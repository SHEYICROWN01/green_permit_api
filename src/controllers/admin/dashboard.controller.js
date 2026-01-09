// src/controllers/admin/dashboard.controller.js
const asyncHandler = require('../../middleware/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const db = require('../../config/database');

/**
 * @desc    Get Dashboard Overview
 * @route   GET /api/v1/admin/dashboard/overview
 * @access  Private (Super Admin OR LGA Admin)
 * 
 * Role-aware endpoint:
 * - Super Admin: Returns system-wide aggregated data (all LGAs)
 * - LGA Admin: Returns LGA-specific data (their assigned LGA only)
 */
exports.getOverview = asyncHandler(async (req, res) => {
    const user = req.user;

    // Handle based on user role
    if (user.role === 'super_admin') {
        // Super Admin: Return aggregated data across all LGAs
        return await getSuperAdminDashboard(req, res);
    } else if (user.role === 'lga_admin') {
        // LGA Admin: Return data for their specific LGA
        return await getLGAAdminDashboard(req, res);
    } else {
        throw new ApiError(403, 'Access denied');
    }
});

/**
 * Get dashboard data for Super Admin (all LGAs aggregated)
 */
async function getSuperAdminDashboard(req, res) {
    // Get current month revenue across ALL LGAs
    const currentMonthRevenue = await db.query(`
        SELECT 
            COALESCE(SUM(price / 100), 0) as revenue,
            COUNT(*) as count
        FROM stickers
        WHERE status = 'active'
        AND MONTH(created_at) = MONTH(CURRENT_DATE())
        AND YEAR(created_at) = YEAR(CURRENT_DATE())
    `);

    // Get previous month revenue across ALL LGAs
    const previousMonthRevenue = await db.query(`
        SELECT COALESCE(SUM(price / 100), 0) as revenue
        FROM stickers
        WHERE status = 'active'
        AND MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
        AND YEAR(created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
    `);

    // Calculate revenue change percentage
    const currentRevenue = currentMonthRevenue && currentMonthRevenue[0] ? parseFloat(currentMonthRevenue[0].revenue) || 0 : 0;
    const previousRevenue = previousMonthRevenue && previousMonthRevenue[0] ? parseFloat(previousMonthRevenue[0].revenue) || 0 : 0;
    const revenueChange = previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
        : 0;

    // Get active stickers count across ALL LGAs
    const activeStickerRows = await db.query(`
        SELECT COUNT(*) as total
        FROM stickers
        WHERE status = 'active'
    `);

    // Get personnel counts across ALL LGAs
    const personnelCountRows = await db.query(`
        SELECT 
            SUM(CASE WHEN role = 'officer' THEN 1 ELSE 0 END) as total_officers,
            SUM(CASE WHEN role = 'supervisor' THEN 1 ELSE 0 END) as total_supervisors,
            SUM(CASE WHEN role IN ('officer', 'supervisor') AND last_login_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 ELSE 0 END) as online_now
        FROM users
        WHERE is_active = 1 AND role IN ('officer', 'supervisor')
    `);

    // Get inventory across ALL LGAs
    const inventoryRows = await db.query(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'unused' THEN 1 ELSE 0 END) as remaining
        FROM stickers
    `);

    const totalInventory = (inventoryRows && Array.isArray(inventoryRows) && inventoryRows.length > 0 && inventoryRows[0])
        ? (inventoryRows[0].total || 0)
        : 0;
    const remainingInventory = (inventoryRows && Array.isArray(inventoryRows) && inventoryRows.length > 0 && inventoryRows[0])
        ? (inventoryRows[0].remaining || 0)
        : 0;
    const percentageRemaining = totalInventory > 0
        ? ((remainingInventory / totalInventory) * 100).toFixed(0)
        : 0;

    // Get daily activations for last 7 days (ALL LGAs)
    const dailyActivationRows = await db.query(`
        SELECT 
            DATE(created_at) as date,
            DAYNAME(created_at) as day,
            COUNT(*) as count
        FROM stickers
        WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 DAY)
        AND status IN ('active', 'expired')
        GROUP BY DATE(created_at), DAYNAME(created_at)
        ORDER BY DATE(created_at) ASC
    `);

    // Format daily activations
    const formattedDailyActivations = dailyActivationRows && dailyActivationRows.length > 0
        ? dailyActivationRows.map(row => ({
            date: row.date,
            day: row.day.substring(0, 3),
            count: row.count
        }))
        : [];

    // Get top officers across ALL LGAs with actual activation stats
    const topOfficerRows = await db.query(`
        SELECT 
            u.id as officer_id,
            u.name,
            u.email,
            l.name as lga_name,
            COUNT(DISTINCT a.id) as activations_count,
            COALESCE(SUM(a.amount_paid), 0) as revenue_generated
        FROM users u
        LEFT JOIN lgas l ON u.lga_id = l.id
        LEFT JOIN activations a ON (a.officer_id = u.id OR a.activated_by = u.id)
        WHERE u.role = 'officer' AND u.is_active = 1
        GROUP BY u.id, u.name, u.email, l.name
        ORDER BY revenue_generated DESC, activations_count DESC
        LIMIT 5
    `);

    const topOfficersWithRank = topOfficerRows && topOfficerRows.length > 0
        ? topOfficerRows.map((officer, index) => ({
            officer_id: `off_${officer.officer_id}`,
            name: officer.name,
            email: officer.email,
            lga_name: officer.lga_name,
            activations_count: officer.activations_count,
            revenue_generated: parseFloat(officer.revenue_generated),
            rank: index + 1
        }))
        : [];

    // Get recent activations (empty for now)
    const formattedRecentActivations = [];

    // Build response for Super Admin
    const responseData = {
        lga_info: {
            lga_id: null,
            lga_name: 'All LGAs (System-wide)',
            state: 'All States',
            scope: 'system_wide'
        },
        kpis: {
            revenue: {
                current_month: currentRevenue,
                previous_month: previousRevenue,
                percentage_change: parseFloat(revenueChange),
                currency: 'NGN'
            },
            active_stickers: {
                total: (activeStickerRows && Array.isArray(activeStickerRows) && activeStickerRows.length > 0 && activeStickerRows[0])
                    ? (activeStickerRows[0].total || 0)
                    : 0,
                percentage_change: 0
            },
            personnel: {
                total_officers: (personnelCountRows && Array.isArray(personnelCountRows) && personnelCountRows.length > 0 && personnelCountRows[0])
                    ? (personnelCountRows[0].total_officers || 0)
                    : 0,
                total_supervisors: (personnelCountRows && Array.isArray(personnelCountRows) && personnelCountRows.length > 0 && personnelCountRows[0])
                    ? (personnelCountRows[0].total_supervisors || 0)
                    : 0,
                online_now: (personnelCountRows && Array.isArray(personnelCountRows) && personnelCountRows.length > 0 && personnelCountRows[0])
                    ? (personnelCountRows[0].online_now || 0)
                    : 0
            },
            inventory: {
                remaining: remainingInventory,
                total: totalInventory,
                percentage_remaining: parseInt(percentageRemaining)
            }
        },
        daily_activations: formattedDailyActivations,
        top_officers: topOfficersWithRank,
        recent_activations: formattedRecentActivations
    };

    return ApiResponse.success(res, responseData, 'Dashboard overview retrieved successfully (Super Admin)');
}

/**
 * Get dashboard data for LGA Admin (specific LGA only)
 */
async function getLGAAdminDashboard(req, res) {
    const lgaId = req.user.lga_id;

    if (!lgaId) {
        throw new ApiError(400, 'LGA information not found for this admin');
    }

    // Get LGA info
    const lgaInfoRows = await db.query(
        'SELECT id, name as lga_name, state FROM lgas WHERE id = ?',
        [lgaId]
    );

    console.log('LGA Query Result:', lgaInfoRows);
    console.log('Is Array?', Array.isArray(lgaInfoRows));

    if (!lgaInfoRows || !Array.isArray(lgaInfoRows) || lgaInfoRows.length === 0) {
        throw new ApiError(404, 'LGA not found');
    }

    const lga = lgaInfoRows[0];
    console.log('LGA Object:', lga);

    if (!lga || !lga.id) {
        throw new ApiError(404, 'LGA data could not be retrieved');
    }    // Get current month revenue from activations table (amount_paid is in kobo)
    const currentMonthRevenue = await db.query(`
        SELECT 
            COALESCE(SUM(amount_paid), 0) as revenue,
            COUNT(*) as count
        FROM activations
        WHERE lga_id = ?
        AND MONTH(created_at) = MONTH(CURRENT_DATE())
        AND YEAR(created_at) = YEAR(CURRENT_DATE())
    `, [lgaId]);

    // Get previous month revenue from activations table
    const previousMonthRevenue = await db.query(`
        SELECT COALESCE(SUM(amount_paid), 0) as revenue
        FROM activations
        WHERE lga_id = ?
        AND MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
        AND YEAR(created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
    `, [lgaId]);

    // Calculate revenue change percentage
    const currentRevenue = currentMonthRevenue && currentMonthRevenue[0] ? parseFloat(currentMonthRevenue[0].revenue) || 0 : 0;
    const previousRevenue = previousMonthRevenue && previousMonthRevenue[0] ? parseFloat(previousMonthRevenue[0].revenue) || 0 : 0;
    const revenueChange = previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
        : 0;

    // Get active stickers count
    const activeStickerRows = await db.query(`
        SELECT COUNT(*) as total
        FROM stickers
        WHERE lga_id = ? AND status = 'active'
    `, [lgaId]);

    // Get personnel counts
    const personnelCountRows = await db.query(`
        SELECT 
            SUM(CASE WHEN role = 'officer' THEN 1 ELSE 0 END) as total_officers,
            SUM(CASE WHEN role = 'supervisor' THEN 1 ELSE 0 END) as total_supervisors,
            SUM(CASE WHEN role IN ('officer', 'supervisor') AND last_login_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 ELSE 0 END) as online_now
        FROM users
        WHERE lga_id = ? AND is_active = 1
    `, [lgaId]);

    // Get inventory
    const inventoryRows = await db.query(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'unused' THEN 1 ELSE 0 END) as remaining
        FROM stickers
        WHERE lga_id = ?
    `, [lgaId]);

    // Safe extraction with proper null checks
    const totalInventory = (inventoryRows && Array.isArray(inventoryRows) && inventoryRows.length > 0 && inventoryRows[0])
        ? (inventoryRows[0].total || 0)
        : 0;
    const remainingInventory = (inventoryRows && Array.isArray(inventoryRows) && inventoryRows.length > 0 && inventoryRows[0])
        ? (inventoryRows[0].remaining || 0)
        : 0;
    const percentageRemaining = totalInventory > 0
        ? ((remainingInventory / totalInventory) * 100).toFixed(0)
        : 0;

    // Get daily activations for last 7 days from activations table
    const dailyActivationRows = await db.query(`
        SELECT 
            DATE(created_at) as date,
            DAYNAME(created_at) as day,
            COUNT(*) as count
        FROM activations
        WHERE lga_id = ?
        AND created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 DAY)
        GROUP BY DATE(created_at), DAYNAME(created_at)
        ORDER BY DATE(created_at) ASC
    `, [lgaId]);

    // Format daily activations
    const formattedDailyActivations = dailyActivationRows && dailyActivationRows.length > 0
        ? dailyActivationRows.map(row => ({
            date: row.date,
            day: row.day.substring(0, 3), // Mon, Tue, etc.
            count: row.count
        }))
        : [];

    // Get top officers with actual activation stats
    const topOfficerRows = await db.query(`
        SELECT 
            u.id as officer_id,
            u.name,
            u.email,
            COUNT(DISTINCT a.id) as activations_count,
            COALESCE(SUM(a.amount_paid), 0) as revenue_generated
        FROM users u
        LEFT JOIN activations a ON (a.officer_id = u.id OR a.activated_by = u.id) AND a.lga_id = ?
        WHERE u.lga_id = ? AND u.role = 'officer' AND u.is_active = 1
        GROUP BY u.id, u.name, u.email
        ORDER BY revenue_generated DESC, activations_count DESC
        LIMIT 5
    `, [lgaId, lgaId]);

    // Add rank to top officers
    const topOfficersWithRank = topOfficerRows && topOfficerRows.length > 0
        ? topOfficerRows.map((officer, index) => ({
            officer_id: `off_${officer.officer_id}`,
            name: officer.name,
            email: officer.email,
            activations_count: officer.activations_count,
            revenue_generated: parseFloat(officer.revenue_generated),
            rank: index + 1
        }))
        : [];

    // Get recent activations with officer details
    const recentActivationRows = await db.query(`
        SELECT 
            a.id as activation_id,
            a.officer_id,
            u.name as officer_name,
            a.sticker_code as sticker_id,
            a.amount_paid as amount,
            a.created_at as timestamp,
            'success' as status
        FROM activations a
        LEFT JOIN users u ON a.officer_id = u.id
        WHERE a.lga_id = ?
        ORDER BY a.created_at DESC
        LIMIT 10
    `, [lgaId]);

    const formattedRecentActivations = recentActivationRows && recentActivationRows.length > 0
        ? recentActivationRows.map(row => ({
            activation_id: `act_${row.activation_id}`,
            officer_id: `off_${row.officer_id}`,
            officer_name: row.officer_name || 'Unknown',
            sticker_id: row.sticker_id,
            amount: parseInt(row.amount),
            timestamp: row.timestamp,
            status: row.status
        }))
        : [];

    // Build response
    const responseData = {
        lga_info: {
            lga_id: `lga_${lga.id}`,
            lga_name: lga.lga_name,
            state: lga.state
        },
        kpis: {
            revenue: {
                current_month: currentRevenue,
                previous_month: previousRevenue,
                percentage_change: parseFloat(revenueChange),
                currency: 'NGN'
            },
            active_stickers: {
                total: (activeStickerRows && Array.isArray(activeStickerRows) && activeStickerRows.length > 0 && activeStickerRows[0])
                    ? (activeStickerRows[0].total || 0)
                    : 0,
                percentage_change: 0 // You can calculate this based on previous month if needed
            },
            personnel: {
                total_officers: (personnelCountRows && Array.isArray(personnelCountRows) && personnelCountRows.length > 0 && personnelCountRows[0])
                    ? (personnelCountRows[0].total_officers || 0)
                    : 0,
                total_supervisors: (personnelCountRows && Array.isArray(personnelCountRows) && personnelCountRows.length > 0 && personnelCountRows[0])
                    ? (personnelCountRows[0].total_supervisors || 0)
                    : 0,
                online_now: (personnelCountRows && Array.isArray(personnelCountRows) && personnelCountRows.length > 0 && personnelCountRows[0])
                    ? (personnelCountRows[0].online_now || 0)
                    : 0
            },
            inventory: {
                remaining: remainingInventory,
                total: totalInventory,
                percentage_remaining: parseInt(percentageRemaining)
            }
        },
        daily_activations: formattedDailyActivations,
        top_officers: topOfficersWithRank,
        recent_activations: formattedRecentActivations
    };

    return ApiResponse.success(res, responseData, 'Dashboard overview retrieved successfully (LGA Admin)');
}

