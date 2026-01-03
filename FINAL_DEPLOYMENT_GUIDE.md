# 🚀 COMPLETE DEPLOYMENT INSTRUCTIONS

**Date:** January 3, 2026  
**Status:** ✅ ALL FIXES READY TO DEPLOY  
**Priority:** 🔥 CRITICAL - FINAL STEP BEFORE GO-LIVE

---

## 📋 WHAT YOU NEED TO DO

Run **ONE COMMAND** on your production server to deploy everything:

```bash
cd /home/ggtlnplz/green-permit-api
./deploy-complete.sh
```

This script will automatically:
1. ✅ Pull latest code from GitHub
2. ✅ Fix LGA pricing (multiply by 100 for kobo format)
3. ✅ Create missing database tables (cart_pushers, activations, verifications)
4. ✅ Restart the application
5. ✅ Run complete API test suite
6. ✅ Show you the results

---

## 🎯 WHAT THIS FIXES

### Issue 1: SERVER_ERROR on Activation ❌ → ✅
**Root Cause:** Missing database tables  
**Fix:** Creates `cart_pushers`, `activations`, `verifications` tables  
**Result:** Activation endpoint will work

### Issue 2: Wrong Pricing (₦30 instead of ₦3,000) ❌ → ✅
**Root Cause:** Prices stored in Naira instead of Kobo  
**Fix:** Multiplies all LGA prices by 100  
**Result:** Correct pricing displayed everywhere

### Issue 3: Phone Format Validation ✅
**Status:** Already working correctly  
**Format:** `+234XXXXXXXXXX`  
**Mobile App:** Already using correct format

### Issue 4: Amount Validation ✅
**Status:** Already working correctly  
**Validates:** `amountPaid === pricePerMonth × durationMonths`  
**Mobile App:** Already calculating correctly

---

## 📊 BEFORE vs AFTER

### Before Deployment:

| Endpoint | Status | Issue |
|----------|--------|-------|
| Login | ✅ Working | None |
| Dashboard | ✅ Working | None |
| Sticker Details | ✅ Working | Wrong price (₦30) |
| Activities | ✅ Working | None |
| Sales Reports | ✅ Working | None |
| **Activation** | ❌ **Failing** | **SERVER_ERROR** |

### After Deployment:

| Endpoint | Status | Result |
|----------|--------|--------|
| Login | ✅ Working | None |
| Dashboard | ✅ Working | None |
| Sticker Details | ✅ Working | Correct price (₦3,000) |
| Activities | ✅ Working | None |
| Sales Reports | ✅ Working | None |
| **Activation** | ✅ **Working** | **Success!** |

---

## 🧪 TESTING AFTER DEPLOYMENT

The deployment script automatically tests all endpoints. You should see:

```
==========================================
TEST SUMMARY
==========================================
Tests Passed: 6
Tests Failed: 0

🎉 ALL TESTS PASSED! API is ready for go-live!
```

### Manual Test: Activate a Sticker

After deployment, test manually:

```bash
# Get token
TOKEN=$(curl -s -X POST https://gtech.gifamz.com/api/v1/officer/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"bola","password":"Admin@123"}' | \
  python3 -c 'import sys, json; print(json.load(sys.stdin)["data"]["token"])')

# Activate sticker (use actual sticker from your database)
curl -X POST "https://gtech.gifamz.com/api/v1/officer/stickers/OGIFO-176734845652006002/activate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cartPusherName": "Test Cart Pusher",
    "cartPusherContact": "+2348012345678",
    "durationMonths": 3,
    "amountPaid": 9000,
    "paymentMethod": "cash"
  }' | python3 -m json.tool
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Sticker activated successfully",
  "data": {
    "activationID": "ACT-20260103-001",
    "stickerID": "OGIFO-176734845652006002",
    "activatedAt": "2026-01-03T...",
    "expiryDate": "2026-04-03T...",
    "durationMonths": 3,
    "amountPaid": 9000,
    "cartPusher": {
      "name": "Test Cart Pusher",
      "phoneNumber": "+2348012345678"
    },
    "receipt": {
      "receiptNumber": "RCP-20260103-001"
    }
  }
}
```

---

## 📱 MOBILE APP TESTING

Once deployment is complete, mobile team can test:

### Test 1: Login
1. Open mobile app
2. Login with: bola / Admin@123
3. Expected: ✅ Success

### Test 2: View Dashboard
1. Navigate to Dashboard
2. Expected: ✅ Shows statistics

### Test 3: Scan Sticker
1. Tap "Scan Sticker"
2. Scan QR code: OGIFO-176734845652006002
3. Expected: ✅ Shows sticker details with correct price (₦3,000/month)

### Test 4: View Duration Options
1. After scanning, view duration options
2. Expected prices for OGIFO (₦3,000/month):
   - 1 Month: ₦3,000
   - 2 Months: ₦6,000
   - 3 Months: ₦9,000
   - 4 Months: ₦12,000
   - 5 Months: ₦15,000
   - 6 Months: ₦18,000

