# 🎯 DEPLOYMENT CHECKLIST - Sticker Inventory Fix

**Ready to Deploy:** ✅ YES  
**Commits:** 4b7f825, 955c1cd, cc56ca8  
**Files Changed:** 1 code file + 3 documentation files

---

## ⚡ QUICK START

### Deploy Now (Copy & Paste):

```bash
cd ~/green-permit-api && \
git pull origin main && \
mkdir -p tmp && \
touch tmp/restart.txt && \
sleep 10 && \
curl -s https://gtech.gifamz.com/health && \
echo -e "\n✅ Deployment complete!"
```

---

## 📋 STEP-BY-STEP CHECKLIST

### ☐ STEP 1: Access Production Server

**Method A: cPanel Terminal**
- Go to cPanel → Terminal
- Already in server ✓

**Method B: SSH**
```bash
ssh your-username@gtech.gifamz.com
```

---

### ☐ STEP 2: Navigate to App Directory

```bash
cd ~/green-permit-api
pwd
# Should show: /home/yourusername/green-permit-api
```

---

### ☐ STEP 3: Check Current Status (Optional)

```bash
# See current commit
git log --oneline -1

# Check for uncommitted changes
git status
```

---

### ☐ STEP 4: Pull Latest Changes

```bash
git pull origin main
```

**Expected Output:**
```
remote: Enumerating objects...
Updating 1d484cf..cc56ca8
Fast-forward
 DEPLOY_STICKER_INVENTORY_FIX.md        | 356 ++++++++++++++++
 FRONTEND_INTEGRATION_GUIDE.md          | 700 ++++++++++++++++++++++++++++++
 STICKER_INVENTORY_FIX.md               | 546 +++++++++++++++++++++++
 STICKER_INVENTORY_FIX_SUMMARY.md       | 335 ++++++++++++++
 src/models/Sticker.js                  |  62 ++-
 5 files changed, 1995 insertions(+), 4 deletions(-)
```

**If Error:**
```bash
# Stash any local changes
git stash

# Try pull again
git pull origin main
```

---

### ☐ STEP 5: Verify Latest Commit

```bash
git log --oneline -1
```

**Should show:**
```
cc56ca8 docs: add comprehensive summary for sticker inventory fix
```

**Or one of these:**
- `955c1cd docs: add deployment guide for sticker inventory fix`
- `4b7f825 fix: correct sticker inventory statistics calculation`

---

### ☐ STEP 6: Restart Application

```bash
# Create tmp directory if it doesn't exist
mkdir -p tmp

# Touch restart file (Passenger restart method)
touch tmp/restart.txt
```

**What this does:**
- Signals Passenger to restart the Node.js app
- Zero downtime restart
- Takes ~5-10 seconds

---

### ☐ STEP 7: Wait for Restart

```bash
sleep 10
echo "Restart complete"
```

**Or watch logs:**
```bash
# In another terminal, watch for restart
tail -f stderr.log

# Press Ctrl+C when you see app started
```

---

### ☐ STEP 8: Verify Application is Running

```bash
# Check health endpoint
curl -s https://gtech.gifamz.com/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

**If 503 Error:**
```bash
# Wait a bit more
sleep 10

# Try again
curl -s https://gtech.gifamz.com/health
```

---

### ☐ STEP 9: Test the Fixed Endpoint

**Get your super admin token first** (from login or saved token)

```bash
# Set your token
TOKEN="your-super-admin-jwt-token"

# Test inventory endpoint
curl -X GET https://gtech.gifamz.com/api/v1/super-admin/stickers/inventory/summary \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  | jq '.'
```

**Expected Response Structure:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_generated": 104,
      "total_activated": 25,     ← Should show actual count
      "total_remaining": 79,     ← Should be different from total
      "total_batches": 4,
      "active_batches": 4
    },
    "batches": [
      {
        "batch_id": "BATCH-2026-022",
        "quantity": 13,
        "used": 5,               ← Should show count
        "remaining": 8           ← Should show count
      }
    ]
  }
}
```

