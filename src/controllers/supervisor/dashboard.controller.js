const db = require('../../config/database');
const Report = require('../../models/Report');

/**
 * @desc    Get supervisor dashboard statistics
 * @route   GET /api/v1/supervisor/dashboard
 * @access  Private (Supervisor)
 */
exports.getDashboardStats = async (req, res) => {
    try {
        console.log('\n=== GET SUPERVISOR DASHBOARD ===');
        console.log('Query Params:', req.query);
        console.log('User:', { id: req.user.id, supervisor_id: req.user.supervisor_id });

        const { period = 'today' } = req.query;

        // Extract numeric supervisor ID
        const supervisorId = req.user.id;
        const lgaId = req.user.lga_id;

        // Use the Report model to get supervisor detail report
        const result = await Report.getSupervisorDetailReport(
            supervisorId,
            lgaId,
            { period }
        );

        if (!result) {
            console.log('ERROR: Supervisor not found');
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Supervisor not found',
                    statusCode: 404
                }
            });
        }

        console.log(`Dashboard stats retrieved for period: ${period}`);
        console.log('=== GET SUPERVISOR DASHBOARD SUCCESS ===\n');

        return res.status(200).json({
            success: true,
            message: 'Dashboard statistics retrieved successfully',
            data: result
        });

    } catch (error) {
        console.error('ERROR in getDashboardStats:', error);
        console.error('Stack:', error.stack);

        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve dashboard statistics',
                statusCode: 500,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
};

/**
 * @desc    Get recent activities for supervisor's team
 * @route   GET /api/v1/supervisor/activities
 * @access  Private (Supervisor)
 */
