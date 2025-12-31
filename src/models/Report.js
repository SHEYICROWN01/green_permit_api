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
        
        -- Lifetime statistics (placeholder - will be populated when activation tracking is implemented)
        0 as total_activations,
        0 as total_revenue,
        0 as avg_activations_per_officer,
        0 as avg_revenue_per_officer,
        0 as success_rate,
        
        -- Period statistics (placeholder)
        0 as period_activations,
        0 as period_revenue,
        
        u.created_at
      FROM users u
      LEFT JOIN lgas l ON u.lga_id = l.id
      LEFT JOIN users off ON u.id = off.supervisor_id AND off.role = 'officer'
      WHERE ${supervisorWhere}
      GROUP BY u.id, l.code, u.name, u.email, u.phone, u.is_active, u.created_at
      ORDER BY ${sortField === 'name' ? 'u.name' : sortField} ${order}
    `; const supervisors = await db.query(sql, params);

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
        
        -- Placeholder values for activation data
        0 as total_activations,
        0 as total_revenue,
        0 as avg_activations_per_supervisor,
        0 as avg_revenue_per_supervisor,
        0 as period_activations,
        0 as period_revenue
      FROM users sup
      LEFT JOIN users off ON sup.id = off.supervisor_id AND off.role = 'officer'
      WHERE sup.lga_id = ? AND sup.role = 'supervisor'
    `;

        const [summary] = await db.query(sql, [lgaId]);

        // Get top supervisor (placeholder - will use activation data later)
        const topSupervisorSql = `
      SELECT 
        CONCAT('sup_', u.id) as supervisor_id,
        u.name,
        0 as total_activations,
        0 as total_revenue
      FROM users u
      WHERE u.lga_id = ? AND u.role = 'supervisor' AND u.is_active = 1
      ORDER BY u.name ASC
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
        
        -- Placeholder statistics (will be populated with real activation data later)
        0 as total_activations,
        0 as total_revenue,
        0 as success_rate,
        0 as avg_daily_activations,
        NULL as last_activation_date,
        0 as period_activations,
        0 as period_revenue,
        0 as period_success_rate,
        
        u.created_at,
        u.last_login_at as last_login
      FROM users u
      WHERE ${officerWhere}
      ORDER BY u.name ASC
    `;

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

        // Calculate summary for this supervisor
        const summary = {
            total_officers: officers.length,
            active_officers: officers.filter(o => o.status === 'active').length,
            inactive_officers: officers.filter(o => o.status === 'inactive').length,
            total_activations: 0, // Placeholder
            total_revenue: 0, // Placeholder
            avg_success_rate: 0, // Placeholder
            period_activations: 0, // Placeholder
            period_revenue: 0, // Placeholder
            best_performer: officers.length > 0 ? {
                officer_id: officers[0].officer_id,
                name: officers[0].name,
                activations: 0,
                revenue: 0
            } : null,
            lowest_performer: officers.length > 0 ? {
                officer_id: officers[officers.length - 1].officer_id,
                name: officers[officers.length - 1].name,
                activations: 0,
                revenue: 0
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

        // Get current period totals
        const totalsSql = `
      SELECT 
        COUNT(DISTINCT sup.id) as supervisors,
        COUNT(DISTINCT off.id) as officers,
        0 as activations,  -- Placeholder
        0 as revenue       -- Placeholder
      FROM users sup
      LEFT JOIN users off ON sup.id = off.supervisor_id AND off.role = 'officer'
      WHERE sup.lga_id = ? AND sup.role = 'supervisor'
    `;

        const [totals] = await db.query(totalsSql, [lgaId]);

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
