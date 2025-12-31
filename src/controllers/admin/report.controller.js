// src/controllers/admin/report.controller.js
const asyncHandler = require('../../middleware/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const db = require('../../config/database');

/**
 * @desc    Get Revenue Report
 * @route   GET /api/v1/admin/reports/revenue
 * @access  Private (Admin only)
 */
exports.getRevenueReport = asyncHandler(async (req, res) => {
    const lgaId = req.user.lga_id;
    const { start_date, end_date, group_by = 'day', format = 'json' } = req.query;

    if (!start_date || !end_date) {
        throw new ApiError(400, 'start_date and end_date are required');
    }

    // Get LGA info
    const [lga] = await db.query('SELECT id, name, state FROM lgas WHERE id = ?', [lgaId]);

    // Get summary
    const [summary] = await db.query(`
        SELECT 
            COALESCE(SUM(price / 100), 0) as total_revenue,
            COUNT(*) as total_activations,
            COALESCE(AVG(price / 100), 0) as average_per_activation
        FROM stickers
        WHERE lga_id = ?
        AND DATE(activated_at) BETWEEN ? AND ?
        AND status IN ('active', 'expired')
    `, [lgaId, start_date, end_date]);

    // Breakdown by day
    const [byDay] = await db.query(`
        SELECT 
            DATE(activated_at) as date,
            COUNT(*) as activations,
            COALESCE(SUM(price / 100), 0) as revenue
        FROM stickers
        WHERE lga_id = ? AND DATE(activated_at) BETWEEN ? AND ?
        AND status IN ('active', 'expired')
        GROUP BY DATE(activated_at)
        ORDER BY date
    `, [lgaId, start_date, end_date]);

    // Breakdown by officer
    const [byOfficer] = await db.query(`
        SELECT 
            u.id as officer_id,
            u.name as officer_name,
            COUNT(s.id) as activations,
            COALESCE(SUM(s.price / 100), 0) as revenue
        FROM users u
        LEFT JOIN stickers s ON u.id = s.activated_by 
            AND DATE(s.activated_at) BETWEEN ? AND ?
            AND s.status IN ('active', 'expired')
        WHERE u.lga_id = ? AND u.role = 'officer'
        GROUP BY u.id, u.name
        HAVING activations > 0
        ORDER BY revenue DESC
    `, [start_date, end_date, lgaId]);

    // Breakdown by supervisor
    const [bySupervisor] = await db.query(`
        SELECT 
            sup.id as supervisor_id,
            sup.name as supervisor_name,
            COUNT(DISTINCT off.id) as officers_count,
            COUNT(s.id) as activations,
            COALESCE(SUM(s.price / 100), 0) as revenue
        FROM users sup
        LEFT JOIN users off ON sup.id = off.supervisor_id
        LEFT JOIN stickers s ON off.id = s.activated_by 
            AND DATE(s.activated_at) BETWEEN ? AND ?
            AND s.status IN ('active', 'expired')
        WHERE sup.lga_id = ? AND sup.role = 'supervisor'
        GROUP BY sup.id, sup.name
        HAVING activations > 0
        ORDER BY revenue DESC
    `, [start_date, end_date, lgaId]);

    const totalDays = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)) + 1;

    const responseData = {
        report_type: 'revenue',
        lga_id: `lga_${lga[0].id}`,
        lga_name: lga[0].name,
        period: {
            start_date,
            end_date
        },
        summary: {
            total_revenue: parseFloat(summary[0].total_revenue),
            total_activations: summary[0].total_activations,
            average_per_activation: parseFloat(summary[0].average_per_activation),
            average_per_day: parseFloat(summary[0].total_revenue) / totalDays
        },
        breakdown_by_day: byDay.map(row => ({
            date: row.date,
            activations: row.activations,
            revenue: parseFloat(row.revenue)
        })),
        breakdown_by_officer: byOfficer.map(row => ({
            officer_id: `off_${row.officer_id}`,
            officer_name: row.officer_name,
            activations: row.activations,
            revenue: parseFloat(row.revenue)
        })),
        breakdown_by_supervisor: bySupervisor.map(row => ({
            supervisor_id: `sup_${row.supervisor_id}`,
            supervisor_name: row.supervisor_name,
            officers_count: row.officers_count,
            activations: row.activations,
            revenue: parseFloat(row.revenue)
        }))
    };

    res.status(200).json(new ApiResponse(200, responseData, 'Revenue report retrieved successfully'));
});

/**
 * @desc    Get Officer Performance Report
 * @route   GET /api/v1/admin/reports/officer-performance
 * @access  Private (Admin only)
 */
