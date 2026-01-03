#!/bin/bash
# Green Permit API - Complete Deployment & Testing
# Date: January 3, 2026
# Run this on production server to deploy all fixes and test

echo "=========================================="
echo "GREEN PERMIT API - DEPLOYMENT & TESTING"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Database credentials
DB_USER="ggtlnplz_gpuser"
DB_PASS="Gifamz@2025@"
DB_NAME="ggtlnplz_green_permit"

echo -e "${BLUE}Step 1: Pull Latest Code${NC}"
echo "========================================"
cd /home/ggtlnplz/green-permit-api
git pull origin main
echo ""

echo -e "${BLUE}Step 2: Check Current LGA Prices${NC}"
echo "========================================"
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  -e "SELECT id, name, code, sticker_price, (sticker_price / 100) as price_naira FROM lgas;"
echo ""

echo -e "${BLUE}Step 3: Fix LGA Pricing (Multiply by 100)${NC}"
echo "=========================================="
echo "This converts prices from Naira to Kobo format"
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < database/migrations/FIX_LGA_PRICING.sql
echo -e "${GREEN}✅ Pricing updated${NC}"
echo ""

echo -e "${BLUE}Step 4: Verify Updated Prices${NC}"
echo "========================================"
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  -e "SELECT id, name, code, sticker_price, (sticker_price / 100) as price_naira FROM lgas;"
echo ""

echo -e "${BLUE}Step 5: Create Missing Tables${NC}"
echo "========================================"
echo "Creating cart_pushers, activations, verifications tables..."
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < database/migrations/002_create_missing_tables.sql
echo -e "${GREEN}✅ Tables created${NC}"
echo ""

echo -e "${BLUE}Step 6: Verify Tables Exist${NC}"
echo "========================================"
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  -e "SHOW TABLES LIKE '%cart_pushers%';" \
  -e "SHOW TABLES LIKE '%activations%';" \
  -e "SHOW TABLES LIKE '%verifications%';"
echo ""

echo -e "${BLUE}Step 7: Restart Application${NC}"
echo "========================================"
touch /home/ggtlnplz/green-permit-api/app.js
echo -e "${GREEN}✅ Application restarted${NC}"
echo "Waiting 3 seconds for app to initialize..."
sleep 3
echo ""

echo -e "${BLUE}Step 8: Run API Tests${NC}"
echo "========================================"
./test-all-apis.sh

echo ""
echo -e "${GREEN}=========================================="
echo "DEPLOYMENT COMPLETE!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Test on mobile app"
echo "2. Try activating a sticker"
echo "3. Check dashboard for new activations"
echo ""
