const asyncHandler = require('../middleware/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Example = require('../models/Example');

/**
 * @desc    Get all examples
 * @route   GET /api/v1/examples
 * @access  Public
 */
const getExamples = asyncHandler(async (req, res) => {
    const examples = await Example.findAll();
    ApiResponse.success(res, examples, 'Examples retrieved successfully');
});

/**
 * @desc    Get single example by ID
 * @route   GET /api/v1/examples/:id
 * @access  Public
 */
const getExampleById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const example = await Example.findById(id);

    if (!example) {
        throw new ApiError(404, `Example with id ${id} not found`);
    }

    ApiResponse.success(res, example, 'Example retrieved successfully');
});

/**
 * @desc    Create new example
 * @route   POST /api/v1/examples
 * @access  Private
 */
const createExample = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const newExample = await Example.create({ name, description });

    ApiResponse.success(res, newExample, 'Example created successfully', 201);
});

/**
 * @desc    Update example
 * @route   PUT /api/v1/examples/:id
 * @access  Private
 */
const updateExample = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if example exists
    const exists = await Example.exists(id);
    if (!exists) {
        throw new ApiError(404, `Example with id ${id} not found`);
    }

    const updatedExample = await Example.update(id, { name, description });

    ApiResponse.success(res, updatedExample, 'Example updated successfully');
});

/**
 * @desc    Delete example
 * @route   DELETE /api/v1/examples/:id
 * @access  Private
 */
const deleteExample = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if example exists
    const exists = await Example.exists(id);
    if (!exists) {
        throw new ApiError(404, `Example with id ${id} not found`);
    }

    await Example.delete(id);

    ApiResponse.success(res, null, 'Example deleted successfully');
});

module.exports = {
    getExamples,
    getExampleById,
    createExample,
    updateExample,
    deleteExample,
};
