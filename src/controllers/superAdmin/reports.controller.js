const asyncHandler = require('../../middleware/asyncHandler');
const { formatCurrency, calculateTrend } = require('../../utils/helpers');
const db = require('../../config/database');

/**
 * @desc    Get comprehensive system reports with analytics
 * @route   GET /api/v1/super-admin/reports
 * @access  Private (Super Admin only)
 */
const getReports = asyncHandler(async (req, res) => {
    const {
        period = 'last_30_days',
        start_date,
        end_date,
        lga_id
    } = req.query;

    // Calculate date range based on period
    let startDate, endDate;
    const now = new Date();

    switch (period) {
        case 'last_7_days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            endDate = now;
            break;
        case 'last_30_days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            endDate = now;
            break;
        case 'last_90_days':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            endDate = now;
            break;
        case 'this_year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = now;
            break;
        case 'custom':
            if (!start_date || !end_date) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_DATE_RANGE',
                        message: 'start_date and end_date are required for custom period'
                    }
                });
            }
            startDate = new Date(start_date);
            endDate = new Date(end_date);
            break;
        default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            endDate = now;
    }

    // Build LGA filter
    const lgaFilter = lga_id ? 'AND lga_id = ?' : '';
    const lgaParams = lga_id ? [lga_id] : [];

    // Execute all queries in parallel
    const [
        summaryStats,
        revenueByLGA,
        stickersByLGA,
        monthlyTrend,
        statusDistribution,
        lgaDetails,
        previousPeriodRevenue,
        previousPeriodActivations
    ] = await Promise.all([
        // Summary statistics
        getSummaryStats(startDate, endDate, lgaFilter, lgaParams),

        // Revenue by LGA
        getRevenueByLGA(startDate, endDate, lgaFilter, lgaParams),

        // Stickers by LGA
        getStickersByLGA(startDate, endDate, lgaFilter, lgaParams),

        // Monthly trend
        getMonthlyTrend(startDate, endDate, lgaFilter, lgaParams),

        // Status distribution
        getStatusDistribution(lgaFilter, lgaParams),

        // LGA details
        getLGADetails(startDate, endDate, lgaFilter, lgaParams),

        // Previous period for growth calculation
        getPreviousPeriodRevenue(startDate, endDate, lgaFilter, lgaParams),
        getPreviousPeriodActivations(startDate, endDate, lgaFilter, lgaParams)
    ]);

    // Calculate growth percentages
    const revenueGrowth = calculateTrend(
        summaryStats.total_revenue,
        previousPeriodRevenue
    );

    const activationGrowth = calculateTrend(
        summaryStats.total_stickers_activated,
        previousPeriodActivations
    );

    res.status(200).json({
        success: true,
        message: 'Reports retrieved successfully',
        data: {
            period: {
                type: period,
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0]
            },
            summary: {
                ...summaryStats,
                revenue_growth: revenueGrowth.percentage,
                revenue_growth_direction: revenueGrowth.direction,
                activation_growth: activationGrowth.percentage,
                activation_growth_direction: activationGrowth.direction
            },
            revenue_by_lga: revenueByLGA,
            stickers_by_lga: stickersByLGA,
            monthly_trend: monthlyTrend,
            status_distribution: statusDistribution,
            lga_details: lgaDetails
        }
    });
});

/**
 * Helper function to get summary statistics
 */
