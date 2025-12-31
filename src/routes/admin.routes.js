// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Import controllers
const authController = require('../controllers/admin/auth.controller');
const dashboardController = require('../controllers/admin/dashboard.controller');
const supervisorController = require('../controllers/admin/supervisor.controller');
const officerController = require('../controllers/admin/officer.controller');
const reportController = require('../controllers/admin/report.controller');
const reportsController = require('../controllers/admin/reports.controller');
const profileController = require('../controllers/admin/profile.controller');

// ============================================
// AUTHENTICATION ROUTES (No auth required)
// ============================================
router.post('/auth/login', authController.login);

// ============================================
// PROTECTED ROUTES (Auth required)
// ============================================
// Apply authentication middleware to all routes below
router.use(authenticate);

// ============================================
// DASHBOARD ROUTES (Super Admin OR LGA Admin)
// ============================================
// Dashboard overview - accessible by both super_admin and lga_admin
// IMPORTANT: This route must come BEFORE the global authorize('lga_admin') middleware
// Super admins can see all LGAs, LGA admins see only their LGA
router.get('/dashboard/overview',
    authorize('super_admin', 'lga_admin'), // Allow both roles
    dashboardController.getOverview
);

router.get('/dashboard/revenue',
    authorize('super_admin', 'lga_admin'),
    dashboardController.getRevenueSummary
);

router.get('/dashboard/inventory',
    authorize('super_admin', 'lga_admin'),
    dashboardController.getInventoryStatus
);

// ============================================
// AUTHENTICATION ROUTES (LGA Admin only)
// ============================================
router.post('/auth/logout', authorize('lga_admin'), authController.logout);
router.post('/auth/refresh', authorize('lga_admin'), authController.refreshToken);

// ============================================
// ALL ROUTES BELOW REQUIRE LGA ADMIN ROLE
// ============================================
router.use(authorize('lga_admin')); // Apply to all remaining routes

// ============================================
// SUPERVISOR MANAGEMENT ROUTES
// ============================================
router.route('/supervisors')
    .get(supervisorController.getAllSupervisors)
    .post(supervisorController.createSupervisor);

router.route('/supervisors/:supervisor_id')
    .get(supervisorController.getSupervisorDetails)
    .put(supervisorController.updateSupervisor)
    .delete(supervisorController.deleteSupervisor);

router.post('/supervisors/:supervisor_id/reset-password', supervisorController.resetPassword);

// ============================================
// OFFICER MANAGEMENT ROUTES
// ============================================
router.route('/officers')
    .get(officerController.getAllOfficers)
    .post(officerController.createOfficer);

router.route('/officers/:officer_id')
    .get(officerController.getOfficerDetails)
    .put(officerController.updateOfficer)
    .delete(officerController.deleteOfficer);

router.patch('/officers/:officer_id/reassign', officerController.reassignOfficer);
router.post('/officers/:officer_id/reset-password', officerController.resetPassword);

// ============================================
// REPORTS ROUTES
// ============================================
// New comprehensive reports endpoints
router.get('/reports/summary', reportsController.getReportSummary);
router.get('/reports/supervisors', reportsController.getSupervisorReportsSummary);
router.get('/reports/supervisors/:supervisor_id', reportsController.getSupervisorDetailReport);
router.post('/reports/supervisors/export', reportsController.exportAllSupervisorsReport);
router.post('/reports/supervisors/:supervisor_id/export', reportsController.exportSupervisorReport);

// Legacy report endpoints (to be deprecated)
router.get('/reports/revenue', reportController.getRevenueReport);
router.get('/reports/officer-performance', reportController.getOfficerPerformanceReport);
router.get('/reports/activations', reportController.getActivationHistoryReport);
router.get('/reports/inventory', reportController.getInventoryReport);
router.post('/reports/export', reportController.exportReport);

// ============================================
// PROFILE & SETTINGS ROUTES
// ============================================
router.get('/profile', profileController.getProfile);
router.put('/profile', profileController.updateProfile);
router.post('/profile/change-password', profileController.changePassword);

module.exports = router;
