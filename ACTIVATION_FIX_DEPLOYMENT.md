# ✅ STICKER ACTIVATION FIX - DEPLOYMENT GUIDE

**Date:** January 3, 2026  
**Time:** 6:15 PM  
**Status:** ✅ FIXED - READY TO DEPLOY  
**Commit:** 111332f  
**Priority:** 🔥 CRITICAL - UNBLOCKS GO-LIVE

---

## 🎯 WHAT WAS FIXED

Fixed the sticker activation endpoint that was returning 503 Service Unavailable.

### Root Cause:
The `activateSticker` function was trying to use `pool.getConnection()` for database transactions, but `pool` was not imported in the controller file.

### Changes Made:
1. ✅ Added `pool` import to sticker.controller.js
2. ✅ Now supports database transactions for atomic activation operations

### Files Modified:
- `src/controllers/officer/sticker.controller.js` (added line 3: `const { pool } = require('../../config/database');`)

---

## 🚀 DEPLOY TO PRODUCTION

### Step 1: Pull Latest Code

```bash
cd /home/ggtlnplz/green-permit-api
git pull origin main
```

**Expected output:**
```
Updating 9533ea2..111332f
Fast-forward
 src/controllers/officer/sticker.controller.js | 1 +
 1 file changed, 1 insertion(+)
```

### Step 2: Restart Application

**Via cPanel:**
1. Go to cPanel → Setup Node.js App
2. Find "green-permit-api"
3. Click "Restart"

**OR via terminal:**
```bash
touch /home/ggtlnplz/green-permit-api/app.js
```

---

## 🧪 TEST THE FIX

### Test 1: Activate a Sticker

```bash
# Step 1: Get auth token
TOKEN=$(curl -s -X POST https://gtech.gifamz.com/api/v1/officer/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"bola","password":"Admin@123"}' | \
  python3 -c 'import sys, json; print(json.load(sys.stdin)["data"]["token"])')

# Step 2: Activate sticker
curl -X POST "https://gtech.gifamz.com/api/v1/officer/stickers/LAOWO-176744638584679001/activate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cartPusherName": "John Test",
    "cartPusherContact": "+2348012345678",
    "durationMonths": 3,
    "amountPaid": 15003,
    "paymentMethod": "cash"
  }' | python3 -m json.tool
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Sticker activated successfully",
  "data": {
    "activationID": "ACT-20260103-001",
    "stickerID": "LAOWO-176744638584679001",
    "activatedAt": "2026-01-03T18:15:00.000Z",
    "expiryDate": "2026-04-03T18:15:00.000Z",
    "durationMonths": 3,
    "amountPaid": 15003,
    "cartPusher": {
      "name": "John Test",
      "phoneNumber": "+2348012345678"
    },
    "officer": {
      "id": "OFF-001",
      "name": "Bola"
    },
    "receipt": {
      "receiptNumber": "RCP-20260103-001",
      "downloadUrl": "https://gtech.gifamz.com/receipts/RCP-20260103-001.pdf"
    }
  }
}
```

### Test 2: Verify Sticker is Now Active

