# 🚨 URGENT: Fix Missing Database Columns

## The Problem
The officer login endpoint is failing because 4 security columns are missing from the `users` table in the production database.

## Error Message
```
Unknown column 'u.failed_login_attempts' in 'SELECT'
```

## Solution (Choose ONE method)

### Method 1: Using MySQL Command Line (FASTEST) ⚡
```bash
# On production server, run:
cd /home/ggtlnplz/green-permit-api

# Connect to MySQL and run the migration
mysql -u ggtlnplz_gpuser -p'Gifamz@2025@' ggtlnplz_green_permit < database/migrations/URGENT_add_security_columns.sql

# Verify columns were added
mysql -u ggtlnplz_gpuser -p'Gifamz@2025@' ggtlnplz_green_permit -e "DESCRIBE users;" | grep -E 'failed_login_attempts|locked_until|last_login_at|pin_hash'
```

### Method 2: Using cPanel phpMyAdmin (EASIER) 🖱️

1. **Login to cPanel** at https://gtech.gifamz.com:2083
2. **Open phpMyAdmin**
3. **Select database**: `ggtlnplz_green_permit` (left sidebar)
4. **Click "SQL" tab** at the top
5. **Copy and paste** the contents of `database/migrations/URGENT_add_security_columns.sql`
6. **Click "Go"** button
7. **Verify**: Click on `users` table → Structure tab → Scroll down to see the 4 new columns

### Method 3: Using Node.js Script (ALTERNATIVE)
```bash
# On production server
cd /home/ggtlnplz/green-permit-api
node scripts/add-login-security-columns.js
```

## What Gets Added

These 4 columns will be added to the `users` table:

| Column Name | Type | Default | Description |
|-------------|------|---------|-------------|
| `failed_login_attempts` | INT | 0 | Tracks failed login attempts |
| `locked_until` | DATETIME | NULL | Account lock expiry time |
| `last_login_at` | TIMESTAMP | NULL | Last successful login |
| `pin_hash` | VARCHAR(255) | NULL | Legacy PIN hash (optional) |

## After Running the Migration

1. **Restart PM2**:
   ```bash
   pm2 restart green-permit-api
   ```

2. **Test Login**:
   ```bash
   curl -X POST http://127.0.0.1:3000/api/v1/officer/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"username":"bola","password":"Admin@123"}'
   ```
   
   Expected: `200 OK` with token (no more column errors)

3. **Test Dashboard**:
   ```bash
   # Get token first
   TOKEN=$(curl -s -X POST http://127.0.0.1:3000/api/v1/officer/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"username":"bola","password":"Admin@123"}' | \
     python -c "import sys, json; print(json.load(sys.stdin)['data']['token'])")
   
   # Test dashboard
   curl -X GET http://127.0.0.1:3000/api/v1/officer/dashboard/overview \
     -H "Authorization: Bearer $TOKEN"
   ```
   
   Expected: `200 OK` with dashboard data

## Why This Happened

The previous Node.js script (`scripts/add-login-security-columns.js`) ran successfully locally but somehow didn't add the columns to the production database. This SQL file is more direct and safer.

## Safe for Existing Systems? ✅

**YES!** These columns are:
- Added with DEFAULT values (won't break existing INSERT queries)
- NULL allowed (backward compatible)
- Only used by officer mobile app endpoints
- Won't affect super admin, LGA, or supervisor functionality

## Rollback (if needed)

If you need to remove these columns:
```sql
ALTER TABLE users 
  DROP COLUMN failed_login_attempts,
  DROP COLUMN locked_until,
  DROP COLUMN last_login_at,
  DROP COLUMN pin_hash;
```

---

**Status**: Once columns are added, officer login and dashboard will work immediately! 🚀
