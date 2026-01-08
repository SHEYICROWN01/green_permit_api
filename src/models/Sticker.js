const { pool } = require('../config/database');
const { generateStickerCode, generateQRCodeData } = require('../utils/stickerCodeGenerator');

class Sticker {
    static async bulkCreate(batchInfo, quantity) {
        const { batch_id, lga_id, lga_code, price } = batchInfo;
        const values = [];
        for (let i = 1; i <= quantity; i++) {
            const stickerCode = generateStickerCode(lga_code, i);
            const qrCodeUrl = generateQRCodeData(stickerCode);
            values.push([stickerCode, batch_id, lga_id, qrCodeUrl, price]);
        }
        const placeholders = values.map(() => '(?, ?, ?, ?, ?)').join(', ');
        const flatValues = values.flat();
        const sql = 'INSERT INTO stickers (code, batch_id, lga_id, qr_code_url, price) VALUES ' + placeholders;
        await pool.execute(sql, flatValues);
        return { generated: quantity, batch_id, lga_code, message: 'Successfully generated ' + quantity + ' stickers' };
    }

    static async findByCode(stickerCode) {
        const sql = `
            SELECT 
                s.*,
                l.name as lga_name,
                l.state as state_name
            FROM stickers s
            LEFT JOIN lgas l ON s.lga_id = l.id
            WHERE s.code = ?
        `;
        const [rows] = await pool.execute(sql, [stickerCode]);
        return rows.length > 0 ? rows[0] : null;
    }

    static async findById(id) {
        const sql = `
            SELECT 
                s.*,
                l.name as lga_name,
                l.state as state_name
            FROM stickers s
            LEFT JOIN lgas l ON s.lga_id = l.id
            WHERE s.id = ?
        `;
        const [rows] = await pool.execute(sql, [id]);
        return rows.length > 0 ? rows[0] : null;
    }

    static async findByBatch(batchId, options = {}) {
        const { page = 1, limit = 50, status = null, activation_status = null } = options;
        let sql = 'SELECT * FROM stickers WHERE batch_id = ?';
        const params = [batchId];

        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }

        if (activation_status) {
            sql += ' AND status = ?';
            params.push(activation_status);
        }

        const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
        const [countResult] = await pool.execute(countSql, params);
        const total = countResult[0].total;
        sql += ' ORDER BY id ASC';
        const offset = (page - 1) * limit;
        sql += ` LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}`;
        const [rows] = await pool.execute(sql, params);
        return { data: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), total_pages: Math.ceil(total / limit) } };
    }

    static async search(filters = {}) {
        const { sticker_code, lga_id, batch_id, status, activation_status, date_from, date_to, page = 1, limit = 50 } = filters;
        let sql = 'SELECT * FROM stickers WHERE 1=1';
        const params = [];

        if (sticker_code) {
            sql += ' AND code LIKE ?';
            params.push('%' + sticker_code + '%');
        }

        if (lga_id) {
            sql += ' AND lga_id = ?';
            params.push(lga_id);
        }

        if (batch_id) {
            sql += ' AND batch_id = ?';
            params.push(batch_id);
        }

        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }

        if (activation_status) {
            sql += ' AND status = ?';
            params.push(activation_status);
        }

        if (date_from) {
            sql += ' AND DATE(generated_at) >= ?';
            params.push(date_from);
        }

        if (date_to) {
            sql += ' AND DATE(generated_at) <= ?';
            params.push(date_to);
        }

        const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
        const [countResult] = await pool.execute(countSql, params);
        const total = countResult[0].total;
        sql += ' ORDER BY generated_at DESC';
        const offset = (page - 1) * limit;
        sql += ` LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}`;
        const [rows] = await pool.execute(sql, params);
        return { data: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), total_pages: Math.ceil(total / limit) } };
    }

    static async activate(stickerCode, activationData) {
        const { verified_by_id, verified_by_name, verified_by_role, verification_location, verification_notes, verification_photo_url, assigned_to_name, assigned_to_phone, expires_at } = activationData;
        const now = new Date();
        const sql = "UPDATE stickers SET status = 'active', activated_by = ?, activated_at = ?, assigned_to_name = ?, assigned_to_phone = ?, expires_at = ? WHERE code = ? AND status = 'unused'";
        const [result] = await pool.execute(sql, [verified_by_id, now, assigned_to_name || null, assigned_to_phone || null, expires_at || null, stickerCode]);
        if (result.affectedRows === 0) throw new Error('Sticker not found or already activated');
        return this.findByCode(stickerCode);
    }

    static async verify(stickerCode) {
        const sticker = await this.findByCode(stickerCode);

        // Sticker not found
        if (!sticker) {
            return {
                valid: false,
                message: 'Invalid sticker code. Sticker not found.',
                sticker: null,
                is_activated: 0,
                lga_name: null,
                state: null,
                expired: false,
                code: stickerCode
            };
        }

        // Check if expired
        const now = new Date();
        const expired = sticker.expires_at && new Date(sticker.expires_at) < now;

        // Determine activation status
        const is_activated = sticker.is_activated || (sticker.status === 'active' ? 1 : 0);

        // Build response
        const response = {
            valid: true,
            is_activated,
            lga_name: sticker.lga_name,
            state: sticker.state_name,
            expired,
            code: sticker.code,
            sticker: {
                id: sticker.id,
                code: sticker.code,
                lga_name: sticker.lga_name,
                state_name: sticker.state_name,
                status: sticker.status,
                is_activated,
                activated_at: sticker.activated_at,
                expires_at: sticker.expires_at,
                price: sticker.price ? (sticker.price / 100).toFixed(2) : '0.00', // Convert kobo to naira
                batch_id: sticker.batch_id,
                lga_id: sticker.lga_id,
                created_at: sticker.created_at,
                assigned_to_name: sticker.assigned_to_name || null,
                assigned_to_phone: sticker.assigned_to_phone || null
            }
        };

        // Set appropriate message based on status
        if (expired) {
            response.message = 'Sticker has expired';
        } else if (sticker.status === 'cancelled' || sticker.status === 'revoked') {
            response.valid = false;
            response.message = `Sticker has been ${sticker.status}`;
        } else if (is_activated === 1) {
            response.message = 'Sticker is valid and active';
        } else {
            response.message = 'Sticker is valid but not yet activated';
        }

        return response;
    }

    static async updateStatus(stickerCode, status) {
        await pool.execute('UPDATE stickers SET status = ? WHERE code = ?', [status, stickerCode]);
        return this.findByCode(stickerCode);
    }

    static async getStatistics(filters = {}) {
        const { lga_id, batch_id } = filters;
        let sql = "SELECT COUNT(*) as total_stickers, SUM(CASE WHEN status = 'unused' THEN 1 ELSE 0 END) as unused, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active, SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired, SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) as revoked FROM stickers WHERE 1=1";
        const params = [];
        if (lga_id) {
            sql += ' AND lga_id = ?';
            params.push(lga_id);
        }
        if (batch_id) {
            sql += ' AND batch_id = ?';
            params.push(batch_id);
        }
        const [rows] = await pool.execute(sql, params);
        return rows[0];
    }

    static async getInventorySummary() {
        const sql = "SELECT lga_id, COUNT(*) as total_stickers, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activated, SUM(CASE WHEN status = 'unused' THEN 1 ELSE 0 END) as unused, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active, SUM(price) as total_value FROM stickers GROUP BY lga_id ORDER BY total_stickers DESC";
        const [rows] = await pool.execute(sql);
        return rows;
    }
}
module.exports = Sticker;
