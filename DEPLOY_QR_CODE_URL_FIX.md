# 🚀 DEPLOY QR CODE URL FORMAT FIX

**Date:** January 8, 2026  
**Status:** Ready to Deploy  
**Changes:** QR codes now include full verification URL

---

## ✅ WHAT'S BEING DEPLOYED

### Changes:
- ✅ QR codes now contain: `https://permitmanager.gifamz.com/verify/{CODE}`
- ✅ Environment variable support: `VERIFICATION_URL`
- ✅ Backward compatible with existing stickers
- ✅ Documentation created for mobile and frontend teams

### Files Modified:
- `src/utils/stickerCodeGenerator.js` - Updated `generateQRCodeData()` function
- `QR_CODE_URL_FORMAT_CHANGE.md` - Comprehensive documentation

---

## 📋 PRE-DEPLOYMENT CHECKLIST

- [x] Code committed to GitHub
- [x] Code pushed successfully (commit: 1e79bd1)
- [x] Documentation created
- [ ] Mobile app team notified
- [ ] Frontend team notified
- [ ] Ready to deploy to production

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Login to cPanel

1. Go to: **https://cpanel.gifamz.com** or Namecheap cPanel
2. Login with your credentials
3. Open **Terminal** (Advanced section)

---

### Step 2: Pull Latest Changes

Run this command in cPanel Terminal:

```bash
cd ~/green-permit-api && git pull origin main && touch app.js
```

**Expected Output:**
```
Already on 'main'
Your branch is behind 'origin/main' by X commits, and can be fast-forwarded.
Updating 5c202bc..1e79bd1
Fast-forward
 QR_CODE_URL_FORMAT_CHANGE.md        | 446 ++++++++++++++++++++++++++++++
 src/utils/stickerCodeGenerator.js   |  10 +-
 2 files changed, 450 insertions(+), 6 deletions(-)
 create mode 100644 QR_CODE_URL_FORMAT_CHANGE.md
```

---

### Step 3: Verify Deployment

Check that the app restarted successfully:

```bash
# Check if app.js was touched
ls -lt ~/green-permit-api/app.js

# Check application logs
tail -f ~/green-permit-api/server.log
```

**Look for:**
```
Server running on port...
Database connected successfully
```

---

### Step 4: Test QR Code Generation

#### Option A: Generate Test Sticker Batch

Use the Dashboard or API to generate a new sticker batch, then check the database:

```bash
# Login to MySQL
mysql -u ggtlnplz_gpuser -p'Gifamz@2025@' ggtlnplz_green_permit

# Check the latest sticker
SELECT id, code, qr_code_url FROM stickers ORDER BY id DESC LIMIT 1;
```

**Expected qr_code_url:**
```
https://permitmanager.gifamz.com/verify/ONSEY-176757997717816002
```

#### Option B: Test API Directly

```bash
# Get auth token first
TOKEN="your-jwt-token-here"

# Generate a test batch (replace LGA_ID with actual ID)
curl -X POST https://gtech.gifamz.com/api/v1/officer/stickers/batch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lga_id": 4,
    "quantity": 1,
    "price": 300000,
    "batch_number": "TEST-QR-URL"
  }'
```

---

## 🔍 VERIFICATION

### Test 1: Check QR Code Data

```bash
mysql -u ggtlnplz_gpuser -p'Gifamz@2025@' ggtlnplz_green_permit -e "SELECT id, code, qr_code_url FROM stickers WHERE DATE(created_at) = CURDATE() ORDER BY id DESC LIMIT 5;"
```

**All new stickers should have:**
```
qr_code_url: https://permitmanager.gifamz.com/verify/{CODE}
```

### Test 2: API Health Check

```bash
curl https://gtech.gifamz.com/api/v1/health
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Server is running"
}
```

### Test 3: Generate QR Code Image (Optional)

If you have QR code generation endpoint, test it:

```bash
curl https://gtech.gifamz.com/api/v1/stickers/{STICKER_CODE}/qr
```

Scan with phone camera - it should open the verification page.

---

## 📱 NEXT STEPS FOR OTHER TEAMS

### Mobile App Team - ACTION REQUIRED ⚠️

