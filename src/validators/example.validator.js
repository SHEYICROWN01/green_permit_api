const { body, param } = require('express-validator');

/**
 * Validation rules for creating an example
 */
const createExampleValidation = [
    body('name')
        .notEmpty()
        .withMessage('Name is required')
        .isString()
        .withMessage('Name must be a string')
        .isLength({ min: 3, max: 100 })
        .withMessage('Name must be between 3 and 100 characters'),

    body('description')
        .optional()
        .isString()
        .withMessage('Description must be a string')
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters'),
];

/**
 * Validation rules for updating an example
 */
const updateExampleValidation = [
    param('id')
        .notEmpty()
        .withMessage('ID is required'),

    body('name')
        .optional()
        .isString()
        .withMessage('Name must be a string')
        .isLength({ min: 3, max: 100 })
        .withMessage('Name must be between 3 and 100 characters'),

    body('description')
        .optional()
        .isString()
        .withMessage('Description must be a string')
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters'),
];

/**
 * Validation rules for getting/deleting an example by ID
 */
const idValidation = [
    param('id')
        .notEmpty()
        .withMessage('ID is required'),
];

module.exports = {
    createExampleValidation,
    updateExampleValidation,
    idValidation,
};