/**
 * @desc    Get Revenue Summary
 * @route   GET /api/v1/admin/dashboard/revenue
 * @access  Private (Admin only)
 */
exports.getRevenueSummary = asyncHandler(async (req, res) => {
    const lgaId = req.user.lga_id;
    const { period = 'month', start_date, end_date } = req.query;

    let dateCondition = '';
    let params = [lgaId];

    if (start_date && end_date) {
        dateCondition = 'AND DATE(activated_at) BETWEEN ? AND ?';
        params.push(start_date, end_date);
    } else {
        switch (period) {
            case 'today':
                dateCondition = 'AND DATE(activated_at) = CURRENT_DATE()';
                break;
            case 'week':
                dateCondition = 'AND activated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
                break;
            case 'month':
                dateCondition = 'AND MONTH(activated_at) = MONTH(CURRENT_DATE()) AND YEAR(activated_at) = YEAR(CURRENT_DATE())';
                break;
            case 'year':
                dateCondition = 'AND YEAR(activated_at) = YEAR(CURRENT_DATE())';
                break;
        }
    }

    // Get total revenue
    const [totalRevenue] = await db.query(`
        SELECT 
            COALESCE(SUM(price / 100), 0) as total,
            COUNT(*) as count
        FROM stickers
        WHERE lga_id = ? ${dateCondition}
        AND status IN ('active', 'expired')
    `, params);

    // Get revenue by officer
    const [byOfficer] = await db.query(`
        SELECT 
            u.id as officer_id,
            u.name as officer_name,
            COALESCE(SUM(s.price / 100), 0) as amount,
            COUNT(s.id) as count
        FROM users u
        LEFT JOIN stickers s ON u.id = s.activated_by AND s.status IN ('active', 'expired')
        WHERE u.lga_id = ? ${dateCondition}
        AND u.role = 'officer'
        GROUP BY u.id, u.name
        ORDER BY amount DESC
    `, params);

    // Get revenue by day
    const [byDay] = await db.query(`
        SELECT 
            DATE(activated_at) as date,
            COALESCE(SUM(price / 100), 0) as amount,
            COUNT(*) as count
        FROM stickers
        WHERE lga_id = ? ${dateCondition}
        AND status IN ('active', 'expired')
        GROUP BY DATE(activated_at)
        ORDER BY DATE(activated_at) ASC
    `, params);

    const responseData = {
        total_revenue: parseFloat(totalRevenue[0].total),
        period,
        start_date: start_date || null,
        end_date: end_date || null,
        breakdown: {
            by_sticker_type: [
                {
                    type: 'Cart Pushers',
                    amount: parseFloat(totalRevenue[0].total),
                    count: totalRevenue[0].count
                }
            ],
            by_officer: byOfficer.map(row => ({
                officer_id: `off_${row.officer_id}`,
                officer_name: row.officer_name,
                amount: parseFloat(row.amount)
            })),
            by_day: byDay.map(row => ({
                date: row.date,
                amount: parseFloat(row.amount),
                count: row.count
            }))
        },
        comparison: {
            previous_period: 0, // Calculate if needed
            change_amount: 0,
            change_percentage: 0
        }
    };

    res.status(200).json(new ApiResponse(200, responseData, 'Revenue summary retrieved successfully'));
});

