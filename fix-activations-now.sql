-- EMERGENCY FIX: Add missing columns to activations table
-- Run with: mysql -u ggtlnplz_gpuser -p'Gifamz@2025@' ggtlnplz_green_permit < fix-activations-now.sql

-- Add cart_pusher_id if missing
ALTER TABLE activations ADD COLUMN IF NOT EXISTS cart_pusher_id INT NULL;

-- Add lga_id if missing  
ALTER TABLE activations ADD COLUMN IF NOT EXISTS lga_id INT NULL;

-- Add location columns if missing
ALTER TABLE activations ADD COLUMN IF NOT EXISTS location_latitude DECIMAL(10, 8) NULL;
ALTER TABLE activations ADD COLUMN IF NOT EXISTS location_longitude DECIMAL(11, 8) NULL;

-- Add expiry_date if missing (the controller looks for this)
ALTER TABLE activations ADD COLUMN IF NOT EXISTS expiry_date DATETIME NULL;

-- Show the final structure
DESCRIBE activations;
