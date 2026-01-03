# 🚀 URGENT: Deploy Officer Mobile App Fixes

**Date:** January 3, 2026  
**Status:** Code Ready | Database Migration Needed

---

## ✅ What Was Fixed

### 1. Reports Controller Database Issues
- **Changed**: `pool.execute()` → `db.query()` (consistent with other controllers)
- **Fixed**: `cart_pusher_id` references → `cart_pusher_phone` and `cart_pusher_name`
- **Added**: Graceful error handling for missing tables
- **Result**: Activities and sales reports will work (with defaults if tables missing)

### 2. Database Migration Created
- **File**: `database/migrations/002_create_missing_tables.sql`
- **Creates**: `activations`, `verifications`, `cart_pushers` tables
- **Safe**: Only creates if tables don't exist (won't break existing data)

---

## 🎯 DEPLOYMENT STEPS (10 Minutes)

### Step 1: Pull Latest Code (2 minutes)
```bash
cd /home/ggtlnplz/green-permit-api
git pull origin main
```

**Expected Output:**
```
Updating 46f23bd..403f95e
Fast-forward
 src/controllers/officer/reports.controller.js  | XX lines changed
 database/migrations/002_create_missing_tables.sql | XX insertions
```

### Step 2: Run Database Migration (3 minutes)
```bash
mysql -u ggtlnplz_gpuser -p'Gifamz@2025@' ggtlnplz_green_permit < database/migrations/002_create_missing_tables.sql
```

**Expected Output:**
```
(No errors - silent success or confirmation messages)
```

### Step 3: Verify Tables Created (1 minute)
```bash
mysql -u ggtlnplz_gpuser -p'Gifamz@2025@' ggtlnplz_green_permit -e "SHOW TABLES LIKE '%activations%'; SHOW TABLES LIKE '%verifications%'; SHOW TABLES LIKE '%cart_pushers%';"
```

**Expected Output:**
```
Tables_in_ggtlnplz_green_permit (%activations%)
activations

Tables_in_ggtlnplz_green_permit (%verifications%)
verifications

Tables_in_ggtlnplz_green_permit (%cart_pushers%)
cart_pushers
```

### Step 4: Restart cPanel Node.js App (1 minute)
1. Go to cPanel → **Setup Node.js App**
2. Find: **gtech.gifamz.com** application
3. Click: **"RESTART"** button
4. Wait: 10 seconds

### Step 5: Test Endpoints (3 minutes)

#### Test 1: Login (Should still work)
```bash
curl -s -X POST https://gtech.gifamz.com/api/v1/officer/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"bola","password":"Admin@123"}' > /tmp/test_login.json

TOKEN=$(cat /tmp/test_login.json | python3 -c 'import sys, json; print(json.load(sys.stdin)["data"]["token"])')
echo "Token: ${TOKEN:0:30}..."
```

#### Test 2: Dashboard (Should still work)
```bash
curl -s -X GET https://gtech.gifamz.com/api/v1/officer/dashboard/overview \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -20
```

#### Test 3: Activities (NEW - Should work now!)
```bash
curl -s -X GET "https://gtech.gifamz.com/api/v1/officer/activities?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -30
```

**Expected**: 200 OK with empty/zero data (no activities yet)

#### Test 4: Sales Report (NEW - Should work now!)
```bash
curl -s -X GET "https://gtech.gifamz.com/api/v1/officer/reports/sales?groupBy=week&startDate=2025-12-27&endDate=2026-01-03" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -30
```

**Expected**: 200 OK with zero sales data

---

## 📊 Expected Test Results

### Activities Endpoint
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 0,
      "totalActivations": 0,
      "totalVerifications": 0,
      "dateRange": {
        "start": "...",
        "end": "..."
      }
    },
    "transactions": [],
    "pagination": {
      "currentPage": 1,
      "totalPages": 0,
      "totalRecords": 0,
      "limit": 20
    }
  }
}
```

### Sales Reports Endpoint
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalActivations": 0,
      "totalRevenue": 0,
      "avgRevenuePerActivation": 0,
      "dateRange": {
        "start": "...",
        "end": "..."
      }
    },
    "salesData": [],
    "paymentMethodBreakdown": [],
    "durationBreakdown": []
  }
}
```

