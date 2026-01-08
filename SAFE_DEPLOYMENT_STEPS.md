# 🔧 SAFE DEPLOYMENT - Public API Fix

**Issue:** Previous deployment caused 503 error  
**Solution:** Deploy in smaller, testable steps  
**Status:** Ready for safe deployment

---

## 🎯 WHAT WENT WRONG

The 503 error suggests either:
1. Syntax error in the code
2. Manual edits on the server conflicted with our changes
3. Missing dependencies or database connection issue

---

## ✅ SAFE DEPLOYMENT STRATEGY

We'll deploy the public API in steps, testing after each one:

### Step 1: Verify Current State

```bash
# Make sure the app is running after rollback
curl https://gtech.gifamz.com/health

# Expected: {"status":"ok",...}
```

If this works, proceed to Step 2.

---

### Step 2: Pull Only QR Code Changes (Currently Deployed)

```bash
# You're already on this commit after rollback
git log --oneline -1

# Should show: 1e79bd1 feat: update QR codes to include full verification URL
```

This includes only the QR code URL format change, which should work fine.

---

### Step 3: Test the Current Code Syntax

Before pulling the new changes, test if the code has syntax errors:

```bash
cd ~/green-permit-api

# Test if Node can parse the files
node -c src/models/Sticker.js
node -c src/controllers/public/verification.controller.js

# Should show nothing (no errors)
```

---

### Step 4: Check for Manual Edits

```bash
cd ~/green-permit-api

# Check if there are any uncommitted changes
git status

# Should show: nothing to commit, working tree clean
```

If there are uncommitted changes, we need to stash or commit them first.

---

### Step 5: Create a Test Branch

Instead of deploying directly to main, let's test first:

```bash
cd ~/green-permit-api

# Create and switch to test branch
git fetch origin
git checkout -b test-public-api origin/main

# This will pull all the new changes
```

---

### Step 6: Test the Application Locally

```bash
cd ~/green-permit-api

# Check for syntax errors in the new code
node -c src/models/Sticker.js
node -c src/controllers/public/verification.controller.js
node -c src/routes/public.routes.js

# If any errors show up, we'll fix them before deploying
```

---

### Step 7: Restart and Monitor

```bash
# Restart the app
touch ~/green-permit-api/app.js

# Wait for restart
sleep 10

# Check if it's running
curl https://gtech.gifamz.com/health

# If 503 error, check logs immediately
ls -la ~/green-permit-api/logs/
# OR
find ~/green-permit-api -name "*.log" -type f
```

---

### Step 8: Find the Error Log

Passenger/Node.js logs might be in different locations:

```bash
# Try these locations:
tail -50 ~/green-permit-api/logs/error.log
tail -50 ~/green-permit-api/logs/passenger.log
tail -50 ~/passenger.*.log
tail -50 ~/logs/passenger.log

# OR search for recent log files
find ~ -name "*log" -type f -mmin -10 -exec ls -lh {} \;
```

---

## 🐛 ALTERNATIVE: Manual Verification

If we can't find logs, let's verify the code manually:

### Test 1: Check Database Connection

```bash
cd ~/green-permit-api

# Test if the database module loads
node -e "
const { pool } = require('./src/config/database');
console.log('Database module loaded');
pool.query('SELECT 1').then(() => {
    console.log('Database connection successful');
    process.exit(0);
}).catch(err => {
    console.error('Database error:', err.message);
    process.exit(1);
});
"
```

---

### Test 2: Check Sticker Model

```bash
cd ~/green-permit-api

# Test if Sticker model loads without errors
node -e "
const Sticker = require('./src/models/Sticker');
console.log('Sticker model loaded');
console.log('Methods:', Object.getOwnPropertyNames(Sticker).filter(m => typeof Sticker[m] === 'function'));
"
```

---

### Test 3: Check Routes

```bash
cd ~/green-permit-api

# Test if routes load
node -e "
const publicRoutes = require('./src/routes/public.routes');
console.log('Public routes loaded successfully');
"
```

---

## 🔄 CLEAN DEPLOYMENT (If Manual Tests Pass)

If all manual tests pass, deploy cleanly:

```bash
cd ~/green-permit-api

# Ensure clean working directory
git reset --hard HEAD
git clean -fd

# Pull the latest changes
git fetch origin
git reset --hard origin/main

# Restart
touch app.js

# Wait and test
sleep 10
curl https://gtech.gifamz.com/health
```

---

## 🚨 IF STILL FAILS

If it still fails after clean deployment, the issue might be:

### Option 1: Missing Node Modules

```bash
cd ~/green-permit-api
rm -rf node_modules
npm install
touch app.js
```

---

### Option 2: Node Version Incompatibility

```bash
# Check Node version
node --version

# Should be 14.x or higher
# If lower, we might need to adjust the code
```

---

### Option 3: Permissions Issue

```bash
# Check file permissions
ls -la ~/green-permit-api/src/models/Sticker.js
ls -la ~/green-permit-api/src/controllers/public/

# Should be readable by your user
```

---

## 📋 STEP-BY-STEP INSTRUCTIONS

Run these commands **in order** and share the output after each one:

```bash
# 1. Check current status
curl https://gtech.gifamz.com/health

# 2. Check git status
cd ~/green-permit-api && git status

# 3. Try to find error logs
find ~/green-permit-api -name "*log" -type f -mmin -30

# 4. Test syntax
cd ~/green-permit-api && node -c src/models/Sticker.js

# 5. If all pass, deploy cleanly
git reset --hard origin/main && touch app.js && sleep 10 && curl https://gtech.gifamz.com/health
```

---

## 💡 NEXT STEPS

Once you share the output of the commands above, I'll know exactly what's wrong and how to fix it!

The key is finding the actual error message - it will tell us exactly what needs to be fixed.
