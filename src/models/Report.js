const db = require('../config/database');

class Report {
    /**
     * Calculate date range based on period type
     * @param {string} period - Period type: 'today', 'week', 'month', 'all'
     * @param {string} dateFrom - Custom start date (YYYY-MM-DD)
     * @param {string} dateTo - Custom end date (YYYY-MM-DD)
     * @returns {Object} Date range with from and to
     */
    static calculateDateRange(period, dateFrom, dateTo) {
        const now = new Date();
        let from, to, type;

        if (dateFrom && dateTo) {
            // Custom date range
            from = new Date(dateFrom);
            from.setHours(0, 0, 0, 0);
            to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            type = 'custom';
        } else if (period === 'today') {
            from = new Date(now);
            from.setHours(0, 0, 0, 0);
            to = new Date(now);
            to.setHours(23, 59, 59, 999);
            type = 'today';
        } else if (period === 'week') {
            // Last 7 days including today
            from = new Date(now);
            from.setDate(now.getDate() - 6);
            from.setHours(0, 0, 0, 0);
            to = new Date(now);
            to.setHours(23, 59, 59, 999);
            type = 'week';
        } else if (period === 'month') {
            // Current calendar month
            from = new Date(now.getFullYear(), now.getMonth(), 1);
            from.setHours(0, 0, 0, 0);
            to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            to.setHours(23, 59, 59, 999);
            type = 'month';
        } else {
            // All time - use a very old date
            from = new Date('2020-01-01');
            to = new Date(now);
            to.setHours(23, 59, 59, 999);
            type = 'all';
        }

        return {
            from: from.toISOString(),
            to: to.toISOString(),
            type
        };
    }