```bash
curl -s "https://gtech.gifamz.com/api/v1/officer/stickers/LAOWO-176744638584679001" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

**Expected:** Status should now be "active" instead of "unused"

### Test 3: Try to Activate Same Sticker Again (Should Fail)

```bash
curl -X POST "https://gtech.gifamz.com/api/v1/officer/stickers/LAOWO-176744638584679001/activate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cartPusherName": "Another Person",
    "cartPusherContact": "+2348087654321",
    "durationMonths": 3,
    "amountPaid": 15003,
    "paymentMethod": "cash"
  }' | python3 -m json.tool
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "This sticker has already been activated",
  "errorCode": "STICKER_ALREADY_ACTIVATED",
  "data": {
    "activatedAt": "2026-01-03T18:15:00.000Z",
    "expiryDate": "2026-04-03T18:15:00.000Z"
  }
}
```

---

## 💡 IMPORTANT: PRICING CALCULATION

The activation endpoint validates that the `amountPaid` matches the expected amount based on:
- **LGA sticker price** (from database)
- **Duration in months**

### Formula:
```
expectedAmount = (LGA_sticker_price_in_kobo / 100) × duration_months
```

### Examples:

**LAOWO LGA (5001 kobo = ₦50.01/month):**
- 1 month: ₦50.01
- 2 months: ₦100.02
- 3 months: ₦150.03
- 6 months: ₦300.06

**OGIFO LGA (3000 kobo = ₦30/month):**
- 1 month: ₦30.00
- 2 months: ₦60.00
- 3 months: ₦90.00
- 6 months: ₦180.00

### ⚠️ After Running Price Fix:

Once you run the `FIX_LGA_PRICING.sql` migration, prices will be:

**LAOWO LGA (500100 kobo = ₦5,001/month):**
- 1 month: ₦5,001.00
- 2 months: ₦10,002.00
- 3 months: ₦15,003.00
- 6 months: ₦30,006.00

**OGIFO LGA (300000 kobo = ₦3,000/month):**
- 1 month: ₦3,000.00
- 2 months: ₦6,000.00
- 3 months: ₦9,000.00
- 6 months: ₦18,000.00

---

## 🔍 TECHNICAL DETAILS

### What the Activation Endpoint Does:

1. **Validates input:**
   - Cart pusher name (required)
   - Cart pusher contact (optional, but validated if provided)
   - Duration (1-6 months)
   - Amount paid (must match expected amount)
   - Payment method (cash, transfer, pos)

2. **Checks sticker status:**
   - Sticker must exist
   - Sticker must be "unused" (not already activated)

3. **Creates/gets cart pusher:**
   - If phone number provided, checks if cart pusher already exists
   - Creates new cart pusher if needed
   - Updates name if cart pusher exists

4. **Calculates expiry date:**
   - activation_date + duration_months

5. **Creates activation record:**
   - Stores all activation details
   - Generates receipt number
   - Stores location if provided

6. **Updates sticker:**
   - Status: unused → active
   - Sets activated_by, activated_at, expires_at
   - Links to cart pusher

7. **Uses database transaction:**
   - All operations atomic (all succeed or all fail)
   - No partial activations
   - Data consistency guaranteed

---

## 🐛 TROUBLESHOOTING

### Issue 1: Still Getting 503 Error

**Solution:**
1. Verify code was pulled: `git log -1 --oneline` (should show commit 111332f)
2. Restart app: `touch /home/ggtlnplz/green-permit-api/app.js`
3. Check if app is running: `ps aux | grep node`
4. Check logs: `tail -50 /home/ggtlnplz/green-permit-api/logs/error.log`

### Issue 2: Amount Validation Fails

**Symptoms:**
```json
{
  "success": false,
  "message": "Amount paid (₦150.00) does not match expected amount (₦150.03)",
  "errorCode": "INVALID_AMOUNT"
}
```

**Solution:**
Mobile app must calculate exact amount:
```javascript
// Get price from API (sticker details endpoint)
const pricePerMonth = stickerData.pricePerMonth; // e.g., 50.01

// Calculate total
const totalAmount = pricePerMonth * selectedDuration; // e.g., 50.01 × 3 = 150.03

// Send exact amount (not rounded!)
const payload = {
  amountPaid: totalAmount, // 150.03
  durationMonths: selectedDuration
};
```

### Issue 3: Phone Number Validation Fails

**Symptoms:**
```json
{
  "success": false,
  "message": "Invalid phone number format. Must be +234XXXXXXXXXX",
  "errorCode": "INVALID_PHONE_NUMBER"
}
```

**Solution:**
Phone number must be in format: `+234XXXXXXXXXX`
- ✅ `+2348012345678` (correct)
- ❌ `08012345678` (missing +234)
- ❌ `2348012345678` (missing +)
- ❌ `+234 801 234 5678` (has spaces)

### Issue 4: Sticker Already Activated

**Symptoms:**
```json
{
  "success": false,
  "message": "This sticker has already been activated",
  "errorCode": "STICKER_ALREADY_ACTIVATED"
}
```

**Solution:**
This is correct behavior! Cannot activate a sticker twice. Use a different unused sticker for testing.

---

## 📱 MOBILE APP INTEGRATION

### Request Format:

```javascript
POST /api/v1/officer/stickers/:stickerId/activate

Headers:
  Authorization: Bearer {token}
  Content-Type: application/json

