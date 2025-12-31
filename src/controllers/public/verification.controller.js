// src/controllers/public/verification.controller.js
const Sticker = require('../../models/Sticker');
const StickerVerificationLog = require('../../models/StickerVerificationLog');

/**
 * Public sticker verification
 * POST /public/verify-sticker
 */
exports.verifySticker = async (req, res) => {
    try {
        const { sticker_code, gps_location } = req.body;

        if (!sticker_code) {
            return res.status(400).json({
                success: false,
                message: 'Sticker code is required'
            });
        }

        // Verify the sticker
        const verification = await Sticker.verify(sticker_code);

        // Get device and IP info
        const ip_address = req.ip || req.connection.remoteAddress;
        const device_info = req.headers['user-agent'];

        // Determine verification result
        let verification_result = verification.valid ? 'success' : 'failed';
        if (!verification.valid && verification.expired) {
            verification_result = 'expired';
        }
        if (!verification.valid && verification.message === 'Invalid sticker code') {
            verification_result = 'invalid';
        }

        // Log the verification attempt
        if (verification.sticker) {
            await StickerVerificationLog.create({
                sticker_id: verification.sticker.id,
                sticker_code,
                verified_by_id: null,
                verified_by_name: 'Public Verification',
                verification_type: 'api',
                verification_result,
                ip_address,
                device_info,
                gps_location: gps_location || null,
                notes: verification.message
            });
        }

        res.json({
            success: verification.valid,
            ...verification
        });

    } catch (error) {
        console.error('Verify sticker error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify sticker',
            error: error.message
        });
    }
};
