// src/controllers/officer/reports.controller.js
const { pool } = require('../../config/database');

/**
 * @desc    Get activity breakdown with pagination
 * @route   GET /api/v1/officer/activities/breakdown
 * @access  Private (Officer)
 */
exports.getActivityBreakdown = async (req, res) => {
    try {
        console.log('\n=== GET ACTIVITY BREAKDOWN ===');
        const { userId } = req.user;
        const {
            page = 1,
            limit = 20,
            startDate,
            endDate,
            type // 'activation' or 'verification'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        console.log('Query params:', { page, limit, startDate, endDate, type });

        // Calculate default dates if not provided (last 7 days)
        const now = new Date();
        const defaultEndDate = now.toISOString().split('T')[0];
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const defaultStartDate = sevenDaysAgo.toISOString().split('T')[0];

        const effectiveStartDate = startDate || defaultStartDate;
        const effectiveEndDate = endDate || defaultEndDate;

        // Build date filter
        const dateFilter = [];
        const params = [userId];

        if (effectiveStartDate) {
            dateFilter.push('DATE(a.activation_date) >= ?');
            params.push(effectiveStartDate);
        }
        if (effectiveEndDate) {
            dateFilter.push('DATE(a.activation_date) <= ?');
            params.push(effectiveEndDate);
        }

        const whereDateClause = dateFilter.length > 0
            ? `AND ${dateFilter.join(' AND ')}`
            : '';

        // Get summary statistics
        const summaryParams = [userId, effectiveStartDate, effectiveEndDate];
        const [summaryRows] = await pool.execute(
            `SELECT 
                COUNT(a.id) as totalActivations,
                COALESCE(SUM(a.amount_paid), 0) as totalRevenue,
                COUNT(DISTINCT a.cart_pusher_id) as uniqueCartPushers
             FROM activations a
             WHERE a.officer_id = ?
               AND DATE(a.activation_date) BETWEEN ? AND ?`,
            summaryParams
        );

        // Count verifications
        const [verificationCount] = await pool.execute(
            `SELECT COUNT(id) as totalVerifications
             FROM verifications
             WHERE officer_id = ?
               AND DATE(verified_at) BETWEEN ? AND ?`,
            summaryParams
        );

        // Get activations
        let activations = [];
        if (!type || type === 'activation') {
            const [activationRows] = await pool.execute(
                `SELECT 
                    CONCAT('ACT-', a.id) as id,
                    'activation' as type,
                    s.sticker_code as sticker_id,
                    a.amount_paid as amount,
                    a.activation_date as timestamp,
                    cp.phone_number as cart_pusher_contact,
                    cp.name as cart_pusher_name,
                    a.payment_method,
                    a.duration_months,
                    a.receipt_number
                 FROM activations a
                 JOIN stickers s ON a.sticker_id = s.id
                 LEFT JOIN cart_pushers cp ON a.cart_pusher_id = cp.id
                 WHERE a.officer_id = ? ${whereDateClause}
                 ORDER BY a.activation_date DESC`,
                params
            );
            activations = activationRows;
        }

        // Build date filter for verifications
        const verificationDateFilter = [];
        const verificationParams = [userId];

        if (effectiveStartDate) {
            verificationDateFilter.push('DATE(v.verified_at) >= ?');
            verificationParams.push(effectiveStartDate);
        }
        if (effectiveEndDate) {
            verificationDateFilter.push('DATE(v.verified_at) <= ?');
            verificationParams.push(effectiveEndDate);
        }

        const whereVerificationDateClause = verificationDateFilter.length > 0
            ? `AND ${verificationDateFilter.join(' AND ')}`
            : '';

        // Get verifications
        let verifications = [];
        if (!type || type === 'verification') {
            const [verificationRows] = await pool.execute(
                `SELECT 
                    CONCAT('VER-', v.id) as id,
                    'verification' as type,
                    s.sticker_code as sticker_id,
                    v.status_at_verification as status,
                    v.is_valid,
                    v.verified_at as timestamp
                 FROM verifications v
                 JOIN stickers s ON v.sticker_id = s.id
                 WHERE v.officer_id = ? ${whereVerificationDateClause}
                 ORDER BY v.verified_at DESC`,
                verificationParams
            );
            verifications = verificationRows;
        }

        // Combine and sort activities
        let allActivities = [...activations, ...verifications];
        allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Get total count
        const totalActivities = allActivities.length;

        // Paginate
        const paginatedActivities = allActivities.slice(offset, offset + parseInt(limit));

        // Format response to match mobile app expectations
        const formattedActivities = paginatedActivities.map(activity => {
            if (activity.type === 'activation') {
                return {
                    id: activity.id,
                    type: 'activation',
                    stickerID: activity.sticker_id,
                    timestamp: activity.timestamp,
                    amount: parseFloat((activity.amount / 100).toFixed(2)),
                    durationMonths: activity.duration_months,
                    cartPusher: {
                        name: activity.cart_pusher_name,
                        phoneNumber: activity.cart_pusher_contact
                    },
                    paymentMethod: activity.payment_method,
                    receiptNumber: activity.receipt_number
                };
            } else {
                return {
                    id: activity.id,
                    type: 'verification',
                    stickerID: activity.sticker_id,
                    timestamp: activity.timestamp,
                    status: activity.status,
                    isValid: activity.is_valid === 1
                };
            }
        });

        const summary = summaryRows[0];
        console.log('Total activities:', totalActivities);
        console.log('=== GET ACTIVITY BREAKDOWN SUCCESS ===\n');

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalRevenue: parseFloat((summary.totalRevenue / 100).toFixed(2)),
                    totalActivations: parseInt(summary.totalActivations),
                    totalVerifications: parseInt(verificationCount[0].totalVerifications),
                    dateRange: {
                        start: effectiveStartDate,
                        end: effectiveEndDate
                    }
                },
                transactions: formattedActivities,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalActivities / parseInt(limit)),
                    totalRecords: totalActivities,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('ERROR in getActivityBreakdown:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve activity breakdown',
            error: {
                message: error.message,
                statusCode: 500
            }
        });
    }
};

