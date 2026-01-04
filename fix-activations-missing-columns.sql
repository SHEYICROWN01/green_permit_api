-- Add missing columns to activations table
-- Run with: mysql -u ggtlnplz_gpuser -p'Gifamz@2025@' ggtlnplz_green_permit < fix-activations-missing-columns.sql

-- Add duration_months column
ALTER TABLE activations ADD COLUMN IF NOT EXISTS duration_months INT NOT NULL DEFAULT 1;

-- Add payment_method column
ALTER TABLE activations ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash';

-- Add receipt_number column
ALTER TABLE activations ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100) NULL;

-- Verify the changes
DESCRIBE activations;