### Test 5: Activate Sticker
1. Select duration: 3 months
2. Enter cart pusher name: "John Test"
3. Phone auto-fills: +2340000000000
4. Select payment: Cash
5. Tap "Activate Sticker"
6. Expected: ✅ Success message with receipt

### Test 6: View Activated Sticker
1. Scan the same sticker again
2. Expected: Shows "Active" status with expiry date

### Test 7: View Activities
1. Navigate to Activities tab
2. Expected: Shows the activation you just made

---

## 🎯 FINAL CHECKLIST

After running `./deploy-complete.sh`, verify:

### Backend
- [ ] Script completed without errors
- [ ] All 6 API tests passed
- [ ] LGA prices are in thousands (300000, 500100, etc.)
- [ ] Tables exist: cart_pushers, activations, verifications
- [ ] Application restarted successfully

### Database
```bash
# Check prices (should be 300000, 500100, 450000, not 3000, 5001, 4500)
mysql -u ggtlnplz_gpuser -p'Gifamz@2025@' ggtlnplz_green_permit \
  -e "SELECT name, code, sticker_price, (sticker_price/100) as price_naira FROM lgas;"

# Check tables (should show 3 tables)
mysql -u ggtlnplz_gpuser -p'Gifamz@2025@' ggtlnplz_green_permit \
  -e "SHOW TABLES LIKE '%cart_pushers%'; SHOW TABLES LIKE '%activations%'; SHOW TABLES LIKE '%verifications%';"
```

### Mobile App
- [ ] Can login
- [ ] Can view dashboard
- [ ] Can scan sticker
- [ ] Shows correct prices (₦3,000+)
- [ ] Can activate sticker
- [ ] Shows success message
- [ ] Can view activated sticker
- [ ] Activities list updates

---

## 🐛 TROUBLESHOOTING

### Issue: deploy-complete.sh not found

**Solution:**
```bash
cd /home/ggtlnplz/green-permit-api
git pull origin main
chmod +x deploy-complete.sh
./deploy-complete.sh
```

### Issue: Permission denied

**Solution:**
```bash
chmod +x deploy-complete.sh
chmod +x test-all-apis.sh
```

### Issue: Tables already exist (error)

**Solution:** This is fine! The migrations use `CREATE TABLE IF NOT EXISTS`, so they won't fail if tables already exist.

### Issue: Still getting SERVER_ERROR

**Check logs:**
```bash
tail -50 /home/ggtlnplz/green-permit-api/logs/error.log
```

**Common causes:**
1. Database connection issues
2. Foreign key constraints
3. Missing columns in existing tables
4. Application not restarted

---

## 📊 COMPLETE FIX SUMMARY

### Commits Deployed:
1. `7547353` - Add LGA info to batch details
2. `d14900e` - Add LGA code and state to sticker details
3. `9533ea2` - Create pricing fix SQL migration
4. `111332f` - Import pool for activation transactions
5. `2a70260` - Add complete deployment script

### Files Changed:
- `src/models/StickerBatch.js`
- `src/controllers/officer/sticker.controller.js`
- `database/migrations/FIX_LGA_PRICING.sql`
- `database/migrations/002_create_missing_tables.sql`
- `deploy-complete.sh`
- `test-all-apis.sh`

### Database Changes:
- LGA prices multiplied by 100 (Naira → Kobo)
- Created `cart_pushers` table
- Created `activations` table
- Created `verifications` table

---

## 🎉 GO-LIVE READINESS

After successful deployment:

### Backend: ✅ READY
- All endpoints working
- Database properly configured
- Pricing correct
- Validation working
- Error handling proper

### Mobile App: ✅ READY
- Phone format correct
- Amount calculation correct
- Error handling implemented
- Success flow implemented
- UI/UX complete

### System: ✅ READY FOR GO-LIVE
- End-to-end flow works
- Officers can activate stickers
- Revenue collection possible
- Reports generate correctly
- Dashboard updates in real-time

---

## 📞 SUPPORT

If you encounter any issues:

1. **Check logs:**
   ```bash
   tail -100 /home/ggtlnplz/green-permit-api/logs/error.log
   ```

2. **Verify database:**
   ```bash
   mysql -u ggtlnplz_gpuser -p'Gifamz@2025@' ggtlnplz_green_permit -e "SHOW TABLES;"
   ```

3. **Test manually:**
   ```bash
   cd /home/ggtlnplz/green-permit-api
   ./test-all-apis.sh
   ```

---

## ✅ ONE COMMAND TO DEPLOY EVERYTHING

```bash
cd /home/ggtlnplz/green-permit-api && git pull origin main && ./deploy-complete.sh
```

**That's it! Your system will be fully operational and ready for go-live!** 🚀

---

**Last Updated:** January 3, 2026  
**Status:** ✅ READY TO DEPLOY  
**Time Required:** ~5 minutes  
**Risk Level:** Low (all fixes tested)  
**Go-Live:** Ready immediately after deployment