Body:
{
  "cartPusherName": "John Doe",          // REQUIRED
  "cartPusherContact": "+2348012345678", // OPTIONAL (but must be valid if provided)
  "durationMonths": 3,                   // REQUIRED (1-6)
  "amountPaid": 150.03,                  // REQUIRED (must match expected)
  "paymentMethod": "cash",               // REQUIRED (cash|transfer|pos)
  "locationLatitude": 6.5244,            // OPTIONAL
  "locationLongitude": 3.3792            // OPTIONAL
}
```

### Success Response (201 Created):

```javascript
{
  "success": true,
  "message": "Sticker activated successfully",
  "data": {
    "activationID": "ACT-20260103-001",
    "stickerID": "LAOWO-176744638584679001",
    "activatedAt": "2026-01-03T18:15:00.000Z",
    "expiryDate": "2026-04-03T18:15:00.000Z",
    "durationMonths": 3,
    "amountPaid": 150.03,
    "cartPusher": {
      "name": "John Doe",
      "phoneNumber": "+2348012345678"
    },
    "officer": {
      "id": "OFF-001",
      "name": "Bola"
    },
    "receipt": {
      "receiptNumber": "RCP-20260103-001",
      "downloadUrl": "https://gtech.gifamz.com/receipts/RCP-20260103-001.pdf"
    }
  }
}
```

### Error Responses:

#### 400 - Validation Error
```json
{
  "success": false,
  "message": "Missing required fields: cartPusherName, durationMonths, amountPaid",
  "errorCode": "VALIDATION_ERROR"
}
```

#### 400 - Invalid Amount
```json
{
  "success": false,
  "message": "Amount paid (₦150.00) does not match expected amount (₦150.03) for 3 month(s)",
  "errorCode": "INVALID_AMOUNT",
  "data": {
    "durationMonths": 3,
    "pricePerMonth": 50.01,
    "expectedAmount": 150.03,
    "providedAmount": 150.00
  }
}
```

#### 404 - Sticker Not Found
```json
{
  "success": false,
  "message": "Sticker not found",
  "errorCode": "STICKER_NOT_FOUND"
}
```

#### 400 - Already Activated
```json
{
  "success": false,
  "message": "This sticker has already been activated",
  "errorCode": "STICKER_ALREADY_ACTIVATED",
  "data": {
    "activatedAt": "2026-01-03T18:15:00.000Z",
    "expiryDate": "2026-04-03T18:15:00.000Z"
  }
}
```

#### 422 - Invalid Phone Number
```json
{
  "success": false,
  "message": "Invalid phone number format. Must be +234XXXXXXXXXX",
  "errorCode": "INVALID_PHONE_NUMBER"
}
```

---

## ✅ GO-LIVE CHECKLIST

Before going live:

### Backend
- [ ] Code deployed (commit 111332f)
- [ ] Application restarted
- [ ] Activation endpoint returns 200 OK (not 503)
- [ ] Amount validation working
- [ ] Phone validation working
- [ ] Sticker status updates correctly
- [ ] Cart pusher created correctly
- [ ] Activation record created
- [ ] No errors in logs

### Database
- [ ] `cart_pushers` table exists
- [ ] `activations` table exists
- [ ] `stickers` table has required columns
- [ ] LGA prices are correct (run FIX_LGA_PRICING.sql if needed)

### Mobile App
- [ ] Calculates exact amount (not rounded)
- [ ] Sends phone in correct format (+234XXXXXXXXXX)
- [ ] Handles all error responses
- [ ] Shows success confirmation
- [ ] Updates sticker status in UI
- [ ] Can scan next sticker

### End-to-End Test
- [ ] Login as officer
- [ ] Scan unused sticker
- [ ] View sticker details (gets price)
- [ ] Select duration
- [ ] Enter cart pusher details
- [ ] Activate (success)
- [ ] View updated sticker (now active)
- [ ] Check dashboard (shows new activation)
- [ ] Check activities (shows activation activity)

---

## 🎉 SUCCESS CRITERIA

The fix is successful when:

1. ✅ POST /officer/stickers/:id/activate returns 200/201 (not 503)
2. ✅ Sticker status changes from "unused" to "active"
3. ✅ Cart pusher is created/updated
4. ✅ Activation record is created
5. ✅ Expiry date is calculated correctly
6. ✅ Receipt number is generated
7. ✅ Mobile app shows success message
8. ✅ Dashboard reflects new activation
9. ✅ Activities log shows activation
10. ✅ Cannot activate same sticker twice

---

## 🚨 DEPLOYMENT DEPENDENCIES

### Must be done BEFORE testing:

1. **Run pricing fix (if not done yet):**
   ```bash
   mysql -u ggtlnplz_gpuser -p'Gifamz@2025@' ggtlnplz_green_permit < database/migrations/FIX_LGA_PRICING.sql
   ```

2. **Verify tables exist:**
   ```bash
   mysql -u ggtlnplz_gpuser -p'Gifamz@2025@' ggtlnplz_green_permit -e "SHOW TABLES LIKE '%cart_pushers%';"
   mysql -u ggtlnplz_gpuser -p'Gifamz@2025@' ggtlnplz_green_permit -e "SHOW TABLES LIKE '%activations%';"
   ```

   If tables don't exist, run:
   ```bash
   mysql -u ggtlnplz_gpuser -p'Gifamz@2025@' ggtlnplz_green_permit < database/migrations/002_create_missing_tables.sql
   ```

---

**DEPLOYMENT TIME:** ~2 minutes  
**RISK LEVEL:** Low (only fixes import, doesn't change logic)  
**REQUIRES DATABASE CHANGES:** No (but existing migrations should be run)  
**BLOCKS GO-LIVE:** Yes - this is critical for activation functionality

---

**Last Updated:** January 3, 2026, 6:15 PM  
**Status:** ✅ FIXED AND READY TO DEPLOY  
**Commit:** 111332f  
**Priority:** 🔥 CRITICAL - UNBLOCKS GO-LIVE