---

### ☐ STEP 10: Verify Math

Check the response manually:

```javascript
// Summary level
total_generated === total_activated + total_remaining
// Example: 104 === 25 + 79 ✓

// Batch level (for each batch)
quantity === used + remaining
// Example: 13 === 5 + 8 ✓
```

**If Math Doesn't Add Up:**
- Something is wrong, check logs
- Review STICKER_INVENTORY_FIX.md

---

### ☐ STEP 11: Test in Frontend

1. **Open browser**
2. **Navigate to:** `https://permitmanager.gifamz.com` (or your frontend URL)
3. **Log in** as Super Admin
4. **Go to:** Sticker Inventory page

**Check:**
- [ ] Total Generated shows correct number
- [ ] Activated shows a number (not 0, if you have activations)
- [ ] Remaining is less than Total Generated
- [ ] Each batch row shows Used count
- [ ] Each batch row shows Remaining count
- [ ] Used + Remaining = Quantity for each batch

---

### ☐ STEP 12: Check Logs for Errors

```bash
# Check for any errors
tail -50 ~/green-permit-api/stderr.log

# Look for:
# - Syntax errors (there should be none)
# - Database errors (there should be none)
# - API errors (there should be none)
```

**If No Errors:**
✅ Deployment successful!

**If Errors:**
See troubleshooting section below

---

## 🐛 TROUBLESHOOTING

### Issue 1: Still Showing 0 Activated

**Possible Cause:** No stickers have actually been activated yet

**Check:**
```sql
-- Connect to database
mysql -u ggtlnplz_gpuser -p ggtlnplz_green_permit
# Password: Gifamz@2025@

-- Check actual data
SELECT 
    status,
    COUNT(*) as count
FROM stickers
GROUP BY status;

-- Should show something like:
-- unused: 79
-- active: 20
-- expired: 5
-- revoked: 0
```

**If All Show 'unused':**
- This is correct! No stickers activated yet
- The fix is working, just no data to display
- Activate some stickers to test

---

### Issue 2: Git Pull Shows Conflicts

**Solution:**
```bash
# See what files have conflicts
git status

# Stash your local changes
git stash

# Pull again
git pull origin main

# If you need your local changes back
git stash pop
```

---

### Issue 3: App Won't Restart (503 Error)

**Solution 1: Check Syntax**
```bash
# Test JavaScript syntax
node -c src/models/Sticker.js

# Should output nothing (no syntax errors)
```

**Solution 2: Check Logs**
```bash
tail -100 stderr.log

# Look for the specific error
```

**Solution 3: Force Restart**
```bash
# Kill Node processes (last resort)
pkill -f node

# Wait a bit
sleep 5

# Touch restart file
touch tmp/restart.txt

# Wait for restart
sleep 10
```

---

### Issue 4: Database Connection Error

**Check:**
```bash
# Test database connection
mysql -u ggtlnplz_gpuser -p -h localhost
# Password: Gifamz@2025@

# Should connect successfully
```

**If Connection Fails:**
- Check database credentials in `.env`
- Verify database server is running
- Contact hosting support

---

### Issue 5: Response Structure Different

**Expected Structure Changed:**
The response structure was intentionally changed from LGA-grouped to summary+batches.

**Frontend Compatibility:**
- Frontend should already expect new structure
- If frontend breaks, it needs updating
- Share `FRONTEND_INTEGRATION_GUIDE.md` with frontend team

---

## 🔄 ROLLBACK PROCEDURE

If deployment causes issues:

```bash
# Go to app directory
cd ~/green-permit-api

# Rollback to previous commit
git reset --hard 1d484cf

# Restart app
touch tmp/restart.txt
sleep 10

# Verify rollback
git log --oneline -1
# Should show: 1d484cf cleanup: remove debug code...

# Test
curl -s https://gtech.gifamz.com/health
```

