
// src/controllers/officer/activation.controller.js
const Sticker = require('../../models/Sticker');
const StickerBatch = require('../../models/StickerBatch');
const StickerVerificationLog = require('../../models/StickerVerificationLog');
const User = require('../../models/User');
const ActivityLog = require('../../models/ActivityLog');

/**
 * Activate a sticker (Officer/Supervisor action)
 * POST /officer/stickers/activate
 */
exports.activateSticker = async (req, res) => {
    try {
        const {
            sticker_code,
            assigned_to_name,
            assigned_to_phone,
            verification_location,
            verification_notes,
            verification_photo_url,
            validity_days = 365 // Default 1 year
        } = req.body;

        // Validate required fields
        if (!sticker_code) {
            return res.status(400).json({
                success: false,
                message: 'Sticker code is required'
            });
        }

        // Check if sticker exists
        const sticker = await Sticker.findByCode(sticker_code);
        if (!sticker) {
            return res.status(404).json({
                success: false,
                message: 'Sticker not found'
            });
        }

        // Check if already activated
        if (sticker.status === 'active' || sticker.status === 'expired') {
            return res.status(400).json({
                success: false,
                message: 'Sticker has already been activated',
                activated_at: sticker.verified_at,
                activated_by: sticker.verified_by_name
            });
        }

        // Get user details
        const user = await User.findById(req.user.id);

        // Calculate expiry date
        const expires_at = new Date();
        expires_at.setDate(expires_at.getDate() + validity_days);

        // Activate the sticker
        const activationData = {
            verified_by_id: req.user.id,
            verified_by_name: user ? user.name : 'Unknown User',
            verified_by_role: req.user.role,
            verification_location,
            verification_notes,
            verification_photo_url,
            assigned_to_name,
            assigned_to_phone,
            expires_at
        };

        const activatedSticker = await Sticker.activate(sticker_code, activationData);

        // Update batch usage count
        await StickerBatch.incrementUsedCount(sticker.batch_id, 1);

        // Log the verification
        await StickerVerificationLog.create({
            sticker_id: sticker.id,
            sticker_code,
            verified_by_id: req.user.id,
            verified_by_name: req.user.name,
            verification_type: 'manual',
            verification_result: 'success',
            ip_address: req.ip || req.connection.remoteAddress,
            device_info: req.headers['user-agent'],
            gps_location: verification_location || null,
            notes: `Activated by ${req.user.name} (${req.user.role})`
        });

        // Log activity
        await ActivityLog.log({
            user_id: req.user.id,
            lga_id: sticker.lga_id,
            action: 'sticker_activated',
            category: 'sticker',
            description: `Activated sticker ${sticker_code} for ${assigned_to_name || 'unnamed cart pusher'}`,
            metadata: {
                sticker_code,
                sticker_id: sticker.id,
                assigned_to_name,
                lga_id: sticker.lga_id
            }
        });

        res.json({
            success: true,
            message: 'Sticker activated successfully',
            data: {
                sticker: activatedSticker,
                expires_at
            }
        });

    } catch (error) {
        console.error('Activate sticker error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to activate sticker',
            error: error.message
        });
    }
};







