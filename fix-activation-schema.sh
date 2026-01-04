#!/bin/bash

# Fix Activation Schema - January 4, 2026
# This script fixes the schema mismatch causing SERVER_ERROR on activation

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=============================================="
echo "FIX ACTIVATION SCHEMA MISMATCH"
echo "=============================================="
echo ""

# Database credentials
DB_USER="ggtlnplz_gpuser"
DB_PASS="Gifamz@2025@"
DB_NAME="ggtlnplz_green_permit"

echo "Step 1: Check Current Activations Table Structure"
echo "=================================================="
mysql -u $DB_USER -p"$DB_PASS" $DB_NAME -e "DESCRIBE activations;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Found existing activations table with wrong schema${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Activations table doesn't exist${NC}"
    echo ""
fi

echo "Step 2: Backup Existing Data (if any)"
echo "======================================"
BACKUP_FILE="activations_backup_$(date +%Y%m%d_%H%M%S).sql"
mysqldump -u $DB_USER -p"$DB_PASS" $DB_NAME activations > "/tmp/$BACKUP_FILE" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup created: /tmp/$BACKUP_FILE${NC}"
else
    echo -e "${YELLOW}⚠️  No data to backup (table empty or doesn't exist)${NC}"
fi
echo ""

echo "Step 3: Apply Schema Fix"
echo "========================"
mysql -u $DB_USER -p"$DB_PASS" $DB_NAME < database/migrations/003_fix_activations_schema.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema fix applied successfully${NC}"
else
    echo -e "${RED}❌ Failed to apply schema fix${NC}"
    exit 1
fi
echo ""

echo "Step 4: Verify New Schema"
echo "========================="
echo ""
echo "Activations table structure:"
echo "----------------------------"
mysql -u $DB_USER -p"$DB_PASS" $DB_NAME -e "DESCRIBE activations;"
echo ""

echo "Cart pushers table structure:"
echo "------------------------------"
mysql -u $DB_USER -p"$DB_PASS" $DB_NAME -e "DESCRIBE cart_pushers;"
echo ""

echo "Step 5: Test Database Connection"
echo "================================="
mysql -u $DB_USER -p"$DB_PASS" $DB_NAME -e "SELECT COUNT(*) as sticker_count FROM stickers WHERE status = 'unused';"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database connection working${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi
echo ""

echo "Step 6: Restart Application"
echo "============================"
# For cPanel, touch the app file to trigger restart
touch /home/ggtlnplz/green-permit-api/src/app.js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Application restart triggered${NC}"
    echo "Waiting 3 seconds for app to initialize..."
    sleep 3
else
    echo -e "${RED}❌ Failed to restart application${NC}"
fi
echo ""

echo "=============================================="
echo -e "${GREEN}✅ SCHEMA FIX COMPLETE${NC}"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Test activation with this command:"
echo ""
echo "TOKEN=\$(curl -s -X POST https://gtech.gifamz.com/api/v1/officer/auth/login \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"username\":\"bola\",\"password\":\"Admin@123\"}' | \\"
echo "  python3 -c 'import sys, json; print(json.load(sys.stdin)[\"data\"][\"token\"])')"
echo ""
echo "curl -X POST \"https://gtech.gifamz.com/api/v1/officer/stickers/LAOWO-176744638584664004/activate\" \\"
echo "  -H \"Authorization: Bearer \$TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"cartPusherName\": \"Test User\","
echo "    \"cartPusherContact\": \"+2348012345678\","
echo "    \"durationMonths\": 1,"
echo "    \"amountPaid\": 5001,"
echo "    \"paymentMethod\": \"cash\""
echo "  }' | python3 -m json.tool"
echo ""
echo "Expected: 201 Created with activation details"
echo ""

