-- Create missing tables for officer mobile app features
-- Run this on production database: ggtlnplz_green_permit

-- 1. Create cart_pushers table (if not exists)
CREATE TABLE IF NOT EXISTS cart_pushers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    lga_id INT,
    registered_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    registered_by_officer_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone_number),
    INDEX idx_lga (lga_id),
    FOREIGN KEY (lga_id) REFERENCES lgas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Cart pushers registered by officers';

-- 2. Create verifications table (if not exists)
CREATE TABLE IF NOT EXISTS verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sticker_id INT NOT NULL,
    officer_id INT NOT NULL,
    status_at_verification VARCHAR(50) DEFAULT 'active',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_address VARCHAR(500),
    verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sticker (sticker_id),
    INDEX idx_officer (officer_id),
    INDEX idx_date (verified_at),
    FOREIGN KEY (sticker_id) REFERENCES stickers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Sticker verification logs by officers';

-- 3. Check if activations table exists, create if not
CREATE TABLE IF NOT EXISTS activations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sticker_id INT NOT NULL,
    officer_id INT NOT NULL,
    cart_pusher_name VARCHAR(255) NOT NULL,
    cart_pusher_phone VARCHAR(20) NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) DEFAULT 'cash',
    duration_months INT DEFAULT 12,
    receipt_number VARCHAR(100),
    activation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sticker (sticker_id),
    INDEX idx_officer (officer_id),
    INDEX idx_date (activation_date),
    INDEX idx_phone (cart_pusher_phone),
    FOREIGN KEY (sticker_id) REFERENCES stickers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Sticker activations by officers';

-- 4. Verify the tables were created
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME
FROM INFORMATION_SCHEMA.TABLES
WHERE 
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME IN ('cart_pushers', 'verifications', 'activations')
ORDER BY TABLE_NAME;

-- 5. Show column structure for verification
SHOW COLUMNS FROM activations;
SHOW COLUMNS FROM verifications;
SHOW COLUMNS FROM cart_pushers;
