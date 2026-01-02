// src/models/StickerBatch.js
const { pool } = require('../config/database');

class StickerBatch {
    /**
     * Create a new sticker batch
     * @param {Object} batchData - Batch information
     * @returns {Promise<Object>} Created batch
     */
    static async create(batchData) {
        const {
            batch_code,
            lga_id,
            quantity,
            prefix,
            start_number,
            end_number,
            generated_by_id
        } = batchData;

        const sql = `
      INSERT INTO sticker_batches (
        batch_code, lga_id, quantity, prefix, start_number, end_number, 
        used_count, generated_by
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `;

        const [result] = await pool.execute(sql, [
            batch_code,
            lga_id,
            quantity,
            prefix,
            start_number,
            end_number,
            generated_by_id
        ]);

        return this.findById(result.insertId);
    }

    /**
     * Find batch by ID
     * @param {number} id - Batch ID
     * @returns {Promise<Object|null>}
     */
    static async findById(id) {
        const sql = 'SELECT * FROM sticker_batches WHERE id = ?';
        const [rows] = await pool.execute(sql, [id]);

        if (rows.length === 0) return null;

        const batch = rows[0];
        // design_config is already parsed by MySQL when using JSON column type
        // No need to JSON.parse() it
        return batch;
    }

    /**
     * Find batch by batch_code (unique string identifier)
     * @param {string} batchCode - Batch code string
     * @returns {Promise<Object|null>}
     */
    static async findByBatchId(batchCode) {
        const sql = 'SELECT * FROM sticker_batches WHERE batch_code = ?';
        const [rows] = await pool.execute(sql, [batchCode]);

        if (rows.length === 0) return null;

        return rows[0];
    }

    /**
     * Get all batches with filtering and pagination
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} Paginated results
     */
    static async findAll(filters = {}) {
        const {
            lga_id,
            status,
            search,
            page = 1,
            limit = 20,
            sort_by = 'generated_at',
            sort_order = 'DESC'
        } = filters;

        let sql = `
            SELECT 
                sb.*,
                l.name as lga_name,
                l.code as lga_code,
                l.state as state_name,
                'active' as status
            FROM sticker_batches sb
            LEFT JOIN lgas l ON sb.lga_id = l.id
            WHERE 1=1
        `;
        const params = [];

        // Apply filters
        if (lga_id) {
            sql += ' AND sb.lga_id = ?';
            params.push(lga_id);
        }

        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }

        if (search) {
            sql += ' AND (sb.batch_code LIKE ? OR l.name LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern);
        }

        // Get total count
        const countSql = sql.replace(/SELECT\s+sb\.\*.*?FROM/s, 'SELECT COUNT(*) as total FROM');
        const [countResult] = await pool.execute(countSql, params);
        const total = countResult[0].total;

        // Add sorting and pagination
        const allowedSortFields = ['generated_at', 'batch_code', 'quantity', 'used_count'];
        const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'generated_at';
        const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Use safe SQL construction for ORDER BY (can't be parameterized)
        sql += ` ORDER BY sb.\`${sortField}\` ${order}`;

        // Calculate offset
        const offset = (page - 1) * limit;

        // Add LIMIT and OFFSET directly to SQL instead of using params
        sql += ` LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}`;

        const [rows] = await pool.execute(sql, params);

        // JSON is already parsed by MySQL
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
     * Update batch status
     * @param {number} id - Batch ID
     * @param {string} status - New status
     * @returns {Promise<Object>}
     */
    static async updateStatus(id, status) {
        const sql = 'UPDATE sticker_batches SET status = ? WHERE id = ?';
        await pool.execute(sql, [status, id]);
        return this.findById(id);
    }

    /**
     * Update usage counts when stickers are activated
     * @param {number} id - Batch ID
     * @param {number} count - Number of stickers used (default 1)
     * @returns {Promise<Object>}
     */
    static async incrementUsedCount(id, count = 1) {
        const sql = `
      UPDATE sticker_batches 
      SET used_count = used_count + ?,
          remaining_count = remaining_count - ?
      WHERE id = ?
    `;
        await pool.execute(sql, [count, count, id]);

        // Auto-update status to depleted if no stickers remaining
        const batch = await this.findById(id);
        if (batch && batch.remaining_count <= 0 && batch.status === 'active') {
            await this.updateStatus(id, 'depleted');
        }

        return this.findById(id);
    }

    /**
     * Delete a batch (and cascade delete all its stickers)
     * @param {number} id - Batch ID
     * @returns {Promise<boolean>}
     */
    static async delete(id) {
        const sql = 'DELETE FROM sticker_batches WHERE id = ?';
        const [result] = await pool.execute(sql, [id]);
        return result.affectedRows > 0;
    }

    /**
     * Get batch statistics
     * @param {number} lgaId - Optional LGA ID filter
     * @returns {Promise<Object>}
     */
    static async getStatistics(lgaId = null) {
        let sql = `
      SELECT 
        COUNT(*) as total_batches,
        SUM(quantity) as total_stickers_generated,
        SUM(used_count) as total_stickers_used,
        SUM(remaining_count) as total_stickers_remaining,
        SUM(total_value) as total_value,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_batches,
        SUM(CASE WHEN status = 'depleted' THEN 1 ELSE 0 END) as depleted_batches,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_batches,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_batches
      FROM sticker_batches
    `;

        const params = [];
        if (lgaId) {
            sql += ' WHERE lga_id = ?';
            params.push(lgaId);
        }

        const [rows] = await pool.execute(sql, params);
        return rows[0];
    }

    /**
     * Generate next batch code
     * @returns {Promise<string>}
     */
    static async generateBatchId() {
        const sql = `
      SELECT batch_code 
      FROM sticker_batches 
      ORDER BY id DESC 
      LIMIT 1
    `;
        const [rows] = await pool.execute(sql);

        if (rows.length === 0) {
            return 'BATCH-2026-001';
        }

        const lastBatchCode = rows[0].batch_code;
        const match = lastBatchCode.match(/BATCH-(\d{4})-(\d{3})/);

        if (!match) {
            return 'BATCH-2026-001';
        }

        const year = new Date().getFullYear();
        const lastYear = parseInt(match[1]);
        const lastNumber = parseInt(match[2]);

        if (year > lastYear) {
            return `BATCH-${year}-001`;
        }

        const nextNumber = String(lastNumber + 1).padStart(3, '0');
        return `BATCH-${year}-${nextNumber}`;
    }
}

module.exports = StickerBatch;
