const db = require('../config/database');

class Activation {
    /**
     * Get total revenue for a period
     */
    static async getTotalRevenue(startDate = null, endDate = null) {
        let sql = `
            SELECT COALESCE(SUM(amount_paid), 0) as total_revenue
            FROM activations
            WHERE 1=1
        `;
        const params = [];

        if (startDate && endDate) {
            sql += ` AND activation_date BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        } else if (startDate) {
            sql += ` AND activation_date >= ?`;
            params.push(startDate);
        } else if (endDate) {
            sql += ` AND activation_date <= ?`;
            params.push(endDate);
        }

        const [result] = await db.query(sql, params);
        return result[0]?.total_revenue || 0;
    }

    /**
     * Get revenue by LGA
     */
    static async getRevenueByLGA(startDate = null, endDate = null) {
        let sql = `
            SELECT 
                l.id,
                l.name,
                l.code,
                COALESCE(SUM(a.amount_paid), 0) as revenue,
                COUNT(a.id) as activations
            FROM lgas l
            LEFT JOIN activations a ON a.lga_id = l.id
        `;
        const params = [];

        if (startDate && endDate) {
            sql += ` AND a.activation_date BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        } else if (startDate) {
            sql += ` AND a.activation_date >= ?`;
            params.push(startDate);
        } else if (endDate) {
            sql += ` AND a.activation_date <= ?`;
            params.push(endDate);
        }

        sql += `
            WHERE l.is_active = 1
            GROUP BY l.id, l.name, l.code
            ORDER BY revenue DESC
        `;

        return await db.query(sql, params);
    }

    /**
     * Get recent activations
     */
    static async getRecentActivations(limit = 10) {
        const sql = `
            SELECT 
                a.id,
                s.sticker_code as sticker_number,
                a.customer_name as plate_number,
                a.amount_paid,
                a.activation_date,
                l.name as lga_name,
                l.code as lga_code,
                u.name as activated_by_name,
                u.role as activated_by_role
            FROM activations a
            JOIN lgas l ON a.lga_id = l.id
            LEFT JOIN stickers s ON a.sticker_id = s.id
            LEFT JOIN users u ON a.activated_by = u.id
            ORDER BY a.activation_date DESC
            LIMIT ${parseInt(limit)}
        `;

        return await db.query(sql);
    }

    /**
     * Get daily revenue for the last N days
     */
    static async getDailyRevenue(days = 30) {
        const sql = `
            SELECT 
                DATE(activation_date) as date,
                COUNT(id) as activations,
                COALESCE(SUM(amount_paid), 0) as revenue
            FROM activations
            WHERE activation_date >= DATE_SUB(CURDATE(), INTERVAL ${parseInt(days)} DAY)
            GROUP BY DATE(activation_date)
            ORDER BY date ASC
        `;

        return await db.query(sql);
    }

    /**
     * Get monthly revenue for the last N months
     */
    static async getMonthlyRevenue(months = 12) {
        const sql = `
            SELECT 
                DATE_FORMAT(activation_date, '%Y-%m') as month,
                COUNT(id) as activations,
                COALESCE(SUM(amount_paid), 0) as revenue
            FROM activations
            WHERE activation_date >= DATE_SUB(CURDATE(), INTERVAL ${parseInt(months)} MONTH)
            GROUP BY DATE_FORMAT(activation_date, '%Y-%m')
            ORDER BY month ASC
        `;

        return await db.query(sql);
    }

    /**
     * Get activation count for a period
     */
    static async getActivationCount(startDate = null, endDate = null) {
        let sql = `
            SELECT COUNT(id) as count
            FROM activations
            WHERE 1=1
        `;
        const params = [];

        if (startDate && endDate) {
            sql += ` AND activation_date BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        } else if (startDate) {
            sql += ` AND activation_date >= ?`;
            params.push(startDate);
        } else if (endDate) {
            sql += ` AND activation_date <= ?`;
            params.push(endDate);
        }

        const [result] = await db.query(sql, params);
        return result[0]?.count || 0;
    }

    /**
     * Get top performing officers
     */
    static async getTopOfficers(limit = 10, startDate = null, endDate = null) {
        let sql = `
            SELECT 
                u.id,
                u.name,
                u.role,
                l.name as lga_name,
                COUNT(a.id) as activations,
                COALESCE(SUM(a.amount_paid), 0) as revenue
            FROM users u
            LEFT JOIN activations a ON a.activated_by = u.id
        `;
        const params = [];

        if (startDate && endDate) {
            sql += ` AND a.activation_date BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        } else if (startDate) {
            sql += ` AND a.activation_date >= ?`;
            params.push(startDate);
        } else if (endDate) {
            sql += ` AND a.activation_date <= ?`;
            params.push(endDate);
        }

        sql += `
            LEFT JOIN lgas l ON u.lga_id = l.id
            WHERE u.role IN ('officer', 'supervisor')
            GROUP BY u.id, u.name, u.role, l.name
            ORDER BY activations DESC
            LIMIT ${parseInt(limit)}
        `;

        return await db.query(sql, params);
    }

    /**
     * Get top performing supervisors
     */
    static async getTopSupervisors(limit = 10, startDate = null, endDate = null) {
        let sql = `
            SELECT 
                u.id,
                u.name,
                l.name as lga_name,
                COUNT(DISTINCT a.id) as activations,
                COALESCE(SUM(a.amount_paid), 0) as revenue,
                COUNT(DISTINCT o.id) as team_size
            FROM users u
            LEFT JOIN activations a ON a.supervisor_id = u.id
        `;
        const params = [];

        if (startDate && endDate) {
            sql += ` AND a.activation_date BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        } else if (startDate) {
            sql += ` AND a.activation_date >= ?`;
            params.push(startDate);
        } else if (endDate) {
            sql += ` AND a.activation_date <= ?`;
            params.push(endDate);
        }

        sql += `
            LEFT JOIN users o ON o.supervisor_id = u.id
            LEFT JOIN lgas l ON u.lga_id = l.id
            WHERE u.role = 'supervisor'
            GROUP BY u.id, u.name, l.name
            ORDER BY activations DESC
            LIMIT ${parseInt(limit)}
        `;

        return await db.query(sql, params);
    }

    /**
     * Get activation statistics by vehicle type
     */
    static async getStatsByVehicleType(startDate = null, endDate = null) {
        let sql = `
            SELECT 
                vehicle_type,
                COUNT(id) as count,
                COALESCE(SUM(amount_paid), 0) as revenue
            FROM activations
            WHERE 1=1
        `;
        const params = [];

        if (startDate && endDate) {
            sql += ` AND activation_date BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        } else if (startDate) {
            sql += ` AND activation_date >= ?`;
            params.push(startDate);
        } else if (endDate) {
            sql += ` AND activation_date <= ?`;
            params.push(endDate);
        }

        sql += `
            GROUP BY vehicle_type
            ORDER BY count DESC
        `;

        return await db.query(sql, params);
    }
}

module.exports = Activation;
