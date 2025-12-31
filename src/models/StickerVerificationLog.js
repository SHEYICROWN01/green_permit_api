// src/models/StickerVerificationLog.js
const { pool } = require('../config/database');

class StickerVerificationLog {
    /**
     * Create a verification log entry
     * @param {Object} logData - Log entry data
     * @returns {Promise<Object>}
     */
    static async create(logData) {
        const {
            sticker_id,
            sticker_code,
            verified_by_id,
            verified_by_name,
            verification_type,
            verification_result,
            ip_address,
            device_info,
            gps_location,
            notes
        } = logData;

        const sql = `
      INSERT INTO sticker_verification_logs (
        sticker_id, sticker_code, verified_by_id, verified_by_name,
        verification_type, verification_result, ip_address, device_info,
        gps_location, attempted_at, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
    `;

        const [result] = await pool.execute(sql, [
            sticker_id,
            sticker_code,
            verified_by_id || null,
            verified_by_name || null,
            verification_type,
            verification_result,
            ip_address || null,
            device_info || null,
            gps_location || null,
            notes || null
        ]);

        return this.findById(result.insertId);
    }

    /**
     * Find log by ID
     * @param {number} id - Log ID
     * @returns {Promise<Object|null>}
     */
    static async findById(id) {
        const sql = 'SELECT * FROM sticker_verification_logs WHERE id = ?';
        const [rows] = await pool.execute(sql, [id]);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Get verification history for a sticker
     * @param {string} stickerCode - Sticker code
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>}
     */
    static async getHistory(stickerCode, options = {}) {
        const { page = 1, limit = 50 } = options;

        let sql = 'SELECT * FROM sticker_verification_logs WHERE sticker_code = ?';
        const params = [stickerCode];

        // Get total count
        const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
        const [countResult] = await pool.execute(countSql, params);
        const total = countResult[0].total;

        // Add pagination
        sql += ' ORDER BY attempted_at DESC';
        const offset = (page - 1) * limit;
        sql += ` LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}`;

        const [rows] = await pool.execute(sql, params);

        return {
            data: rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                total_pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get verification logs with filters
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>}
     */
    static async findAll(filters = {}) {
        const {
            sticker_id,
            verified_by_id,
            verification_result,
            date_from,
            date_to,
            page = 1,
            limit = 50
        } = filters;

        let sql = 'SELECT * FROM sticker_verification_logs WHERE 1=1';
        const params = [];

        if (sticker_id) {
            sql += ' AND sticker_id = ?';
            params.push(sticker_id);
        }

        if (verified_by_id) {
            sql += ' AND verified_by_id = ?';
            params.push(verified_by_id);
        }

        if (verification_result) {
            sql += ' AND verification_result = ?';
            params.push(verification_result);
        }

        if (date_from) {
            sql += ' AND DATE(attempted_at) >= ?';
            params.push(date_from);
        }

        if (date_to) {
            sql += ' AND DATE(attempted_at) <= ?';
            params.push(date_to);
        }

        // Get total count
        const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
        const [countResult] = await pool.execute(countSql, params);
        const total = countResult[0].total;

        // Add pagination
        sql += ' ORDER BY attempted_at DESC';
        const offset = (page - 1) * limit;
        sql += ` LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}`;

        const [rows] = await pool.execute(sql, params);

        return {
            data: rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                total_pages: Math.ceil(total / limit)
            }
        };
    }
}

module.exports = StickerVerificationLog;
