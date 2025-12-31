const express = require('express');
const router = express.Router();

const {
    getExamples,
    getExampleById,
    createExample,
    updateExample,
    deleteExample,
} = require('../controllers/example.controller');

const {
    createExampleValidation,
    updateExampleValidation,
    idValidation,
} = require('../validators/example.validator');

const validate = require('../middleware/validate');

// Routes
router.get('/', getExamples);
router.get('/:id', idValidation, validate, getExampleById);
router.post('/', createExampleValidation, validate, createExample);
router.put('/:id', updateExampleValidation, validate, updateExample);
router.delete('/:id', idValidation, validate, deleteExample);

module.exports = router;