/**
 * @desc    Get Inventory Status
 * @route   GET /api/v1/admin/dashboard/inventory
 * @access  Private (Admin only)
 */
exports.getInventoryStatus = asyncHandler(async (req, res) => {
    const lgaId = req.user.lga_id;

    // Get overall inventory stats
    const [inventoryStats] = await db.query(`
        SELECT 
            COUNT(*) as total_allocated,
            SUM(CASE WHEN status IN ('active', 'expired', 'revoked') THEN 1 ELSE 0 END) as total_used,
            SUM(CASE WHEN status = 'unused' THEN 1 ELSE 0 END) as total_remaining
        FROM stickers
        WHERE lga_id = ?
    `, [lgaId]);

    const totalAllocated = inventoryStats[0].total_allocated || 0;
    const totalUsed = inventoryStats[0].total_used || 0;
    const totalRemaining = inventoryStats[0].total_remaining || 0;
    const percentageUsed = totalAllocated > 0 ? Math.round((totalUsed / totalAllocated) * 100) : 0;
    const percentageRemaining = totalAllocated > 0 ? Math.round((totalRemaining / totalAllocated) * 100) : 0;

    // Get batches
    const [batches] = await db.query(`
        SELECT 
            sb.id,
            sb.batch_code as batch_number,
            sb.quantity as total_stickers,
            sb.used_count as used,
            (sb.quantity - sb.used_count) as remaining,
            sb.generated_at as allocated_date,
            'active' as status
        FROM sticker_batches sb
        WHERE sb.lga_id = ?
        ORDER BY sb.generated_at DESC
    `, [lgaId]);

    const formattedBatches = batches.map(batch => ({
        batch_id: `batch_${batch.id}`,
        batch_number: batch.batch_number,
        total_stickers: batch.total_stickers,
        used: batch.used,
        remaining: batch.remaining,
        allocated_date: batch.allocated_date,
        status: batch.status
    }));

    const responseData = {
        total_allocated: totalAllocated,
        total_used: totalUsed,
        total_remaining: totalRemaining,
        percentage_used: percentageUsed,
        percentage_remaining: percentageRemaining,
        batches: formattedBatches,
        low_inventory_alert: totalRemaining < 500,
        reorder_threshold: 500
    };

    res.status(200).json(new ApiResponse(200, responseData, 'Inventory status retrieved successfully'));
});
