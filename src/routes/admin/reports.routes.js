const express = require('express');
const router = express.Router();
const {
    getSupervisorReportsSummary,
    getSupervisorDetailReport,
    getReportSummary,
    exportSupervisorReport,
    exportAllSupervisorsReport
} = require('../../controllers/admin/reports.controller');
const { protect, authorize } = require('../../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);
router.use(authorize('lga_admin'));

/**
 * @route   GET /api/v1/admin/reports/summary
 * @desc    Get quick summary statistics for reports dashboard
 * @access  Private (LGA Admin)
 */
router.get('/summary', getReportSummary);

/**
 * @route   GET /api/v1/admin/reports/supervisors
 * @desc    Get supervisor reports summary with aggregated statistics
 * @access  Private (LGA Admin)
 */
router.get('/supervisors', getSupervisorReportsSummary);

/**
 * @route   POST /api/v1/admin/reports/supervisors/export
 * @desc    Export all supervisors report (PDF/Excel)
 * @access  Private (LGA Admin)
 * @note    Future implementation
 */
router.post('/supervisors/export', exportAllSupervisorsReport);

/**
 * @route   GET /api/v1/admin/reports/supervisors/:supervisor_id
 * @desc    Get detailed report for specific supervisor
 * @access  Private (LGA Admin)
 */
router.get('/supervisors/:supervisor_id', getSupervisorDetailReport);

/**
 * @route   POST /api/v1/admin/reports/supervisors/:supervisor_id/export
 * @desc    Export supervisor report (PDF/Excel)
 * @access  Private (LGA Admin)
 * @note    Future implementation
 */
router.post('/supervisors/:supervisor_id/export', exportSupervisorReport);

module.exports = router;
