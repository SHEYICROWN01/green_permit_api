# 🚀 Deploy Sticker Inventory Fix - Quick Guide

**Date:** January 8, 2026  
**Commit:** 4b7f825  
**Priority:** HIGH

---

## 📋 What Was Fixed

The sticker inventory endpoint now correctly calculates:
- ✅ Total activated stickers (was always showing 0)
- ✅ Total remaining stickers (was showing total count)
- ✅ Per-batch used count (was showing 0)
- ✅ Per-batch remaining count (was showing 0)

**No frontend changes required** - it will automatically display correct data!

---

## 🚀 Deployment Commands

### Option 1: Deploy via cPanel Terminal

```bash
# Navigate to app directory
cd ~/green-permit-api

# Pull latest changes
git pull origin main

# Restart the app (Passenger method)
mkdir -p tmp
touch tmp/restart.txt

# Wait for restart
sleep 10

echo "✅ Deployment complete!"
```

### Option 2: SSH Deployment

```bash
# SSH to server
ssh yourusername@gtech.gifamz.com

# Then run the same commands as Option 1
cd ~/green-permit-api
git pull origin main
mkdir -p tmp
touch tmp/restart.txt
sleep 10
```

---

## ✅ Verification Steps

### 1. Test API Directly

```bash
# Replace YOUR_TOKEN with actual super admin token
curl -X GET https://gtech.gifamz.com/api/v1/super-admin/stickers/inventory/summary \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_generated": 104,
      "total_activated": 25,        ← Should show actual count (not 0)
      "total_remaining": 79,        ← Should be less than total
      "total_batches": 4,
      "active_batches": 4
    },
    "batches": [
      {
        "batch_id": "BATCH-2026-022",
        "quantity": 13,
        "used": 5,                  ← Should show activated count
        "remaining": 8,             ← Should show unused count
        "status": "active"
      }
    ]
  }
}
```

### 2. Verify Math

Check that the numbers add up correctly:
```javascript
// Summary level
total_generated === total_activated + total_remaining

// Batch level (for each batch)
quantity === used + remaining
```

### 3. Test in Frontend

1. **Log in to Super Admin Dashboard**
2. **Navigate to:** Sticker Inventory page
3. **Check Summary Cards:**
   - Total Generated: Should show correct count ✅
   - Activated: Should show number > 0 (if you have activations) ✅
   - Remaining: Should be < Total Generated ✅

4. **Check Batch Table:**
   - Each batch should show correct **Used** count ✅
   - Each batch should show correct **Remaining** count ✅
   - Used + Remaining should equal Quantity ✅

---

## 🐛 Troubleshooting

### Issue 1: Still Showing 0 Activated

**Possible Causes:**
1. App didn't restart properly
2. Changes not pulled from Git
3. No stickers have actually been activated yet

**Solutions:**
```bash
# Force restart again
cd ~/green-permit-api
touch tmp/restart.txt
sleep 10

# Check if code was updated
git log --oneline -1
# Should show: 4b7f825 fix: correct sticker inventory statistics calculation

# Verify stickers are actually activated in database
mysql -u ggtlnplz_gpuser -p ggtlnplz_green_permit
# Enter password: Gifamz@2025@

# Then run:
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN status != 'unused' THEN 1 END) as activated,
    COUNT(CASE WHEN status = 'unused' THEN 1 END) as unused
FROM stickers;
```

**If database shows 0 activated:**
- This is correct! No stickers have been activated yet
- The fix is working - it's just showing accurate data
- Activate some stickers to test

### Issue 2: Git Pull Fails

**Error:** `Your local changes would be overwritten by merge`

**Solution:**
```bash
# Stash local changes
git stash

# Pull updates
git pull origin main

# Restart app
touch tmp/restart.txt
```

### Issue 3: 503 Service Unavailable

**Solution:**
```bash
# Check error logs
tail -50 ~/green-permit-api/stderr.log

# Usually fixed by proper restart
mkdir -p tmp
touch tmp/restart.txt
sleep 10
```

---

## 🧪 Test SQL Queries

### Check Overall Statistics:
```sql
SELECT 
    COUNT(*) as total_generated,
    COUNT(CASE WHEN status != 'unused' THEN 1 END) as activated,
    COUNT(CASE WHEN status = 'unused' THEN 1 END) as remaining
FROM stickers;
```