async function getSummaryStats(startDate, endDate, lgaFilter, lgaParams) {
    const sql = `
        SELECT 
            COALESCE(SUM(a.amount_paid), 0) as total_revenue,
            COUNT(DISTINCT s.id) as total_stickers_generated,
            COUNT(DISTINCT CASE WHEN a.id IS NOT NULL THEN a.id END) as total_stickers_activated,
            ROUND((COUNT(DISTINCT CASE WHEN a.id IS NOT NULL THEN a.id END) / NULLIF(COUNT(DISTINCT s.id), 0)) * 100, 1) as activation_rate,
            COUNT(DISTINCT u.id) as total_personnel,
            COUNT(DISTINCT l.id) as total_lgas
        FROM lgas l
        LEFT JOIN stickers s ON l.id = s.lga_id
        LEFT JOIN activations a ON s.id = a.sticker_id 
            AND a.activation_date BETWEEN ? AND ?
        LEFT JOIN users u ON l.id = u.lga_id 
            AND u.role IN ('lga_admin', 'supervisor', 'officer')
        WHERE l.is_active = TRUE ${lgaFilter}
    `;

    const params = [startDate, endDate, ...lgaParams];
    const results = await db.query(sql, params);

    return {
        total_revenue: parseInt(results[0].total_revenue) || 0,
        total_stickers_generated: parseInt(results[0].total_stickers_generated) || 0,
        total_stickers_activated: parseInt(results[0].total_stickers_activated) || 0,
        activation_rate: parseFloat(results[0].activation_rate) || 0,
        total_personnel: parseInt(results[0].total_personnel) || 0,
        total_lgas: parseInt(results[0].total_lgas) || 0
    };
}

/**
 * Helper function to get revenue by LGA
 */
async function getRevenueByLGA(startDate, endDate, lgaFilter, lgaParams) {
    const sql = `
        SELECT 
            l.id as lga_id,
            l.name as lga_name,
            l.code as lga_code,
            COALESCE(SUM(a.amount_paid), 0) as revenue
        FROM lgas l
        LEFT JOIN activations a ON l.id = a.lga_id 
            AND a.activation_date BETWEEN ? AND ?
        WHERE l.is_active = TRUE ${lgaFilter}
        GROUP BY l.id, l.name, l.code
        ORDER BY revenue DESC
    `;

    const params = [startDate, endDate, ...lgaParams];
    const results = await db.query(sql, params);

    return results.map(row => ({
        lga_id: row.lga_id,
        lga_name: row.lga_name,
        lga_code: row.lga_code,
        revenue: parseInt(row.revenue)
    }));
}

/**
 * Helper function to get stickers by LGA
 */
async function getStickersByLGA(startDate, endDate, lgaFilter, lgaParams) {
    const sql = `
        SELECT 
            l.id as lga_id,
            l.name as lga_name,
            COUNT(DISTINCT s.id) as \`generated\`,
            COUNT(DISTINCT CASE WHEN s.status != 'unused' THEN s.id END) as activated,
            ROUND((COUNT(DISTINCT CASE WHEN s.status != 'unused' THEN s.id END) / 
                NULLIF(COUNT(DISTINCT s.id), 0)) * 100, 1) as activation_rate
        FROM lgas l
        LEFT JOIN stickers s ON l.id = s.lga_id
        WHERE l.is_active = TRUE ${lgaFilter}
        GROUP BY l.id, l.name
        ORDER BY \`generated\` DESC
    `;

    const params = [...lgaParams];
    const results = await db.query(sql, params);

    return results.map(row => ({
        lga_id: row.lga_id,
        lga_name: row.lga_name,
        generated: parseInt(row.generated) || 0,
        activated: parseInt(row.activated) || 0,
        activation_rate: parseFloat(row.activation_rate) || 0
    }));
}

/**
 * Helper function to get monthly trend
 */
async function getMonthlyTrend(startDate, endDate, lgaFilter, lgaParams) {
    const sql = `
        SELECT 
            DATE_FORMAT(a.activation_date, '%Y-%m') as month,
            COALESCE(SUM(a.amount_paid), 0) as revenue,
            COUNT(a.id) as activations
        FROM activations a
        WHERE a.activation_date BETWEEN ? AND ? ${lgaFilter.replace('AND lga_id', 'AND a.lga_id')}
        GROUP BY DATE_FORMAT(a.activation_date, '%Y-%m')
        ORDER BY month ASC
    `;

    const params = [startDate, endDate, ...lgaParams];
    const results = await db.query(sql, params);

    return results.map(row => ({
        month: row.month,
        revenue: parseInt(row.revenue),
        activations: parseInt(row.activations)
    }));
}

/**
 * Helper function to get status distribution
 */
