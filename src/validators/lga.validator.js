const { body } = require('express-validator');

// List of Nigerian states
const NIGERIAN_STATES = [
    'Abia State',
    'Adamawa State',
    'Akwa Ibom State',
    'Anambra State',
    'Bauchi State',
    'Bayelsa State',
    'Benue State',
    'Borno State',
    'Cross River State',
    'Delta State',
    'Ebonyi State',
    'Edo State',
    'Ekiti State',
    'Enugu State',
    'Gombe State',
    'Imo State',
    'Jigawa State',
    'Kaduna State',
    'Kano State',
    'Katsina State',
    'Kebbi State',
    'Kogi State',
    'Kwara State',
    'Lagos State',
    'Nasarawa State',
    'Niger State',
    'Ogun State',
    'Ondo State',
    'Osun State',
    'Oyo State',
    'Plateau State',
    'Rivers State',
    'Sokoto State',
    'Taraba State',
    'Yobe State',
    'Zamfara State',
    'Federal Capital Territory'
];

/**
 * Validation rules for creating an LGA
 */
const createLGAValidation = [
    // LGA details validation
    body('lga.name')
        .trim()
        .notEmpty()
        .withMessage('LGA name is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('LGA name must be between 3 and 100 characters'),

    body('lga.state')
        .trim()
        .notEmpty()
        .withMessage('State is required')
        .isIn(NIGERIAN_STATES)
        .withMessage('Invalid Nigerian state'),

    body('lga.code')
        .trim()
        .notEmpty()
        .withMessage('LGA code is required')
        .isLength({ min: 2, max: 10 })
        .withMessage('LGA code must be between 2 and 10 characters')
        .matches(/^[A-Z0-9-]+$/)
        .withMessage('LGA code must contain only uppercase letters, numbers, and hyphens'),

    body('lga.sticker_prefix')
        .trim()
        .notEmpty()
        .withMessage('Sticker prefix is required')
        .isLength({ min: 2, max: 20 })
        .withMessage('Sticker prefix must be between 2 and 20 characters')
        .matches(/^[A-Z0-9-]+$/)
        .withMessage('Sticker prefix must contain only uppercase letters, numbers, and hyphens'),

    body('lga.sticker_price')
        .notEmpty()
        .withMessage('Sticker price is required')
        .isInt({ min: 100, max: 5000000 })
        .withMessage('Sticker price must be between ₦1.00 and ₦50,000.00 (100-5000000 kobo)'),

    body('lga.address')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Address must not exceed 255 characters'),

    body('lga.phone')
        .optional()
        .trim()
        .matches(/^\+?[0-9]{10,15}$/)
        .withMessage('Invalid phone number format'),

    body('lga.email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Invalid email address')
        .normalizeEmail(),

    // Admin user validation
    body('admin.name')
        .trim()
        .notEmpty()
        .withMessage('Admin name is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Admin name must be between 3 and 100 characters'),

    body('admin.email')
        .trim()
        .notEmpty()
        .withMessage('Admin email is required')
        .isEmail()
        .withMessage('Invalid admin email address')
        .normalizeEmail(),

    body('admin.username')
        .trim()
        .notEmpty()
        .withMessage('Admin username is required')
        .isLength({ min: 3, max: 50 })
        .withMessage('Admin username must be between 3 and 50 characters')
        .matches(/^[a-z0-9_]+$/)
        .withMessage('Admin username must contain only lowercase letters, numbers, and underscores'),

    body('admin.password')
        .notEmpty()
        .withMessage('Admin password is required')
        .isLength({ min: 8 })
        .withMessage('Admin password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Admin password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

    body('admin.phone')
        .optional()
        .trim()
        .matches(/^\+?[0-9]{10,15}$/)
        .withMessage('Invalid admin phone number format')
];

/**
 * Validation rules for updating an LGA
 */
const updateLGAValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('LGA name must be between 3 and 100 characters'),

    body('state')
        .optional()
        .trim()
        .isIn(NIGERIAN_STATES)
        .withMessage('Invalid Nigerian state'),

    body('code')
        .optional()
        .trim()
        .isLength({ min: 2, max: 10 })
        .withMessage('LGA code must be between 2 and 10 characters')
        .matches(/^[A-Z0-9-]+$/)
        .withMessage('LGA code must contain only uppercase letters, numbers, and hyphens'),

    body('sticker_prefix')
        .optional()
        .trim()
        .isLength({ min: 2, max: 20 })
        .withMessage('Sticker prefix must be between 2 and 20 characters')
        .matches(/^[A-Z0-9-]+$/)
        .withMessage('Sticker prefix must contain only uppercase letters, numbers, and hyphens'),

    body('sticker_price')
        .optional()
        .isInt({ min: 100, max: 5000000 })
        .withMessage('Sticker price must be between ₦1.00 and ₦50,000.00 (100-5000000 kobo)'),

    body('address')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Address must not exceed 255 characters'),

    body('phone')
        .optional()
        .trim()
        .matches(/^\+?[0-9]{10,15}$/)
        .withMessage('Invalid phone number format'),

    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Invalid email address')
        .normalizeEmail()
];

module.exports = {
    createLGAValidation,
    updateLGAValidation,
    NIGERIAN_STATES
};