**To Restore Fix Later:**
```bash
git reset --hard cc56ca8
touch tmp/restart.txt
```

---

## ✅ SUCCESS CRITERIA

Deployment is successful when:

- [x] Git pull completed without errors
- [x] App restarted (tmp/restart.txt touched)
- [x] Health endpoint returns OK
- [x] Inventory endpoint returns correct structure
- [x] `total_activated` shows actual count (or 0 if no activations)
- [x] `total_remaining` is accurate
- [x] Each batch shows `used` and `remaining` counts
- [x] Math verification passes
- [x] Frontend displays correctly
- [x] No errors in logs

---

## 📊 DATABASE VERIFICATION (Optional)

Test the queries directly in MySQL:

```sql
-- Overall statistics
SELECT 
    COUNT(*) as total_generated,
    COUNT(CASE WHEN status != 'unused' THEN 1 END) as total_activated,
    COUNT(CASE WHEN status = 'unused' THEN 1 END) as total_remaining
FROM stickers;

-- Per-batch statistics  
SELECT 
    sb.batch_code,
    sb.quantity,
    COUNT(CASE WHEN s.status != 'unused' THEN 1 END) as used,
    COUNT(CASE WHEN s.status = 'unused' THEN 1 END) as remaining
FROM sticker_batches sb
LEFT JOIN stickers s ON sb.id = s.batch_id
GROUP BY sb.id, sb.batch_code, sb.quantity;

-- Verify math
SELECT 
    sb.batch_code,
    sb.quantity,
    COUNT(CASE WHEN s.status != 'unused' THEN 1 END) as used,
    COUNT(CASE WHEN s.status = 'unused' THEN 1 END) as remaining,
    (COUNT(CASE WHEN s.status != 'unused' THEN 1 END) + COUNT(CASE WHEN s.status = 'unused' THEN 1 END)) as calculated_total,
    (sb.quantity = (COUNT(CASE WHEN s.status != 'unused' THEN 1 END) + COUNT(CASE WHEN s.status = 'unused' THEN 1 END))) as math_correct
FROM sticker_batches sb
LEFT JOIN stickers s ON sb.id = s.batch_id
GROUP BY sb.id, sb.batch_code, sb.quantity;
```

---

## 📞 SUPPORT

### Documentation:
- **Technical:** `STICKER_INVENTORY_FIX.md`
- **Deployment:** `DEPLOY_STICKER_INVENTORY_FIX.md`
- **Summary:** `STICKER_INVENTORY_FIX_SUMMARY.md`
- **Frontend:** `FRONTEND_INTEGRATION_GUIDE.md`

### Commits:
- **Fix:** 4b7f825
- **Deploy Guide:** 955c1cd
- **Summary:** cc56ca8

### Files Modified:
- `src/models/Sticker.js` (getInventorySummary method)

---

## 🎉 POST-DEPLOYMENT

After successful deployment:

1. **Notify Team**
   - Frontend team: Inventory now shows correct data
   - Testing team: Ready for testing
   - Management: Issue resolved

2. **Monitor**
   - Watch logs for any errors
   - Check dashboard regularly
   - Verify data accuracy

3. **Document**
   - Mark ticket as resolved
   - Update project documentation
   - Share success metrics

---

## 📝 DEPLOYMENT LOG

Use this section to track your deployment:

```
Date: _______________
Time: _______________
Deployed By: _______________
Commit Hash: cc56ca8
Git Pull: [ ] Success [ ] Failed
App Restart: [ ] Success [ ] Failed
Health Check: [ ] OK [ ] Failed
API Test: [ ] Success [ ] Failed
Frontend Test: [ ] Success [ ] Failed
Issues: _______________________________________________
Notes: ________________________________________________
```

---

**Ready to deploy? Let's go! 🚀**

**Estimated Time:** 5 minutes  
**Difficulty:** Easy  
**Risk:** Low  
**Preparation:** Complete ✅
