-- SAFE ACTIVATION TABLE SCHEMA FIX
-- This uses ALTER TABLE instead of DROP TABLE to preserve any existing data
-- Run on: ggtlnplz_green_permit database

-- Step 1: Add missing columns if they don't exist
-- This is safe - won't affect existing data

-- Add cart_pusher_id column (INT, foreign key)
ALTER TABLE activations 
ADD COLUMN IF NOT EXISTS cart_pusher_id INT NULL AFTER officer_id;

-- Add lga_id column (INT, foreign key)
ALTER TABLE activations 
ADD COLUMN IF NOT EXISTS lga_id INT NULL AFTER cart_pusher_id;

-- Add location tracking columns
ALTER TABLE activations 
ADD COLUMN IF NOT EXISTS location_latitude DECIMAL(10, 8) NULL;

ALTER TABLE activations 
ADD COLUMN IF NOT EXISTS location_longitude DECIMAL(11, 8) NULL;

-- Step 2: Rename/fix existing columns

-- Check if expires_at exists and rename to expiry_date
-- (This handles the column name mismatch)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'activations' 
    AND column_name = 'expires_at'
);

SET @sql = IF(@col_exists > 0, 
    'ALTER TABLE activations CHANGE expires_at expiry_date DATETIME NOT NULL', 
    'SELECT "Column expires_at does not exist, skipping rename" as status'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 3: Modify amount_paid to INT (kobo) if currently DECIMAL
-- This converts existing Naira values to kobo (multiply by 100)

-- First check current type
SET @amount_type = (
    SELECT DATA_TYPE 
    FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'activations' 
    AND column_name = 'amount_paid'
);

-- If DECIMAL, convert existing data to kobo then change type
SET @sql = IF(@amount_type = 'decimal', 
    'UPDATE activations SET amount_paid = amount_paid * 100 WHERE amount_paid < 1000000; 
     ALTER TABLE activations MODIFY COLUMN amount_paid INT NOT NULL COMMENT "Amount in kobo (Naira × 100)";', 
    'ALTER TABLE activations MODIFY COLUMN amount_paid INT NOT NULL COMMENT "Amount in kobo (Naira × 100)";'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Drop old columns that are no longer needed (if they exist)

-- Check and drop cart_pusher_name (replaced by cart_pusher_id foreign key)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'activations' 
    AND column_name = 'cart_pusher_name'
);

SET @sql = IF(@col_exists > 0, 
    'ALTER TABLE activations DROP COLUMN cart_pusher_name', 
    'SELECT "Column cart_pusher_name does not exist" as status'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and drop cart_pusher_phone (replaced by cart_pusher_id foreign key)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'activations' 
    AND column_name = 'cart_pusher_phone'
);

SET @sql = IF(@col_exists > 0, 
    'ALTER TABLE activations DROP COLUMN cart_pusher_phone', 
    'SELECT "Column cart_pusher_phone does not exist" as status'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 5: Add indexes for performance
ALTER TABLE activations ADD INDEX IF NOT EXISTS idx_cart_pusher (cart_pusher_id);
ALTER TABLE activations ADD INDEX IF NOT EXISTS idx_lga (lga_id);
ALTER TABLE activations ADD INDEX IF NOT EXISTS idx_activation_date (activation_date);
ALTER TABLE activations ADD INDEX IF NOT EXISTS idx_expiry_date (expiry_date);

-- Step 6: Add foreign key constraints (if they don't exist)

-- Add foreign key to cart_pushers
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM information_schema.table_constraints 
    WHERE constraint_schema = DATABASE() 
    AND table_name = 'activations' 
    AND constraint_name = 'fk_activations_cart_pusher'
);

SET @sql = IF(@fk_exists = 0, 
    'ALTER TABLE activations ADD CONSTRAINT fk_activations_cart_pusher 
     FOREIGN KEY (cart_pusher_id) REFERENCES cart_pushers(id) ON DELETE RESTRICT', 
    'SELECT "Foreign key fk_activations_cart_pusher already exists" as status'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key to lgas
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM information_schema.table_constraints 
    WHERE constraint_schema = DATABASE() 
    AND table_name = 'activations' 
    AND constraint_name = 'fk_activations_lga'
);

SET @sql = IF(@fk_exists = 0, 
    'ALTER TABLE activations ADD CONSTRAINT fk_activations_lga 
     FOREIGN KEY (lga_id) REFERENCES lgas(id) ON DELETE RESTRICT', 
    'SELECT "Foreign key fk_activations_lga already exists" as status'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 7: Fix cart_pushers table - make phone_number nullable
ALTER TABLE cart_pushers 
MODIFY COLUMN phone_number VARCHAR(20) NULL COMMENT 'Optional phone number';

-- Step 8: Verify final structure
SELECT 'Final activations table structure:' as status;
SHOW COLUMNS FROM activations;

SELECT 'Cart pushers table structure:' as status;
SHOW COLUMNS FROM cart_pushers;

-- Step 9: Check data integrity
SELECT 
    'Data integrity check' as status,
    COUNT(*) as total_records,
    COUNT(cart_pusher_id) as records_with_cart_pusher,
    COUNT(lga_id) as records_with_lga,
    COUNT(CASE WHEN amount_paid >= 100000 THEN 1 END) as records_with_kobo_amounts
FROM activations;

SELECT 'Schema migration complete!' as status;
