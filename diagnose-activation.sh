#!/bin/bash

# Diagnose activation issue - check all related tables
# Run this to see what might be wrong

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

DB_USER="ggtlnplz_gpuser"
DB_PASS="Gifamz@2025@"
DB_NAME="ggtlnplz_green_permit"

echo "=============================================="
echo "ACTIVATION DIAGNOSTIC"
echo "=============================================="
echo ""

echo -e "${BLUE}1. Check if test sticker exists${NC}"
echo "================================"
mysql -u $DB_USER -p"$DB_PASS" $DB_NAME -e "
    SELECT id, code, lga_id, status 
    FROM stickers 
    WHERE code = 'LAOWO-176744638584664004';
"
echo ""

echo -e "${BLUE}2. Check LGA pricing for LAOWO${NC}"
echo "==============================="
mysql -u $DB_USER -p"$DB_PASS" $DB_NAME -e "
    SELECT id, name, code, sticker_price, (sticker_price/100) as price_naira
    FROM lgas 
    WHERE code = 'LAOWO';
"
echo ""

echo -e "${BLUE}3. Check officer details (bola)${NC}"
echo "==============================="
mysql -u $DB_USER -p"$DB_PASS" $DB_NAME -e "
    SELECT id, username, officer_id, lga_id, role
    FROM users 
    WHERE username = 'bola';
"
echo ""

echo -e "${BLUE}4. Check foreign key constraints on activations${NC}"
echo "==============================================="
mysql -u $DB_USER -p"$DB_PASS" $DB_NAME -e "
    SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = '$DB_NAME'
    AND TABLE_NAME = 'activations'
    AND REFERENCED_TABLE_NAME IS NOT NULL;
"
echo ""

echo -e "${BLUE}5. Test INSERT into cart_pushers${NC}"
echo "================================"
echo "Testing if we can create a cart pusher..."
mysql -u $DB_USER -p"$DB_PASS" $DB_NAME <<EOF
-- Try to insert a test cart pusher
INSERT INTO cart_pushers (name, phone_number, lga_id) 
VALUES ('Test Cart Pusher', '+2348012345678', 2);

-- Check if it worked
SELECT * FROM cart_pushers ORDER BY id DESC LIMIT 1;

-- Delete test record
DELETE FROM cart_pushers WHERE name = 'Test Cart Pusher' LIMIT 1;
EOF
echo ""

echo -e "${BLUE}6. Test activation INSERT query${NC}"
echo "================================"
echo "Simulating the activation INSERT..."
mysql -u $DB_USER -p"$DB_PASS" $DB_NAME <<EOF
-- Get required IDs
SET @sticker_id = (SELECT id FROM stickers WHERE code = 'LAOWO-176744638584664004' LIMIT 1);
SET @officer_id = (SELECT id FROM users WHERE username = 'bola' LIMIT 1);
SET @lga_id = 2;
SET @test_cart_pusher_id = 1;

-- Try the INSERT that controller uses
SELECT 
    @sticker_id as sticker_id,
    @officer_id as officer_id,
    @lga_id as lga_id,
    @test_cart_pusher_id as cart_pusher_id;

-- Show what the controller tries to insert
SELECT CONCAT(
    'INSERT INTO activations (',
    'sticker_id, cart_pusher_id, officer_id, lga_id, ',
    'activation_date, expiry_date, duration_months, ',
    'amount_paid, payment_method, receipt_number, ',
    'location_latitude, location_longitude',
    ') VALUES (',
    COALESCE(@sticker_id, 'NULL'), ', ',
    COALESCE(@test_cart_pusher_id, 'NULL'), ', ',
    COALESCE(@officer_id, 'NULL'), ', ',
    COALESCE(@lga_id, 'NULL'), ', ',
    'NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), 1, ',
    '500100, "cash", "RCP-TEST-001", NULL, NULL',
    ');'
) as query_to_execute;
EOF
echo ""

echo -e "${BLUE}7. Check if officers table exists vs users table${NC}"
echo "================================================"
mysql -u $DB_USER -p"$DB_PASS" $DB_NAME -e "
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = '$DB_NAME' 
    AND table_name IN ('users', 'officers');
"
echo ""

echo -e "${BLUE}8. Show activations table constraints${NC}"
echo "====================================="
mysql -u $DB_USER -p"$DB_PASS" $DB_NAME -e "SHOW CREATE TABLE activations\G"
echo ""

echo "=============================================="
echo "RECOMMENDATIONS"
echo "=============================================="
echo ""
echo "Based on the output above, look for:"
echo "  1. Does the sticker exist? (should show 1 row)"
echo "  2. Does the LGA have correct pricing?"
echo "  3. Does the officer 'bola' exist in users table?"
echo "  4. Are foreign key constraints causing issues?"
echo "  5. Can we insert into cart_pushers successfully?"
echo ""
echo "If you see foreign key constraint errors, we may need to:"
echo "  - Drop the foreign key constraints"
echo "  - Fix the referenced tables"
echo "  - Re-add the constraints"
echo ""