exports.getOfficerPerformanceReport = asyncHandler(async (req, res) => {
    const lgaId = req.user.lga_id;
    const { start_date, end_date, officer_id, supervisor_id, sort_by = 'activations', sort_order = 'desc' } = req.query;

    if (!start_date || !end_date) {
        throw new ApiError(400, 'start_date and end_date are required');
    }

    let whereClause = 'WHERE u.lga_id = ? AND u.role = "officer"';
    const params = [lgaId];

    if (officer_id) {
        whereClause += ' AND u.id = ?';
        params.push(officer_id.replace('off_', ''));
    }

    if (supervisor_id) {
        whereClause += ' AND u.supervisor_id = ?';
        params.push(supervisor_id.replace('sup_', ''));
    }

    const [officers] = await db.query(`
        SELECT 
            u.id as officer_id,
            CONCAT('IFO-OFF-', LPAD(u.id, 3, '0')) as officer_code,
            u.name as officer_name,
            s.name as supervisor_name,
            COUNT(st.id) as total_activations,
            COUNT(CASE WHEN st.status IN ('active', 'expired') THEN 1 END) as successful_activations,
            COUNT(CASE WHEN st.status = 'revoked' THEN 1 END) as failed_activations,
            ROUND((COUNT(CASE WHEN st.status IN ('active', 'expired') THEN 1 END) * 100.0 / GREATEST(COUNT(st.id), 1)), 1) as success_rate,
            COALESCE(SUM(st.price / 100), 0) as total_revenue
        FROM users u
        LEFT JOIN users s ON u.supervisor_id = s.id
        LEFT JOIN stickers st ON u.id = st.activated_by 
            AND DATE(st.activated_at) BETWEEN ? AND ?
        ${whereClause}
        GROUP BY u.id, u.name, s.name
        ORDER BY total_activations DESC
    `, [start_date, end_date, ...params]);

    const formattedOfficers = officers.map((officer, index) => {
        const totalDays = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)) + 1;
        const avgPerDay = officer.total_activations / totalDays;

        let performanceRating = 'Poor';
        if (officer.success_rate >= 95 && avgPerDay >= 5) performanceRating = 'Excellent';
        else if (officer.success_rate >= 85 && avgPerDay >= 3) performanceRating = 'Good';
        else if (officer.success_rate >= 70) performanceRating = 'Average';

        return {
            officer_id: `off_${officer.officer_id}`,
            officer_code: officer.officer_code,
            officer_name: officer.officer_name,
            supervisor_name: officer.supervisor_name || 'N/A',
            statistics: {
                total_activations: officer.total_activations,
                successful_activations: officer.successful_activations,
                failed_activations: officer.failed_activations,
                success_rate: parseFloat(officer.success_rate),
                total_revenue: parseFloat(officer.total_revenue),
                average_per_day: parseFloat(avgPerDay.toFixed(1)),
                rank: index + 1,
                performance_rating: performanceRating
            }
        };
    });

    const responseData = {
        report_type: 'officer_performance',
        period: { start_date, end_date },
        officers: formattedOfficers,
        summary: {
            total_officers: officers.length,
            total_activations: officers.reduce((sum, o) => sum + o.total_activations, 0),
            total_revenue: officers.reduce((sum, o) => sum + parseFloat(o.total_revenue), 0),
            average_activations_per_officer: officers.length > 0 ? (officers.reduce((sum, o) => sum + o.total_activations, 0) / officers.length).toFixed(1) : 0,
            top_performer: formattedOfficers[0] || null
        }
    };

    res.status(200).json(new ApiResponse(200, responseData, 'Officer performance report retrieved successfully'));
});

/**
 * @desc    Get Activation History Report
 * @route   GET /api/v1/admin/reports/activations
 * @access  Private (Admin only)
 */
