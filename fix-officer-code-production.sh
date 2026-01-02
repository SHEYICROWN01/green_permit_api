#!/bin/bash
# Quick fix script for adding officer_code column to production database
# Usage: ./fix-officer-code-production.sh

set -e

echo "🔧 Production Database Fix: Adding officer_code Column"
echo "======================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Load database credentials from .env
export $(grep -v '^#' .env | xargs)

echo "📋 Database Configuration:"
echo "   Host: $DB_HOST"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Confirm before proceeding
read -p "⚠️  This will modify the production database. Continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "🔍 Checking if officer_code column exists..."

# Check if column exists
COLUMN_EXISTS=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -sN -e \
    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = '$DB_NAME' 
     AND TABLE_NAME = 'users' 
     AND COLUMN_NAME = 'officer_code';")

if [ "$COLUMN_EXISTS" -gt 0 ]; then
    echo -e "${GREEN}✅ officer_code column already exists!${NC}"
    echo ""
    echo "📊 Sample officers:"
    mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -t -e \
        "SELECT id, name, username, officer_code, role FROM users WHERE role='officer' LIMIT 3;"
    echo ""
    echo -e "${GREEN}✨ No changes needed. You may need to restart your application.${NC}"
    echo ""
    echo "Restart command: pm2 restart green-permit-api"
    exit 0
fi

echo -e "${YELLOW}⚠️  Column does not exist. Adding it now...${NC}"
echo ""

# Create backup
echo "💾 Creating backup..."
BACKUP_FILE="backup_users_$(date +%Y%m%d_%H%M%S).sql"
mysqldump -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" users > "$BACKUP_FILE"
echo -e "${GREEN}✅ Backup saved to: $BACKUP_FILE${NC}"
echo ""

# Add column
echo "📝 Adding officer_code column..."
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" <<SQL
ALTER TABLE users 
ADD COLUMN officer_code VARCHAR(50) NULL UNIQUE 
COMMENT 'Unique officer code (e.g., OFF-IFO-2025-0001)' 
AFTER username;
SQL
echo -e "${GREEN}✅ Column added successfully!${NC}"
echo ""

# Create index
echo "🔍 Creating index..."
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" <<SQL
CREATE INDEX idx_officer_code ON users(officer_code);
SQL
echo -e "${GREEN}✅ Index created successfully!${NC}"
echo ""

# Generate codes for existing officers
echo "🔢 Generating codes for existing officers..."
UPDATED=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -sN -e \
    "UPDATE users u
     INNER JOIN lgas l ON u.lga_id = l.id
     SET u.officer_code = CONCAT('OFF-', l.code, '-', YEAR(COALESCE(u.created_at, NOW())), '-', LPAD(u.id, 4, '0'))
     WHERE u.role = 'officer' 
     AND u.officer_code IS NULL;
     SELECT ROW_COUNT();")

echo -e "${GREEN}✅ Updated $UPDATED officers with codes!${NC}"
echo ""

# Show sample officers
echo "📊 Sample officers with codes:"
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -t -e \
    "SELECT id, name, username, officer_code, role FROM users WHERE role='officer' LIMIT 5;"

echo ""
echo -e "${GREEN}✨ Migration completed successfully!${NC}"
echo ""
echo "🎯 Next steps:"
echo "   1. Restart your application:"
echo "      pm2 restart green-permit-api"
echo "      # OR"
echo "      sudo systemctl restart green-permit-api"
echo ""
echo "   2. Test the API endpoint:"
echo "      curl https://gtech.gifamz.com/api/v1/admin/officers"
echo ""
echo "   3. Test creating an officer from LGA dashboard"
echo ""
echo "📦 Backup file: $BACKUP_FILE"
echo ""
