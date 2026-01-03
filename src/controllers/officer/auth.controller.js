// src/controllers/officer/auth.controller.js
const db = require('../../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * @desc    Officer login with username/password (or legacy officer ID/PIN)
 * @route   POST /api/v1/officer/auth/login
 * @access  Public
 * 
 * Supports two login methods:
 * 1. New: { username, password }
 * 2. Legacy: { officerId, pin } (backward compatibility)
 */
exports.login = async (req, res) => {
    try {
        console.log('\n=== OFFICER LOGIN REQUEST ===');
        const { username, password, officerId, pin } = req.body;

        // Determine login method
        const isNewMethod = username && password;
        const isLegacyMethod = officerId && pin;

        console.log('Login method:', {
            type: isNewMethod ? 'username/password' : 'officerId/pin',
            identifier: isNewMethod ? username : officerId
        });

        // Validate input - require either method
        if (!isNewMethod && !isLegacyMethod) {
            return res.status(400).json({
                success: false,
                message: 'Either (username and password) or (officerId and pin) are required',
                errorCode: 'VALIDATION_ERROR'
            });
        }

        // Build query based on login method
        let query, queryParams;

        if (isNewMethod) {
            // New method: Find by username
            query = `SELECT u.id, u.name, u.officer_code, u.username, u.email, u.phone, u.password, u.is_active, 
                            u.failed_login_attempts, u.locked_until, u.lga_id, u.last_login_at,
                            l.name as lga_name, l.code as lga_code
                     FROM users u
                     LEFT JOIN lgas l ON u.lga_id = l.id
                     WHERE u.username = ? AND u.role = 'officer'`;
            queryParams = [username];
        } else {
            // Legacy method: Find by officer_code
            query = `SELECT u.id, u.name, u.officer_code, u.username, u.email, u.phone, u.pin_hash, u.is_active, 
                            u.failed_login_attempts, u.locked_until, u.lga_id, u.last_login_at,
                            l.name as lga_name, l.code as lga_code
                     FROM users u
                     LEFT JOIN lgas l ON u.lga_id = l.id
                     WHERE u.officer_code = ? AND u.role = 'officer'`;
            queryParams = [officerId];
        }

        // Find officer
        const officers = await db.query(query, queryParams);

        if (!officers || officers.length === 0) {
            console.log('Officer not found:', isNewMethod ? username : officerId);
            return res.status(401).json({
                success: false,
                message: isNewMethod ? 'Invalid username or password' : 'Invalid officer ID or PIN',
                errorCode: 'AUTH_INVALID_CREDENTIALS'
            });
        }

        const officer = officers[0];
        console.log('Officer found:', { id: officer.id, name: officer.name });

        // Check if officer is active
        if (!officer.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Officer account is deactivated',
                errorCode: 'AUTH_ACCOUNT_DEACTIVATED'
            });
        }

        // Check if account is locked
        if (officer.locked_until && new Date(officer.locked_until) > new Date()) {
            const lockMinutes = Math.ceil((new Date(officer.locked_until) - new Date()) / 60000);
            return res.status(401).json({
                success: false,
                message: `Account is locked. Try again in ${lockMinutes} minutes`,
                errorCode: 'AUTH_ACCOUNT_LOCKED',
                data: { locked_until: officer.locked_until }
            });
        }

        // Verify credentials based on login method
        let isValidCredential = false;

        if (isNewMethod) {
            // New method: Verify password
            if (!officer.password) {
                return res.status(401).json({
                    success: false,
                    message: 'Password not set for this officer. Please contact administrator.',
                    errorCode: 'AUTH_PASSWORD_NOT_SET'
                });
            }
            isValidCredential = await bcrypt.compare(password, officer.password);
        } else {
            // Legacy method: Verify PIN
            if (!officer.pin_hash) {
                return res.status(401).json({
                    success: false,
                    message: 'PIN not set for this officer. Please contact administrator.',
                    errorCode: 'AUTH_PIN_NOT_SET'
                });
            }
            isValidCredential = await bcrypt.compare(pin, officer.pin_hash);
        }

        if (!isValidCredential) {
            // Increment failed attempts
            const failedAttempts = (officer.failed_login_attempts || 0) + 1;
            let locked_until = null;

            // Lock account after 5 failed attempts for 15 minutes
            if (failedAttempts >= 5) {
                locked_until = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
                console.log('Account locked due to failed attempts:', {
                    identifier: isNewMethod ? username : officerId,
                    locked_until
                });
            }

            await db.query(
                'UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
                [failedAttempts, locked_until, officer.id]
            );

            if (locked_until) {
                return res.status(401).json({
                    success: false,
                    message: 'Account locked due to too many failed login attempts. Try again in 15 minutes.',
                    errorCode: 'AUTH_ACCOUNT_LOCKED',
                    data: { locked_until }
                });
            }

            return res.status(401).json({
                success: false,
                message: isNewMethod ? 'Invalid username or password' : 'Invalid officer ID or PIN',
                errorCode: 'AUTH_INVALID_CREDENTIALS',
                data: { attempts_remaining: 5 - failedAttempts }
            });
        }

        console.log(isNewMethod ? 'Password verified successfully' : 'PIN verified successfully');

        // Reset failed attempts and update last login
        await db.query(
            'UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = ?',
            [officer.id]
        );

        // Generate JWT token
        const token = jwt.sign(
            {
                officerId: officer.officer_code,
                userId: officer.id,
                name: officer.name,
                lgaId: officer.lga_id,
                lgaAssigned: officer.lga_name,
                role: 'field_officer'
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // 24 hours for mobile app
        );

        console.log('JWT token generated');
        console.log('=== OFFICER LOGIN SUCCESS ===\n');

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                officer: {
                    id: officer.officer_code,
                    name: officer.name,
                    lgaAssigned: officer.lga_name,
                    lgaCode: officer.lga_code,
                    phoneNumber: officer.phone || null,
                    role: 'field_officer'
                },
                token,
                expiresIn: 86400 // 24 hours in seconds
            }
        });

    } catch (error) {
        console.error('ERROR in officer login:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            errorCode: 'SERVER_ERROR'
        });
    }
};

/**
 * @desc    Refresh JWT token
 * @route   POST /api/v1/officer/auth/refresh
 * @access  Private (Officer)
 */
exports.refreshToken = async (req, res) => {
    try {
        console.log('\n=== REFRESH TOKEN REQUEST ===');

        // Token is already verified by middleware
        const { officerId, userId, name, lgaId, lgaAssigned, role } = req.user;

        // Generate new token
        const newToken = jwt.sign(
            { officerId, userId, name, lgaId, lgaAssigned, role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Token refreshed successfully');
        console.log('=== REFRESH TOKEN SUCCESS ===\n');

        res.status(200).json({
            success: true,
            data: {
                token: newToken,
                expiresIn: 86400
            }
        });

    } catch (error) {
        console.error('ERROR in refresh token:', error);
        res.status(500).json({
            success: false,
            message: 'Token refresh failed',
            errorCode: 'SERVER_ERROR'
        });
    }
};

/**
 * @desc    Officer logout
 * @route   POST /api/v1/officer/auth/logout
 * @access  Private (Officer)
 */
exports.logout = async (req, res) => {
    try {
        console.log('\n=== OFFICER LOGOUT ===');
        console.log('Officer:', { id: req.user.officerId, name: req.user.name });

        // In JWT, logout is handled client-side by removing the token
        // But we can log the event for audit purposes
        console.log('Officer logged out successfully');
        console.log('=== OFFICER LOGOUT SUCCESS ===\n');

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('ERROR in logout:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};

module.exports = exports;
