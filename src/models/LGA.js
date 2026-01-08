# Get token
TOKEN = $(curl - s - X POST https://gtech.gifamz.com/api/v1/auth/super-admin/login \
    -H 'Content-Type: application/json' \
    -d '{"username":"superadmin","password":"Admin@2025"}' | \
    grep - o '"token":"[^"]*"' | sed 's/"token":"//;s/"$//')

# Test LGA 4(should now show 3 activations)
curl - s "https://gtech.gifamz.com/api/v1/super-admin/lgas/4" \
-H "Authorization: Bearer $TOKEN" | python3 - m json.tool | grep - A 10 '"stats"'# Get full stats response
TOKEN = $(curl - s - X POST https://gtech.gifamz.com/api/v1/auth/super-admin/login \
    -H 'Content-Type: application/json' \
    -d '{"username":"superadmin","password":"Admin@2025"}' | \
    grep - o '"token":"[^"]*"' | sed 's/"token":"//;s/"$//')

# Get full response to see what getStats is actually returning
curl - s "https://gtech.gifamz.com/api/v1/super-admin/lgas/4" \
-H "Authorization: Bearer $TOKEN" | python3 - m json.tool > /tmp/lga4_response.json

# Show the response
cat / tmp / lga4_response.jsonconst db = require('../config/database');

class LGA {
    /**
     * Find all LGAs with optional filters
     */
    static async findAll(filters = {}) {
        let sql = 'SELECT * FROM lgas WHERE 1=1';
        const params = [];

        if (filters.search) {
            sql += ' AND (name LIKE ? OR code LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm);
        }

        if (filters.state) {
            sql += ' AND state = ?';
            params.push(filters.state);
        }

        if (filters.status === 'active') {
            sql += ' AND is_active = TRUE';
        } else if (filters.status === 'inactive') {
            sql += ' AND is_active = FALSE';
        }

        sql += ' ORDER BY created_at DESC';

        return await db.query(sql, params);
    }

    /**
     * Find LGA by ID
     */
    static async findById(id) {
        const sql = 'SELECT * FROM lgas WHERE id = ?';
        const results = await db.query(sql, [id]);
        return results[0];
    }

    /**
     * Find LGA by code
     */
    static async findByCode(code) {
        const sql = 'SELECT * FROM lgas WHERE code = ?';
        const results = await db.query(sql, [code]);
        return results[0];
    }

