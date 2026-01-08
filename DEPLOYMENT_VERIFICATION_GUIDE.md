# ✅ DEPLOYMENT VERIFICATION GUIDE

**Date:** January 8, 2026  
**Commits Deployed:**
- `e0ba5f4` - Dashboard summary stats fix
- `7feb812` - Officers list individual stats fix
- `28f512b` - Test script added

---

## 🎯 What Was Fixed

### Issue 1: LGA Dashboard showing ₦0 ✅ FIXED (commit e0ba5f4)
- Fixed dashboard top officers query
- Fixed summary statistics query
- Added JOIN with activations table

### Issue 2: Officers list rows showing ₦0 ✅ FIXED (commit 7feb812)
- Fixed officers list query (different from summary query!)
- Added activation statistics to individual officer rows
- Individual stats now match summary totals

---

## 🧪 VERIFICATION STEPS

### Option 1: Using Test Script (Easiest)

On production server:
```bash
cd ~/green-permit-api
git pull origin main  # Get the test script
chmod +x test-officers-list.sh

# Run test with your LGA Admin token
./test-officers-list.sh YOUR_LGA_ADMIN_TOKEN
```

The script will:
- ✅ Fetch officers list data
- ✅ Extract summary statistics
- ✅ Extract first officer statistics
- ✅ Verify data consistency
- ✅ Show if fix is working

---

### Option 2: Manual API Test (Using curl)

```bash
# Test Officers List API
curl -X GET 'https://gtech.gifamz.com/api/v1/admin/officers' \
  -H 'Authorization: Bearer YOUR_LGA_ADMIN_TOKEN'
```

**Look for in the response:**

#### Summary Section (should work):
```json
"summary": {
  "total_activations": 9,        // ✅ Should NOT be 0
  "total_revenue": 7250100       // ✅ Should NOT be 0 (₦72,501)
}
```

#### Officers Array (NOW should work):
```json
"officers": [
  {
    "name": "Bola Ahmed",
    "statistics": {
      "activations_count": 9,    // ✅ Should match summary (NOT 0!)
      "total_revenue": 7250100,  // ✅ Should match summary (NOT 0!)
      "success_rate": 100
    }
  }
]
```

---

### Option 3: Frontend Verification (Visual)

1. **Login to LGA Admin Dashboard**
   - URL: `https://permitmanager.gifamz.com/admin/dashboard`
   - Login with LGA Admin credentials

2. **Navigate to Officers Page**
   - Click "Officers" in sidebar

3. **Verify Summary Card (Top)**
   ```
   Total Activations: 9        ✅ Should show 9
   Total Revenue: ₦72,501      ✅ Should show ₦72,501
   ```

4. **Verify Officer Rows (Below)**
   ```
   Officer          | Activations      | Revenue
   ----------------|------------------|----------
   Bola Ahmed      | 9 activations    | ₦72,501   ✅ Should match summary!
                   | Success: 100%    |
   ```

5. **Check Consistency**
   - ✅ Summary total = Sum of individual officers
   - ✅ No ₦0 values where there should be revenue
   - ✅ Sorting by activations/revenue works

---

## ✅ SUCCESS CRITERIA

Fix is successful when:

### Summary Statistics:
- [x] Total Activations shows **9** (not 0)
- [x] Total Revenue shows **₦72,501** (not ₦0)

### Individual Officer Rows:
- [ ] **Bola Ahmed** shows **9 activations** (not 0)
- [ ] **Bola Ahmed** shows **₦72,501** (not ₦0)
- [ ] Success rate shows **100%** (not 0%)

### Data Consistency:
- [ ] Summary total **=** Sum of individual officers
- [ ] First officer activations **=** 9 (matches summary)
- [ ] First officer revenue **=** 7250100 kobo (matches summary)

---

## 🐛 TROUBLESHOOTING

### If officers still show ₦0:

#### 1. Check if app restarted
```bash
cd ~/green-permit-api
ls -la tmp/restart.txt  # Should show recent timestamp

# If old, restart again:
touch tmp/restart.txt
sleep 10
```

#### 2. Check for errors in logs
```bash
tail -100 ~/green-permit-api/logs/app.log
# OR
pm2 logs green-permit-api --lines 50
```

#### 3. Verify code was pulled
```bash
cd ~/green-permit-api
git log --oneline -3
# Should show:
# 28f512b add: test script for officers list API verification
# 7feb812 fix: add activation statistics to officers list query
# e0ba5f4 fix: calculate actual officer statistics in dashboard APIs
```

#### 4. Check database connection
```bash
mysql -u ggtlnplz_gpuser -p ggtlnplz_green_permit -e "
SELECT 
    COUNT(*) as total_activations,
    SUM(amount_paid) as total_revenue_kobo,
    SUM(amount_paid) / 100 as total_revenue_naira
FROM activations 
WHERE lga_id = 4;
"
# Should show: 9 activations, 7250100 kobo
```

---

## 📊 EXPECTED DATABASE RESULTS

Run this query to verify data:

```sql
-- Individual officer statistics
SELECT 
    o.id,
    o.name,
    COUNT(DISTINCT a.id) as activations,
    COALESCE(SUM(a.amount_paid), 0) as revenue_kobo,
    COALESCE(SUM(a.amount_paid) / 100, 0) as revenue_naira
FROM users o
LEFT JOIN activations a ON (a.officer_id = o.id OR a.activated_by = o.id) 
    AND a.lga_id = 4
WHERE o.role = 'officer' AND o.lga_id = 4
GROUP BY o.id, o.name
ORDER BY revenue_kobo DESC;
```

**Expected Output:**
```
id | name        | activations | revenue_kobo | revenue_naira
---|-------------|-------------|--------------|---------------
10 | Bola Ahmed  | 9           | 7250100     | 72501.00
9  | Hello baba  | 0           | 0            | 0.00
11 | Ola oba     | 0           | 0            | 0.00
```

If this matches, API should also return same data!

---

## 🚨 QUICK FIXES

### App not restarting:
```bash
cd ~/green-permit-api
touch tmp/restart.txt
sleep 15  # Wait longer
curl -I https://gtech.gifamz.com/api/health  # Check if responding
```

### Wrong data returned:
```bash
# Clear any caching (if applicable)
cd ~/green-permit-api
rm -rf node_modules/.cache

# Force restart
touch tmp/restart.txt
```

### Token expired:
```bash
# Get new LGA Admin token
curl -X POST 'https://gtech.gifamz.com/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "YOUR_LGA_ADMIN_USERNAME",
    "password": "YOUR_PASSWORD"
  }'
```

---

## 📝 FILES CHANGED

### Commit e0ba5f4:
- `src/controllers/admin/dashboard.controller.js`
  - Line ~120: Super Admin top officers query
  - Line ~313: LGA Admin top officers query

### Commit 7feb812:
- `src/controllers/admin/officer.controller.js`
  - Line ~115-145: Officers list query (MAIN FIX!)

### Commit 28f512b:
- `test-officers-list.sh` (new test script)

---

## 🎉 NEXT STEPS

1. **Run verification** using one of the options above
2. **Check frontend** - Officers page should show correct data
3. **Test sorting** - Sort by activations/revenue should work
4. **Verify consistency** - Summary should match individual rows
5. **Report results** - Let me know if you see any issues!

---

## 📞 CONTACT

If you encounter issues:
1. Share the API response from curl command
2. Share any error logs from `logs/app.log`
3. Share screenshot of frontend if relevant
4. Confirm app was restarted (`ls -la tmp/restart.txt`)

---

**Status:** ✅ **DEPLOYED** - Ready for verification  
**Priority:** 🔴 **HIGH** - Verify immediately

---

**Test now and confirm the fix is working!** 🚀
