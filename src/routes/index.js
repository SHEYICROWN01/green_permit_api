const express = require('express');
const router = express.Router();

// Import route modules
const exampleRoutes = require('./example.routes');
const authRoutes = require('./auth.routes');
const superAdminRoutes = require('./superAdmin.routes');
const adminRoutes = require('./admin.routes');
const supervisorRoutes = require('./supervisor.routes');
const officerRoutes = require('./officer.routes');
const publicRoutes = require('./public.routes');

// API routes
router.use('/auth', authRoutes);
router.use('/super-admin', superAdminRoutes);
router.use('/admin', adminRoutes);
router.use('/supervisor', supervisorRoutes);
router.use('/officer', officerRoutes);
router.use('/public', publicRoutes);
router.use('/examples', exampleRoutes);

// Welcome route
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Green Permit API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: {
                superAdminLogin: 'POST /api/v1/auth/super-admin/login',
                logout: 'POST /api/v1/auth/logout',
                profile: 'GET /api/v1/auth/me',
            },
            superAdmin: {
                dashboard: 'GET /api/v1/super-admin/dashboard',
                lgas: {
                    list: 'GET /api/v1/super-admin/lgas',
                    create: 'POST /api/v1/super-admin/lgas',
                    details: 'GET /api/v1/super-admin/lgas/:id',
                    update: 'PUT /api/v1/super-admin/lgas/:id',
                    deactivate: 'DELETE /api/v1/super-admin/lgas/:id',
                },
                stickers: {
                    generateBatch: 'POST /api/v1/super-admin/sticker-batches',
                    listBatches: 'GET /api/v1/super-admin/sticker-batches',
                    batchDetails: 'GET /api/v1/super-admin/sticker-batches/:batch_id',
                    searchStickers: 'GET /api/v1/super-admin/stickers',
                    stickerDetails: 'GET /api/v1/super-admin/stickers/:sticker_code',
                    inventory: 'GET /api/v1/super-admin/stickers/inventory/summary',
                    statistics: 'GET /api/v1/super-admin/stickers/statistics',
                    export: 'GET /api/v1/super-admin/stickers/export'
                }
            },
            officer: {
                activateSticker: 'POST /api/v1/officer/stickers/activate'
            },
            public: {
                verifySticker: 'POST /api/v1/public/verify-sticker'
            },
            examples: '/api/v1/examples',
        },
    });
});

module.exports = router;
