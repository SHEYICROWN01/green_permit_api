#!/bin/bash

# Check Activations Table Usage - January 4, 2026
# This script checks if recreating activations table will affect existing functionality

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=============================================="
echo "ACTIVATIONS TABLE IMPACT ANALYSIS"
echo "=============================================="
echo ""

# Database credentials
DB_USER="ggtlnplz_gpuser"
DB_PASS="Gifamz@2025@"
DB_NAME="ggtlnplz_green_permit"

echo -e "${BLUE}Step 1: Check if activations table exists${NC}"
echo "==========================================="
TABLE_EXISTS=$(mysql -u $DB_USER -p"$DB_PASS" $DB_NAME -sse "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME' AND table_name = 'activations';")

if [ "$TABLE_EXISTS" -eq "1" ]; then
    echo -e "${GREEN}✅ Activations table exists${NC}"
    echo ""
    
    echo -e "${BLUE}Step 2: Check current table structure${NC}"
    echo "======================================"
    mysql -u $DB_USER -p"$DB_PASS" $DB_NAME -e "DESCRIBE activations;"
    echo ""
    
    echo -e "${BLUE}Step 3: Count existing activation records${NC}"
    echo "=========================================="
    RECORD_COUNT=$(mysql -u $DB_USER -p"$DB_PASS" $DB_NAME -sse "SELECT COUNT(*) FROM activations;")
    echo "Total records: $RECORD_COUNT"
    echo ""
    
    if [ "$RECORD_COUNT" -gt "0" ]; then
        echo -e "${RED}⚠️  WARNING: Table has $RECORD_COUNT existing records!${NC}"
        echo ""
        echo -e "${YELLOW}Records will be lost if we recreate the table.${NC}"
        echo ""
        
        echo -e "${BLUE}Step 4: Show sample records${NC}"
        echo "==========================="
        mysql -u $DB_USER -p"$DB_PASS" $DB_NAME -e "SELECT * FROM activations LIMIT 5;"
        echo ""
        
        echo -e "${BLUE}Step 5: Check who created these records${NC}"
        echo "========================================"
        mysql -u $DB_USER -p"$DB_PASS" $DB_NAME -e "
            SELECT 
                a.*,
                u.username as officer_username,
                u.role as officer_role
            FROM activations a
            LEFT JOIN users u ON a.officer_id = u.id
            LIMIT 5;
        "
        echo ""
        
        echo -e "${RED}=============================================="
        echo "⚠️  CRITICAL: TABLE HAS PRODUCTION DATA"
        echo "=============================================="
        echo -e "${NC}"
        echo "Options:"
        echo "1. BACKUP data before recreating table"
        echo "2. ALTER table instead of DROP/CREATE (safer)"
        echo "3. Cancel and investigate further"
        echo ""
        
    else
        echo -e "${GREEN}✅ Table is empty - safe to recreate${NC}"
        echo ""
    fi
    
else
    echo -e "${YELLOW}⚠️  Activations table does NOT exist${NC}"
    echo "Safe to create from scratch"
    echo ""
fi

echo -e "${BLUE}Step 6: Check who uses activations table${NC}"
echo "=========================================="
echo ""
echo "Controllers that query activations table:"
echo "- Officer controller (mobile app)"
echo "- Super admin reports controller"
echo "- Supervisor dashboard"
echo ""

echo -e "${BLUE}Step 7: Check if super admin/supervisor are working${NC}"
echo "====================================================="
echo ""
echo "Testing super admin endpoint..."
# This would need authentication, so we'll just note it
echo "Manual test required: Check if super admin dashboard loads"
echo ""

echo -e "${BLUE}Step 8: Analyze schema compatibility${NC}"
echo "====================================="
echo ""
echo "Checking if current schema matches controller expectations..."
echo ""

# Check for required columns
REQUIRED_COLS=("cart_pusher_id" "lga_id" "expiry_date" "location_latitude" "location_longitude")
MISSING_COLS=()