/**
 * @desc    Get sales reports with analytics
 * @route   GET /api/v1/officer/reports/sales
 * @access  Private (Officer)
 */
exports.getSalesReports = async (req, res) => {
    try {
        console.log('\n=== GET SALES REPORTS ===');
        const { userId, lgaId } = req.user;
        const { startDate, endDate, groupBy = 'day' } = req.query;

        console.log('Query params:', { startDate, endDate, groupBy });

        // Default to current month if no dates provided
        const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const end = endDate || new Date().toISOString().split('T')[0];

        // Determine grouping format
        let dateFormat;
        switch (groupBy) {
            case 'week':
                dateFormat = '%Y-%u'; // Year-Week
                break;
            case 'month':
                dateFormat = '%Y-%m'; // Year-Month
                break;
            case 'day':
            default:
                dateFormat = '%Y-%m-%d'; // Year-Month-Day
                break;
        }

        // Get sales data grouped by date
        const [salesData] = await pool.execute(
            `SELECT 
                DATE_FORMAT(a.activation_date, ?) as period,
                COUNT(a.id) as total_activations,
                COALESCE(SUM(a.amount_paid), 0) as total_revenue,
                AVG(a.amount_paid) as avg_transaction,
                MIN(a.amount_paid) as min_transaction,
                MAX(a.amount_paid) as max_transaction,
                COUNT(DISTINCT a.cart_pusher_id) as unique_cart_pushers
             FROM activations a
             WHERE a.officer_id = ?
               AND DATE(a.activation_date) BETWEEN ? AND ?
             GROUP BY period
             ORDER BY period ASC`,
            [dateFormat, userId, start, end]
        );

        // Get payment method breakdown
        const [paymentBreakdown] = await pool.execute(
            `SELECT 
                a.payment_method,
                COUNT(a.id) as count,
                COALESCE(SUM(a.amount_paid), 0) as total_revenue
             FROM activations a
             WHERE a.officer_id = ?
               AND DATE(a.activation_date) BETWEEN ? AND ?
             GROUP BY a.payment_method`,
            [userId, start, end]
        );

        // Get duration breakdown
        const [durationBreakdown] = await pool.execute(
            `SELECT 
                a.duration_months,
                COUNT(a.id) as count,
                COALESCE(SUM(a.amount_paid), 0) as total_revenue
             FROM activations a
             WHERE a.officer_id = ?
               AND DATE(a.activation_date) BETWEEN ? AND ?
             GROUP BY a.duration_months
             ORDER BY a.duration_months ASC`,
            [userId, start, end]
        );

        // Calculate totals
        const totalActivations = salesData.reduce((sum, row) => sum + row.total_activations, 0);
        const totalRevenue = salesData.reduce((sum, row) => sum + row.total_revenue, 0);

        // Format sales data
        const formattedSalesData = salesData.map(row => ({
            period: row.period,
            totalActivations: row.total_activations,
            totalRevenue: parseFloat((row.total_revenue / 100).toFixed(2)),
            avgTransaction: parseFloat((row.avg_transaction / 100).toFixed(2)),
            minTransaction: parseFloat((row.min_transaction / 100).toFixed(2)),
            maxTransaction: parseFloat((row.max_transaction / 100).toFixed(2)),
            uniqueCartPushers: row.unique_cart_pushers
        }));

        // Format payment breakdown
        const formattedPaymentBreakdown = paymentBreakdown.map(row => ({
            paymentMethod: row.payment_method,
            count: row.count,
            totalRevenue: parseFloat((row.total_revenue / 100).toFixed(2)),
            percentage: totalRevenue > 0 ? parseFloat(((row.total_revenue / totalRevenue) * 100).toFixed(2)) : 0
        }));

        // Format duration breakdown
        const formattedDurationBreakdown = durationBreakdown.map(row => ({
            durationMonths: row.duration_months,
            count: row.count,
            totalRevenue: parseFloat((row.total_revenue / 100).toFixed(2)),
            percentage: totalRevenue > 0 ? parseFloat(((row.total_revenue / totalRevenue) * 100).toFixed(2)) : 0
        }));

        console.log('Sales report generated:', { totalActivations, totalRevenue: totalRevenue / 100 });
        console.log('=== GET SALES REPORTS SUCCESS ===\n');

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalActivations,
                    totalRevenue: parseFloat((totalRevenue / 100).toFixed(2)),
                    avgRevenuePerActivation: totalActivations > 0
                        ? parseFloat((totalRevenue / totalActivations / 100).toFixed(2))
                        : 0,
                    dateRange: {
                        start,
                        end
                    }
                },
                salesData: formattedSalesData,
                paymentMethodBreakdown: formattedPaymentBreakdown,
                durationBreakdown: formattedDurationBreakdown
            }
        });

    } catch (error) {
        console.error('ERROR in getSalesReports:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate sales report',
            errorCode: 'SERVER_ERROR'
        });
    }
};

