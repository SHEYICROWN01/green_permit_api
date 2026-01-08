# 🚀 DEPLOY ACTIVATION REVENUE FIX - Quick Guide

**Date:** January 8, 2026  
**Commit:** 1e88eee  
**Priority:** 🔥 CRITICAL

---

## 🎯 What This Fixes

Your dashboard currently showing:
- ❌ Total Revenue: **₦0** (should show ₦24,000+)
- ❌ Activated: **0** (should show 1+)
- ❌ Batch Used: **0** (should show counts)

**After this fix:**
- ✅ Revenue will display correctly
- ✅ Activation counts will update
- ✅ All dashboard statistics will work

---

## ⚡ QUICK DEPLOY (Copy & Paste)

### Step 1: Deploy Code

```bash
cd ~/green-permit-api && \
git pull origin main && \
mkdir -p tmp && \
touch tmp/restart.txt && \
sleep 10 && \
echo "✅ Code deployed!"
```

### Step 2: Migrate Old Data (IMPORTANT!)

This migrates your existing activation (the one you just made) to show in dashboard:

```bash
mysql -u ggtlnplz_gpuser -p ggtlnplz_green_permit < ~/green-permit-api/migrate-activations.sql
# Password: Gifamz@2025@
```

### Step 3: Verify

```bash
# Check if activation was recorded
mysql -u ggtlnplz_gpuser -p ggtlnplz_green_permit -e "
SELECT COUNT(*) as total_activations FROM activations;
"
```

**Expected:** Should show 1 or more

---

## 📋 DETAILED STEPS

### Step 1: Access Server

**Option A: cPanel Terminal**
- Log in to cPanel
- Click "Terminal"
- Ready to go ✓

**Option B: SSH**
```bash
ssh your-username@gtech.gifamz.com
```

---

### Step 2: Navigate to App

```bash
cd ~/green-permit-api
pwd
# Should show: /home/.../green-permit-api
```

---

### Step 3: Pull Latest Changes

```bash
git pull origin main
```

**Expected Output:**
```
Updating 5045b84..1e88eee
Fast-forward
 ACTIVATION_REVENUE_FIX.md                           | 600 ++++++++++++++++
 migrate-activations.sql                             | 125 ++++
 src/controllers/officer/activation.controller.js    |  18 +-
 src/models/Activation.js                            |  44 ++
 4 files changed, 787 insertions(+), 4 deletions(-)
```

---

### Step 4: Verify Commit

```bash
git log --oneline -1
```

**Should show:**
```
1e88eee fix: record activations in activations table for revenue tracking
```

---

### Step 5: Restart Application

```bash
mkdir -p tmp
touch tmp/restart.txt
sleep 10
```

**What happens:**
- Passenger detects tmp/restart.txt
- Restarts Node.js app
- Loads new code
- Takes ~10 seconds

---

### Step 6: Test Health

```bash
curl -s https://gtech.gifamz.com/health
```

**Expected:**
```json
{"status":"ok","timestamp":"2026-01-08T..."}
```

**If 503:** Wait another 10 seconds and try again

---

### Step 7: ⚠️ MIGRATE OLD ACTIVATIONS

**This is crucial!** Your activation from earlier needs to be migrated.

```bash
# Run migration script
mysql -u ggtlnplz_gpuser -p ggtlnplz_green_permit < ~/green-permit-api/migrate-activations.sql
```

**When prompted, enter password:** `Gifamz@2025@`

**What this does:**
- Finds all activated stickers in `stickers` table
- Creates matching records in `activations` table
- Preserves amount_paid, customer info, dates
- Safe to run multiple times (checks for existing records)

**Output:**
```
+-------------------------------------------+-------+
| description                               | count |
+-------------------------------------------+-------+
| Activated Stickers (in stickers table)   |     1 |
| Activation Records (in activations table)|     0 |
| Missing Activation Records               |     1 |
+-------------------------------------------+-------+

... migration happens ...

+--------------------+------------------+
| status             | records_inserted |
+--------------------+------------------+
| MIGRATION COMPLETE |                1 |
+--------------------+------------------+
```

---

### Step 8: Verify Migration

```bash
# Check total activations
mysql -u ggtlnplz_gpuser -p ggtlnplz_green_permit -e "
SELECT COUNT(*) as activation_count FROM activations;
"
```

**Expected:** 1 or more

```bash
# Check total revenue
mysql -u ggtlnplz_gpuser -p ggtlnplz_green_permit -e "
SELECT SUM(amount_paid) / 100 as total_revenue_naira FROM activations;
"
```

**Expected:** 24000.00 or your activation amount

---

### Step 9: Check Dashboard

1. **Open mobile app or web dashboard**
2. **Navigate to Dashboard/Overview**
3. **Check:**
   - ✅ Total Revenue shows **₦24,000** (or your amount)
   - ✅ Activated shows **1**
   - ✅ Monthly Revenue shows value
   - ✅ Batch Used shows **1**
   - ✅ Batch Remaining shows **12** (or quantity - 1)

---

### Step 10: Test New Activation

To confirm fix is working:

1. **Activate another sticker** via mobile app
2. **Wait 5 seconds**
3. **Refresh dashboard**
4. **Verify:**
   - Revenue increased by sticker price
   - Activated count increased by 1
   - Batch counts updated

---

## 🐛 TROUBLESHOOTING

### Issue 1: Migration Shows 0 Records

