const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { superAdminLogin, supervisorLogin, logout, getCurrentUser } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation rules for login
const loginValidation = [
    body('username')
        .notEmpty()
        .withMessage('Username is required')
        .isLength({ min: 4 })
        .withMessage('Username must be at least 4 characters'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters'),
];

// Routes
router.post('/super-admin/login', loginValidation, validate, superAdminLogin);
router.post('/supervisor/login', loginValidation, validate, supervisorLogin);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);

module.exports = router;
