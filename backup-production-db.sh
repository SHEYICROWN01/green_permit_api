#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# Database Backup Script for Production
# ═══════════════════════════════════════════════════════════════
# Run daily via cron job
# Add to crontab: 0 2 * * * /home/ggtlnplz/green-permit-api/backup-production-db.sh
# ═══════════════════════════════════════════════════════════════

# Load environment variables
cd ~/green-permit-api
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
BACKUP_DIR="$HOME/database-backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="green_permit_backup_${DATE}.sql"
RETENTION_DAYS=7

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform backup
echo "Starting database backup..."
mysqldump -h "${DB_HOST:-localhost}" \
          -P "${DB_PORT:-3306}" \
          -u "$DB_USER" \
          -p"$DB_PASSWORD" \
          "$DB_NAME" > "${BACKUP_DIR}/${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo "✓ Backup created: ${BACKUP_FILE}"
    
    # Compress backup
    gzip "${BACKUP_DIR}/${BACKUP_FILE}"
    echo "✓ Backup compressed: ${BACKUP_FILE}.gz"
    
    # Remove old backups
    find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
    echo "✓ Old backups removed (older than ${RETENTION_DAYS} days)"
    
    # Show backup size
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}.gz" | cut -f1)
    echo "✓ Backup size: ${BACKUP_SIZE}"
    
    # List recent backups
    echo ""
    echo "Recent backups:"
    ls -lh $BACKUP_DIR | tail -5
else
    echo "✗ Backup failed!"
    exit 1
fi
