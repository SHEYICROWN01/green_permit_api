# 🔍 DEBUG OFFICER LOGIN - Step by Step

## Current Status
✅ Application running (PM2 status: online, 86.0mb)  
✅ Database connected successfully  
❌ Login still returning 500 error  

---

## 🧪 Debug Steps - Run on Production Server

### Step 1: Check real-time logs for errors
```bash
# Watch logs in real-time, then try login again
pm2 logs green-permit-api
```
**Keep this running, open another terminal, and run the curl command again.**  
Look for error messages or stack traces.

---

### Step 2: Verify officer exists in database
```bash
mysql -u ggtlnplz_green_permit -p ggtlnplz_green_permit_db << 'EOF'
SELECT 
  id,
  name,
  username,
  officer_code,
  role,
  is_active,
  CASE 
    WHEN password IS NULL OR password = '' THEN '❌ NOT SET' 
    ELSE '✅ SET' 
  END as password_status,
  lga_id,
  created_at
FROM users 
WHERE username = 'bola' OR officer_code LIKE '%bola%';
EOF
```

**Expected:** Should return officer details with password_status = '✅ SET'

---

### Step 3: Check database connection settings
```bash
cd ~/green-permit-api
cat .env | grep -E "^(DB_|JWT_|PORT)" | head -20
```

**Verify these variables exist:**
- DB_HOST
- DB_PORT
- DB_USER
- DB_PASSWORD
- DB_NAME
- JWT_SECRET

---

### Step 4: Test database query manually
```bash
mysql -u ggtlnplz_green_permit -p ggtlnplz_green_permit_db << 'EOF'
-- Test the exact query the login endpoint uses
SELECT 
  u.id,
  u.name,
  u.username,
  u.officer_code as officerId,
  u.password,
  u.phone,
  u.role,
  u.is_active,
  u.failed_login_attempts,
  u.locked_until,
  u.lga_id,
  l.name as lgaAssigned,
  l.code as lgaCode
FROM users u
LEFT JOIN lgas l ON u.lga_id = l.id
WHERE u.username = 'bola'
  AND u.role = 'officer'
LIMIT 1;
EOF
```

**Expected:** Should return complete officer record with password hash

---

### Step 5: Check if error is logged to file
```bash
# Check error logs
tail -50 ~/.pm2/logs/green-permit-api-error.log

# Check output logs with timestamps
tail -100 ~/.pm2/logs/green-permit-api-out.log | grep -i "error\|fail\|exception"
```

---

### Step 6: Test with verbose logging
```bash
# Stop current instance
pm2 stop green-permit-api

# Start with environment variable for debugging
cd ~/green-permit-api
NODE_ENV=production DEBUG=* pm2 start src/server.js \
  --name green-permit-api \
  --max-memory-restart 400M

# Wait and test
sleep 3
pm2 logs green-permit-api --lines 20 --nostream

# Try login again
curl -X POST https://gtech.gifamz.com/api/v1/officer/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bola","password":"Admin@123"}'
```

---

### Step 7: Check if password needs to be reset
```bash
# If officer exists but password might be corrupted, reset it:
mysql -u ggtlnplz_green_permit -p ggtlnplz_green_permit_db << 'EOF'
-- First check current password status
SELECT id, username, LEFT(password, 20) as password_preview, LENGTH(password) as pwd_length 
FROM users 
WHERE username = 'bola';

-- If password looks wrong, we can generate a new hash
-- Bcrypt hash for 'Admin@123' (run the generateHash.js script)
EOF
```

---

### Step 8: Generate proper password hash
```bash
cd ~/green-permit-api

# Use the generateHash script to create proper bcrypt hash
node scripts/generateHash.js Admin@123
```

**This will output a bcrypt hash. Then update the database:**
```bash
mysql -u ggtlnplz_green_permit -p ggtlnplz_green_permit_db << 'EOF'
UPDATE users 
SET password = '$2b$10$HASH_FROM_ABOVE' 
WHERE username = 'bola';

SELECT username, '✅ Password Updated' as status FROM users WHERE username = 'bola';
EOF
```

---

### Step 9: Test health endpoint first
```bash
# Make sure API is responding at all
curl https://gtech.gifamz.com/health

# Expected: {"status":"ok","timestamp":"..."}
```

---

### Step 10: Try alternative login method (officerId + pin)
```bash
# If officer has a PIN set, try that method
curl -X POST https://gtech.gifamz.com/api/v1/officer/auth/login \
  -H "Content-Type: application/json" \
  -d '{"officerId":"OFF-IFO-2025-0001","pin":"1234"}'
```

---

## 🔍 Common Issues and Fixes

### Issue 1: "password_compare is not a function"
**Cause:** bcrypt not installed or wrong import  
**Fix:**
```bash
cd ~/green-permit-api
npm install bcrypt
pm2 restart green-permit-api
```

### Issue 2: Database connection error
**Symptoms:** "Cannot read property 'query' of undefined"  
**Check:**
```bash
node -e "const db = require('./src/config/database'); console.log('DB:', typeof db, typeof db.query);"
```

### Issue 3: JWT_SECRET not set
**Symptoms:** "secret or private key must have a value"  
**Fix:**
```bash
cd ~/green-permit-api
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
pm2 restart green-permit-api
```

### Issue 4: Officer record not found
**Create a test officer:**
```bash
cd ~/green-permit-api
node scripts/create-test-officer.js
```

---

## 📋 Quick Diagnostic Command

Run this all-in-one diagnostic:

```bash
cd ~/green-permit-api

echo "=== 1. PM2 Status ==="
pm2 list

echo ""
echo "=== 2. Recent Logs ==="
pm2 logs green-permit-api --lines 10 --nostream

echo ""
echo "=== 3. Environment Check ==="
cat .env | grep -E "^(DB_|JWT_|PORT)" | wc -l
echo "Environment variables found (should be 6+)"

echo ""
echo "=== 4. Database Connection Test ==="
mysql -u ggtlnplz_green_permit -p ggtlnplz_green_permit_db -e "SELECT 'DB Connected' as status;"

echo ""
echo "=== 5. Officer Check ==="
mysql -u ggtlnplz_green_permit -p ggtlnplz_green_permit_db -e \
  "SELECT COUNT(*) as officer_count FROM users WHERE role='officer';"

echo ""
echo "=== 6. Health Endpoint ==="
curl -s https://gtech.gifamz.com/health | jq '.' 2>/dev/null || curl -s https://gtech.gifamz.com/health

echo ""
echo "=== Diagnostic Complete ==="
```

---

## 🎯 Next Action

**Run Step 1 first** - Check real-time logs while testing login to see the actual error message.

The error "SERVER_ERROR" is generic. We need to see the actual error in the logs to diagnose properly.

---

## 📝 Report Format

After running diagnostics, report:
1. What error appears in PM2 logs?
2. Does officer 'bola' exist in database?
3. Is password properly hashed (starts with $2b$ or $2a$)?
4. Are all environment variables set?
5. Does health endpoint respond?

**Start with Step 1 - watch the logs!** 🔍