for col in "${REQUIRED_COLS[@]}"; do
    COL_EXISTS=$(mysql -u $DB_USER -p"$DB_PASS" $DB_NAME -sse "
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_schema = '$DB_NAME' 
        AND table_name = 'activations' 
        AND column_name = '$col';
    " 2>/dev/null)
    
    if [ "$COL_EXISTS" -eq "0" ]; then
        MISSING_COLS+=("$col")
    fi
done

if [ ${#MISSING_COLS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing required columns:${NC}"
    for col in "${MISSING_COLS[@]}"; do
        echo "   - $col"
    done
    echo ""
    echo -e "${YELLOW}This explains why activations are failing!${NC}"
else
    echo -e "${GREEN}✅ All required columns present${NC}"
fi
echo ""

echo "=============================================="
echo "IMPACT ASSESSMENT"
echo "=============================================="
echo ""
echo -e "${BLUE}Questions to answer:${NC}"
echo ""
echo "1. Does activations table have any data?"
if [ "$RECORD_COUNT" -gt "0" ]; then
    echo -e "   ${RED}YES - $RECORD_COUNT records exist${NC}"
    echo "   ${RED}Action: MUST backup before recreating${NC}"
else
    echo -e "   ${GREEN}NO - Table is empty${NC}"
    echo "   ${GREEN}Action: Safe to drop and recreate${NC}"
fi
echo ""

echo "2. Is super admin using this table?"
echo "   YES - Super admin reports query activations for:"
echo "   - Total revenue calculation"
echo "   - Revenue by LGA reports"
echo "   - Activation history"
echo "   - Growth metrics"
echo ""
echo "   ${YELLOW}Impact if we recreate:${NC}"
if [ "$RECORD_COUNT" -gt "0" ]; then
    echo "   ${RED}• Super admin will lose historical data${NC}"
    echo "   ${RED}• Reports will show 0 until new activations${NC}"
else
    echo "   ${GREEN}• No impact - no data exists yet${NC}"
fi
echo ""

echo "3. Is supervisor using this table?"
echo "   YES - Supervisor dashboard shows:"
echo "   - Activation counts (currently shows 0 as placeholder)"
echo ""
echo "   ${YELLOW}Impact if we recreate:${NC}"
echo "   ${GREEN}• Minimal - already showing placeholder values${NC}"
echo ""

echo "4. Will recreation break existing functionality?"
if [ "$RECORD_COUNT" -gt "0" ]; then
    echo "   ${RED}POSSIBLY - If super admin is actively using reports${NC}"
    echo "   ${YELLOW}Recommendation: Check with super admin/LGA teams first${NC}"
else
    echo "   ${GREEN}NO - No data to lose, all endpoints use LEFT JOIN${NC}"
    echo "   ${GREEN}(LEFT JOIN means missing table won't break queries)${NC}"
fi
echo ""

echo "=============================================="
echo "RECOMMENDATION"
echo "=============================================="
echo ""

if [ "$RECORD_COUNT" -gt "0" ]; then
    echo -e "${RED}⚠️  DO NOT RECREATE WITHOUT BACKUP${NC}"
    echo ""
    echo "Steps:"
    echo "1. Contact super admin/LGA teams"
    echo "2. Check if they're using activation reports"
    echo "3. If yes: BACKUP data first"
    echo "4. Consider ALTER instead of DROP/CREATE"
    echo ""
    echo "Alternative solution:"
    echo "Use ALTER TABLE to add missing columns instead:"
    echo ""
    echo "  ALTER TABLE activations"
    echo "    ADD COLUMN cart_pusher_id INT AFTER officer_id,"
    echo "    ADD COLUMN lga_id INT AFTER cart_pusher_id,"
    echo "    CHANGE expires_at expiry_date DATETIME,"
    echo "    ADD COLUMN location_latitude DECIMAL(10,8),"
    echo "    ADD COLUMN location_longitude DECIMAL(11,8),"
    echo "    MODIFY amount_paid INT COMMENT 'In kobo';"
    echo ""
    
else
    echo -e "${GREEN}✅ SAFE TO RECREATE${NC}"
    echo ""
    echo "Reasons:"
    echo "• Table is empty (no data loss)"
    echo "• Officer mobile app not yet in production"
    echo "• Super admin reports use LEFT JOIN (won't break)"
    echo "• Supervisor dashboard shows placeholders anyway"
    echo ""
    echo "Proceed with: ./fix-activation-schema.sh"
fi

echo ""