exports.getActivationHistoryReport = asyncHandler(async (req, res) => {
    const lgaId = req.user.lga_id;
    const { start_date, end_date, officer_id, supervisor_id, status, page = 1, limit = 50 } = req.query;

    if (!start_date || !end_date) {
        throw new ApiError(400, 'start_date and end_date are required');
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereClause = 'WHERE s.lga_id = ? AND DATE(s.activated_at) BETWEEN ? AND ?';
    const params = [lgaId, start_date, end_date];

    if (officer_id) {
        whereClause += ' AND s.activated_by = ?';
        params.push(officer_id.replace('off_', ''));
    }

    if (supervisor_id) {
        whereClause += ' AND u.supervisor_id = ?';
        params.push(supervisor_id.replace('sup_', ''));
    }

    if (status) {
        whereClause += ' AND s.status = ?';
        params.push(status);
    }

    // Get total count
    const [count] = await db.query(`
        SELECT COUNT(*) as total
        FROM stickers s
        JOIN users u ON s.activated_by = u.id
        ${whereClause}
    `, params);

    // Get activations
    const [activations] = await db.query(`
        SELECT 
            s.id as activation_id,
            s.sticker_code as sticker_code,
            s.price / 100 as amount_paid,
            s.activated_at as activation_date,
            s.expires_at as expiry_date,
            s.status,
            u.id as officer_id,
            CONCAT('IFO-OFF-', LPAD(u.id, 3, '0')) as officer_code,
            u.name as officer_name,
            sup.id as supervisor_id,
            sup.name as supervisor_name
        FROM stickers s
        JOIN users u ON s.activated_by = u.id
        LEFT JOIN users sup ON u.supervisor_id = sup.id
        ${whereClause}
        ORDER BY s.activated_at DESC
        LIMIT ${parseInt(limit)} OFFSET ${offset}
    `, params);

    // Get summary
    const [summary] = await db.query(`
        SELECT 
            COUNT(*) as total_activations,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_stickers,
            SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_stickers,
            SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) as revoked_stickers,
            COALESCE(SUM(price / 100), 0) as total_revenue
        FROM stickers s
        JOIN users u ON s.activated_by = u.id
        ${whereClause}
    `, params);

    const responseData = {
        activations: activations.map(act => ({
            activation_id: `act_${act.activation_id}`,
            sticker_id: act.sticker_code,
            sticker_code: act.sticker_code,
            cart_pusher: { name: 'N/A', phone: 'N/A' },
            officer: {
                officer_id: `off_${act.officer_id}`,
                officer_code: act.officer_code,
                officer_name: act.officer_name
            },
            supervisor: {
                supervisor_id: act.supervisor_id ? `sup_${act.supervisor_id}` : null,
                supervisor_name: act.supervisor_name || 'N/A'
            },
            amount_paid: parseFloat(act.amount_paid),
            activation_date: act.activation_date,
            expiry_date: act.expiry_date,
            status: act.status,
            location: null
        })),
        pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(count[0].total / parseInt(limit)),
            total_items: count[0].total,
            items_per_page: parseInt(limit)
        },
        summary: {
            total_activations: summary[0].total_activations,
            active_stickers: summary[0].active_stickers,
            expired_stickers: summary[0].expired_stickers,
            revoked_stickers: summary[0].revoked_stickers,
            total_revenue: parseFloat(summary[0].total_revenue)
        }
    };

    res.status(200).json(new ApiResponse(200, responseData, 'Activation history retrieved successfully'));
});

/**
 * @desc    Get Inventory Report
 * @route   GET /api/v1/admin/reports/inventory
 * @access  Private (Admin only)
 */
exports.getInventoryReport = asyncHandler(async (req, res) => {
    const lgaId = req.user.lga_id;

    const [lga] = await db.query('SELECT id, name, state FROM lgas WHERE id = ?', [lgaId]);

    const [summary] = await db.query(`
        SELECT 
            COUNT(*) as total_allocated,
            SUM(CASE WHEN status IN ('active', 'expired', 'revoked') THEN 1 ELSE 0 END) as total_used,
            SUM(CASE WHEN status = 'unused' THEN 1 ELSE 0 END) as total_remaining,
            SUM(CASE WHEN status = 'damaged' THEN 1 ELSE 0 END) as total_damaged
        FROM stickers
        WHERE lga_id = ?
    `, [lgaId]);

    const totalAllocated = summary[0].total_allocated || 0;
    const totalUsed = summary[0].total_used || 0;
    const usageRate = totalAllocated > 0 ? Math.round((totalUsed / totalAllocated) * 100) : 0;

    const [batches] = await db.query(`
        SELECT 
            sb.id as batch_id,
            sb.batch_code as batch_number,
            sb.generated_at as allocated_date,
            sb.quantity as total_stickers,
            sb.used_count as used,
            (sb.quantity - sb.used_count) as remaining,
            0 as damaged,
            'active' as status
        FROM sticker_batches sb
        WHERE sb.lga_id = ?
        ORDER BY sb.generated_at DESC
    `, [lgaId]);

    const responseData = {
        lga_id: `lga_${lga[0].id}`,
        lga_name: lga[0].name,
        summary: {
            total_allocated: totalAllocated,
            total_used: totalUsed,
            total_remaining: summary[0].total_remaining || 0,
            total_damaged: summary[0].total_damaged || 0,
            usage_rate: usageRate
        },
        batches: batches.map(b => ({
            batch_id: `batch_${b.batch_id}`,
            batch_number: b.batch_number,
            allocated_date: b.allocated_date,
            total_stickers: b.total_stickers,
            used: b.used,
            remaining: b.remaining,
            damaged: b.damaged,
            status: b.status
        })),
        usage_trends: []
    };

    res.status(200).json(new ApiResponse(200, responseData, 'Inventory report retrieved successfully'));
});

/**
 * @desc    Export Report
 * @route   POST /api/v1/admin/reports/export
 * @access  Private (Admin only)
 */
exports.exportReport = asyncHandler(async (req, res) => {
    const { report_type, format = 'pdf', start_date, end_date, filters = {} } = req.body;

    if (!report_type) {
        throw new ApiError(400, 'report_type is required');
    }

    // In a real implementation, you would generate the report file here
    // For now, we'll just return a mock response

    const reportId = `rep_${Date.now()}`;
    const downloadUrl = `https://api.example.com/downloads/reports/${reportId}.${format}`;

    const responseData = {
        report_id: reportId,
        download_url: downloadUrl,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        file_size: 1024000,
        format
    };

    res.status(200).json(new ApiResponse(200, responseData, 'Report generated successfully'));
});
