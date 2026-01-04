#!/bin/bash

# Check stickers table structure
DB_USER="ggtlnplz_gpuser"
DB_PASS="Gifamz@2025@"
DB_NAME="ggtlnplz_green_permit"

echo "=============================================="
echo "STICKERS TABLE STRUCTURE CHECK"
echo "=============================================="
echo ""

echo "Checking stickers table columns..."
mysql -u $DB_USER -p"$DB_PASS" $DB_NAME -e "DESCRIBE stickers;"

echo ""
echo "Columns the controller tries to UPDATE:"
echo "  - status"
echo "  - activated_by"
echo "  - activated_at"
echo "  - assigned_to_name"
echo "  - assigned_to_phone"
echo "  - expires_at"
echo ""

echo "Checking if these columns exist..."
mysql -u $DB_USER -p"$DB_PASS" $DB_NAME -e "
    SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = '$DB_NAME'
    AND TABLE_NAME = 'stickers'
    AND COLUMN_NAME IN ('status', 'activated_by', 'activated_at', 'assigned_to_name', 'assigned_to_phone', 'expires_at');
"
