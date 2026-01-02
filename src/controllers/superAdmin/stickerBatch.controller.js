// src/controllers/superAdmin/stickerBatch.controller.js
const StickerBatch = require('../../models/StickerBatch');
const Sticker = require('../../models/Sticker');
const LGA = require('../../models/LGA');
const User = require('../../models/User');
const ActivityLog = require('../../models/ActivityLog');

/**
 * Generate a new sticker batch
 * POST /super-admin/sticker-batches
 */
exports.generateBatch = async (req, res) => {
    try {
        const {
            lga_id,
            quantity,
            design_config,
            notes,
            expires_at
        } = req.body;

        // Validate quantity
        if (!quantity || quantity < 10 || quantity > 1000000) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be between 10 and 1,000,000'
            });
        }

        // Get LGA details
        const lga = await LGA.findById(lga_id);
        if (!lga) {
            return res.status(404).json({
                success: false,
                message: 'LGA not found'
            });
        }

        // Get user details
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate batch code
        const batch_code = await StickerBatch.generateBatchId();

        // Calculate sticker range
        const prefix = lga.code; // Use LGA code as prefix
        const start_number = 1;
        const end_number = quantity;

        // Create batch record
        const batchData = {
            batch_code,
            lga_id,
            quantity,
            prefix,
            start_number,
            end_number,
            generated_by_id: req.user.id
        };

        const batch = await StickerBatch.create(batchData);

        // Get price from LGA
        const price_per_sticker = lga.sticker_price || 0;

        // Generate individual stickers
        const stickerInfo = {
            batch_id: batch.id,
            lga_id,
            lga_code: lga.code,
            price: price_per_sticker
        };

        await Sticker.bulkCreate(stickerInfo, quantity);

        // Log activity
        await ActivityLog.log({
            user_id: req.user.id,
            lga_id: lga_id,
            action: 'batch_generated',
            category: 'sticker',
            description: `Generated batch ${batch_code} with ${quantity} stickers for ${lga.name}`,
            metadata: { batch_id: batch.id, lga_id, quantity }
        });

        res.status(201).json({
            success: true,
            message: `Successfully generated ${quantity} stickers`,
            data: {
                batch,
                stickers_generated: quantity
            }
        });

    } catch (error) {
        console.error('Generate batch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate sticker batch',
            error: error.message
        });
    }
};

/**
 * Get all batches
 * GET /super-admin/sticker-batches
 */
exports.getAllBatches = async (req, res) => {
    try {
        const filters = {
            lga_id: req.query.lga_id,
            status: req.query.status,
            search: req.query.search,
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            sort_by: req.query.sort_by || 'generated_at',
            sort_order: req.query.sort_order || 'DESC'
        };

        const result = await StickerBatch.findAll(filters);

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('Get batches error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve batches',
            error: error.message
        });
    }
};

/**
 * Get single batch details
 * GET /super-admin/sticker-batches/:batch_id
 */
exports.getBatchDetails = async (req, res) => {
    try {
        // Accept either numeric ID or batch_code
        const batchId = req.params.batch_id;
        let batch;

        // Try to find by numeric ID first
        if (!isNaN(batchId)) {
            batch = await StickerBatch.findById(parseInt(batchId));
        }

        // If not found, try batch_code
        if (!batch) {
            batch = await StickerBatch.findByBatchId(batchId);
        }

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }

        // Get sticker statistics for this batch
        const stats = await Sticker.getStatistics({ batch_id: batch.id });

        res.json({
            success: true,
            data: {
                ...batch,
                sticker_stats: stats
            }
        });

    } catch (error) {
        console.error('Get batch details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve batch details',
            error: error.message
        });
    }
};

/**
 * Update batch status
 * PATCH /super-admin/sticker-batches/:batch_id/status
 */
exports.updateBatchStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['active', 'depleted', 'expired', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const batch = await StickerBatch.findByBatchId(req.params.batch_id);
        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }

        const updatedBatch = await StickerBatch.updateStatus(batch.id, status);

        // Log activity
        await ActivityLog.log({
            user_id: req.user.id,
            action: 'batch_status_updated',
            category: 'sticker',
            description: `Updated batch ${batch.batch_id} status to ${status}`,
            metadata: { batch_id: batch.id, old_status: batch.status, new_status: status },
            lga_id: batch.lga_id
        });

        res.json({
            success: true,
            message: 'Batch status updated successfully',
            data: updatedBatch
        });

    } catch (error) {
        console.error('Update batch status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update batch status',
            error: error.message
        });
    }
};

/**
 * Delete a batch
 * DELETE /super-admin/sticker-batches/:batch_id
 */
exports.deleteBatch = async (req, res) => {
    try {
        const batch = await StickerBatch.findByBatchId(req.params.batch_id);

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }

        // Check if any stickers have been activated
        const stats = await Sticker.getStatistics({ batch_id: batch.id });
        if (stats.activated > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete batch with activated stickers',
                activated_count: stats.activated
            });
        }

        await StickerBatch.delete(batch.id);

        // Log activity
        await ActivityLog.log({
            user_id: req.user.id,
            action: 'batch_deleted',
            category: 'sticker',
            description: `Deleted batch ${batch.batch_id}`,
            metadata: { batch_id: batch.id, quantity: batch.quantity },
            lga_id: batch.lga_id
        });

        res.json({
            success: true,
            message: 'Batch deleted successfully'
        });

    } catch (error) {
        console.error('Delete batch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete batch',
            error: error.message
        });
    }
};

/**
 * Get stickers in a batch
 * GET /super-admin/sticker-batches/:batch_id/stickers
 */
exports.getBatchStickers = async (req, res) => {
    try {
        const batch = await StickerBatch.findByBatchId(req.params.batch_id);

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }

        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 50,
            status: req.query.status,
            activation_status: req.query.activation_status // 'unused', 'active', 'expired'
        };

        const result = await Sticker.findByBatch(batch.id, options);

        res.json({
            success: true,
            batch: {
                id: batch.id,
                batch_id: batch.batch_id,
                lga_name: batch.lga_name,
                status: batch.status
            },
            ...result
        });

    } catch (error) {
        console.error('Get batch stickers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve batch stickers',
            error: error.message
        });
    }
};
