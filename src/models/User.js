const db = require('../config/database');

class User {
    /**
     * Find user by email
     */
    static async findByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        const results = await db.query(sql, [email]);
        return results[0];
    }

    /**
     * Find user by username
     */
    static async findByUsername(username) {
        const sql = 'SELECT * FROM users WHERE username = ?';
        const results = await db.query(sql, [username]);
        return results[0];
    }

    /**
     * Find user by ID
     */
    static async findById(id) {
        const sql = `
            SELECT u.*, l.name as lga_name, l.code as lga_code
            FROM users u
            LEFT JOIN lgas l ON u.lga_id = l.id
            WHERE u.id = ?
        `;
        const results = await db.query(sql, [id]);
        return results[0];
    }

    /**
     * Create new user
     */
    static async create(userData) {
        const sql = `
            INSERT INTO users (name, email, username, password, role, lga_id, supervisor_id, phone, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await db.query(sql, [
            userData.name,
            userData.email,
            userData.username,
            userData.password, // Should be hashed before calling this
            userData.role,
            userData.lga_id || null,
            userData.supervisor_id || null,
            userData.phone || null,
            userData.is_active !== undefined ? userData.is_active : true,
        ]);

        return await this.findById(result.insertId);
    }

    /**
     * Update user's last login timestamp
     */
    static async updateLastLogin(userId) {
        const sql = 'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?';
        await db.query(sql, [userId]);
    }

    /**
     * Get all personnel with filters
     */
    static async getAllPersonnel(filters = {}) {
        let sql = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.username,
                u.phone,
                u.role,
                u.is_active,
                u.last_login_at,
                u.created_at,
                l.id as lga_id,
                l.name as lga_name,
                l.code as lga_code,
                s.id as supervisor_id,
                s.name as supervisor_name
            FROM users u
            LEFT JOIN lgas l ON u.lga_id = l.id
            LEFT JOIN users s ON u.supervisor_id = s.id
            WHERE u.role != 'super_admin'
        `;

        const params = [];

        // Add filters
        if (filters.role) {
            sql += ' AND u.role = ?';
            params.push(filters.role);
        }

        if (filters.lga_id) {
            sql += ' AND u.lga_id = ?';
            params.push(filters.lga_id);
        }

        if (filters.status === 'active') {
            sql += ' AND u.is_active = TRUE';
        } else if (filters.status === 'inactive') {
            sql += ' AND u.is_active = FALSE';
        }

        if (filters.search) {
            sql += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.username LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        sql += ' ORDER BY u.created_at DESC';

        return await db.query(sql, params);
    }

    /**
     * Get personnel stats by role
     */
    static async getPersonnelStats() {
        const sql = `
            SELECT 
                role,
                COUNT(*) as count,
                SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_count,
                SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive_count
            FROM users
            WHERE role != 'super_admin'
            GROUP BY role
        `;
        return await db.query(sql);
    }

    /**
     * Update user
     */
    static async update(id, userData) {
        const fields = [];
        const values = [];

        const allowedFields = ['name', 'email', 'phone', 'is_active', 'lga_id', 'supervisor_id'];

        allowedFields.forEach(field => {
            if (userData[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(userData[field]);
            }
        });

        if (fields.length === 0) {
            return null;
        }

        values.push(id);

        const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        await db.query(sql, values);

        return await this.findById(id);
    }

    /**
     * Deactivate users by LGA
     */
    static async deactivateByLGA(lgaId) {
        const sql = 'UPDATE users SET is_active = FALSE WHERE lga_id = ?';
        await db.query(sql, [lgaId]);
    }
}

module.exports = User;