**Message to send:**

```
URGENT: QR Code Format Change Deployed

As of [TODAY'S DATE], QR codes now contain full URLs:
https://permitmanager.gifamz.com/verify/{CODE}

Your app needs to extract the code from the URL.

CODE EXAMPLE:
See QR_CODE_URL_FORMAT_CHANGE.md in the repo for implementation.

TESTING:
1. Scan old QR codes (plain code) - should work
2. Scan new QR codes (URL format) - should work
3. Test activation flow

DEADLINE: Please update within 48 hours.

Old stickers will continue working. New stickers generated today have URL format.
```

---

### Frontend Team - ACTION REQUIRED ⚠️

**Message to send:**

```
NEW REQUIREMENT: Public Verification Page

URL Pattern: /verify/:stickerCode
Example: https://permitmanager.gifamz.com/verify/ONSEY-176757997717816002

REQUIREMENTS:
- Public page (no authentication)
- Call API: GET /api/v1/officer/stickers/:code/verify
- Display sticker status, LGA, validity
- Mobile-friendly design

DEADLINE: End of week

This enables users to verify stickers by scanning with regular phone cameras.

See QR_CODE_URL_FORMAT_CHANGE.md for full specifications.
```

---

## 🐛 TROUBLESHOOTING

### Issue: QR codes still showing old format

**Cause:** Using cached stickers or old batch

**Solution:**
- Generate a NEW sticker batch
- Check stickers created AFTER deployment

---

### Issue: Environment variable not working

**Check .env file:**
```bash
cd ~/green-permit-api && grep VERIFICATION_URL .env
```

**If missing, add it:**
```bash
echo "VERIFICATION_URL=https://permitmanager.gifamz.com" >> .env
```

**Restart app:**
```bash
touch app.js
```

---

### Issue: App not restarting

**Check Passenger:**
```bash
# Check if app.js exists
ls -la ~/green-permit-api/app.js

# Check server logs
tail -50 ~/green-permit-api/server.log
```

**Force restart:**
```bash
cd ~/green-permit-api && touch tmp/restart.txt
```

---

## 📊 DEPLOYMENT SUCCESS CRITERIA

- [x] Code pulled successfully ✅
- [x] App restarted (app.js touched) ✅
- [ ] New stickers have URL format in qr_code_url field
- [ ] API health check passes
- [ ] No errors in server logs
- [ ] Mobile team notified
- [ ] Frontend team notified

---

## 🔄 ROLLBACK (If Needed)

If something goes wrong, revert to previous version:

```bash
cd ~/green-permit-api

# Revert to previous commit
git reset --hard 5c202bc

# Restart app
touch app.js
```

**Note:** Rolling back won't affect already-generated stickers.

---

## 📝 DEPLOYMENT LOG

### Deployment Timeline:

- **2026-01-08:** Code committed (1e79bd1)
- **2026-01-08:** Code pushed to GitHub
- **[PENDING]:** Deployed to production
- **[PENDING]:** Mobile team notified
- **[PENDING]:** Frontend team notified

### Who to Notify:

1. **Mobile App Team Lead** - QR scanner update needed
2. **Frontend Team Lead** - Verification page needed
3. **QA Team** - Test new QR codes
4. **Operations** - Monitor for issues

---

## ⚠️ IMPORTANT REMINDERS

1. **Old stickers still work** - No need to reprint existing stickers
2. **Mobile app MUST be updated** - Or activation will fail for new stickers
3. **Frontend page is optional** - But improves user experience
4. **Environment variable is optional** - Has sensible default

---

## 📞 SUPPORT

### If Issues Occur:

1. Check server logs: `tail -f ~/green-permit-api/server.log`
2. Check database: Verify qr_code_url field has URL format
3. Test API health: `curl https://gtech.gifamz.com/api/v1/health`
4. Contact: Backend team

### Emergency Rollback:

If critical issues occur, rollback immediately:
```bash
cd ~/green-permit-api && git reset --hard 5c202bc && touch app.js
```

---

**Ready to Deploy?** Run the command from Step 2! 🚀

```bash
cd ~/green-permit-api && git pull origin main && touch app.js
```