async function getStatusDistribution(lgaFilter, lgaParams) {
    const sql = `
        SELECT 
            s.status,
            COUNT(*) as count
        FROM stickers s
        WHERE 1=1 ${lgaFilter.replace('AND lga_id', 'AND s.lga_id')}
        GROUP BY s.status
        ORDER BY count DESC
    `;

    const params = [...lgaParams];
    const results = await db.query(sql, params);

    return results.map(row => ({
        status: row.status,
        count: parseInt(row.count)
    }));
}

/**
 * Helper function to get LGA details
 */
async function getLGADetails(startDate, endDate, lgaFilter, lgaParams) {
    const sql = `
        SELECT 
            l.id as lga_id,
            l.name as lga_name,
            l.code as lga_code,
            COALESCE(SUM(a.amount_paid), 0) as total_revenue,
            COUNT(DISTINCT s.id) as stickers_generated,
            COUNT(DISTINCT a.id) as stickers_activated,
            ROUND((COUNT(DISTINCT a.id) / NULLIF(COUNT(DISTINCT s.id), 0)) * 100, 1) as activation_rate,
            COUNT(DISTINCT CASE WHEN u.role = 'officer' THEN u.id END) as officers_count,
            COUNT(DISTINCT CASE WHEN u.role = 'supervisor' THEN u.id END) as supervisors_count,
            ROUND(COALESCE(SUM(a.amount_paid), 0) / NULLIF(COUNT(DISTINCT CASE WHEN u.role = 'officer' THEN u.id END), 0), 0) as avg_revenue_per_officer
        FROM lgas l
        LEFT JOIN stickers s ON l.id = s.lga_id
        LEFT JOIN activations a ON s.id = a.sticker_id 
            AND a.activation_date BETWEEN ? AND ?
        LEFT JOIN users u ON l.id = u.lga_id 
            AND u.role IN ('officer', 'supervisor')
        WHERE l.is_active = TRUE ${lgaFilter}
        GROUP BY l.id, l.name, l.code
        ORDER BY total_revenue DESC
    `;

    const params = [startDate, endDate, ...lgaParams];
    const results = await db.query(sql, params);

    return results.map(row => ({
        lga_id: row.lga_id,
        lga_name: row.lga_name,
        lga_code: row.lga_code,
        total_revenue: parseInt(row.total_revenue),
        stickers_generated: parseInt(row.stickers_generated) || 0,
        stickers_activated: parseInt(row.stickers_activated) || 0,
        activation_rate: parseFloat(row.activation_rate) || 0,
        officers_count: parseInt(row.officers_count) || 0,
        supervisors_count: parseInt(row.supervisors_count) || 0,
        avg_revenue_per_officer: parseInt(row.avg_revenue_per_officer) || 0
    }));
}

/**
 * Helper function to get previous period revenue for growth calculation
 */
async function getPreviousPeriodRevenue(startDate, endDate, lgaFilter, lgaParams) {
    const periodLength = endDate - startDate;
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = new Date(startDate.getTime() - 1);

    const sql = `
        SELECT COALESCE(SUM(amount_paid), 0) as revenue
        FROM activations
        WHERE activation_date BETWEEN ? AND ? ${lgaFilter.replace('AND lga_id', 'AND activations.lga_id')}
    `;

    const params = [prevStartDate, prevEndDate, ...lgaParams];
    const results = await db.query(sql, params);

    return parseInt(results[0].revenue) || 0;
}

/**
 * Helper function to get previous period activations for growth calculation
 */
async function getPreviousPeriodActivations(startDate, endDate, lgaFilter, lgaParams) {
    const periodLength = endDate - startDate;
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = new Date(startDate.getTime() - 1);

    const sql = `
        SELECT COUNT(*) as count
        FROM activations
        WHERE activation_date BETWEEN ? AND ? ${lgaFilter.replace('AND lga_id', 'AND activations.lga_id')}
    `;

    const params = [prevStartDate, prevEndDate, ...lgaParams];
    const results = await db.query(sql, params);

    return parseInt(results[0].count) || 0;
}

module.exports = {
    getReports
};
