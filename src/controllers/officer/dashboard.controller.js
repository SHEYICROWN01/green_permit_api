// src/controllers/officer/dashboard.controller.js
const db = require('../../config/database');

/**
 * @desc    Get officer dashboard overview
 * @route   GET /api/v1/officer/dashboard/overview
 * @access  Private (Officer)
 */
exports.getDashboardOverview = async (req, res) => {
    try {
        console.log('\n=== GET DASHBOARD OVERVIEW ===');
        const { userId, officerId, name, lgaId, lgaAssigned } = req.user;
        const { date } = req.query;

        // Use provided date or today
        const targetDate = date || new Date().toISOString().split('T')[0];
        console.log('Officer:', { userId, officerId, targetDate });

        // Get today's statistics for this officer
        const todayStats = await db.query(
            `SELECT 
                COUNT(a.id) as stickers_activated,
                COALESCE(SUM(a.amount_paid), 0) as revenue
             FROM activations a
             WHERE a.officer_id = ?
             AND DATE(a.activation_date) = ?`,
            [userId, targetDate]
        );

        // Get today's verification count
        const verificationStats = await db.query(
            `SELECT COUNT(id) as verifications_performed
             FROM verifications
             WHERE officer_id = ?
             AND DATE(verified_at) = ?`,
            [userId, targetDate]
        );

        // Get overall statistics for this officer's LGA
        const overallStats = await db.query(
            `SELECT 
                COUNT(DISTINCT a.cart_pusher_id) as total_cart_pushers_registered,
                COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_permits,
                COUNT(CASE WHEN s.status = 'expired' THEN 1 END) as expired_permits
             FROM stickers s
             LEFT JOIN activations a ON s.id = a.sticker_id
             WHERE s.lga_id = ?`,
            [lgaId]
        );

        // Get recent activities (last 10 activations and verifications combined)
        const activations = await db.query(
            `SELECT 
                CONCAT('ACT-', a.id) as id,
                'activation' as type,
                s.sticker_code as sticker_id,
                a.amount_paid as amount,
                a.activation_date as timestamp,
                cp.phone_number as cart_pusher_contact,
                cp.name as cart_pusher_name
             FROM activations a
             JOIN stickers s ON a.sticker_id = s.id
             LEFT JOIN cart_pushers cp ON a.cart_pusher_id = cp.id
             WHERE a.officer_id = ?
             ORDER BY a.activation_date DESC
             LIMIT 5`,
            [userId]
        );

        const verifications = await db.query(
            `SELECT 
                CONCAT('VER-', v.id) as id,
                'verification' as type,
                s.sticker_code as sticker_id,
                v.status_at_verification as status,
                v.verified_at as timestamp
             FROM verifications v
             JOIN stickers s ON v.sticker_id = s.id
             WHERE v.officer_id = ?
             ORDER BY v.verified_at DESC
             LIMIT 5`,
            [userId]
        );

        // Combine and sort activities
        const recentActivities = [...activations, ...verifications]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10)
            .map(activity => ({
                id: activity.id,
                type: activity.type,
                stickerID: activity.sticker_id,
                amount: activity.type === 'activation' ? parseFloat((activity.amount / 100).toFixed(2)) : undefined,
                timestamp: activity.timestamp,
                cartPusherContact: activity.cart_pusher_contact || undefined,
                status: activity.status || undefined
            }));

        console.log('Dashboard data retrieved successfully');
        console.log('=== GET DASHBOARD OVERVIEW SUCCESS ===\n');

        res.status(200).json({
            success: true,
            data: {
                officer: {
                    name,
                    id: officerId,
                    lgaAssigned
                },
                todayStats: {
                    revenue: parseFloat(((todayStats[0]?.revenue || 0) / 100).toFixed(2)),
                    stickersActivated: todayStats[0]?.stickers_activated || 0,
                    verificationsPerformed: verificationStats[0]?.verifications_performed || 0
                },
                overallStats: {
                    totalCartPushersRegistered: overallStats[0]?.total_cart_pushers_registered || 0,
                    activePermits: overallStats[0]?.active_permits || 0,
                    expiredPermits: overallStats[0]?.expired_permits || 0
                },
                recentActivities
            }
        });

    } catch (error) {
        console.error('ERROR in getDashboardOverview:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve dashboard data',
            errorCode: 'SERVER_ERROR',
            debug: error.message // Add for debugging
        });
    }
};

module.exports = exports;
