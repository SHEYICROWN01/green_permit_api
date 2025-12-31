const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');

/**
 * @desc    Supervisor login
 * @route   POST /api/v1/auth/supervisor/login
 * @access  Public
 */
exports.login = async (req, res) => {
    try {
        console.log('\n=== SUPERVISOR LOGIN REQUEST ===');
        console.log('Request Body:', { ...req.body, password: '[HIDDEN]' });

        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            console.log('ERROR: Missing email or password');
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Get supervisor from database
        const sql = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.password,
        u.phone,
        u.is_active,
        u.lga_id,
        u.created_at,
        l.name as lga_name,
        l.code as lga_code
      FROM users u
      LEFT JOIN lgas l ON u.lga_id = l.id
      WHERE u.email = ? AND u.role = 'supervisor'
    `;

        console.log('Checking supervisor credentials for:', email);

        const [supervisor] = await db.query(sql, [email]);

        if (!supervisor) {
            console.log('ERROR: Supervisor not found');
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        console.log('Supervisor found:', { id: supervisor.id, name: supervisor.name, is_active: supervisor.is_active });

        // Check if supervisor is active
        if (!supervisor.is_active) {
            console.log('ERROR: Supervisor account is inactive');
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact your LGA administrator.'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, supervisor.password);

        if (!isPasswordValid) {
            console.log('ERROR: Invalid password');
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        console.log('Password validated successfully');

        // Update last_login timestamp
        await db.query(
            'UPDATE users SET last_login_at = NOW() WHERE id = ?',
            [supervisor.id]
        );

        console.log('Updated last_login timestamp');

        // Generate JWT token with supervisor_id
        const token = jwt.sign(
            {
                user_id: supervisor.id,
                supervisor_id: `sup_${supervisor.id}`, // Critical: Include supervisor_id
                role: 'supervisor',
                lga_id: supervisor.lga_id,
                email: supervisor.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' } // 7 days for supervisors
        );

        console.log('JWT token generated');

        // Prepare user data for response (exclude password)
        const userData = {
            user_id: `usr_${supervisor.id}`,
            supervisor_id: `sup_${supervisor.id}`,
            role: 'supervisor',
            name: supervisor.name,
            email: supervisor.email,
            phone: supervisor.phone,
            lga_id: `lga_${supervisor.lga_id}`,
            lga_name: supervisor.lga_name,
            lga_code: supervisor.lga_code,
            status: 'active',
            created_at: supervisor.created_at
        };

        console.log('Login successful for supervisor:', supervisor.name);
        console.log('=== SUPERVISOR LOGIN SUCCESS ===\n');

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: userData
            }
        });

    } catch (error) {
        console.error('ERROR in supervisor login:', error);
        console.error('Stack:', error.stack);

        return res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get current supervisor profile
 * @route   GET /api/v1/supervisor/me
 * @access  Private (Supervisor)
 */
exports.getProfile = async (req, res) => {
    try {
        console.log('\n=== GET SUPERVISOR PROFILE ===');
        console.log('User:', { id: req.user.id, role: req.user.role });

        const sql = `
      SELECT 
        u.id,
        CONCAT('sup_', u.id) as supervisor_id,
        CONCAT('SUP-', l.code, '-', YEAR(u.created_at), '-', LPAD(u.id, 4, '0')) as supervisor_code,
        u.name,
        u.email,
        u.phone,
        CASE WHEN u.is_active = 1 THEN 'active' ELSE 'inactive' END as status,
        CONCAT('lga_', u.lga_id) as lga_id,
        l.name as lga_name,
        l.code as lga_code,
        u.created_at,
        u.last_login_at
      FROM users u
      LEFT JOIN lgas l ON u.lga_id = l.id
      WHERE u.id = ? AND u.role = 'supervisor'
    `;

        const [supervisor] = await db.query(sql, [req.user.id]);

        if (!supervisor) {
            console.log('ERROR: Supervisor not found');
            return res.status(404).json({
                success: false,
                message: 'Supervisor profile not found'
            });
        }

        console.log('Profile retrieved for:', supervisor.name);
        console.log('=== GET SUPERVISOR PROFILE SUCCESS ===\n');

        return res.status(200).json({
            success: true,
            data: {
                supervisor
            }
        });

    } catch (error) {
        console.error('ERROR in getProfile:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Refresh JWT token
 * @route   POST /api/v1/supervisor/auth/refresh
 * @access  Public (requires valid token in body)
 */
exports.refreshToken = async (req, res) => {
    try {
        console.log('\n=== REFRESH TOKEN ===');
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required'
            });
        }

        // Verify the existing token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user is supervisor
        if (decoded.role !== 'supervisor') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Generate a new token
        const newToken = jwt.sign(
            {
                user_id: decoded.user_id,
                supervisor_id: decoded.supervisor_id,
                email: decoded.email,
                role: decoded.role,
                lga_id: decoded.lga_id
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        console.log('Token refreshed successfully');
        console.log('=== REFRESH TOKEN SUCCESS ===\n');

        return res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: { token: newToken }
        });

    } catch (error) {
        console.error('ERROR in refreshToken:', error.message);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Token refresh failed'
        });
    }
};

/**
 * @desc    Supervisor logout
 * @route   POST /api/v1/supervisor/auth/logout
 * @access  Private (Supervisor)
 */
exports.logout = async (req, res) => {
    try {
        console.log('\n=== SUPERVISOR LOGOUT ===');
        console.log('User:', { id: req.user.id, name: req.user.name });

        // In a stateless JWT system, logout is handled client-side
        // But we can log the logout event for audit purposes
        console.log('Supervisor logged out successfully');
        console.log('=== SUPERVISOR LOGOUT SUCCESS ===\n');

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('ERROR in logout:', error);

        return res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};
