// src/controllers/officer/sticker.controller.js
const db = require('../../config/database');
const bcrypt = require('bcryptjs');

/**
 * @desc    Get sticker details by scanning QR code
 * @route   GET /api/v1/officer/stickers/:stickerID
 * @access  Private (Officer)
 */
exports.getStickerDetails = async (req, res) => {
    try {
        console.log('\n=== GET STICKER DETAILS ===');
        const { stickerID } = req.params;
        console.log('Sticker ID:', stickerID);

        // Find sticker by sticker_code with graceful error handling
        let stickers = [];
        try {
            stickers = await db.query(
                `SELECT s.*, 
                        l.name as lga_name,
                        l.sticker_price as price_per_month,
                        a.activation_date as activated_at,
                        a.expires_at as expiry_date,
                        a.duration_months,
                        a.amount_paid,
                        a.cart_pusher_name,
                        a.cart_pusher_phone,
                        u.officer_code as activated_by_officer_id,
                        u.name as activated_by_officer_name
                 FROM stickers s
                 LEFT JOIN lgas l ON s.lga_id = l.id
                 LEFT JOIN activations a ON s.id = a.sticker_id
                 LEFT JOIN users u ON a.officer_id = u.id
                 WHERE s.sticker_code = ?
                 ORDER BY a.activation_date DESC
                 LIMIT 1`,
                [stickerID]
            );
        } catch (error) {
            console.log('Error querying sticker with activations, trying without:', error.code);
            // Fallback: query without activations table
            try {
                stickers = await db.query(
                    `SELECT s.*, 
                            l.name as lga_name,
                            l.sticker_price as price_per_month
                     FROM stickers s
                     LEFT JOIN lgas l ON s.lga_id = l.id
                     WHERE s.sticker_code = ?
                     LIMIT 1`,
                    [stickerID]
                );
            } catch (fallbackError) {
                console.error('Error in fallback query:', fallbackError);
                throw fallbackError;
            }
        }

        if (stickers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sticker not found',
                errorCode: 'STICKER_NOT_FOUND'
            });
        }

        const sticker = stickers[0];

        // Determine current status
        let status = sticker.status || 'unused';
        if (sticker.status === 'active' && sticker.expires_at) {
            status = new Date() > new Date(sticker.expires_at) ? 'expired' : 'active';
        }

        console.log('Sticker found:', { code: stickerID, status });
        console.log('=== GET STICKER DETAILS SUCCESS ===\n');

        // Return appropriate response based on status
        if (status === 'unused') {
            return res.status(200).json({
                success: true,
                data: {
                    stickerID: sticker.sticker_code,
                    lgaName: sticker.lga_name,
                    status: 'unused',
                    pricePerMonth: parseFloat((sticker.price_per_month / 100).toFixed(2)),
                    createdAt: sticker.created_at,
                    activatedAt: null,
                    expiryDate: null,
                    cartPusher: null
                }
            });
        }

        // Active or expired sticker
        res.status(200).json({
            success: true,
            data: {
                stickerID: sticker.sticker_code,
                lgaName: sticker.lga_name,
                status,
                pricePerMonth: parseFloat((sticker.price_per_month / 100).toFixed(2)),
                activatedAt: sticker.activated_at,
                expiryDate: sticker.expiry_date,
                durationMonths: sticker.duration_months,
                amountPaid: parseFloat((sticker.amount_paid / 100).toFixed(2)),
                cartPusher: {
                    name: sticker.cart_pusher_name,
                    phoneNumber: sticker.cart_pusher_phone
                },
                activatedBy: {
                    officerId: sticker.activated_by_officer_id,
                    officerName: sticker.activated_by_officer_name
                }
            }
        });

    } catch (error) {
        console.error('ERROR in getStickerDetails:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve sticker details',
            errorCode: 'SERVER_ERROR'
        });
    }
};

/**
 * @desc    Activate sticker (assign to cart pusher)
 * @route   POST /api/v1/officer/stickers/:stickerID/activate
 * @access  Private (Officer)
 */
