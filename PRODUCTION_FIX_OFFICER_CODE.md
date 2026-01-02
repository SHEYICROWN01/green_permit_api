# 🔧 PRODUCTION FIX: Add officer_code Column

## Issue
**Error:** `Unknown column 'o.officer_code' in 'SELECT'`  
**Location:** GET `/api/v1/admin/officers` endpoint  
**Cause:** Production database is missing the `officer_code` column in the `users` table

---

## ✅ Quick Fix for Production

### Option 1: Using SSH + MySQL CLI (Recommended)

```bash
# 1. SSH into your production server
ssh your-username@gtech.gifamz.com

# 2. Connect to MySQL
mysql -u your_db_user -p your_database_name

# 3. Run these SQL commands:
```

```sql
-- Check if column exists
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'users'
AND COLUMN_NAME = 'officer_code';

-- If the above returns 0 rows, add the column:
ALTER TABLE users 
ADD COLUMN officer_code VARCHAR(50) NULL UNIQUE 
COMMENT 'Unique officer code (e.g., OFF-IFO-2025-0001)' 
AFTER username;

-- Create index for performance
CREATE INDEX idx_officer_code ON users(officer_code);

-- Generate codes for existing officers
UPDATE users u
INNER JOIN lgas l ON u.lga_id = l.id
SET u.officer_code = CONCAT('OFF-', l.code, '-', YEAR(COALESCE(u.created_at, NOW())), '-', LPAD(u.id, 4, '0'))
WHERE u.role = 'officer' 
AND u.officer_code IS NULL;

-- Verify the fix
SELECT id, name, username, officer_code, role 
FROM users 
WHERE role = 'officer' 
LIMIT 5;

-- Exit MySQL
EXIT;
```

```bash
# 4. Restart your Node.js application
pm2 restart green-permit-api
# OR
sudo systemctl restart green-permit-api
```

---

### Option 2: Using Node.js Script on Server

```bash
# 1. SSH into production server
ssh your-username@gtech.gifamz.com

# 2. Navigate to your project directory
cd /path/to/green-permit-api

# 3. Run the migration script
node scripts/add-officer-code-column.js

# 4. Restart the application
pm2 restart green-permit-api
```

---

### Option 3: Using cPanel MySQL (If applicable)

1. Log into cPanel at `https://gtech.gifamz.com:2083`
2. Open **phpMyAdmin**
3. Select your database
4. Click on **SQL** tab
5. Copy and paste this SQL:

```sql
-- Add officer_code column
ALTER TABLE users 
ADD COLUMN officer_code VARCHAR(50) NULL UNIQUE 
COMMENT 'Unique officer code (e.g., OFF-IFO-2025-0001)' 
AFTER username;

-- Create index
CREATE INDEX idx_officer_code ON users(officer_code);

-- Generate codes for existing officers
UPDATE users u
INNER JOIN lgas l ON u.lga_id = l.id
SET u.officer_code = CONCAT('OFF-', l.code, '-', YEAR(COALESCE(u.created_at, NOW())), '-', LPAD(u.id, 4, '0'))
WHERE u.role = 'officer' 
AND u.officer_code IS NULL;
```

6. Click **Go**
7. Restart your application via cPanel or PM2

---

## 🧪 Testing After Fix

### Test 1: Check Column Exists
```bash
mysql -u your_db_user -p -e "SHOW COLUMNS FROM users WHERE Field='officer_code';" your_database_name
```

**Expected Output:**
```
+---------------+-------------+------+-----+---------+-------+
| Field         | Type        | Null | Key | Default | Extra |
+---------------+-------------+------+-----+---------+-------+
| officer_code  | varchar(50) | YES  | UNI | NULL    |       |
+---------------+-------------+------+-----+---------+-------+
```

### Test 2: Check Officers Have Codes
```bash
mysql -u your_db_user -p -e "SELECT id, name, officer_code FROM users WHERE role='officer' LIMIT 3;" your_database_name
```

**Expected Output:**
```
+----+------------------+----------------------+
| id | name             | officer_code         |
+----+------------------+----------------------+
|  4 | John Doe         | OFF-IFO-2025-0004    |
|  7 | Jane Smith       | OFF-LAKOS-2025-0007  |
+----+------------------+----------------------+
```

### Test 3: Test the API Endpoint
```bash
# Replace with your actual admin token
curl -X GET "https://gtech.gifamz.com/api/v1/admin/officers?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected:** HTTP 200 with officers list including `officer_code` field

---

## 🔄 Alternative: Download & Upload SQL File

If you can't access MySQL directly:

### Step 1: Download your current database
```bash
# On production server
mysqldump -u your_db_user -p your_database_name > backup_before_fix.sql
```

### Step 2: Add the column locally
```bash
# On local machine
mysql -u root -p your_local_db < backup_before_fix.sql

# Run the fix
mysql -u root -p your_local_db < database/migrations/add_officer_code_fix.sql

# Export fixed database
mysqldump -u root -p your_local_db > fixed_database.sql
```

### Step 3: Upload to production
```bash
# Upload fixed database
mysql -u your_db_user -p your_database_name < fixed_database.sql
```

⚠️ **WARNING:** This will overwrite your production database. Make a backup first!

---

## 📋 Verification Checklist

- [ ] SSH into production server successful
- [ ] MySQL connection established
- [ ] `officer_code` column added to `users` table
- [ ] Index `idx_officer_code` created
- [ ] Existing officers have generated codes
- [ ] Application restarted (PM2/systemctl)
- [ ] API endpoint `/api/v1/admin/officers` returns 200
- [ ] LGA dashboard can fetch officers list
- [ ] Can create new officers from LGA dashboard

---

## 🚨 If You Still Get Errors

### Error: "Column already exists"
✅ **Good!** The column is already there. Just restart your app.

### Error: "Access denied"
❌ You need MySQL admin privileges. Contact your hosting provider.

### Error: "Table 'users' doesn't exist"
❌ Wrong database selected. Check your database name.

### Error: "Duplicate entry"
🔧 Run this to clear duplicate codes:
```sql
UPDATE users SET officer_code = NULL WHERE role = 'officer';
-- Then re-run the UPDATE statement to regenerate codes
```

---

## 📞 Need Help?

1. **Check your database config:**
   ```bash
   cat /path/to/green-permit-api/.env | grep DB_
   ```

2. **Check PM2 logs:**
   ```bash
   pm2 logs green-permit-api --lines 50
   ```

3. **Check MySQL error log:**
   ```bash
   sudo tail -f /var/log/mysql/error.log
   ```

---

## ✨ Summary

The `officer_code` column was added to your local database via migrations, but **production database** is still missing it. You need to:

1. ✅ SSH into production
2. ✅ Run the ALTER TABLE command
3. ✅ Restart the application
4. ✅ Test the endpoint

**That's it!** The error will be gone. 🎉