/**
 * @desc    Export report data
 * @route   POST /api/v1/officer/reports/export
 * @access  Private (Officer)
 */
exports.exportReport = async (req, res) => {
    try {
        console.log('\n=== EXPORT REPORT ===');
        const { userId, name, lgaAssigned } = req.user;
        const { reportType, format = 'json', startDate, endDate } = req.body;

        console.log('Export request:', { reportType, format, startDate, endDate });

        // Validation
        if (!reportType || !['sales', 'activities'].includes(reportType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report type. Must be "sales" or "activities"',
                errorCode: 'INVALID_REPORT_TYPE'
            });
        }

        if (!['json', 'csv'].includes(format)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid format. Must be "json" or "csv"',
                errorCode: 'INVALID_FORMAT'
            });
        }

        // Default to current month if no dates provided
        const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const end = endDate || new Date().toISOString().split('T')[0];

        let data = [];
        let headers = [];

        if (reportType === 'sales') {
            // Export sales data
            const [salesRows] = await pool.execute(
                `SELECT 
                    a.id as activation_id,
                    s.sticker_code,
                    a.activation_date,
                    a.expiry_date,
                    a.duration_months,
                    a.amount_paid,
                    a.payment_method,
                    a.receipt_number,
                    cp.name as cart_pusher_name,
                    cp.phone_number as cart_pusher_phone
                 FROM activations a
                 JOIN stickers s ON a.sticker_id = s.id
                 LEFT JOIN cart_pushers cp ON a.cart_pusher_id = cp.id
                 WHERE a.officer_id = ?
                   AND DATE(a.activation_date) BETWEEN ? AND ?
                 ORDER BY a.activation_date DESC`,
                [userId, start, end]
            );

            data = salesRows.map(row => ({
                activation_id: `ACT-${row.activation_id}`,
                sticker_code: row.sticker_code,
                activation_date: row.activation_date,
                expiry_date: row.expiry_date,
                duration_months: row.duration_months,
                amount_paid: parseFloat((row.amount_paid / 100).toFixed(2)),
                payment_method: row.payment_method,
                receipt_number: row.receipt_number,
                cart_pusher_name: row.cart_pusher_name,
                cart_pusher_phone: row.cart_pusher_phone
            }));

            headers = [
                'Activation ID', 'Sticker Code', 'Activation Date', 'Expiry Date',
                'Duration (Months)', 'Amount Paid (₦)', 'Payment Method',
                'Receipt Number', 'Cart Pusher Name', 'Cart Pusher Phone'
            ];

        } else if (reportType === 'activities') {
            // Export activities data (activations + verifications)
            const [activations] = await pool.execute(
                `SELECT 
                    CONCAT('ACT-', a.id) as id,
                    'activation' as type,
                    s.sticker_code,
                    a.activation_date as timestamp,
                    a.amount_paid,
                    cp.name as cart_pusher_name,
                    NULL as status,
                    NULL as is_valid
                 FROM activations a
                 JOIN stickers s ON a.sticker_id = s.id
                 LEFT JOIN cart_pushers cp ON a.cart_pusher_id = cp.id
                 WHERE a.officer_id = ?
                   AND DATE(a.activation_date) BETWEEN ? AND ?`,
                [userId, start, end]
            );

            const [verifications] = await pool.execute(
                `SELECT 
                    CONCAT('VER-', v.id) as id,
                    'verification' as type,
                    s.sticker_code,
                    v.verified_at as timestamp,
                    NULL as amount_paid,
                    NULL as cart_pusher_name,
                    v.status_at_verification as status,
                    v.is_valid
                 FROM verifications v
                 JOIN stickers s ON v.sticker_id = s.id
                 WHERE v.officer_id = ?
                   AND DATE(v.verified_at) BETWEEN ? AND ?`,
                [userId, start, end]
            );

            // Combine and sort
            const combined = [...activations, ...verifications];
            combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            data = combined.map(row => ({
                id: row.id,
                type: row.type,
                sticker_code: row.sticker_code,
                timestamp: row.timestamp,
                amount_paid: row.amount_paid ? parseFloat((row.amount_paid / 100).toFixed(2)) : null,
                cart_pusher_name: row.cart_pusher_name || '-',
                status: row.status || '-',
                is_valid: row.is_valid !== null ? (row.is_valid ? 'Yes' : 'No') : '-'
            }));

            headers = [
                'ID', 'Type', 'Sticker Code', 'Timestamp',
                'Amount Paid (₦)', 'Cart Pusher', 'Status', 'Valid'
            ];
        }

        // Generate export file name
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `${reportType}_report_${timestamp}.${format}`;

        console.log('Export generated:', { fileName, rows: data.length });
        console.log('=== EXPORT REPORT SUCCESS ===\n');

        // Return data in requested format
        if (format === 'json') {
            res.status(200).json({
                success: true,
                data: {
                    reportType,
                    dateRange: { start, end },
                    generatedBy: {
                        officerId: userId,
                        officerName: name,
                        lga: lgaAssigned
                    },
                    generatedAt: new Date(),
                    totalRecords: data.length,
                    records: data,
                    downloadUrl: `${process.env.APP_URL || 'https://api.cartpusher.gov.ng'}/downloads/${fileName}`
                }
            });
        } else if (format === 'csv') {
            // Convert to CSV
            const csvRows = [headers.join(',')];
            data.forEach(row => {
                const values = Object.values(row).map(val => {
                    // Escape commas and quotes
                    if (val === null || val === undefined) return '';
                    const stringVal = String(val);
                    if (stringVal.includes(',') || stringVal.includes('"')) {
                        return `"${stringVal.replace(/"/g, '""')}"`;
                    }
                    return stringVal;
                });
                csvRows.push(values.join(','));
            });

            const csvContent = csvRows.join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.status(200).send(csvContent);
        }

    } catch (error) {
        console.error('ERROR in exportReport:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export report',
            errorCode: 'SERVER_ERROR'
        });
    }
};

module.exports = exports;
