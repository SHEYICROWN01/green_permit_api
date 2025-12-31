const db = require('../config/database');
const { hashPassword } = require('../utils/auth');

class Officer {
    /**
     * Find officer by username
     */
    static async findByUsername(username) {
        const sql = `
            SELECT u.*, l.name as lga_name, l.code as lga_code,
                   s.name as supervisor_name, s.id as supervisor_id
            FROM users u
            LEFT JOIN lgas l ON u.lga_id = l.id
            LEFT JOIN users s ON u.supervisor_id = s.id
            WHERE u.username = ? AND u.role = 'officer'
        `;
        const results = await db.query(sql, [username]);
        return results[0];
    }

    /**
     * Find officer by ID
     */
    static async findById(id) {
        const sql = `
            SELECT u.*, l.name as lga_name, l.code as lga_code, l.state,
                   s.name as supervisor_name, s.username as supervisor_username
            FROM users u
            LEFT JOIN lgas l ON u.lga_id = l.id
            LEFT JOIN users s ON u.supervisor_id = s.id
            WHERE u.id = ? AND u.role = 'officer'
        `;
        const results = await db.query(sql, [id]);
        return results[0];
    }

    /**
     * Generate unique officer code
     * Format: OFF-{LGA_CODE}-{YEAR}-{SEQUENCE}
     */
    static async generateOfficerCode(lgaCode) {
        const year = new Date().getFullYear();
        const prefix = `OFF-${lgaCode}-${year}`;

        // Get the latest sequence number for this LGA and year
        const sql = `
            SELECT officer_code 
            FROM users 
            WHERE role = 'officer' 
            AND officer_code LIKE ?
            ORDER BY officer_code DESC 
            LIMIT 1
        `;

        const results = await db.query(sql, [`${prefix}-%`]);

        let sequence = 1;
        if (results.length > 0 && results[0].officer_code) {
            const lastCode = results[0].officer_code;
            const lastSequence = parseInt(lastCode.split('-').pop());
            sequence = lastSequence + 1;
        }

        // Zero-pad sequence to 4 digits
        const paddedSequence = sequence.toString().padStart(4, '0');
        return `${prefix}-${paddedSequence}`;
    }

    /**
     * Check if supervisor has reached officer limit
     */
    static async checkSupervisorLimit(supervisorId, limit = 50) {
        const sql = `
            SELECT COUNT(*) as count 
            FROM users 
            WHERE supervisor_id = ? AND role = 'officer' AND is_active = 1
        `;
        const results = await db.query(sql, [supervisorId]);
        const count = results[0].count;

        return {
            count,
            hasReachedLimit: count >= limit,
            remaining: Math.max(0, limit - count)
        };
    }

    /**
     * Create new officer
     */
    static async create(officerData, lgaCode) {
        // Generate officer code
        const officerCode = await this.generateOfficerCode(lgaCode);

        const sql = `
            INSERT INTO users (
                name, username, password, phone, role, 
                lga_id, supervisor_id, officer_code, is_active, created_at
            ) VALUES (?, ?, ?, ?, 'officer', ?, ?, ?, ?, NOW())
        `;

        const result = await db.query(sql, [
            officerData.name,
            officerData.username,
            officerData.password, // Should already be hashed
            officerData.phone,
            officerData.lga_id,
            officerData.supervisor_id,
            officerCode,
            officerData.is_active !== undefined ? officerData.is_active : true
        ]);

        return await this.findById(result.insertId);
    }