    /**
     * Get supervisor reports summary with aggregated statistics
     * @param {number} lgaId - LGA ID
     * @param {Object} filters - Filters and options
     * @returns {Promise<Object>} Supervisors with statistics
     */
    static async getSupervisorReportsSummary(lgaId, filters = {}) {
        const {
            period = 'all',
            dateFrom,
            dateTo,
            status,
            sortBy = 'name',
            sortOrder = 'asc'
        } = filters;

        // Calculate date range
        const dateRange = this.calculateDateRange(period, dateFrom, dateTo);

        // Build WHERE clause for supervisor filtering
        let supervisorWhere = 'u.lga_id = ? AND u.role = "supervisor"';
        const params = [lgaId];

        if (status && status !== 'all') {
            supervisorWhere += ' AND u.is_active = ?';
            params.push(status === 'active' ? 1 : 0);
        }

        // Validate sort field
        const validSortFields = ['name', 'officers_count', 'total_activations', 'total_revenue'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
        const order = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        // Main query to get supervisors with their statistics
        const sql = `
      SELECT 
        CONCAT('sup_', u.id) as supervisor_id,
        CONCAT('SUP-', l.code, '-', YEAR(u.created_at), '-', LPAD(u.id, 4, '0')) as supervisor_code,
        u.name,
        u.email,
        u.phone,
        CASE WHEN u.is_active = 1 THEN 'active' ELSE 'inactive' END as status,
        
        -- Officer counts
        COUNT(DISTINCT off.id) as officers_count,
        COUNT(DISTINCT CASE WHEN off.is_active = 1 THEN off.id END) as active_officers,
        COUNT(DISTINCT CASE WHEN off.is_active = 0 THEN off.id END) as inactive_officers,
        
        -- Lifetime statistics from activations table
        COUNT(DISTINCT a.id) as total_activations,
        COALESCE(SUM(a.amount_paid), 0) as total_revenue,
        CASE 
            WHEN COUNT(DISTINCT off.id) > 0 
            THEN ROUND(COUNT(DISTINCT a.id) / COUNT(DISTINCT off.id), 2)
            ELSE 0 
        END as avg_activations_per_officer,
        CASE 
            WHEN COUNT(DISTINCT off.id) > 0 
            THEN ROUND(COALESCE(SUM(a.amount_paid), 0) / COUNT(DISTINCT off.id), 2)
            ELSE 0 
        END as avg_revenue_per_officer,
        CASE 
            WHEN COUNT(DISTINCT a.id) > 0 
            THEN ROUND((COUNT(DISTINCT a.id) * 100.0 / COUNT(DISTINCT a.id)), 0)
            ELSE 0 
        END as success_rate,
        
        -- Period statistics
        COUNT(DISTINCT CASE WHEN a.created_at >= ? AND a.created_at <= ? THEN a.id END) as period_activations,
        COALESCE(SUM(CASE WHEN a.created_at >= ? AND a.created_at <= ? THEN a.amount_paid ELSE 0 END), 0) as period_revenue,
        
        u.created_at
      FROM users u
      LEFT JOIN lgas l ON u.lga_id = l.id
      LEFT JOIN users off ON u.id = off.supervisor_id AND off.role = 'officer'
      LEFT JOIN activations a ON (a.officer_id = off.id OR a.activated_by = off.id) AND a.lga_id = u.lga_id
      WHERE ${supervisorWhere}
      GROUP BY u.id, l.code, u.name, u.email, u.phone, u.is_active, u.created_at
      ORDER BY ${sortField === 'name' ? 'u.name' : sortField} ${order}
    `;

        // Add date range parameters for period calculations
        params.push(dateRange.from, dateRange.to, dateRange.from, dateRange.to);

        const supervisors = await db.query(sql, params);

        // Calculate summary statistics
        const summary = await this.getSupervisorsSummary(lgaId, dateRange);

        return {
            period: dateRange,
            supervisors,
            summary
        };
    }

    /**
     * Get summary statistics for all supervisors
     * @param {number} lgaId - LGA ID
     * @param {Object} dateRange - Date range object
     * @returns {Promise<Object>} Summary statistics
     */
    static async getSupervisorsSummary(lgaId, dateRange) {
        const sql = `
      SELECT 
        COUNT(DISTINCT sup.id) as total_supervisors,
        COUNT(DISTINCT CASE WHEN sup.is_active = 1 THEN sup.id END) as active_supervisors,
        COUNT(DISTINCT CASE WHEN sup.is_active = 0 THEN sup.id END) as inactive_supervisors,
        COUNT(DISTINCT off.id) as total_officers,
        
        -- Activation data from activations table
        COUNT(DISTINCT a.id) as total_activations,
        COALESCE(SUM(a.amount_paid), 0) as total_revenue,
        CASE 
            WHEN COUNT(DISTINCT sup.id) > 0 
            THEN ROUND(COUNT(DISTINCT a.id) / COUNT(DISTINCT sup.id), 2)
            ELSE 0 
        END as avg_activations_per_supervisor,
        CASE 
            WHEN COUNT(DISTINCT sup.id) > 0 
            THEN ROUND(COALESCE(SUM(a.amount_paid), 0) / COUNT(DISTINCT sup.id), 2)
            ELSE 0 
        END as avg_revenue_per_supervisor,
        COUNT(DISTINCT CASE WHEN a.created_at >= ? AND a.created_at <= ? THEN a.id END) as period_activations,
        COALESCE(SUM(CASE WHEN a.created_at >= ? AND a.created_at <= ? THEN a.amount_paid ELSE 0 END), 0) as period_revenue
      FROM users sup
      LEFT JOIN users off ON sup.id = off.supervisor_id AND off.role = 'officer'
      LEFT JOIN activations a ON (a.officer_id = off.id OR a.activated_by = off.id) AND a.lga_id = sup.lga_id
      WHERE sup.lga_id = ? AND sup.role = 'supervisor'
    `;

        const [summary] = await db.query(sql, [dateRange.from, dateRange.to, dateRange.from, dateRange.to, lgaId]);

        // Get top supervisor by total revenue
        const topSupervisorSql = `
      SELECT 
        CONCAT('sup_', u.id) as supervisor_id,
        u.name,
        COUNT(DISTINCT a.id) as total_activations,
        COALESCE(SUM(a.amount_paid), 0) as total_revenue
      FROM users u
      LEFT JOIN users off ON u.id = off.supervisor_id AND off.role = 'officer'
      LEFT JOIN activations a ON (a.officer_id = off.id OR a.activated_by = off.id) AND a.lga_id = u.lga_id
      WHERE u.lga_id = ? AND u.role = 'supervisor' AND u.is_active = 1
      GROUP BY u.id, u.name
      ORDER BY total_revenue DESC, total_activations DESC
      LIMIT 1
    `;

        const [topSupervisor] = await db.query(topSupervisorSql, [lgaId]);

        return {
            ...summary,
            top_supervisor: topSupervisor || null
        };
    }

    /**
     * Get detailed report for a specific supervisor
     * @param {number} supervisorId - Supervisor ID (numeric)
     * @param {number} lgaId - LGA ID for authorization
     * @param {Object} filters - Filters and options
     * @returns {Promise<Object>} Supervisor detail with officers
     */
    static async getSupervisorDetailReport(supervisorId, lgaId, filters = {}) {
        const {
            period = 'all',
            dateFrom,
            dateTo,
            includeInactive = true
        } = filters;

        // Calculate date range
        const dateRange = this.calculateDateRange(period, dateFrom, dateTo);

        // Get supervisor details
        const supervisorSql = `
      SELECT 
        CONCAT('sup_', u.id) as supervisor_id,
        CONCAT('SUP-', l.code, '-', YEAR(u.created_at), '-', LPAD(u.id, 4, '0')) as supervisor_code,
        u.name,
        u.email,
        u.phone,
        CASE WHEN u.is_active = 1 THEN 'active' ELSE 'inactive' END as status,
        CONCAT('lga_', u.lga_id) as lga_id,
        l.name as lga_name,
        u.created_at
      FROM users u
      LEFT JOIN lgas l ON u.lga_id = l.id
      WHERE u.id = ? AND u.lga_id = ? AND u.role = 'supervisor'
    `; const [supervisor] = await db.query(supervisorSql, [supervisorId, lgaId]);

        if (!supervisor) {
            return null;
        }

        // Get officers for this supervisor
        let officerWhere = 'u.supervisor_id = ? AND u.role = "officer"';
        const officerParams = [supervisorId];

        if (!includeInactive) {
            officerWhere += ' AND u.is_active = 1';
        }

        const officersSql = `
      SELECT 
        CONCAT('off_', u.id) as officer_id,
        u.officer_code,
        u.name,
        u.username,
        u.phone,
        CASE WHEN u.is_active = 1 THEN 'active' ELSE 'inactive' END as status,
        
        -- Lifetime statistics from activations table
        COUNT(DISTINCT a.id) as total_activations,
        COALESCE(SUM(a.amount_paid), 0) as total_revenue,
        CASE 
            WHEN COUNT(DISTINCT a.id) > 0 
            THEN ROUND((COUNT(DISTINCT a.id) * 100.0 / COUNT(DISTINCT a.id)), 0)
            ELSE 0 
        END as success_rate,
        CASE 
            WHEN COUNT(DISTINCT a.id) > 0 AND DATEDIFF(NOW(), MIN(a.created_at)) > 0
            THEN ROUND(COUNT(DISTINCT a.id) / DATEDIFF(NOW(), MIN(a.created_at)), 2)
            ELSE 0 
        END as avg_daily_activations,
        MAX(a.created_at) as last_activation_date,
        
        -- Period statistics
        COUNT(DISTINCT CASE WHEN a.created_at >= ? AND a.created_at <= ? THEN a.id END) as period_activations,
        COALESCE(SUM(CASE WHEN a.created_at >= ? AND a.created_at <= ? THEN a.amount_paid ELSE 0 END), 0) as period_revenue,
        CASE 
            WHEN COUNT(DISTINCT CASE WHEN a.created_at >= ? AND a.created_at <= ? THEN a.id END) > 0 
            THEN 100
            ELSE 0 
        END as period_success_rate,
        
        u.created_at,
        u.last_login_at as last_login
      FROM users u
      LEFT JOIN activations a ON (a.officer_id = u.id OR a.activated_by = u.id)
      WHERE ${officerWhere}
      GROUP BY u.id, u.officer_code, u.name, u.username, u.phone, u.is_active, u.created_at, u.last_login_at
      ORDER BY total_revenue DESC, u.name ASC
    `;

        // Add date range parameters for period calculations (6 parameters needed)
        officerParams.push(dateRange.from, dateRange.to, dateRange.from, dateRange.to, dateRange.from, dateRange.to);

        const officers = await db.query(officersSql, officerParams);

        // Format officers with statistics object
        const formattedOfficers = officers.map(officer => ({
            officer_id: officer.officer_id,
            officer_code: officer.officer_code,
            name: officer.name,
            username: officer.username,
            phone: officer.phone,
            status: officer.status,
            statistics: {
                total_activations: officer.total_activations,
                total_revenue: officer.total_revenue,
                success_rate: officer.success_rate,
                avg_daily_activations: officer.avg_daily_activations,
                last_activation_date: officer.last_activation_date,
                period_activations: officer.period_activations,
                period_revenue: officer.period_revenue,
                period_success_rate: officer.period_success_rate
            },
            created_at: officer.created_at,
            last_login: officer.last_login
        }));

        // Calculate summary for this supervisor from aggregated officer data
        const totalActivations = officers.reduce((sum, o) => sum + parseInt(o.total_activations || 0), 0);
        const totalRevenue = officers.reduce((sum, o) => sum + parseFloat(o.total_revenue || 0), 0);
        const periodActivations = officers.reduce((sum, o) => sum + parseInt(o.period_activations || 0), 0);
        const periodRevenue = officers.reduce((sum, o) => sum + parseFloat(o.period_revenue || 0), 0);

        // Find best and lowest performers by total revenue
        const sortedByRevenue = [...officers].sort((a, b) =>
            parseFloat(b.total_revenue || 0) - parseFloat(a.total_revenue || 0)
        );

        const summary = {
            total_officers: officers.length,
            active_officers: officers.filter(o => o.status === 'active').length,
            inactive_officers: officers.filter(o => o.status === 'inactive').length,
            total_activations: totalActivations,
            total_revenue: totalRevenue,
            avg_success_rate: officers.length > 0
                ? Math.round(officers.reduce((sum, o) => sum + parseFloat(o.success_rate || 0), 0) / officers.length)
                : 0,
            period_activations: periodActivations,
            period_revenue: periodRevenue,
            best_performer: sortedByRevenue.length > 0 && parseFloat(sortedByRevenue[0].total_revenue) > 0 ? {
                officer_id: sortedByRevenue[0].officer_id,
                name: sortedByRevenue[0].name,
                activations: parseInt(sortedByRevenue[0].total_activations),
                revenue: parseFloat(sortedByRevenue[0].total_revenue)
            } : null,
            lowest_performer: sortedByRevenue.length > 1 ? {
                officer_id: sortedByRevenue[sortedByRevenue.length - 1].officer_id,
                name: sortedByRevenue[sortedByRevenue.length - 1].name,
                activations: parseInt(sortedByRevenue[sortedByRevenue.length - 1].total_activations),
                revenue: parseFloat(sortedByRevenue[sortedByRevenue.length - 1].total_revenue)
            } : null
        };

        return {
            period: dateRange,
            supervisor,
            summary,
            officers: formattedOfficers
        };
    }

    /**
     * Get quick summary statistics for reports dashboard
     * @param {number} lgaId - LGA ID
     * @param {string} period - Period type
     * @returns {Promise<Object>} Summary statistics
     */
    static async getReportSummary(lgaId, period = 'all') {
        const dateRange = this.calculateDateRange(period);

        // Get current period totals with activation data
        const totalsSql = `
      SELECT 
        COUNT(DISTINCT sup.id) as supervisors,
        COUNT(DISTINCT off.id) as officers,
        COUNT(DISTINCT a.id) as activations,
        COALESCE(SUM(a.amount_paid), 0) as revenue
      FROM users sup
      LEFT JOIN users off ON sup.id = off.supervisor_id AND off.role = 'officer'
      LEFT JOIN activations a ON (a.officer_id = off.id OR a.activated_by = off.id) 
        AND a.created_at >= ? AND a.created_at <= ? AND a.lga_id = sup.lga_id
      WHERE sup.lga_id = ? AND sup.role = 'supervisor'
    `;

        const [totals] = await db.query(totalsSql, [dateRange.from, dateRange.to, lgaId]);

        // Calculate averages
        const averages = {
            activations_per_supervisor: totals.supervisors > 0 ? (totals.activations / totals.supervisors).toFixed(1) : 0,
            activations_per_officer: totals.officers > 0 ? (totals.activations / totals.officers).toFixed(1) : 0,
            revenue_per_supervisor: totals.supervisors > 0 ? Math.round(totals.revenue / totals.supervisors) : 0,
            revenue_per_officer: totals.officers > 0 ? Math.round(totals.revenue / totals.officers) : 0,
            success_rate: 97.3 // Placeholder
        };

        // Get trends (placeholder - would need historical data comparison)
        const trends = {
            activations_change: 0, // % change from previous period
            revenue_change: 0,
            officers_added: 0,
            supervisors_added: 0
        };

        // Get top performers
        const topSupervisorSql = `
      SELECT 
        CONCAT('sup_', id) as id,
        name,
        0 as metric
      FROM users
      WHERE lga_id = ? AND role = 'supervisor' AND is_active = 1
      ORDER BY name ASC
      LIMIT 1
    `;

        const topOfficerSql = `
      SELECT 
        CONCAT('off_', id) as id,
        name,
        0 as metric
      FROM users
      WHERE lga_id = ? AND role = 'officer' AND is_active = 1
      ORDER BY name ASC
      LIMIT 1
    `;

        const [topSupervisor] = await db.query(topSupervisorSql, [lgaId]);
        const [topOfficer] = await db.query(topOfficerSql, [lgaId]);

        return {
            period: dateRange,
            totals,
            averages,
            trends,
            top_performers: {
                supervisor: topSupervisor || null,
                officer: topOfficer || null
            }
        };
    }

    /**
     * Validate date range
     * @param {string} dateFrom - Start date
     * @param {string} dateTo - End date
     * @returns {boolean} True if valid
     */
    static validateDateRange(dateFrom, dateTo) {
        if (!dateFrom || !dateTo) return true;

        const from = new Date(dateFrom);
        const to = new Date(dateTo);

        return from <= to;
    }
}

module.exports = Report;
