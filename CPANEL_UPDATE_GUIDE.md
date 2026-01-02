# 🚀 cPanel Terminal Update Guide

## Complete Step-by-Step Instructions to Fix officer_code Error

---

## 📋 Prerequisites

1. Access to cPanel at `https://gtech.gifamz.com:2083`
2. GitHub repository pushed (✅ **DONE**)
3. SSH/Terminal access in cPanel
4. Database credentials from `.env` file

---

## 🔧 Step 1: Access cPanel Terminal

1. Log into cPanel: `https://gtech.gifamz.com:2083`
2. Scroll down to **"Advanced"** section
3. Click on **"Terminal"** icon
4. A new terminal window will open

---

## 🔄 Step 2: Pull Latest Code from GitHub

```bash
# Navigate to your project directory
cd ~/green-permit-api
# OR if it's in a different location:
# cd ~/public_html/api
# cd ~/repositories/green-permit-api

# Check current branch
git branch

# Pull latest changes from GitHub
git pull origin main

# Verify the new files are present
ls -la scripts/add-officer-code-column.js
ls -la fix-officer-code-production.sh
ls -la PRODUCTION_FIX_OFFICER_CODE.md
```

**Expected Output:**
```
From https://github.com/SHEYICROWN01/green_permit_api
 * branch            main       -> FETCH_HEAD
Updating 19a960a..926bc35
Fast-forward
 DASHBOARD_STICKER_CODE_FIX.md       | 123 ++++++++++++++++
 PRODUCTION_FIX_OFFICER_CODE.md      | 345 +++++++++++++++++++++++++++++++++++++++++
 REPORTS_ZERO_STICKERS_FIX.md        | 89 +++++++++++
 fix-officer-code-production.sh      | 156 ++++++++++++++++++
 scripts/add-officer-code-column.js  | 313 ++++++++++++++++++++++++++++++++++++
 5 files changed, 1026 insertions(+)
```

---

## 🗄️ Step 3: Fix the Database (Add officer_code Column)

### Option A: Using Node.js Script (Recommended)

```bash
# Make sure you're in the project directory
cd ~/green-permit-api

# Run the migration script
node scripts/add-officer-code-column.js
```

**Expected Output:**
```
🔧 Starting officer_code column migration...

📋 Step 1: Checking if officer_code column exists...
⚠️  officer_code column does NOT exist. Adding it now...

📋 Step 2: Adding officer_code column...
✅ Column added successfully!

📋 Step 3: Creating index on officer_code...
✅ Index created successfully!

📋 Step 4: Generating codes for existing officers...
✅ Updated 5 existing officers with officer codes!

📋 Step 5: Verifying the changes...

✨ Migration completed successfully!
```

---

### Option B: Using Bash Script (Alternative)

```bash
# Make the script executable (if not already)
chmod +x fix-officer-code-production.sh

# Run the script
./fix-officer-code-production.sh
```

When prompted, press `y` to continue.

---

### Option C: Using MySQL Directly in cPanel

If the scripts don't work, use cPanel's phpMyAdmin:

1. Go back to cPanel main page
2. Click on **"phpMyAdmin"** under Databases section
3. Select your database from the left sidebar
4. Click **"SQL"** tab at the top
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

-- Verify
SELECT id, name, username, officer_code, role 
FROM users 
WHERE role = 'officer' 
LIMIT 5;
```

6. Click **"Go"** button

---

## 🔄 Step 4: Restart the Application

### If using PM2:

```bash
# List running processes
pm2 list

# Restart your application
pm2 restart green-permit-api

# OR restart all
pm2 restart all

# Check logs to ensure it started properly
pm2 logs green-permit-api --lines 50
```

---

### If using Node.js directly or different process manager:

```bash
# Find the process
ps aux | grep node

# Kill the process (replace PID with actual process ID)
kill -9 PID

# Restart the application
cd ~/green-permit-api
npm start
# OR
node src/server.js &
```

---

### If using cPanel's Application Manager:

1. Go back to cPanel
2. Look for **"Setup Node.js App"** or **"Application Manager"**
3. Find your application
4. Click **"Restart"** button

---

## ✅ Step 5: Verify the Fix

### Test 1: Check Database Column

```bash
# Connect to MySQL from terminal
mysql -u your_db_user -p

