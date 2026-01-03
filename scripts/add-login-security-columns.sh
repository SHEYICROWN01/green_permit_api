#!/bin/bash

echo "🔧 Adding Missing Columns for Officer Login"
echo "============================================"
echo ""

echo "Adding columns to users table..."
echo ""

mysql -u ggtlnplz_green_permit -p ggtlnplz_green_permit_db << 'EOF'

-- Add failed_login_attempts column
ALTER TABLE users 
ADD COLUMN failed_login_attempts INT DEFAULT 0;

-- Add locked_until column
ALTER TABLE users 
ADD COLUMN locked_until DATETIME NULL;

-- Add last_login_at column
ALTER TABLE users 
ADD COLUMN last_login_at DATETIME NULL;

-- Add pin_hash column (for legacy PIN login)
ALTER TABLE users 
ADD COLUMN pin_hash VARCHAR(255) NULL;

-- Show confirmation
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'ggtlnplz_green_permit_db' 
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME IN ('failed_login_attempts', 'locked_until', 'last_login_at', 'pin_hash')
ORDER BY COLUMN_NAME;

EOF

echo ""
echo "============================================"
echo "✅ Columns added successfully!"
echo ""
echo "Now restart PM2 and test login again:"
echo "  pm2 restart green-permit-api"
echo "  curl http://localhost:3000/api/v1/officer/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"bola\",\"password\":\"Admin@123\"}'"
echo ""
