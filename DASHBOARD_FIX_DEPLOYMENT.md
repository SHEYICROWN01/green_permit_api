# 🔧 DASHBOARD ENDPOINT FIX - DEPLOYMENT GUIDE

**Date:** January 3, 2026  
**Issue:** Dashboard endpoint returning 500 error  
**Status:** ✅ FIXED - Ready to Deploy

---

## 🐛 Issue Summary

**Problem:**
```
GET /api/v1/officer/dashboard/overview
Response: 500 Internal Server Error
Message: "Failed to retrieve dashboard data"
```

**Root Cause:**
Same as the login issue - dashboard controller was using `pool.execute()` instead of `db.query()`.

**Solution:**
- Changed database connection method from `pool.execute()` to `db.query()`
- Added safe navigation for empty result sets
- Added debug error messages

---

## 🚀 Deploy to Production

Run these commands on the **production server**:

```bash
cd ~/green-permit-api

# Pull latest code
git pull origin main

# Restart PM2
pm2 restart green-permit-api

# Wait for restart
sleep 3

# Check status
pm2 list

# View logs
pm2 logs green-permit-api --lines 20 --nostream
```

---

## 🧪 Test Dashboard Endpoint

### Step 1: Login to Get Token
```bash
TOKEN=$(curl -s -X POST https://gtech.gifamz.com/api/v1/officer/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bola","password":"Admin@123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"
```

### Step 2: Test Dashboard
```bash
curl -X GET https://gtech.gifamz.com/api/v1/officer/dashboard/overview \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Expected Response:
```json
{
  "success": true,
  "data": {
    "officer": {
      "name": "Bola  Ahmed",
      "id": "OFF-LAOLU-2026-0002",
      "lgaAssigned": "Oluwaseyi LGA"
    },
    "todayStats": {
      "revenue": 0,
      "stickersActivated": 0,
      "verificationsPerformed": 0
    },
    "overallStats": {
      "totalCartPushersRegistered": 0,
      "activePermits": 0,
      "expiredPermits": 0
    },
    "recentActivities": []
  }
}
```

---

## 📋 All-in-One Deployment & Test Script

```bash
#!/bin/bash

echo "🚀 Deploying Dashboard Fix"
echo "=========================="
echo ""

cd ~/green-permit-api

echo "1️⃣ Pulling latest code..."
git pull origin main

echo ""
echo "2️⃣ Restarting PM2..."
pm2 restart green-permit-api
sleep 3

echo ""
echo "3️⃣ Checking PM2 status..."
pm2 list

echo ""
echo "4️⃣ Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST https://gtech.gifamz.com/api/v1/officer/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bola","password":"Admin@123"}')

echo "$LOGIN_RESPONSE" | jq '.'

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed - no token received"
    exit 1
fi

echo ""
echo "✅ Login successful - Token received"
echo ""
echo "5️⃣ Testing Dashboard..."
DASHBOARD_RESPONSE=$(curl -s -X GET https://gtech.gifamz.com/api/v1/officer/dashboard/overview \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$DASHBOARD_RESPONSE" | jq '.'

if echo "$DASHBOARD_RESPONSE" | grep -q '"success":true'; then
    echo ""
    echo "✅ Dashboard endpoint working!"
    echo ""
    echo "=========================="
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "=========================="
else
    echo ""
    echo "❌ Dashboard endpoint still failing"
    echo ""
    echo "Check logs:"
    echo "  pm2 logs green-permit-api"
fi
```

---

## 🔍 Troubleshooting

### If dashboard still fails:

**1. Check PM2 logs:**
```bash
pm2 logs green-permit-api --lines 50
```

**2. Check error log file:**
```bash
tail -50 ~/.pm2/logs/green-permit-api-error.log
```

**3. Verify tables exist:**
```bash
echo "SHOW TABLES" | mysql -u ggtlnplz_green_permit -p ggtlnplz_green_permit_db
```

**4. Check if activations table exists:**
```bash
echo "DESCRIBE activations" | mysql -u ggtlnplz_green_permit -p ggtlnplz_green_permit_db
```

**5. Test on localhost first:**
```bash
TOKEN=$(curl -s http://localhost:3000/api/v1/officer/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bola","password":"Admin@123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl http://localhost:3000/api/v1/officer/dashboard/overview \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 What Was Fixed

| File | Changes | Lines |
|------|---------|-------|
| `dashboard.controller.js` | Replace `pool.execute` with `db.query` | 2, 20, 29, 38, 48, 58 |
| `dashboard.controller.js` | Add safe navigation (`?.`) | 108-116 |
| `dashboard.controller.js` | Add debug error message | 127 |

---

## ✅ Changes Summary

### Before (Broken):
```javascript
const { pool } = require('../../config/database');
const [todayStats] = await pool.execute(...);
```

### After (Fixed):
```javascript
const db = require('../../config/database');
const todayStats = await db.query(...);
```

---

## 🎯 Expected Outcome

After deployment:
- ✅ Dashboard endpoint returns 200 OK
- ✅ Officer statistics displayed
- ✅ Recent activities shown (if any)
- ✅ Mobile app can load dashboard
- ✅ All dashboard features functional

---

## 📱 Mobile Team - Next Steps

Once deployed and tested:
1. ✅ Test login (already working)
2. ✅ Test dashboard load (should work after this fix)
3. Test QR scanner
4. Test sticker activation
5. Test activity history
6. Complete full app testing

---

## 🚨 If You See Missing Tables

If you get errors about missing `activations` or `verifications` tables:

```sql
-- These tables might need to be created
-- Check with database admin if they exist
-- Or create them if needed
```

Contact backend team if tables are missing.

---

**Deploy this fix and the mobile app should be fully functional!** 🚀