    /**
     * Create new LGA
     */
    static async create(lgaData, createdBy) {
        const sql = `
            INSERT INTO lgas (name, state, code, address, phone, email, sticker_price, sticker_prefix, logo_url, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await db.query(sql, [
            lgaData.name,
            lgaData.state,
            lgaData.code,
            lgaData.address || null,
            lgaData.phone || null,
            lgaData.email || null,
            lgaData.sticker_price,
            lgaData.sticker_prefix,
            lgaData.logo_url || null,
            createdBy,
        ]);

        return await this.findById(result.insertId);
    }

    /**
     * Update LGA
     */
    static async update(id, lgaData) {
        const fields = [];
        const values = [];

        const allowedFields = ['name', 'state', 'address', 'phone', 'email', 'sticker_price', 'logo_url', 'is_active'];

        allowedFields.forEach(field => {
            if (lgaData[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(lgaData[field]);
            }
        });

        if (fields.length === 0) {
            return null;
        }

        values.push(id);

        const sql = `UPDATE lgas SET ${fields.join(', ')} WHERE id = ?`;
        await db.query(sql, values);

        return await this.findById(id);
    }

    /**
     * Deactivate LGA (soft delete)
     */
    static async deactivate(id) {
        const sql = 'UPDATE lgas SET is_active = FALSE WHERE id = ?';
        await db.query(sql, [id]);
    }

    /**
     * Get LGA statistics
     */
    static async getStats(lgaId) {
        // Get revenue stats
        const revenueSql = `
            SELECT 
                COALESCE(SUM(CASE WHEN DATE(activation_date) = CURDATE() THEN amount_paid ELSE 0 END), 0) as today,
                COALESCE(SUM(CASE WHEN YEARWEEK(activation_date) = YEARWEEK(CURDATE()) THEN amount_paid ELSE 0 END), 0) as this_week,
                COALESCE(SUM(CASE WHEN YEAR(activation_date) = YEAR(CURDATE()) AND MONTH(activation_date) = MONTH(CURDATE()) THEN amount_paid ELSE 0 END), 0) as this_month,
                COALESCE(SUM(amount_paid), 0) as total
            FROM activations
            WHERE lga_id = ?
        `;
        const revenueResults = await db.query(revenueSql, [lgaId]);

        // Get sticker stats - Count stickers owned by LGA and activations performed by LGA
        const stickerSql = `
            SELECT 
                COUNT(DISTINCT s.id) as total_generated,
                COUNT(DISTINCT CASE WHEN s.status = 'unused' THEN s.id END) as unused,
                COUNT(DISTINCT CASE WHEN s.status = 'expired' THEN s.id END) as expired,
                COUNT(DISTINCT CASE WHEN s.status = 'revoked' THEN s.id END) as revoked
            FROM stickers s
            WHERE s.lga_id = ?
        `;
        const stickerResults = await db.query(stickerSql, [lgaId]);

        // Count activations performed by this LGA (regardless of sticker ownership)
        const activationCountSql = `
            SELECT COUNT(*) as active
            FROM activations
            WHERE lga_id = ?
        `;
        const activationResults = await db.query(activationCountSql, [lgaId]);

        // Merge the results
        stickerResults[0].active = activationResults[0].active;

        // Get personnel stats
        const personnelSql = `
            SELECT 
                SUM(CASE WHEN role = 'supervisor' THEN 1 ELSE 0 END) as supervisors,
                SUM(CASE WHEN role = 'officer' THEN 1 ELSE 0 END) as officers,
                COUNT(*) as total
            FROM users
            WHERE lga_id = ? AND role IN ('supervisor', 'officer')
        `;
        const personnelResults = await db.query(personnelSql, [lgaId]);

        // Get batch stats
        const batchSql = `
            SELECT 
                COUNT(*) as total,
                SUM(quantity) as total_quantity
            FROM sticker_batches
            WHERE lga_id = ?
        `;
        const batchResults = await db.query(batchSql, [lgaId]);

        return {
            revenue: revenueResults[0],
            stickers: stickerResults[0],
            personnel: personnelResults[0],
            batches: batchResults[0],
        };
    }

    /**
     * Get recent batches for an LGA
     */
    static async getRecentBatches(lgaId, limit = 5) {
        const sql = `
            SELECT 
                id,
                batch_code,
                quantity,
                used_count,
                (quantity - used_count) as remaining,
                generated_at
            FROM sticker_batches
            WHERE lga_id = ?
            ORDER BY generated_at DESC
            LIMIT ${parseInt(limit)}
        `;
        return await db.query(sql, [lgaId]);
    }

    /**
     * Get top supervisors for an LGA
     */
    static async getTopSupervisors(lgaId, limit = 5) {
        const sql = `
            SELECT 
                u.id,
                u.name,
                COUNT(DISTINCT o.id) as team_size,
                COUNT(a.id) as activations_this_month,
                COALESCE(SUM(a.amount_paid), 0) as revenue_this_month
            FROM users u
            LEFT JOIN users o ON o.supervisor_id = u.id
            LEFT JOIN activations a ON a.supervisor_id = u.id 
                AND YEAR(a.activation_date) = YEAR(CURDATE()) 
                AND MONTH(a.activation_date) = MONTH(CURDATE())
            WHERE u.lga_id = ? AND u.role = 'supervisor'
            GROUP BY u.id, u.name
            ORDER BY activations_this_month DESC
            LIMIT ${parseInt(limit)}
        `;
        return await db.query(sql, [lgaId]);
    }

    /**
     * Get LGA admin user
     */
    static async getAdmin(lgaId) {
        const sql = `
            SELECT id, name, email, phone, username, is_active, last_login_at
            FROM users
            WHERE lga_id = ? AND role = 'lga_admin'
            LIMIT 1
        `;
        const results = await db.query(sql, [lgaId]);
        return results[0];
    }

    /**
     * Check if code exists
     */
    static async codeExists(code, excludeId = null) {
        let sql = 'SELECT COUNT(*) as count FROM lgas WHERE code = ?';
        const params = [code];

        if (excludeId) {
            sql += ' AND id != ?';
            params.push(excludeId);
        }

        const results = await db.query(sql, params);
        return results[0].count > 0;
    }

    /**
     * Check if sticker prefix exists
     */
    static async prefixExists(prefix, excludeId = null) {
        let sql = 'SELECT COUNT(*) as count FROM lgas WHERE sticker_prefix = ?';
        const params = [prefix];

        if (excludeId) {
            sql += ' AND id != ?';
            params.push(excludeId);
        }

        const results = await db.query(sql, params);
        return results[0].count > 0;
    }

    /**
     * Get detailed statistics for LGA details page
     */
    static async getDetailedStats(lgaId) {
        // Revenue statistics
        const revenueSql = `
            SELECT 
                COALESCE(SUM(amount_paid), 0) as total_revenue,
                COALESCE(SUM(CASE WHEN YEAR(activation_date) = YEAR(CURDATE()) AND MONTH(activation_date) = MONTH(CURDATE()) THEN amount_paid ELSE 0 END), 0) as monthly_revenue,
                COALESCE(SUM(CASE WHEN YEARWEEK(activation_date) = YEARWEEK(CURDATE()) THEN amount_paid ELSE 0 END), 0) as weekly_revenue,
                COALESCE(SUM(CASE WHEN DATE(activation_date) = CURDATE() THEN amount_paid ELSE 0 END), 0) as daily_revenue,
                COUNT(CASE WHEN YEAR(activation_date) = YEAR(CURDATE()) AND MONTH(activation_date) = MONTH(CURDATE()) THEN 1 END) as monthly_activations,
                COALESCE(SUM(CASE WHEN YEAR(activation_date) = YEAR(CURDATE()) AND MONTH(activation_date) = MONTH(CURDATE()) - 1 THEN amount_paid ELSE 0 END), 0) as last_month_revenue
            FROM activations
            WHERE lga_id = ?
        `;
        const revenueResults = await db.query(revenueSql, [lgaId]);
        const revenue = revenueResults[0];

        // Calculate revenue trend
        const revenueTrend = revenue.last_month_revenue > 0
            ? ((revenue.monthly_revenue - revenue.last_month_revenue) / revenue.last_month_revenue * 100).toFixed(1)
            : revenue.monthly_revenue > 0 ? 100 : 0;

        // Personnel statistics
        const personnelSql = `
            SELECT 
                COUNT(CASE WHEN role = 'officer' THEN 1 END) as total_officers,
                COUNT(CASE WHEN role = 'officer' AND is_active = TRUE THEN 1 END) as active_officers,
                COUNT(CASE WHEN role = 'officer' AND is_active = FALSE THEN 1 END) as inactive_officers,
                COUNT(CASE WHEN role = 'supervisor' THEN 1 END) as total_supervisors,
                COUNT(CASE WHEN role = 'supervisor' AND is_active = TRUE THEN 1 END) as active_supervisors,
                COUNT(CASE WHEN role = 'supervisor' AND is_active = FALSE THEN 1 END) as inactive_supervisors,
                COUNT(*) as total_personnel
            FROM users
            WHERE lga_id = ? AND role IN ('officer', 'supervisor')
        `;
        const personnelResults = await db.query(personnelSql, [lgaId]);
        const personnel = personnelResults[0];

        // Sticker statistics - Count stickers owned by LGA and activations performed by LGA
        const stickerSql = `
            SELECT 
                COUNT(DISTINCT s.id) as stickers_generated,
                COUNT(DISTINCT CASE WHEN s.status = 'unused' THEN s.id END) as stickers_unused,
                COUNT(DISTINCT CASE WHEN s.status = 'expired' THEN s.id END) as stickers_expired
            FROM stickers s
            WHERE s.lga_id = ?
        `;
        const stickerResults = await db.query(stickerSql, [lgaId]);

        // Count activations performed by this LGA (regardless of sticker ownership)
        const activationCountSql = `
            SELECT COUNT(*) as stickers_activated
            FROM activations
            WHERE lga_id = ?
        `;
        const activationCountResults = await db.query(activationCountSql, [lgaId]);

        // Merge results and calculate utilization
        const stickers = {
            ...stickerResults[0],
            stickers_activated: activationCountResults[0].stickers_activated,
            utilization_rate: stickerResults[0].stickers_generated > 0
                ? parseFloat((activationCountResults[0].stickers_activated * 100.0 / stickerResults[0].stickers_generated).toFixed(1))
                : 0
        };

        // Average activations
        const avgActivationsSql = `
            SELECT 
                COALESCE(AVG(daily_count), 0) as avg_daily,
                COALESCE(AVG(weekly_count), 0) as avg_weekly
            FROM (
                SELECT 
                    DATE(activation_date) as date,
                    COUNT(*) as daily_count,
                    FLOOR(DATEDIFF(CURDATE(), DATE(activation_date)) / 7) as week_group,
                    COUNT(*) as weekly_count
                FROM activations
                WHERE lga_id = ? AND activation_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY DATE(activation_date), FLOOR(DATEDIFF(CURDATE(), DATE(activation_date)) / 7)
            ) as subquery
        `;
        const avgResults = await db.query(avgActivationsSql, [lgaId]);
        const avgActivations = avgResults[0];

        // Total activations count
        const totalActivationsSql = `
            SELECT COUNT(*) as total_activations
            FROM activations
            WHERE lga_id = ?
        `;
        const totalActivationsResults = await db.query(totalActivationsSql, [lgaId]);

        // Top officer
        const topOfficerSql = `
            SELECT 
                officer_id as top_officer_id,
                COUNT(*) as top_officer_activations
            FROM activations
            WHERE lga_id = ? AND officer_id IS NOT NULL
            GROUP BY officer_id
            ORDER BY COUNT(*) DESC
            LIMIT 1
        `;
        const topOfficerResults = await db.query(topOfficerSql, [lgaId]);
        const topOfficer = topOfficerResults[0] || { top_officer_id: null, top_officer_activations: 0 };

        // Average activations per officer
        const avgPerOfficer = personnel.active_officers > 0
            ? Math.round(totalActivationsResults[0].total_activations / personnel.active_officers)
            : 0;

        return {
            // Revenue
            total_revenue: revenue.total_revenue,
            monthly_revenue: revenue.monthly_revenue,
            weekly_revenue: revenue.weekly_revenue,
            daily_revenue: revenue.daily_revenue,
            revenue_trend: {
                percentage: parseFloat(revenueTrend),
                direction: revenueTrend > 0 ? 'up' : revenueTrend < 0 ? 'down' : 'stable',
                comparison: 'from last month'
            },

            // Personnel
            total_officers: personnel.total_officers,
            active_officers: personnel.active_officers,
            inactive_officers: personnel.inactive_officers,
            total_supervisors: personnel.total_supervisors,
            active_supervisors: personnel.active_supervisors,
            inactive_supervisors: personnel.inactive_supervisors,
            total_personnel: personnel.total_personnel,
            avg_officers_per_supervisor: personnel.total_supervisors > 0
                ? parseFloat((personnel.total_officers / personnel.total_supervisors).toFixed(1))
                : 0,

            // Stickers
            stickers_generated: stickers.stickers_generated,
            stickers_activated: stickers.stickers_activated,
            stickers_unused: stickers.stickers_unused,
            stickers_expired: stickers.stickers_expired,
            utilization_rate: parseFloat(stickers.utilization_rate) || 0,
            avg_daily_activations: Math.round(avgActivations.avg_daily),
            avg_weekly_activations: Math.round(avgActivations.avg_weekly),

            // Performance
            top_officer_id: topOfficer.top_officer_id,
            top_officer_activations: topOfficer.top_officer_activations,
            avg_activations_per_officer: avgPerOfficer,
            total_activations: totalActivationsResults[0].total_activations
        };
    }

    /**
     * Get monthly revenue chart data (last 6 months)
     */
    static async getMonthlyRevenueChart(lgaId) {
        const sql = `
            SELECT 
                DATE_FORMAT(activation_date, '%b') as month,
                DATE_FORMAT(activation_date, '%M %Y') as month_full,
                YEAR(activation_date) as year,
                MONTH(activation_date) as month_number,
                COALESCE(SUM(amount_paid), 0) as value,
                COUNT(*) as activations
            FROM activations
            WHERE lga_id = ? 
                AND activation_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY YEAR(activation_date), MONTH(activation_date), DATE_FORMAT(activation_date, '%b'), DATE_FORMAT(activation_date, '%M %Y')
            ORDER BY year, month_number
            LIMIT 6
        `;
        return await db.query(sql, [lgaId]);
    }

    /**
     * Get weekly activations chart data (last 4 weeks)
     */
    static async getWeeklyActivationsChart(lgaId, stickerPrice = 3500) {
        // Get last 4 weeks of data
        const sql = `
            SELECT 
                WEEK(activation_date, 1) as week_number,
                COUNT(*) as value,
                COALESCE(SUM(amount_paid), 0) as revenue,
                MIN(DATE(activation_date)) as start_date,
                MAX(DATE(activation_date)) as end_date
            FROM activations
            WHERE lga_id = ? 
                AND activation_date >= DATE_SUB(CURDATE(), INTERVAL 28 DAY)
            GROUP BY WEEK(activation_date, 1)
            ORDER BY week_number DESC
            LIMIT 4
        `;

        const rows = await db.query(sql, [lgaId]);

        // Format and reverse to get chronological order (oldest to newest)
        return rows.reverse().map((row, index) => ({
            week_num: index + 1,
            week: `Week ${index + 1}`,
            start_date: row.start_date,
            end_date: row.end_date,
            value: row.value,
            revenue: row.revenue
        }));
    }

    /**
     * Get top performing officers for LGA
     */
    static async getTopOfficers(lgaId, limit = 5) {
        const sql = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.phone,
                u.supervisor_id,
                s.name as supervisor_name,
                COUNT(a.id) as total_activations,
                COUNT(CASE WHEN st.status = 'active' THEN 1 END) as active_stickers,
                COALESCE(SUM(a.amount_paid), 0) as total_revenue,
                u.is_active,
                DATE(u.created_at) as joined_date
            FROM users u
            LEFT JOIN users s ON s.id = u.supervisor_id
            LEFT JOIN activations a ON a.officer_id = u.id
            LEFT JOIN stickers st ON st.id = a.sticker_id
            WHERE u.lga_id = ? AND u.role = 'officer'
            GROUP BY u.id, u.name, u.email, u.phone, u.supervisor_id, s.name, u.is_active, u.created_at
            ORDER BY total_activations DESC
            LIMIT ${parseInt(limit)}
        `;
        return await db.query(sql, [lgaId]);
    }

