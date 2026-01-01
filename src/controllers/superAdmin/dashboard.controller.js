const Activation = require('../../models/Activation');
const Sticker = require('../../models/Sticker');
const LGA = require('../../models/LGA');
const User = require('../../models/User');
const ActivityLog = require('../../models/ActivityLog');
const asyncHandler = require('../../middleware/asyncHandler');
const { formatCurrency, calculateTrend } = require('../../utils/helpers');
const { pool } = require('../../config/database');

/**
 * @desc    Get dashboard statistics and overview
 * @route   GET /api/v1/super-admin/dashboard
 * @access  Private (Super Admin only)
 */
const getDashboard = asyncHandler(async (req, res) => {
    // Date ranges for comparison
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Fetch all statistics in parallel
    const [
        // Current month revenue
        currentMonthRevenue,
        previousMonthRevenue,

        // Activation counts
        currentMonthActivations,
        previousMonthActivations,

        // Sticker statistics
        stickerStats,

        // LGA statistics
        allLGAs,

        // Personnel statistics
        personnelStats,

        // Recent activations
        recentActivations,

        // Revenue by LGA
        revenueByLGA,

        // Monthly revenue trends (last 6 months)
        monthlyRevenue,

        // Daily revenue (last 30 days)
        dailyRevenue,

        // Top performers
        topOfficers,
        topSupervisors
    ] = await Promise.all([
        // Revenue
        Activation.getTotalRevenue(currentMonthStart, currentMonthEnd),
        Activation.getTotalRevenue(previousMonthStart, previousMonthEnd),

        // Activations
        Activation.getActivationCount(currentMonthStart, currentMonthEnd),
        Activation.getActivationCount(previousMonthStart, previousMonthEnd),

        // Stickers
        Sticker.getStatistics(),

        // LGAs
        LGA.findAll({ status: 'active' }),

        // Personnel
        User.getPersonnelStats(),

        // Recent data
        Activation.getRecentActivations(10),

        // Revenue breakdown
        Activation.getRevenueByLGA(currentMonthStart, currentMonthEnd),

        // Trends
        Activation.getMonthlyRevenue(6),
        Activation.getDailyRevenue(30),

        // Top performers
        Activation.getTopOfficers(5, currentMonthStart, currentMonthEnd),
        Activation.getTopSupervisors(5, currentMonthStart, currentMonthEnd)
    ]);

    // Calculate revenue trend
    const revenueTrend = calculateTrend(
        parseInt(currentMonthRevenue),
        parseInt(previousMonthRevenue)
    );

    // Calculate activation trend
    const activationTrend = calculateTrend(
        parseInt(currentMonthActivations),
        parseInt(previousMonthActivations)
    );

    // Count active LGAs
    const activeLGAsCount = allLGAs.length;

    // Format revenue data
    const revenueData = {
        current_month: {
            amount: parseInt(currentMonthRevenue),
            formatted: formatCurrency(currentMonthRevenue),
            activations: parseInt(currentMonthActivations)
        },
        previous_month: {
            amount: parseInt(previousMonthRevenue),
            formatted: formatCurrency(previousMonthRevenue),
            activations: parseInt(previousMonthActivations)
        },
        trend: {
            percentage: revenueTrend.percentage,
            direction: revenueTrend.direction,
            change: parseInt(currentMonthRevenue) - parseInt(previousMonthRevenue),
            formatted_change: formatCurrency(Math.abs(parseInt(currentMonthRevenue) - parseInt(previousMonthRevenue)))
        }
    };

    // Format sticker data
    const stickerData = {
        total: parseInt(stickerStats.total_stickers || 0),
        active: parseInt(stickerStats.active || 0),
        pending: parseInt(stickerStats.available || 0),
        expired: parseInt(stickerStats.expired || 0),
        revoked: parseInt(stickerStats.cancelled || 0),
        usage_rate: parseInt(stickerStats.total_stickers || 0) > 0
            ? ((parseInt(stickerStats.active || 0) / parseInt(stickerStats.total_stickers)) * 100).toFixed(2)
            : 0
    };

    // Format LGA data
    const lgaData = {
        total: activeLGAsCount,
        top_performers: revenueByLGA.slice(0, 5).map(lga => ({
            id: lga.id,
            name: lga.name,
            code: lga.code,
            revenue: parseInt(lga.revenue),
            formatted_revenue: formatCurrency(lga.revenue),
            activations: parseInt(lga.activations)
        }))
    };

    // Format personnel data
    const personnelData = {
        total: parseInt(personnelStats.total || 0),
        lga_admins: parseInt(personnelStats.lga_admins || 0),
        supervisors: parseInt(personnelStats.supervisors || 0),
        officers: parseInt(personnelStats.officers || 0),
        active: parseInt(personnelStats.active || 0),
        inactive: parseInt(personnelStats.inactive || 0)
    };

    // Format recent activations
    const formattedRecentActivations = recentActivations.map(activation => ({
        id: activation.id,
        sticker_number: activation.sticker_number,
        plate_number: activation.plate_number,
        amount_paid: parseInt(activation.amount_paid),
        formatted_amount: formatCurrency(activation.amount_paid),
        activation_date: activation.activation_date,
        lga: {
            name: activation.lga_name,
            code: activation.lga_code
        },
        activated_by: {
            name: activation.activated_by_name,
            role: activation.activated_by_role
        }
    }));

    // Format monthly revenue chart data
    const monthlyChartData = monthlyRevenue.map(month => ({
        month: month.month,
        revenue: parseInt(month.revenue),
        formatted_revenue: formatCurrency(month.revenue),
        activations: parseInt(month.activations)
    }));

    // Format daily revenue chart data
    const dailyChartData = dailyRevenue.map(day => ({
        date: day.date,
        revenue: parseInt(day.revenue),
        formatted_revenue: formatCurrency(day.revenue),
        activations: parseInt(day.activations)
    }));

    // Format top officers
    const formattedTopOfficers = topOfficers.map(officer => ({
        id: officer.id,
        name: officer.name,
        role: officer.role,
        lga_name: officer.lga_name,
        activations: parseInt(officer.activations),
        revenue: parseInt(officer.revenue),
        formatted_revenue: formatCurrency(officer.revenue)
    }));

    // Format top supervisors
    const formattedTopSupervisors = topSupervisors.map(supervisor => ({
        id: supervisor.id,
        name: supervisor.name,
        lga_name: supervisor.lga_name,
        activations: parseInt(supervisor.activations),
        revenue: parseInt(supervisor.revenue),
        formatted_revenue: formatCurrency(supervisor.revenue),
        team_size: parseInt(supervisor.team_size)
    }));

    // Get total revenue (all time)
    const totalRevenueAllTime = await Activation.getTotalRevenue();

    // Get total activations (all time)
    const [totalActivationsResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM activations'
    );
    const totalActivations = totalActivationsResult[0].total;

    // Get total stickers generated
    const totalStickersGenerated = stickerStats.total;
    const totalStickersActivated = stickerStats.active;

    // Calculate growth percentage
    const growthPercentage = previousMonthRevenue > 0
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(1)
        : 0;

    // Get LGA performance data with all required fields
    const lgaPerformance = await Promise.all(
        revenueByLGA.slice(0, 10).map(async (lga) => {
            const [stickersGenerated] = await pool.execute(
                'SELECT COUNT(*) as count FROM stickers WHERE lga_id = ?',
                [lga.id]
            );
            const [stickersActivated] = await pool.execute(
                'SELECT COUNT(*) as count FROM stickers WHERE lga_id = ? AND status = "active"',
                [lga.id]
            );

            // Get LGA state from lgas table
            const [lgaDetails] = await pool.execute(
                'SELECT state FROM lgas WHERE id = ?',
                [lga.id]
            );

            return {
                lga_id: lga.id,
                lga_name: lga.name,
                state: lgaDetails[0]?.state || 'Ogun State',
                total_stickers: stickersGenerated[0].count,
                active_stickers: stickersActivated[0].count,
                revenue: parseInt(lga.revenue) || 0
            };
        })
    );

    // Get recent activities from activity_logs and recent activations
    const [activityLogsResult] = await pool.execute(
        `SELECT 
            al.id,
            al.type,
            al.message as description,
            l.name as lga_name,
            u.name as officer_name,
            al.created_at as timestamp,
            NULL as amount
        FROM activity_logs al
        LEFT JOIN lgas l ON al.lga_id = l.id
        LEFT JOIN users u ON al.created_by = u.id
        ORDER BY al.created_at DESC
        LIMIT 5`
    );

    const [recentActivationsForActivity] = await pool.execute(
        `SELECT 
            a.id,
            'activation' as type,
            CONCAT('New sticker activated - ', s.code) as description,
            l.name as lga_name,
            u.name as officer_name,
            a.activation_date as timestamp,
            a.amount_paid as amount
        FROM activations a
        JOIN lgas l ON a.lga_id = l.id
        LEFT JOIN stickers s ON a.sticker_id = s.id
        LEFT JOIN users u ON a.activated_by = u.id
        ORDER BY a.activation_date DESC
        LIMIT 10`
    );

    // Combine and format recent activities
    const recentActivities = [...activityLogsResult, ...recentActivationsForActivity]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 15)
        .map(activity => ({
            id: activity.id,
            type: activity.type || 'system',
            description: activity.description,
            lga_name: activity.lga_name,
            officer_name: activity.officer_name,
            timestamp: activity.timestamp,
            ...(activity.amount && { amount: parseInt(activity.amount) })
        }));

    // Get top performing LGAs with growth rate
    const topPerformingLgas = await Promise.all(
        revenueByLGA.slice(0, 5).map(async (lga) => {
            // Get previous period revenue for this LGA
            const previousRevenue = await pool.execute(
                `SELECT COALESCE(SUM(amount_paid), 0) as revenue 
                 FROM activations 
                 WHERE lga_id = ? AND activation_date BETWEEN ? AND ?`,
                [lga.id, previousMonthStart, previousMonthEnd]
            );

            const prevRev = previousRevenue[0][0].revenue;
            const currentRev = parseInt(lga.revenue);
            const growth_rate = prevRev > 0
                ? ((currentRev - prevRev) / prevRev * 100).toFixed(1)
                : currentRev > 0 ? 100 : 0;

            return {
                lga_id: lga.id,
                name: lga.name,
                revenue: currentRev,
                activations: parseInt(lga.activations),
                growth_rate: parseFloat(growth_rate)
            };
        })
    );

    // Build response matching frontend requirements exactly
    res.status(200).json({
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: {
            overview: {
                total_lgas: activeLGAsCount,
                total_revenue: parseInt(totalRevenueAllTime),
                total_activations: parseInt(totalActivations),
                active_officers: personnelData.officers,
                active_supervisors: personnelData.supervisors,
                total_stickers_generated: totalStickersGenerated,
                total_stickers_activated: totalStickersActivated,
                revenue_this_month: parseInt(currentMonthRevenue),
                activations_this_month: parseInt(currentMonthActivations),
                growth_percentage: parseFloat(growthPercentage)
            },
            lga_summary: lgaPerformance,
            recent_activities: recentActivities,
            revenue_trend: dailyChartData,
            top_performing_lgas: topPerformingLgas
        }
    });
});

module.exports = {
    getDashboard
};
