const express = require('express');
const router = express.Router();
const { authenticate, requireSuperAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
    createLGAValidation,
    updateLGAValidation
} = require('../validators/lga.validator');
const {
    getLGAs,
    createLGA,
    getLGAById,
    updateLGA,
    deactivateLGA,
    getLGADetails,
    getLGAPersonnel,
    getLGAStickers,
    getLGAActivities
} = require('../controllers/superAdmin/lga.controller');
const { getDashboard } = require('../controllers/superAdmin/dashboard.controller');

// Reports, Personnel, and Settings Controllers
const { getReports } = require('../controllers/superAdmin/reports.controller');
const { getAllPersonnel } = require('../controllers/superAdmin/personnel.controller');
const { getSettings, updateSettings } = require('../controllers/superAdmin/settings.controller');

// Sticker Management Controllers
const {
    generateBatch,
    getAllBatches,
    getBatchDetails,
    updateBatchStatus,
    deleteBatch,
    getBatchStickers
} = require('../controllers/superAdmin/stickerBatch.controller');

const {
    getStickerDetails,
    searchStickers,
    getVerificationHistory,
    getInventorySummary,
    getUsageStatistics,
    exportStickers
} = require('../controllers/superAdmin/sticker.controller');

// Apply authentication and super admin check to all routes
router.use(authenticate);
router.use(requireSuperAdmin);

// Dashboard Route
router.get('/dashboard', getDashboard);

// Reports Route (System-wide analytics)
router.get('/reports', getReports);

// Personnel Route (All users across LGAs)
router.get('/personnel', getAllPersonnel);

// System Settings Routes
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// LGA Management Routes
router.get('/lgas', getLGAs);
router.post('/lgas', createLGAValidation, validate, createLGA);
router.get('/lgas/:id', getLGAById);
router.put('/lgas/:id', updateLGAValidation, validate, updateLGA);
router.delete('/lgas/:id', deactivateLGA);

// LGA Details Routes (New - detailed info with tabs)
router.get('/lgas/:id/details', getLGADetails);
router.get('/lgas/:id/personnel', getLGAPersonnel);
router.get('/lgas/:id/stickers', getLGAStickers);
router.get('/lgas/:id/activities', getLGAActivities);

// ========================================
// STICKER MANAGEMENT ROUTES
// ========================================

// Batch Management
router.post('/sticker-batches', generateBatch);
router.get('/sticker-batches', getAllBatches);
router.get('/sticker-batches/:batch_id', getBatchDetails);
router.patch('/sticker-batches/:batch_id/status', updateBatchStatus);
router.delete('/sticker-batches/:batch_id', deleteBatch);
router.get('/sticker-batches/:batch_id/stickers', getBatchStickers);

// Sticker Operations
router.get('/stickers', searchStickers);
router.get('/stickers/inventory/summary', getInventorySummary);
router.get('/stickers/statistics', getUsageStatistics);
router.get('/stickers/export', exportStickers);
router.get('/stickers/:sticker_code', getStickerDetails);
router.get('/stickers/:sticker_code/verification-history', getVerificationHistory);

module.exports = router;
