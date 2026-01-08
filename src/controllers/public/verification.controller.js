// src/controllers/public/verification.controller.js
const Sticker = require('../../models/Sticker');
const StickerVerificationLog = require('../../models/StickerVerificationLog');

/**
 * Public sticker verification
 * POST /api/v1/public/verify-sticker
 * @param {string} code - Sticker code (required)
 * @param {string} gps_location - GPS coordinates (optional)
 */
exports.verifySticker = async (req, res) => {
    try {
        // Accept both 'code' and 'sticker_code' for backward compatibility
        const { code, sticker_code, gps_location } = req.body;
        const stickerCode = code || sticker_code;

        if (!stickerCode) {
            return res.status(400).json({
                success: false,
                valid: false,
                message: 'Sticker code is required',
                sticker: null,
                is_activated: 0,
                lga_name: null,
                state: null,
                expired: false,
                code: null
            });
        }        // Verify the sticker
        const verification = await Sticker.verify(stickerCode);

        // Get device and IP info for logging
        const ip_address = req.ip || req.connection.remoteAddress;
        const device_info = req.headers['user-agent'];

        // Determine verification result for logging
        let verification_result = 'success';
        if (!verification.valid) {
            if (verification.expired) {
                verification_result = 'expired';
            } else if (!verification.sticker) {
                verification_result = 'invalid';
            } else {
                verification_result = 'failed';
            }
        }

        // Log the verification attempt if sticker exists
        if (verification.sticker) {
            try {
                await StickerVerificationLog.create({
                    sticker_id: verification.sticker.id,
                    sticker_code: stickerCode,
                    verified_by_id: null,
                    verified_by_name: 'Public Verification',
                    verification_type: 'public_api',
                    verification_result,
                    ip_address,
                    device_info,
                    gps_location: gps_location || null,
                    notes: verification.message
                });
            } catch (logError) {
                // Don't fail the request if logging fails
                console.error('Failed to log verification:', logError);
            }
        }

        // Return response in the exact format specified
        return res.status(200).json({
            success: verification.valid,
            valid: verification.valid,
            message: verification.message,
            sticker: verification.sticker,
            is_activated: verification.is_activated,
            lga_name: verification.lga_name,
            state: verification.state,
            expired: verification.expired,
            code: verification.code
        });

    } catch (error) {
        console.error('Verify sticker error:', error);
        return res.status(500).json({
            success: false,
            valid: false,
            message: 'Failed to verify sticker. Please try again later.',
            sticker: null,
            is_activated: 0,
            lga_name: null,
            state: null,
            expired: false,
            code: req.body.code || req.body.sticker_code || null,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
