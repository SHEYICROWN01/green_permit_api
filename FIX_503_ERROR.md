# 🚨 TROUBLESHOOTING: 503 Service Unavailable

**Error:** Error 503. Service Unavailable  
**Cause:** Application failed to start or crashed after deployment  
**Status:** URGENT - Needs immediate fix

---

## 🔍 DIAGNOSIS STEPS

Run these commands on the server to diagnose the issue:

### 1. Check Application Logs

```bash
# Check the most recent errors
tail -50 ~/green-permit-api/server.log

# OR check Passenger logs
tail -50 ~/green-permit-api/logs/error.log
```

**Look for:**
- Syntax errors
- Database connection errors
- Missing dependencies
- Module not found errors

---

### 2. Check if App File Exists

```bash
ls -la ~/green-permit-api/app.js
```

**Should show:** A file modified timestamp

---

### 3. Check Node Modules

```bash
ls ~/green-permit-api/node_modules | wc -l
```

**Should show:** A large number (100+)

If 0 or very small, run:
```bash
cd ~/green-permit-api && npm install
```

---

### 4. Test the Code Manually

```bash
cd ~/green-permit-api
node -c src/models/Sticker.js
node -c src/controllers/public/verification.controller.js
```

**Should show:** Nothing (no errors)  
**If errors:** Syntax error in the code

---

## 🔧 COMMON FIXES

### Fix 1: Syntax Error in Code

If there's a syntax error in the modified files, we need to check:

```bash
# Check Sticker.js for syntax errors
cd ~/green-permit-api
node -e "require('./src/models/Sticker.js')"
```

---

### Fix 2: Database Connection Issue

Check if database credentials are correct:

```bash
cat ~/green-permit-api/.env | grep DB_
```

**Should show:**
```
DB_HOST=localhost
DB_USER=ggtlnplz_gpuser
DB_PASSWORD=Gifamz@2025@
DB_NAME=ggtlnplz_green_permit
```

---

### Fix 3: Missing Dependencies

```bash
cd ~/green-permit-api && npm install
touch app.js
```

---

### Fix 4: Restart Passenger

```bash
# Method 1: Touch restart.txt
mkdir -p ~/green-permit-api/tmp
touch ~/green-permit-api/tmp/restart.txt

# Method 2: Touch app.js again
touch ~/green-permit-api/app.js

# Wait 5 seconds
sleep 5

# Test again
curl https://gtech.gifamz.com/health
```

---

## 🔄 EMERGENCY ROLLBACK

If the above doesn't work, rollback to the previous version:

```bash
cd ~/green-permit-api

# Rollback to before public API changes
git reset --hard 1e79bd1

# Restart
touch app.js

# Wait and test
sleep 5
curl https://gtech.gifamz.com/health
```

**Note:** This will remove the public API and QR code changes.

---

## 🐛 LIKELY ISSUES

Based on the changes we made, here are the most likely issues:

### Issue 1: Syntax Error in Sticker.js

The most likely culprit. Check if the `verify()` method has any syntax errors:

```bash
cd ~/green-permit-api
node -e "
const Sticker = require('./src/models/Sticker');
console.log('Sticker model loaded successfully');
console.log('verify method exists:', typeof Sticker.verify);
"
```

---

### Issue 2: Database Connection

The JOIN queries might be failing if the database isn't connected:

```bash
# Test database connection
mysql -u ggtlnplz_gpuser -p'Gifamz@2025@' ggtlnplz_green_permit -e "SELECT 1;"
```

---

### Issue 3: Missing Module

Check if all required modules are installed:

```bash
cd ~/green-permit-api
node -e "
console.log('express:', require('express').version);
console.log('mysql2:', require('mysql2').version);
console.log('dotenv:', require('dotenv').version);
"
```

---

## 📋 STEP-BY-STEP FIX

### Step 1: Get the Error Message

```bash
tail -100 ~/green-permit-api/server.log
```

**Copy the error message and we'll fix it.**

---

### Step 2: If Syntax Error

Look for lines like:
```
SyntaxError: Unexpected token
```

Find the file and line number, then we can fix it.

---

### Step 3: If Database Error

Look for lines like:
```
Error: connect ECONNREFUSED
```

Fix the database configuration in `.env`

---

### Step 4: If Module Error

Look for lines like:
```
Error: Cannot find module
```

Run:
```bash
cd ~/green-permit-api && npm install && touch app.js
```

---

## 🚨 IMMEDIATE ACTION

**Run this command RIGHT NOW:**

```bash
tail -50 ~/green-permit-api/server.log
```

**Then share the output with me so I can help you fix the specific error.**

---

## 💡 QUICK TEST

After any fix, test with:

```bash
# Test health endpoint
curl https://gtech.gifamz.com/health

# If that works, test the API
curl -X POST https://gtech.gifamz.com/api/v1/public/verify-sticker \
  -H "Content-Type: application/json" \
  -d '{"code": "ONSEY-176757997717816002"}'
```

---

## 📞 NEED HELP?

If you're seeing this error, please run the diagnosis commands above and share:
1. Last 50 lines of `server.log`
2. Output of `node -c src/models/Sticker.js`
3. Output of `ls ~/green-permit-api/node_modules | wc -l`

Then I can provide the exact fix!
