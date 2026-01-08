// src/utils/stickerCodeGenerator.js
const crypto = require('crypto');

/**
 * Generate a unique sticker code
 * Format: {LGA_CODE}-{TIMESTAMP}{RANDOM}{SEQUENCE}
 * Example: IFO-167309234501234
 * 
 * @param {string} lgaCode - LGA code (e.g., 'IFO')
 * @param {number} sequence - Sequential number within batch
 * @returns {string} Unique sticker code
 */
function generateStickerCode(lgaCode, sequence = 1) {
    // Get current timestamp in milliseconds
    const timestamp = Date.now().toString();

    // Generate 2-digit random number
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');

    // Format sequence as 3-digit number
    const seq = sequence.toString().padStart(3, '0');

    // Combine: LGA-TIMESTAMP+RANDOM+SEQUENCE
    const code = `${lgaCode}-${timestamp}${random}${seq}`;

    return code;
}

/**
 * Generate QR code data
 * Returns full verification URL for public scanning with regular phone cameras
 * Format: https://permitmanager.gifamz.com/verify/{STICKER_CODE}
 * 
 * Mobile apps should extract just the sticker code from the URL if needed.
 * Regular phone cameras will open the verification page directly.
 * 
 * @param {string} stickerCode - The unique sticker code
 * @returns {string} QR code data (full verification URL)
 */
function generateQRCodeData(stickerCode) {
    // Base URL for permit verification
    const baseUrl = process.env.VERIFICATION_URL || 'https://permitmanager.gifamz.com';

    // Return full URL so regular phone cameras can scan and open the website
    return `${baseUrl}/verify/${stickerCode}`;
}

/**
 * Validate sticker code format
 * @param {string} code - Sticker code to validate
 * @returns {boolean}
 */
function validateStickerCode(code) {
    // Format: LGA_CODE-DIGITS
    // Example: IFO-167309234501234
    const pattern = /^[A-Z]{2,10}-\d{13,20}$/;
    return pattern.test(code);
}

/**
 * Extract LGA code from sticker code
 * @param {string} stickerCode - Full sticker code
 * @returns {string|null} LGA code or null if invalid
 */
function extractLgaCode(stickerCode) {
    const parts = stickerCode.split('-');
    return parts.length === 2 ? parts[0] : null;
}

module.exports = {
    generateStickerCode,
    generateQRCodeData,
    validateStickerCode,
    extractLgaCode
};