    /**
     * Get all officers with filters, pagination, and statistics
     */
    static async getAll(filters = {}) {
        const {
            lga_id,
            supervisor_id,
            status,
            search,
            page = 1,
            limit = 10,
            sort_by = 'created_at',
            sort_order = 'desc'
        } = filters;

        // Build base query for officers with statistics
        let sql = `
            SELECT 
                u.id,
                u.officer_code,
                u.name,
                u.username,
                u.phone,
                u.is_active as status,
                u.lga_id,
                l.name as lga_name,
                l.code as lga_code,
                u.supervisor_id,
                s.name as supervisor_name,
                s.officer_code as supervisor_code,
                u.last_login_at,
                u.created_at,
                COALESCE(stats.activations_count, 0) as activations_count,
                COALESCE(stats.total_revenue, 0) as total_revenue,
                COALESCE(stats.success_rate, 0) as success_rate,
                COALESCE(stats.avg_daily_activations, 0) as avg_daily_activations,
                stats.last_activation_date
            FROM users u
            LEFT JOIN lgas l ON u.lga_id = l.id
            LEFT JOIN users s ON u.supervisor_id = s.id
            LEFT JOIN (
                SELECT 
                    activated_by as officer_id,
                    COUNT(*) as activations_count,
                    SUM(5000) as total_revenue,
                    100 as success_rate,
                    COUNT(*) / GREATEST(DATEDIFF(CURRENT_DATE, MIN(created_at)), 1) as avg_daily_activations,
                    MAX(created_at) as last_activation_date
                FROM stickers
                WHERE status = 'activated'
                GROUP BY activated_by
            ) stats ON u.id = stats.officer_id
            WHERE u.role = 'officer'
        `;

        const params = [];
        const countParams = [];

        // Apply filters
        if (lga_id) {
            sql += ' AND u.lga_id = ?';
            params.push(lga_id);
            countParams.push(lga_id);
        }

        if (supervisor_id) {
            // Handle both 'sup_X' and numeric formats
            const numericId = supervisor_id.toString().replace('sup_', '');
            sql += ' AND u.supervisor_id = ?';
            params.push(numericId);
            countParams.push(numericId);
        }

        if (status !== undefined) {
            const isActive = status === 'active' ? 1 : 0;
            sql += ' AND u.is_active = ?';
            params.push(isActive);
            countParams.push(isActive);
        }

        if (search) {
            sql += ' AND (u.name LIKE ? OR u.username LIKE ? OR u.officer_code LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
            countParams.push(searchPattern, searchPattern, searchPattern);
        }

        // Get total count for pagination
        const countSql = `
            SELECT COUNT(*) as total 
            FROM users u
            WHERE u.role = 'officer'
            ${lga_id ? 'AND u.lga_id = ?' : ''}
            ${supervisor_id ? 'AND u.supervisor_id = ?' : ''}
            ${status !== undefined ? 'AND u.is_active = ?' : ''}
            ${search ? 'AND (u.name LIKE ? OR u.username LIKE ? OR u.officer_code LIKE ?)' : ''}
        `;

        const countResult = await db.query(countSql, countParams);
        const total = countResult[0].total;

        // Add sorting
        const validSortFields = {
            'name': 'u.name',
            'activations_count': 'activations_count',
            'revenue': 'total_revenue',
            'created_at': 'u.created_at'
        };

        const sortField = validSortFields[sort_by] || 'u.created_at';
        const sortDir = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
        sql += ` ORDER BY ${sortField} ${sortDir}`;

        // Add pagination
        const offset = (page - 1) * limit;
        sql += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        // Execute query
        const officers = await db.query(sql, params);

        // Calculate pagination metadata
        const totalPages = Math.ceil(total / limit);

        return {
            officers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                total_pages: totalPages,
                has_next: page < totalPages,
                has_prev: page > 1
            }
        };
    }

    /**
     * Get summary statistics for all officers in an LGA
     */
    static async getSummary(lgaId) {
        const sql = `
            SELECT 
                COUNT(*) as total_officers,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_officers,
                SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_officers
            FROM users
            WHERE role = 'officer' AND lga_id = ?
        `;

        const results = await db.query(sql, [lgaId]);
        const summary = results[0];

        // Get activation statistics
        const statsSql = `
            SELECT 
                COUNT(*) as total_activations,
                SUM(5000) as total_revenue,
                AVG(100) as avg_success_rate
            FROM stickers s
            INNER JOIN users u ON s.activated_by = u.id
            WHERE u.role = 'officer' AND u.lga_id = ? AND s.status = 'activated'
        `;

        const statsResults = await db.query(statsSql, [lgaId]);
        const stats = statsResults[0];

        // Get top performer
        const topPerformerSql = `
            SELECT 
                u.officer_code,
                u.name,
                COUNT(s.id) as activations_count
            FROM users u
            LEFT JOIN stickers s ON u.id = s.activated_by AND s.status = 'activated'
            WHERE u.role = 'officer' AND u.lga_id = ?
            GROUP BY u.id, u.officer_code, u.name
            ORDER BY activations_count DESC
            LIMIT 1
        `;

        const topPerformerResults = await db.query(topPerformerSql, [lgaId]);
        const topPerformer = topPerformerResults[0] || null;

        return {
            total_officers: summary.total_officers || 0,
            active_officers: summary.active_officers || 0,
            inactive_officers: summary.inactive_officers || 0,
            total_activations: stats.total_activations || 0,
            total_revenue: stats.total_revenue || 0,
            avg_success_rate: stats.avg_success_rate || 0,
            top_performer: topPerformer
        };
    }

    /**
     * Update officer
     */
    static async update(id, updateData) {
        const fields = [];
        const params = [];

        if (updateData.name !== undefined) {
            fields.push('name = ?');
            params.push(updateData.name);
        }

        if (updateData.username !== undefined) {
            fields.push('username = ?');
            params.push(updateData.username);
        }

        if (updateData.phone !== undefined) {
            fields.push('phone = ?');
            params.push(updateData.phone);
        }

        if (updateData.supervisor_id !== undefined) {
            fields.push('supervisor_id = ?');
            params.push(updateData.supervisor_id);
        }

        if (updateData.is_active !== undefined) {
            fields.push('is_active = ?');
            params.push(updateData.is_active);
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        fields.push('updated_at = NOW()');
        params.push(id);

        const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ? AND role = 'officer'`;
        await db.query(sql, params);

        return await this.findById(id);
    }

    /**
     * Update officer's last login
     */
    static async updateLastLogin(id) {
        const sql = 'UPDATE users SET last_login_at = NOW() WHERE id = ? AND role = "officer"';
        await db.query(sql, [id]);
    }
}

module.exports = Officer;