exports.getRecentActivities = async (req, res) => {
    try {
        console.log('\n=== GET SUPERVISOR ACTIVITIES ===');
        console.log('Query Params:', req.query);
        console.log('User:', { id: req.user.id, supervisor_id: req.user.supervisor_id });

        const { limit = 10 } = req.query;
        const supervisorId = req.user.id;

        // Get recent officer logins for this supervisor's team
        const sql = `
      SELECT 
        CONCAT('act_', u.id, '_', UNIX_TIMESTAMP(u.last_login_at)) as activity_id,
        CONCAT('off_', u.id) as officer_id,
        u.officer_code,
        u.name as officer_name,
        'login' as action_type,
        NULL as sticker_code,
        u.last_login_at as timestamp,
        CASE 
          WHEN TIMESTAMPDIFF(MINUTE, u.last_login_at, NOW()) < 1 THEN 'Just now'
          WHEN TIMESTAMPDIFF(MINUTE, u.last_login_at, NOW()) < 60 THEN CONCAT(TIMESTAMPDIFF(MINUTE, u.last_login_at, NOW()), ' min ago')
          WHEN TIMESTAMPDIFF(HOUR, u.last_login_at, NOW()) < 24 THEN CONCAT(TIMESTAMPDIFF(HOUR, u.last_login_at, NOW()), ' hours ago')
          ELSE CONCAT(TIMESTAMPDIFF(DAY, u.last_login_at, NOW()), ' days ago')
        END as time_ago
      FROM users u
      WHERE u.supervisor_id = ? 
        AND u.role = 'officer' 
        AND u.last_login_at IS NOT NULL
      ORDER BY u.last_login_at DESC
      LIMIT ?
    `;

        const activities = await db.query(sql, [supervisorId, parseInt(limit)]);

        console.log(`Found ${activities.length} activities`);
        console.log('=== GET SUPERVISOR ACTIVITIES SUCCESS ===\n');

        return res.status(200).json({
            success: true,
            message: 'Activities retrieved successfully',
            data: {
                activities
            }
        });

    } catch (error) {
        console.error('ERROR in getRecentActivities:', error);
        console.error('Stack:', error.stack);

        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve activities',
                statusCode: 500,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
};

/**
 * @desc    Get team performance chart data
 * @route   GET /api/v1/supervisor/team-performance
 * @access  Private (Supervisor)
 */
exports.getTeamPerformance = async (req, res) => {
    try {
        console.log('\n=== GET TEAM PERFORMANCE ===');
        console.log('Query Params:', req.query);
        console.log('User:', { id: req.user.id, supervisor_id: req.user.supervisor_id });

        const { period = 'week' } = req.query;
        const supervisorId = req.user.id;

        // Calculate date range based on period
        let days = 7; // default to week
        if (period === 'month') days = 30;

        // Generate chart data (placeholder - will be populated with real activation data)
        const chartData = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            chartData.push({
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                date: date.toISOString().split('T')[0],
                activations: 0 // Placeholder - will be calculated from activations table
            });
        }

        console.log(`Generated ${chartData.length} days of performance data`);
        console.log('=== GET TEAM PERFORMANCE SUCCESS ===\n');

        return res.status(200).json({
            success: true,
            message: 'Team performance data retrieved successfully',
            data: {
                chart_data: chartData,
                total_activations: 0, // Placeholder
                period
            }
        });

    } catch (error) {
        console.error('ERROR in getTeamPerformance:', error);
        console.error('Stack:', error.stack);

        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve team performance data',
                statusCode: 500,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
};

/**
 * @desc    Get real-time team status (online/offline officers)
 * @route   GET /api/v1/supervisor/team-status
 * @access  Private (Supervisor)
 */
exports.getTeamStatus = async (req, res) => {
    try {
        console.log('\n=== GET TEAM STATUS ===');
        console.log('User:', { id: req.user.id, supervisor_id: req.user.supervisor_id });

        const supervisorId = req.user.id;

        // Get officers with their last login status
        // Consider "online" if logged in within last 15 minutes
        const sql = `
      SELECT 
        CONCAT('off_', u.id) as officer_id,
        u.officer_code,
        u.name,
        CASE 
          WHEN u.last_login_at IS NOT NULL 
            AND TIMESTAMPDIFF(MINUTE, u.last_login_at, NOW()) <= 15 
          THEN 'online'
          ELSE 'offline'
        END as status,
        u.last_login_at as last_seen
      FROM users u
      WHERE u.supervisor_id = ? AND u.role = 'officer'
      ORDER BY 
        CASE 
          WHEN u.last_login_at IS NOT NULL 
            AND TIMESTAMPDIFF(MINUTE, u.last_login_at, NOW()) <= 15 
          THEN 0 
          ELSE 1 
        END,
        u.name ASC
    `;

        const officers = await db.query(sql, [supervisorId]);

        const onlineCount = officers.filter(o => o.status === 'online').length;

        console.log(`Team status: ${onlineCount}/${officers.length} officers online`);
        console.log('=== GET TEAM STATUS SUCCESS ===\n');

        return res.status(200).json({
            success: true,
            message: 'Team status retrieved successfully',
            data: {
                officers,
                online_count: onlineCount,
                total_count: officers.length
            }
        });

    } catch (error) {
        console.error('ERROR in getTeamStatus:', error);
        console.error('Stack:', error.stack);

        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve team status',
                statusCode: 500,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
};

/**
 * @desc    Get team members list
 * @route   GET /api/v1/supervisor/team
 * @access  Private (Supervisor)
 */
exports.getTeamMembers = async (req, res) => {
    try {
        console.log('\n=== GET TEAM MEMBERS ===');
        console.log('User:', { id: req.user.id, supervisor_id: req.user.supervisor_id });

        const supervisorId = req.user.id;
        const lgaId = req.user.lga_id;

        // Reuse the Report model to get full team data
        const result = await Report.getSupervisorDetailReport(
            supervisorId,
            lgaId,
            { includeInactive: true }
        );

        if (!result) {
            console.log('ERROR: Supervisor not found');
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Supervisor not found',
                    statusCode: 404
                }
            });
        }

        console.log(`Found ${result.officers.length} team members`);
        console.log('=== GET TEAM MEMBERS SUCCESS ===\n');

        return res.status(200).json({
            success: true,
            message: 'Team members retrieved successfully',
            data: {
                officers: result.officers,
                summary: result.summary
            }
        });

    } catch (error) {
        console.error('ERROR in getTeamMembers:', error);
        console.error('Stack:', error.stack);

        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve team members',
                statusCode: 500,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
};