**Check if stickers are actually activated:**
```sql
mysql -u ggtlnplz_gpuser -p ggtlnplz_green_permit -e "
SELECT 
    code, 
    status, 
    activated_at, 
    price 
FROM stickers 
WHERE status = 'active';
"
```

**If no results:**
- Sticker hasn't been activated in database yet
- Check if activation succeeded
- Look at stickers table directly

---

### Issue 2: Dashboard Still Shows 0

**Possible causes:**

1. **Browser cache**
   - Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
   - Clear cache
   - Try incognito mode

2. **App didn't restart**
   ```bash
   touch tmp/restart.txt
   sleep 10
   ```

3. **Migration didn't run**
   - Re-run migration script
   - Check for SQL errors

4. **Frontend not updated**
   - Check if frontend is fetching from correct API
   - Verify API endpoint returns data

---

### Issue 3: SQL Error During Migration

**Common errors:**

**Error:** `Table 'activations' doesn't exist`
```bash
# Check schema
mysql -u ggtlnplz_gpuser -p ggtlnplz_green_permit -e "SHOW TABLES LIKE 'activations';"
```
If missing, your database needs schema update.

**Error:** `Duplicate entry`
```bash
# This is OK - means migration already ran
# Check existing records:
mysql -u ggtlnplz_gpuser -p ggtlnplz_green_permit -e "
SELECT COUNT(*) FROM activations;
"
```

---

### Issue 4: New Activations Still Not Showing

**Test activation endpoint:**
```bash
# Activate sticker via API directly
curl -X POST https://gtech.gifamz.com/api/v1/officer/stickers/activate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sticker_code": "TEST-CODE",
    "assigned_to_name": "Test User",
    "validity_days": 365
  }'
```

**Check logs:**
```bash
tail -50 ~/green-permit-api/stderr.log
```

Look for errors related to:
- `Activation.create()`
- Database connection
- Foreign key constraints

---

## 🔄 ROLLBACK (If Needed)

If something goes wrong:

```bash
cd ~/green-permit-api

# Rollback code
git reset --hard 5045b84

# Restart
touch tmp/restart.txt
sleep 10

# Verify
git log --oneline -1
# Should show: 5045b84 docs: add detailed deployment checklist
```

**To restore fix later:**
```bash
git reset --hard 1e88eee
touch tmp/restart.txt
```

---

## ✅ SUCCESS CHECKLIST

- [ ] SSH/Terminal access to server
- [ ] Navigated to ~/green-permit-api
- [ ] Git pull completed successfully
- [ ] Commit 1e88eee verified
- [ ] App restarted (tmp/restart.txt)
- [ ] Health check passed
- [ ] Migration script executed
- [ ] Activation records verified in database
- [ ] Dashboard shows correct revenue
- [ ] Activated count shows correct number
- [ ] Batch counts updated
- [ ] Test activation works
- [ ] No errors in logs

---

## 📊 VERIFICATION QUERIES

### Check Activation Records:
```sql
SELECT 
    a.id,
    s.code,
    a.amount_paid / 100 as amount_naira,
    a.customer_name,
    a.activation_date,
    l.name as lga_name
FROM activations a
JOIN stickers s ON a.sticker_id = s.id
JOIN lgas l ON a.lga_id = l.id
ORDER BY a.activation_date DESC
LIMIT 10;
```

### Check Revenue by LGA:
```sql
SELECT 
    l.name,
    COUNT(a.id) as activations,
    SUM(a.amount_paid) / 100 as revenue_naira
FROM lgas l
LEFT JOIN activations a ON a.lga_id = l.id
GROUP BY l.id, l.name
ORDER BY revenue_naira DESC;
```

### Check Today's Activations:
```sql
SELECT 
    COUNT(*) as today_count,
    SUM(amount_paid) / 100 as today_revenue
FROM activations
WHERE DATE(activation_date) = CURDATE();
```

---

## 🎯 EXPECTED RESULTS

### After Migration (First Time):
- **Activations Table:** 1+ records
- **Total Revenue:** ₦24,000+ (your activation amount)
- **Dashboard Activated:** 1+
- **Batch Used:** 1+

### After New Activation:
- **Activations Table:** Increments by 1
- **Total Revenue:** Increases by sticker price
- **Dashboard:** Updates immediately
- **Batch Used:** Increments by 1

---

## 📞 SUPPORT

### Files Changed:
- `src/models/Activation.js` - Added create() method
- `src/controllers/officer/activation.controller.js` - Records activations
- `migrate-activations.sql` - Migration script
- `ACTIVATION_REVENUE_FIX.md` - Full documentation

### Related Fixes:
- Sticker Inventory Fix (commit 4b7f825)
- Frontend Integration Guide

### Test Data:
- **Sticker:** OYOYO-176786484558912001
- **Amount:** ₦24,000 (2,400,000 kobo)
- **Customer:** Boss Man
- **Receipt:** RCP-20260108-002

---

## 🚨 IMPORTANT NOTES

1. **Migration is ONE-TIME only** (but safe to run multiple times)
2. **All future activations** will automatically record in activations table
3. **Dashboard queries** look at activations table, not stickers table
4. **Amount is in kobo** (divide by 100 for naira display)
5. **Browser cache** may need clearing to see updates

---

**Deploy now! Your dashboard will finally show correct revenue! 💰**

**Estimated Time:** 5 minutes  
**Downtime:** None  
**Risk:** Low  
**Rollback:** Available

---

**Questions?** Check `ACTIVATION_REVENUE_FIX.md` for detailed technical information.
