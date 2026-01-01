const { pool } = require('../config/database');
const { generateStickerCode, generateQRCodeData } = require('../utils/stickerCodeGenerator');

class Sticker {
    static async bulkCreate(batchInfo, quantity) {
        const { batch_id, lga_id, lga_name, lga_code, state_name, price, generated_by_id, generated_by_name } = batchInfo;
        const values = [];
        for (let i = 1; i <= quantity; i++) {
            const stickerCode = generateStickerCode(lga_code, i);
            const qrCodeData = generateQRCodeData(stickerCode);
            const now = new Date();
            values.push([stickerCode, qrCodeData, batch_id, lga_id, lga_name, lga_code, state_name, price, generated_by_id, generated_by_name, now, now, now]);
        }
        const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE(?), TIME(?), ?)').join(', ');
        const flatValues = values.flat();
        const sql = 'INSERT INTO stickers (sticker_code, qr_code_data, batch_id, lga_id, lga_name, lga_code, state_name, price, generated_by_id, generated_by_name, generated_date, generated_time, generated_at) VALUES ' + placeholders;
        await pool.execute(sql, flatValues);
        return { generated: quantity, batch_id, lga_code, message: 'Successfully generated ' + quantity + ' stickers' };
    }

    static async findByCode(stickerCode) {
        const [rows] = await pool.execute('SELECT * FROM stickers WHERE sticker_code = ?', [stickerCode]);
        return rows.length > 0 ? rows[0] : null;
    }

    static async findById(id) {
        const [rows] = await pool.execute('SELECT * FROM stickers WHERE id = ?', [id]);
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
            sql += ' AND sticker_code LIKE ?';
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
        const sql = "UPDATE stickers SET status = 'active', activated_by = ?, activated_at = ?, assigned_to_name = ?, assigned_to_phone = ?, expires_at = ? WHERE sticker_code = ? AND status = 'unused'";
        const [result] = await pool.execute(sql, [verified_by_id, now, assigned_to_name || null, assigned_to_phone || null, expires_at || null, stickerCode]);
        if (result.affectedRows === 0) throw new Error('Sticker not found or already activated');
        return this.findByCode(stickerCode);
    }

    static async verify(stickerCode) {
        const sticker = await this.findByCode(stickerCode);
        if (!sticker) return { valid: false, message: 'Invalid sticker code', sticker_code: stickerCode };
        if (sticker.expires_at && new Date(sticker.expires_at) < new Date()) return { valid: false, message: 'Sticker has expired', sticker, expired: true };
        if (sticker.status === 'revoked') return { valid: false, message: 'Sticker is revoked', sticker, status: sticker.status };
        return { valid: true, message: 'Valid sticker', sticker, activation_status: sticker.status, lga_name: sticker.lga_name, state: sticker.state_name, assigned_to: sticker.assigned_to_name, activated_at: sticker.activated_at, expires_at: sticker.expires_at };
    }

    static async updateStatus(stickerCode, status) {
        await pool.execute('UPDATE stickers SET status = ? WHERE sticker_code = ?', [status, stickerCode]);
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
        const sql = "SELECT lga_id, ANY_VALUE(lga_name) as lga_name, ANY_VALUE(lga_code) as lga_code, ANY_VALUE(state_name) as state_name, COUNT(*) as total_stickers, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activated, SUM(CASE WHEN status = 'unused' THEN 1 ELSE 0 END) as unused, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active, SUM(price) as total_value FROM stickers GROUP BY lga_id ORDER BY total_stickers DESC";
        const [rows] = await pool.execute(sql);
        return rows;
    }
}
module.exports = Sticker;