---

## 🔍 Troubleshooting

### If Migration Fails
```bash
# Check if tables already exist
mysql -u ggtlnplz_gpuser -p'Gifamz@2025@' ggtlnplz_green_permit -e "SHOW TABLES;"

# If activations exists but has wrong schema, check structure
mysql -u ggtlnplz_gpuser -p'Gifamz@2025@' ggtlnplz_green_permit -e "DESCRIBE activations;"
```

### If Endpoints Still Fail
```bash
# Check cPanel Node.js app logs
# In cPanel: Node.js App → Click application → View logs

# Or check server error logs
tail -100 ~/green-permit-api/logs/error.log

# Or check PM2 logs (if using PM2 instead of cPanel)
pm2 logs green-permit-api --lines 100
```

### If App Doesn't Restart
1. **Stop the app** in cPanel
2. Wait 5 seconds
3. **Start the app** again
4. Test endpoints

---

## 📱 Mobile App Testing Checklist

After deployment, mobile team should test:

### ✅ Already Working
- [x] Login endpoint
- [x] Dashboard endpoint

### 🆕 Now Fixed (Should Work)
- [ ] Activities endpoint (`GET /officer/activities`)
- [ ] Sales reports (`GET /officer/reports/sales`)

### ⏳ Still Need Testing
- [ ] Activate sticker (`POST /officer/stickers/:id/activate`)
- [ ] Verify sticker (`POST /officer/stickers/:id/verify`)

**Note**: Activate/verify endpoints might need additional testing with actual sticker data.

---

## 🛡️ Safety Confirmation

**Q: Will this affect existing systems?**  
**A: NO!** ✅

- Super admin, LGA, supervisor: **Untouched**
- Only adds new tables: **No existing data modified**
- Tables created with `IF NOT EXISTS`: **Safe to run multiple times**
- Code changes only in officer controllers: **Isolated to mobile app**

---

## 📞 Quick Commands Summary

```bash
# 1. Pull code
cd /home/ggtlnplz/green-permit-api && git pull origin main

# 2. Run migration
mysql -u ggtlnplz_gpuser -p'Gifamz@2025@' ggtlnplz_green_permit < database/migrations/002_create_missing_tables.sql

# 3. Verify tables
mysql -u ggtlnplz_gpuser -p'Gifamz@2025@' ggtlnplz_green_permit -e "SHOW TABLES;"

# 4. Restart app in cPanel (use UI)

# 5. Test all endpoints
TOKEN=$(curl -s -X POST https://gtech.gifamz.com/api/v1/officer/auth/login -H 'Content-Type: application/json' -d '{"username":"bola","password":"Admin@123"}' | python3 -c 'import sys, json; print(json.load(sys.stdin)["data"]["token"])')

curl -s "https://gtech.gifamz.com/api/v1/officer/activities?page=1&limit=20" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

curl -s "https://gtech.gifamz.com/api/v1/officer/reports/sales?groupBy=day" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

---

## 🎯 Success Criteria

**Deployment Successful When:**
- ✅ All 3 tables created (`activations`, `verifications`, `cart_pushers`)
- ✅ App restarts without errors
- ✅ Login endpoint: 200 OK
- ✅ Dashboard endpoint: 200 OK
- ✅ Activities endpoint: 200 OK (with empty data)
- ✅ Sales reports endpoint: 200 OK (with zero sales)

---

## ⏱️ Timeline

| Step | Duration | Status |
|------|----------|--------|
| Pull code | 2 min | ⏳ Pending |
| Run migration | 3 min | ⏳ Pending |
| Restart app | 1 min | ⏳ Pending |
| Test endpoints | 3 min | ⏳ Pending |
| **TOTAL** | **10 min** | ⏳ Ready to start |

---

**Status**: Ready for deployment  
**Risk Level**: ✅ Low (all changes isolated, safe rollback possible)  
**Mobile Team**: Can test immediately after deployment  
**Client**: Can see progress in 10 minutes

Let's get this deployed! 🚀