# Enter your database password when prompted
# Then run:
USE your_database_name;

SHOW COLUMNS FROM users WHERE Field='officer_code';

SELECT id, name, officer_code FROM users WHERE role='officer' LIMIT 3;

EXIT;
```

**Expected Output:**
```
+---------------+-------------+------+-----+---------+-------+
| Field         | Type        | Null | Key | Default | Extra |
+---------------+-------------+------+-----+---------+-------+
| officer_code  | varchar(50) | YES  | UNI | NULL    |       |
+---------------+-------------+------+-----+---------+-------+
```

---

### Test 2: Test the API Endpoint

```bash
# Test the officers endpoint (replace YOUR_TOKEN with actual admin token)
curl -X GET "https://gtech.gifamz.com/api/v1/admin/officers?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected:** HTTP 200 response with officers list

---

### Test 3: Check from Frontend

1. Open your LGA dashboard: `http://localhost:8081/lga/officers`
2. The page should load without errors
3. Try creating a new officer
4. Should work without the `Unknown column 'o.officer_code'` error

---

## 🔍 Troubleshooting

### Error: "Column already exists"
✅ **Good news!** The column is already there. Just restart the app.

### Error: "Access denied"
```bash
# Check your database credentials in .env file
cat .env | grep DB_

# Make sure the credentials match your cPanel database settings
```

### Error: "Cannot find module"
```bash
# Reinstall dependencies
npm install

# Then try running the script again
node scripts/add-officer-code-column.js
```

### Error: "pm2 command not found"
```bash
# Install PM2 globally
npm install -g pm2

# Or check if your app is running differently
ps aux | grep node
```

### Application not restarting
```bash
# Find and kill all node processes
pkill node

# Navigate to project directory
cd ~/green-permit-api

# Start fresh
npm start
```

---

## 📊 Complete Verification Checklist

Run these commands to verify everything is working:

```bash
# 1. Check git pull was successful
git log -1 --oneline

# 2. Check migration script exists
ls -la scripts/add-officer-code-column.js

# 3. Check database column
mysql -u your_db_user -p your_database_name -e "SHOW COLUMNS FROM users WHERE Field='officer_code';"

# 4. Check officers have codes
mysql -u your_db_user -p your_database_name -e "SELECT id, name, officer_code FROM users WHERE role='officer' LIMIT 3;"

# 5. Check application is running
pm2 list
# OR
ps aux | grep node

# 6. Check application logs for errors
pm2 logs green-permit-api --lines 50
# OR
tail -f ~/green-permit-api/logs/error.log
```

---

## 🎯 Quick Command Summary

```bash
# Complete update in one go:
cd ~/green-permit-api && \
git pull origin main && \
node scripts/add-officer-code-column.js && \
pm2 restart green-permit-api && \
pm2 logs green-permit-api --lines 20
```

---

## 📝 Notes

- ✅ Code pushed to GitHub: Commit `926bc35`
- ✅ Migration script created: `scripts/add-officer-code-column.js`
- ✅ Bash script created: `fix-officer-code-production.sh`
- ✅ Documentation updated: `PRODUCTION_FIX_OFFICER_CODE.md`

---

## 🆘 Still Having Issues?

1. **Check PM2 logs:**
   ```bash
   pm2 logs green-permit-api --lines 100
   ```

2. **Check error logs:**
   ```bash
   tail -f ~/green-permit-api/logs/error.log
   ```

3. **Test database connection:**
   ```bash
   node -e "const db = require('./src/config/database'); db.query('SELECT 1').then(() => console.log('✅ DB Connected')).catch(e => console.error('❌ DB Error:', e.message));"
   ```

4. **Restart everything:**
   ```bash
   pm2 delete all
   pm2 start ecosystem.config.js
   ```

---

## ✨ Success!

Once all steps are complete:
- ✅ Database has `officer_code` column
- ✅ Application restarted successfully
- ✅ API endpoint returns officers without errors
- ✅ LGA dashboard can create officers

**The `Unknown column 'o.officer_code' in 'SELECT'` error is now fixed!** 🎉
