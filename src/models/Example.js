const db = require('../config/database');

class Example {
    /**
     * Get all examples
     */
    static async findAll() {
        const sql = 'SELECT * FROM examples ORDER BY created_at DESC';
        return await db.query(sql);
    }

    /**
     * Get example by ID
     */
    static async findById(id) {
        const sql = 'SELECT * FROM examples WHERE id = ?';
        const results = await db.query(sql, [id]);
        return results[0];
    }

    /**
     * Create new example
     */
    static async create(data) {
        const sql = 'INSERT INTO examples (name, description) VALUES (?, ?)';
        const result = await db.query(sql, [data.name, data.description]);
        return {
            id: result.insertId,
            ...data,
        };
    }

    /**
     * Update example by ID
     */
    static async update(id, data) {
        const fields = [];
        const values = [];

        if (data.name !== undefined) {
            fields.push('name = ?');
            values.push(data.name);
        }
        if (data.description !== undefined) {
            fields.push('description = ?');
            values.push(data.description);
        }

        if (fields.length === 0) {
            return null;
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const sql = `UPDATE examples SET ${fields.join(', ')} WHERE id = ?`;
        await db.query(sql, values);

        return await this.findById(id);
    }

    /**
     * Delete example by ID
     */
    static async delete(id) {
        const sql = 'DELETE FROM examples WHERE id = ?';
        const result = await db.query(sql, [id]);
        return result.affectedRows > 0;
    }

    /**
     * Check if example exists
     */
    static async exists(id) {
        const sql = 'SELECT COUNT(*) as count FROM examples WHERE id = ?';
        const results = await db.query(sql, [id]);
        return results[0].count > 0;
    }
}

module.exports = Example;
