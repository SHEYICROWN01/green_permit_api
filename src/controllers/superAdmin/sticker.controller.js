// src/controllers/superAdmin/sticker.controller.js
const Sticker = require('../../models/Sticker');
const StickerVerificationLog = require('../../models/StickerVerificationLog');
const ActivityLog = require('../../models/ActivityLog');

/**
 * Get single sticker details
 * GET /super-admin/stickers/:sticker_code
 */
exports.getStickerDetails = async (req, res) => {
    try {
        const sticker = await Sticker.findByCode(req.params.sticker_code);

        if (!sticker) {
            return res.status(404).json({
                success: false,
                message: 'Sticker not found'
            });
        }

        res.json({
            success: true,
            data: sticker
        });

    } catch (error) {
        console.error('Get sticker details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve sticker details',
            error: error.message
        });
    }
};

/**
 * Search stickers
 * GET /super-admin/stickers
 */
exports.searchStickers = async (req, res) => {
    try {
        const filters = {
            sticker_code: req.query.sticker_code,
            lga_id: req.query.lga_id ? parseInt(req.query.lga_id) : null,
            batch_id: req.query.batch_id ? parseInt(req.query.batch_id) : null,
            status: req.query.status,
            activation_status: req.query.activation_status, // 'unused', 'active', 'expired'
            date_from: req.query.date_from,
            date_to: req.query.date_to,
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 50
        };

        const result = await Sticker.search(filters);

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('Search stickers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search stickers',
            error: error.message
        });
    }
};

/**
 * Get verification history for a sticker
 * GET /super-admin/stickers/:sticker_code/verification-history
 */
exports.getVerificationHistory = async (req, res) => {
    try {
        const sticker = await Sticker.findByCode(req.params.sticker_code);

        if (!sticker) {
            return res.status(404).json({
                success: false,
                message: 'Sticker not found'
            });
        }

        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 50
        };

        const result = await StickerVerificationLog.getHistory(req.params.sticker_code, options);

        res.json({
            success: true,
            sticker: {
                code: sticker.sticker_code,
                lga_name: sticker.lga_name,
                activation_status: sticker.status,
                status: sticker.status
            },
            ...result
        });

    } catch (error) {
        console.error('Get verification history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve verification history',
            error: error.message
        });
    }
};

/**
 * Get inventory summary
 * GET /super-admin/stickers/inventory/summary
 */
exports.getInventorySummary = async (req, res) => {
    try {
        const summary = await Sticker.getInventorySummary();

        res.json({
            success: true,
            data: summary
        });

    } catch (error) {
        console.error('Get inventory summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve inventory summary',
            error: error.message
        });
    }
};

/**
 * Get usage statistics
 * GET /super-admin/stickers/statistics
 */
exports.getUsageStatistics = async (req, res) => {
    try {
        const filters = {};

        if (req.query.lga_id) {
            filters.lga_id = parseInt(req.query.lga_id);
        }

        if (req.query.batch_id) {
            filters.batch_id = parseInt(req.query.batch_id);
        }

        const stats = await Sticker.getStatistics(filters);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Get usage statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve usage statistics',
            error: error.message
        });
    }
};

/**
 * Export stickers (CSV format)
 * GET /super-admin/stickers/export
 */
exports.exportStickers = async (req, res) => {
    try {
        const filters = {
            lga_id: req.query.lga_id ? parseInt(req.query.lga_id) : null,
            batch_id: req.query.batch_id ? parseInt(req.query.batch_id) : null,
            status: req.query.status,
            activation_status: req.query.activation_status, // 'unused', 'active', 'expired'
            page: 1,
            limit: 10000 // Max export limit
        };

        const result = await Sticker.search(filters);
        const stickers = result.data;

        // Generate CSV
        const headers = [
            'Sticker Code',
            'LGA Name',
            'LGA Code',
            'State',
            'Price',
            'Status',
            'Is Activated',
            'Verified By',
            'Verified At',
            'Assigned To',
            'Generated At'
        ].join(',');

        const rows = stickers.map(s => [
            s.sticker_code,
            s.lga_name,
            s.lga_code,
            s.state_name,
            s.price,
            s.status,
            (s.status === 'active' || s.status === 'expired') ? 'Yes' : 'No',
            s.verified_by_name || 'N/A',
            s.verified_at || 'N/A',
            s.assigned_to_name || 'N/A',
            s.generated_at
        ].join(','));

        const csv = [headers, ...rows].join('\n');

        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=stickers_export_${Date.now()}.csv`);
        res.send(csv);

    } catch (error) {
        console.error('Export stickers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export stickers',
            error: error.message
        });
    }
};