exports.activateSticker = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        console.log('\n=== ACTIVATE STICKER ===');
        const { stickerID } = req.params;
        const {
            cartPusherContact,
            cartPusherName,
            durationMonths,
            amountPaid,
            paymentMethod = 'cash',
            activatedAt,
            locationLatitude,
            locationLongitude
        } = req.body;

        const { userId, officerId, lgaId } = req.user;

        console.log('Request:', { stickerID, durationMonths, amountPaid, paymentMethod });

        // Validation - cartPusherName is required, cartPusherContact is optional
        if (!cartPusherName || !durationMonths || !amountPaid) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: cartPusherName, durationMonths, amountPaid',
                errorCode: 'VALIDATION_ERROR'
            });
        }

        // Validate phone number format only if provided
        if (cartPusherContact) {
            const phoneRegex = /^\+234\d{10}$/;
            if (!phoneRegex.test(cartPusherContact)) {
                return res.status(422).json({
                    success: false,
                    message: 'Invalid phone number format. Must be +234XXXXXXXXXX',
                    errorCode: 'INVALID_PHONE_NUMBER'
                });
            }
        }

        // Validate duration (1-6 months)
        if (durationMonths < 1 || durationMonths > 6) {
            return res.status(400).json({
                success: false,
                message: 'Duration must be between 1 and 6 months',
                errorCode: 'INVALID_DURATION'
            });
        }

        await connection.beginTransaction();

        // Check if sticker exists and is unused - get LGA price at the same time
        const [stickers] = await connection.execute(
            `SELECT s.id, s.sticker_code, s.lga_id, s.status, l.sticker_price 
             FROM stickers s
             LEFT JOIN lgas l ON s.lga_id = l.id
             WHERE s.sticker_code = ? FOR UPDATE`,
            [stickerID]
        );

        if (stickers.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Sticker not found',
                errorCode: 'STICKER_NOT_FOUND'
            });
        }

        const sticker = stickers[0];

        // Validate amount using LGA-specific price
        const pricePerMonth = sticker.sticker_price || 340000; // Use LGA price in kobo, default ₦3,400
        const expectedAmount = (pricePerMonth / 100) * durationMonths; // Convert to Naira

        console.log('Price validation:', {
            lgaId: sticker.lga_id,
            pricePerMonthKobo: pricePerMonth,
            pricePerMonthNaira: pricePerMonth / 100,
            durationMonths,
            expectedAmount,
            amountPaid
        });

        // Validate amount (allow 1 kobo difference for rounding)
        if (Math.abs(amountPaid - expectedAmount) > 0.01) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `Amount paid (₦${amountPaid.toFixed(2)}) does not match expected amount (₦${expectedAmount.toFixed(2)}) for ${durationMonths} month(s)`,
                errorCode: 'INVALID_AMOUNT',
                data: {
                    durationMonths,
                    pricePerMonth: pricePerMonth / 100,
                    expectedAmount: parseFloat(expectedAmount.toFixed(2)),
                    providedAmount: parseFloat(amountPaid.toFixed(2))
                }
            });
        }

        if (sticker.status === 'active' || sticker.status === 'expired') {
            await connection.rollback();

            // Get activation details
            const [activations] = await connection.execute(
                'SELECT activation_date, expiry_date FROM activations WHERE sticker_id = ? ORDER BY activation_date DESC LIMIT 1',
                [sticker.id]
            );

            return res.status(400).json({
                success: false,
                message: 'This sticker has already been activated',
                errorCode: 'STICKER_ALREADY_ACTIVATED',
                data: {
                    activatedAt: activations[0]?.activation_date,
                    expiryDate: activations[0]?.expiry_date
                }
            });
        }

        // Create or get cart pusher
        let cartPusherId;

        if (cartPusherContact) {
            // If contact provided, check by phone number
            const [existingCartPushers] = await connection.execute(
                'SELECT id FROM cart_pushers WHERE phone_number = ?',
                [cartPusherContact]
            );

            if (existingCartPushers.length > 0) {
                cartPusherId = existingCartPushers[0].id;
                // Update name if different
                await connection.execute(
                    'UPDATE cart_pushers SET name = ? WHERE id = ?',
                    [cartPusherName, cartPusherId]
                );
            } else {
                const [result] = await connection.execute(
                    'INSERT INTO cart_pushers (name, phone_number, lga_id) VALUES (?, ?, ?)',
                    [cartPusherName, cartPusherContact, lgaId]
                );
                cartPusherId = result.insertId;
            }
        } else {
            // No contact provided - create cart pusher with name only
            const [result] = await connection.execute(
                'INSERT INTO cart_pushers (name, phone_number, lga_id) VALUES (?, NULL, ?)',
                [cartPusherName, lgaId]
            );
            cartPusherId = result.insertId;
        }

        // Calculate expiry date
        const activationDate = activatedAt ? new Date(activatedAt) : new Date();
        const expiryDate = new Date(activationDate);
        expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

        // Generate receipt number
        const dateStr = activationDate.toISOString().split('T')[0].replace(/-/g, '');
        const [receiptCount] = await connection.execute(
            'SELECT COUNT(*) as count FROM activations WHERE DATE(activation_date) = DATE(?)',
            [activationDate]
        );
        const sequence = (receiptCount[0].count + 1).toString().padStart(3, '0');
        const receiptNumber = `RCP-${dateStr}-${sequence}`;

        // Create activation record
        const [activationResult] = await connection.execute(
            `INSERT INTO activations (
                sticker_id, cart_pusher_id, officer_id, lga_id,
                activation_date, expiry_date, duration_months,
                amount_paid, payment_method, receipt_number,
                location_latitude, location_longitude
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                sticker.id, cartPusherId, userId, lgaId,
                activationDate, expiryDate, durationMonths,
                Math.round(amountPaid * 100), // Convert to kobo
                paymentMethod, receiptNumber,
                locationLatitude || null, locationLongitude || null
            ]
        );

        const activationID = `ACT-${dateStr}-${sequence}`;

        // Update sticker status
        await connection.execute(
            `UPDATE stickers SET 
                status = 'active',
                activated_by = ?,
                activated_at = NOW(),
                assigned_to_name = ?,
                assigned_to_phone = ?,
                expires_at = ?
             WHERE id = ?`,
            [userId, cartPusherName, cartPusherContact, expiryDate, sticker.id]
        );

        await connection.commit();

        console.log('Sticker activated successfully:', { activationID, receiptNumber });
        console.log('=== ACTIVATE STICKER SUCCESS ===\n');

        res.status(201).json({
            success: true,
            message: 'Sticker activated successfully',
            data: {
                activationID,
                stickerID: sticker.sticker_code,
                activatedAt: activationDate,
                expiryDate,
                durationMonths,
                amountPaid,
                cartPusher: {
                    name: cartPusherName,
                    phoneNumber: cartPusherContact
                },
                officer: {
                    id: officerId,
                    name: req.user.name
                },
                receipt: {
                    receiptNumber,
                    downloadUrl: `${process.env.APP_URL || 'https://api.cartpusher.gov.ng'}/receipts/${receiptNumber}.pdf`
                }
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('ERROR in activateSticker:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to activate sticker',
            errorCode: 'SERVER_ERROR'
        });
    } finally {
        connection.release();
    }
};

/**
 * @desc    Verify sticker status (public endpoint)
 * @route   GET /api/v1/officer/stickers/:stickerID/verify
 * @access  Public
 */
exports.verifySticker = async (req, res) => {
    try {
        console.log('\n=== VERIFY STICKER ===');
        const { stickerID } = req.params;
        console.log('Sticker ID:', stickerID);

        // Find sticker with activation details
        const [stickers] = await pool.execute(
            `SELECT s.*, 
                    a.activation_date as activated_at,
                    a.expiry_date,
                    a.duration_months,
                    a.amount_paid,
                    cp.name as cart_pusher_name,
                    cp.phone_number as cart_pusher_phone
             FROM stickers s
             LEFT JOIN activations a ON s.id = a.sticker_id
             LEFT JOIN cart_pushers cp ON a.cart_pusher_id = cp.id
             WHERE s.sticker_code = ?
             ORDER BY a.activation_date DESC
             LIMIT 1`,
            [stickerID]
        );

        if (stickers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sticker not found',
                errorCode: 'STICKER_NOT_FOUND'
            });
        }

        const sticker = stickers[0];
        const now = new Date();

        // Determine status
        let status = 'unused';
        let isValid = false;
        let daysRemaining = null;
        let daysOverdue = null;

        if (sticker.status === 'active' || sticker.status === 'expired') {
            const expiryDate = new Date(sticker.expiry_date);
            if (now < expiryDate) {
                status = 'active';
                isValid = true;
                daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
            } else {
                status = 'expired';
                isValid = false;
                daysOverdue = Math.ceil((now - expiryDate) / (1000 * 60 * 60 * 24));
            }
        }

        // Log verification (if officer is logged in)
        const officerId = req.user?.userId || null;
        await pool.execute(
            `INSERT INTO verifications (sticker_id, officer_id, status_at_verification, is_valid)
             VALUES (?, ?, ?, ?)`,
            [sticker.id, officerId, status, isValid]
        );

        console.log('Sticker verified:', { status, isValid });
        console.log('=== VERIFY STICKER SUCCESS ===\n');

        // Unused sticker response
        if (status === 'unused') {
            return res.status(200).json({
                success: true,
                data: {
                    stickerID: sticker.sticker_code,
                    status: 'unused',
                    isValid: false,
                    lgaName: sticker.lga_name,
                    message: 'This sticker has not been activated yet',
                    verifiedAt: new Date()
                }
            });
        }

        // Active sticker response
        if (status === 'active') {
            return res.status(200).json({
                success: true,
                data: {
                    stickerID: sticker.sticker_code,
                    status: 'active',
                    isValid: true,
                    lgaName: sticker.lga_name,
                    activatedAt: sticker.activated_at,
                    expiryDate: sticker.expiry_date,
                    daysRemaining,
                    durationMonths: sticker.duration_months,
                    amountPaid: parseFloat((sticker.amount_paid / 100).toFixed(2)),
                    cartPusher: {
                        name: sticker.cart_pusher_name,
                        phoneNumber: sticker.cart_pusher_phone?.replace(/(\d{3})(\d{4})(\d{4})/, '+234 $1 XXX $3') // Mask middle digits
                    },
                    verifiedAt: new Date()
                }
            });
        }

        // Expired sticker response
        res.status(200).json({
            success: true,
            data: {
                stickerID: sticker.sticker_code,
                status: 'expired',
                isValid: false,
                lgaName: sticker.lga_name,
                activatedAt: sticker.activated_at,
                expiryDate: sticker.expiry_date,
                daysOverdue,
                cartPusher: {
                    name: sticker.cart_pusher_name,
                    phoneNumber: sticker.cart_pusher_phone?.replace(/(\d{3})(\d{4})(\d{4})/, '+234 $1 XXX $3')
                },
                verifiedAt: new Date()
            }
        });

    } catch (error) {
        console.error('ERROR in verifySticker:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify sticker',
            errorCode: 'SERVER_ERROR'
        });
    }
};

module.exports = exports;