### Check Per-Batch Statistics:
```sql
SELECT 
    sb.batch_code,
    sb.quantity,
    COUNT(s.id) as stickers_created,
    COUNT(CASE WHEN s.status != 'unused' THEN 1 END) as used,
    COUNT(CASE WHEN s.status = 'unused' THEN 1 END) as remaining
FROM sticker_batches sb
LEFT JOIN stickers s ON sb.id = s.batch_id
GROUP BY sb.id, sb.batch_code, sb.quantity;
```

### Check Specific Batch:
```sql
SELECT 
    code,
    status,
    activated_at
FROM stickers
WHERE batch_id = 13
ORDER BY status, code;
```

---

## 📊 Understanding the Data

### Sticker Status Lifecycle:

```
unused → active → expired
                → revoked
```

### Counting Logic:

| Status    | Counted As        | Meaning                          |
|-----------|-------------------|----------------------------------|
| unused    | **Remaining**     | Never been activated             |
| active    | **Activated**     | Currently active and valid       |
| expired   | **Activated**     | Was active, now expired          |
| revoked   | **Activated**     | Was active, manually cancelled   |

**Key Point:** A sticker is "activated/used" if it has ever been activated, regardless of current state. This is why we use `status != 'unused'` to count activated stickers.

---

## 🔄 Rollback (If Needed)

If something goes wrong, rollback to previous version:

```bash
cd ~/green-permit-api

# Rollback to previous commit (before fix)
git reset --hard 1d484cf

# Restart app
touch tmp/restart.txt
sleep 10

# Verify rollback
git log --oneline -1
# Should show: 1d484cf cleanup: remove debug code and document successful deployment
```

To restore the fix:
```bash
git reset --hard 4b7f825
touch tmp/restart.txt
```

---

## 📋 Deployment Checklist

Before deploying:
- [ ] Code committed and pushed to GitHub
- [ ] Reviewed changes in Git log
- [ ] Backup server available (optional)

During deployment:
- [ ] SSH/access to production server
- [ ] Run `git pull origin main`
- [ ] Verify correct commit (4b7f825)
- [ ] Create tmp directory if not exists
- [ ] Touch tmp/restart.txt
- [ ] Wait 10 seconds for restart

After deployment:
- [ ] Test API endpoint directly (curl)
- [ ] Verify response shows non-zero activated count (if applicable)
- [ ] Check math: total = activated + remaining
- [ ] Test in frontend dashboard
- [ ] Verify batch table shows correct used/remaining
- [ ] Check with actual activated stickers

---

## 📞 Support Information

### Files Modified:
- `src/models/Sticker.js` - Updated `getInventorySummary()` method

### Documentation Created:
- `STICKER_INVENTORY_FIX.md` - Comprehensive technical documentation
- `DEPLOY_STICKER_INVENTORY_FIX.md` - This deployment guide

### Commit Details:
- **Hash:** 4b7f825
- **Message:** "fix: correct sticker inventory statistics calculation"
- **Files Changed:** 3 files, 1564 insertions, 3 deletions

### Testing Endpoints:
```
GET /api/v1/super-admin/stickers/inventory/summary
GET /api/v1/super-admin/sticker-batches
GET /api/v1/super-admin/sticker-batches/:batch_id
```

---

## 🎯 Success Criteria

Deployment is successful when:
- ✅ API returns correct total_activated count
- ✅ API returns correct total_remaining count
- ✅ Each batch shows correct used count
- ✅ Each batch shows correct remaining count
- ✅ Math checks pass: total = activated + remaining
- ✅ Frontend displays updated statistics
- ✅ No errors in server logs
- ✅ All tests pass

---

## 🚀 One-Line Deploy

For quick deployment:

```bash
cd ~/green-permit-api && git pull origin main && mkdir -p tmp && touch tmp/restart.txt && sleep 10 && echo "✅ Deployed!"
```

---

**Ready to deploy! 🎉**

**Deployment Time:** ~30 seconds  
**Downtime:** None (seamless restart)  
**Risk Level:** Low (read-only change, no schema modifications)  
**Rollback Available:** Yes (commit 1d484cf)

---

**Questions?** Check `STICKER_INVENTORY_FIX.md` for detailed technical information.