    /**
     * Get LGA personnel with filters and pagination
     */
    static async getPersonnel(lgaId, options = {}) {
        const {
            page = 1,
            limit = 20,
            role = 'all',
            status = 'all',
            search = '',
            sort_by = 'name',
            sort_order = 'asc'
        } = options;

        const offset = (page - 1) * limit;
        const params = [lgaId];

        let whereClauses = ['u.lga_id = ?'];

        // Role filter
        if (role !== 'all') {
            whereClauses.push('u.role = ?');
            params.push(role);
        } else {
            whereClauses.push("u.role IN ('officer', 'supervisor')");
        }

        // Status filter
        if (status === 'active') {
            whereClauses.push('u.is_active = TRUE');
        } else if (status === 'inactive') {
            whereClauses.push('u.is_active = FALSE');
        }

        // Search filter
        if (search) {
            whereClauses.push('(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Valid sort columns
        const validSortColumns = {
            name: 'u.name',
            activations: 'total_activations',
            revenue: 'total_revenue',
            joined_date: 'u.created_at'
        };
        const sortColumn = validSortColumns[sort_by] || 'u.name';
        const sortDirection = sort_order === 'desc' ? 'DESC' : 'ASC';

        // Get personnel with pagination
        const sql = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.phone,
                u.role,
                u.supervisor_id,
                s.name as supervisor_name,
                u.zone,
                COUNT(a.id) as total_activations,
                COUNT(CASE WHEN st.status = 'active' THEN 1 END) as active_stickers,
                COALESCE(SUM(a.amount_paid), 0) as total_revenue,
                u.is_active,
                DATE(u.created_at) as joined_date,
                u.last_login_at as last_login
            FROM users u
            LEFT JOIN users s ON s.id = u.supervisor_id
            LEFT JOIN activations a ON a.officer_id = u.id OR a.supervisor_id = u.id
            LEFT JOIN stickers st ON st.id = a.sticker_id
            WHERE ${whereClauses.join(' AND ')}
            GROUP BY u.id, u.name, u.email, u.phone, u.role, u.supervisor_id, s.name, u.zone, u.is_active, u.created_at, u.last_login_at
            ORDER BY ${sortColumn} ${sortDirection}
            LIMIT ${parseInt(limit)} OFFSET ${offset}
        `;

        const personnel = await db.query(sql, params);

        // Get total count
        const countSql = `
            SELECT COUNT(DISTINCT u.id) as total
            FROM users u
            WHERE ${whereClauses.join(' AND ')}
        `;
        const countResults = await db.query(countSql, params);
        const totalItems = countResults[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // Get summary stats
        const summarySql = `
            SELECT 
                COUNT(CASE WHEN role = 'officer' THEN 1 END) as total_officers,
                COUNT(CASE WHEN role = 'officer' AND is_active = TRUE THEN 1 END) as active_officers,
                COUNT(CASE WHEN role = 'supervisor' THEN 1 END) as total_supervisors,
                COUNT(CASE WHEN role = 'supervisor' AND is_active = TRUE THEN 1 END) as active_supervisors,
                COUNT(*) as total_personnel
            FROM users
            WHERE lga_id = ? AND role IN ('officer', 'supervisor')
        `;
        const summaryResults = await db.query(summarySql, [lgaId]);

        return {
            personnel,
            pagination: {
                current_page: parseInt(page),
                total_pages: totalPages,
                total_items: totalItems,
                items_per_page: parseInt(limit),
                has_next: page < totalPages,
                has_previous: page > 1
            },
            summary: summaryResults[0]
        };
    }

    /**
     * Get LGA stickers with filters and pagination
     */
    static async getStickers(lgaId, options = {}) {
        const {
            page = 1,
            limit = 50,
            status = 'all',
            search = '',
            officer_id = null,
            date_from = null,
            date_to = null
        } = options;

        const offset = (page - 1) * limit;
        const params = [lgaId];

        let whereClauses = ['s.lga_id = ?'];

        // Status filter
        if (status !== 'all') {
            whereClauses.push('s.status = ?');
            params.push(status);
        }

        // Search filter
        if (search) {
            whereClauses.push('(s.code LIKE ? OR a.customer_name LIKE ?)');
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        // Officer filter
        if (officer_id) {
            whereClauses.push('s.activated_by = ?');
            params.push(officer_id);
        }

        // Date range filters
        if (date_from) {
            whereClauses.push('DATE(a.activation_date) >= ?');
            params.push(date_from);
        }
        if (date_to) {
            whereClauses.push('DATE(a.activation_date) <= ?');
            params.push(date_to);
        }

        // Get stickers with pagination
        const sql = `
            SELECT 
                s.id,
                s.code,
                s.status,
                a.customer_name as vehicle_plate,
                a.customer_name as vehicle_owner,
                a.customer_phone as vehicle_phone,
                u.name as activated_by,
                s.activated_by as activated_by_id,
                a.activation_date,
                a.expiry_date,
                COALESCE(a.amount_paid, l.sticker_price) as price,
                CASE 
                    WHEN a.expiry_date IS NOT NULL THEN DATEDIFF(a.expiry_date, CURDATE())
                    ELSE NULL 
                END as days_remaining
            FROM stickers s
            LEFT JOIN activations a ON a.sticker_id = s.id
            LEFT JOIN users u ON u.id = s.activated_by
            LEFT JOIN lgas l ON l.id = s.lga_id
            WHERE ${whereClauses.join(' AND ')}
            ORDER BY s.created_at DESC
            LIMIT ${parseInt(limit)} OFFSET ${offset}
        `;

        const stickers = await db.query(sql, params);

        // Get total count
        const countSql = `
            SELECT COUNT(*) as total
            FROM stickers s
            LEFT JOIN activations a ON a.sticker_id = s.id
            WHERE ${whereClauses.join(' AND ')}
        `;
        const countResults = await db.query(countSql, params);
        const totalItems = countResults[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // Get summary stats
        const summarySql = `
            SELECT 
                COUNT(*) as total_generated,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
                COUNT(CASE WHEN status = 'unused' THEN 1 END) as unused,
                COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired,
                ROUND(COUNT(CASE WHEN status = 'active' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as utilization_rate
            FROM stickers
            WHERE lga_id = ?
        `;
        const summaryResults = await db.query(summarySql, [lgaId]);

        return {
            stickers,
            pagination: {
                current_page: parseInt(page),
                total_pages: totalPages,
                total_items: totalItems,
                items_per_page: parseInt(limit),
                has_next: page < totalPages,
                has_previous: page > 1
            },
            summary: summaryResults[0]
        };
    }
}

module.exports = LGA;
