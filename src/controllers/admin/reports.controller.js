const Report = require('../../models/Report');

/**
 * @desc    Get supervisor reports summary
 * @route   GET /api/v1/admin/reports/supervisors
 * @access  Private (LGA Admin)
 */
exports.getSupervisorReportsSummary = async (req, res) => {
    try {
        console.log('\n=== GET SUPERVISOR REPORTS SUMMARY ===');
        console.log('Query Params:', req.query);
        console.log('User:', { id: req.user.id, lga_id: req.user.lga_id, role: req.user.role });

        const {
            date_from,
            date_to,
            period,
            status,
            sort_by,
            sort_order
        } = req.query;

        // Validate date range if provided
        if (date_from && date_to) {
            if (!Report.validateDateRange(date_from, date_to)) {
                console.log('ERROR: Invalid date range');
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Invalid date range. date_from must be before date_to',
                        statusCode: 400
                    }
                });
            }
        }

        // Get supervisor reports
        const filters = {
            period,
            dateFrom: date_from,
            dateTo: date_to,
            status,
            sortBy: sort_by,
            sortOrder: sort_order
        };

        console.log('Fetching supervisor reports with filters:', filters);

        const result = await Report.getSupervisorReportsSummary(req.user.lga_id, filters);

        console.log(`Found ${result.supervisors.length} supervisors`);
        console.log('=== GET SUPERVISOR REPORTS SUMMARY SUCCESS ===\n');

        return res.status(200).json({
            success: true,
            message: 'Supervisor reports retrieved successfully',
            data: result
        });

    } catch (error) {
        console.error('ERROR in getSupervisorReportsSummary:', error);
        console.error('Stack:', error.stack);

        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve supervisor reports',
                statusCode: 500,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
};

/**
 * @desc    Get supervisor detail report
 * @route   GET /api/v1/admin/reports/supervisors/:supervisor_id
 * @access  Private (LGA Admin)
 */
exports.getSupervisorDetailReport = async (req, res) => {
    try {
        console.log('\n=== GET SUPERVISOR DETAIL REPORT ===');
        console.log('Params:', req.params);
        console.log('Query Params:', req.query);
        console.log('User:', { id: req.user.id, lga_id: req.user.lga_id, role: req.user.role });

        const { supervisor_id } = req.params;
        const {
            date_from,
            date_to,
            period,
            include_inactive
        } = req.query;

        // Extract numeric ID from supervisor_id (format: sup_XX)
        const supervisorIdMatch = supervisor_id.match(/^sup_(\d+)$/);
        if (!supervisorIdMatch) {
            console.log('ERROR: Invalid supervisor ID format');
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid supervisor ID format. Expected format: sup_XX',
                    statusCode: 400
                }
            });
        }

        const numericSupervisorId = parseInt(supervisorIdMatch[1], 10);

        // Validate date range if provided
        if (date_from && date_to) {
            if (!Report.validateDateRange(date_from, date_to)) {
                console.log('ERROR: Invalid date range');
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Invalid date range. date_from must be before date_to',
                        statusCode: 400
                    }
                });
            }
        }

        // Get supervisor detail report
        const filters = {
            period,
            dateFrom: date_from,
            dateTo: date_to,
            includeInactive: include_inactive !== 'false'
        };

        console.log('Fetching supervisor detail report:', { supervisorId: numericSupervisorId, filters });

        const result = await Report.getSupervisorDetailReport(
            numericSupervisorId,
            req.user.lga_id,
            filters
        );

        if (!result) {
            console.log('ERROR: Supervisor not found or does not belong to LGA');
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Supervisor not found or does not belong to your LGA',
                    statusCode: 404
                }
            });
        }

        console.log(`Found supervisor with ${result.officers.length} officers`);
        console.log('=== GET SUPERVISOR DETAIL REPORT SUCCESS ===\n');

        return res.status(200).json({
            success: true,
            message: 'Supervisor detail report retrieved successfully',
            data: result
        });

    } catch (error) {
        console.error('ERROR in getSupervisorDetailReport:', error);
        console.error('Stack:', error.stack);

        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve supervisor detail report',
                statusCode: 500,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
};

/**
 * @desc    Get report summary statistics
 * @route   GET /api/v1/admin/reports/summary
 * @access  Private (LGA Admin)
 */
exports.getReportSummary = async (req, res) => {
    try {
        console.log('\n=== GET REPORT SUMMARY ===');
        console.log('Query Params:', req.query);
        console.log('User:', { id: req.user.id, lga_id: req.user.lga_id, role: req.user.role });

        const { period } = req.query;

        console.log('Fetching report summary for period:', period || 'all');

        const result = await Report.getReportSummary(req.user.lga_id, period);

        console.log('Summary retrieved successfully');
        console.log('=== GET REPORT SUMMARY SUCCESS ===\n');

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('ERROR in getReportSummary:', error);
        console.error('Stack:', error.stack);

        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve report summary',
                statusCode: 500,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
};

/**
 * @desc    Export supervisor report (PDF/Excel)
 * @route   POST /api/v1/admin/reports/supervisors/:supervisor_id/export
 * @access  Private (LGA Admin)
 * @note    Future implementation - currently returns placeholder
 */
exports.exportSupervisorReport = async (req, res) => {
    try {
        console.log('\n=== EXPORT SUPERVISOR REPORT ===');
        console.log('Params:', req.params);
        console.log('Body:', req.body);

        // Placeholder response - implement PDF/Excel generation later
        return res.status(501).json({
            success: false,
            error: {
                message: 'Report export feature not yet implemented. Will be available in future update.',
                statusCode: 501
            }
        });

    } catch (error) {
        console.error('ERROR in exportSupervisorReport:', error);

        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to export report',
                statusCode: 500
            }
        });
    }
};

/**
 * @desc    Export all supervisors report (PDF/Excel)
 * @route   POST /api/v1/admin/reports/supervisors/export
 * @access  Private (LGA Admin)
 * @note    Future implementation - currently returns placeholder
 */
exports.exportAllSupervisorsReport = async (req, res) => {
    try {
        console.log('\n=== EXPORT ALL SUPERVISORS REPORT ===');
        console.log('Body:', req.body);

        // Placeholder response - implement PDF/Excel generation later
        return res.status(501).json({
            success: false,
            error: {
                message: 'Report export feature not yet implemented. Will be available in future update.',
                statusCode: 501
            }
        });

    } catch (error) {
        console.error('ERROR in exportAllSupervisorsReport:', error);

        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to export report',
                statusCode: 500
            }
        });
    }
};
