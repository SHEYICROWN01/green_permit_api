# 🚀 DEPLOY PUBLIC VERIFICATION API - NOW

**Date:** January 8, 2026  
**Commit:** f9a2b2d  
**Status:** ✅ READY TO DEPLOY  
**Priority:** HIGH - Required for QR Code Verification

---

## ✅ WHAT'S READY TO DEPLOY

### 🎯 Public Sticker Verification API

**Endpoint:** `POST /api/v1/public/verify-sticker`

**Features Implemented:**
- ✅ **NO authentication required** (fully public)
- ✅ **Complete sticker information** with LGA name and state
- ✅ **Automatic expiry checking**
- ✅ **Price in naira format** (converted from kobo)
- ✅ **Verification logging** (IP, device, GPS tracking)
- ✅ **Rate limiting** (100 requests/minute for public endpoints)
- ✅ **CORS enabled** (configurable via environment variable)
- ✅ **Backward compatible** (accepts both `code` and `sticker_code`)
- ✅ **Comprehensive error handling**
- ✅ **User-friendly status messages**

---

## 📦 FILES CHANGED

### Backend Code:
1. ✅ `src/models/Sticker.js` - Updated `findByCode()`, `findById()`, and `verify()` methods
2. ✅ `src/controllers/public/verification.controller.js` - Updated to exact API specification
3. ✅ `src/routes/public.routes.js` - Already configured (no changes needed)

### Documentation:
4. ✅ `PUBLIC_VERIFICATION_API.md` - Complete implementation documentation
5. ✅ `PUBLIC_API_QUICK_START.md` - Quick reference for frontend team
6. ✅ `QR_CODE_URL_FORMAT_CHANGE.md` - QR code URL format documentation
7. ✅ `DEPLOY_QR_CODE_URL_FIX.md` - QR code deployment guide

### Testing:
8. ✅ `test-public-verification-api.sh` - Automated test script
9. ✅ `deploy-verification-fix.sh` - Deployment helper script

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Login to cPanel

Go to: **https://cpanel.gifamz.com** or your Namecheap cPanel  
Open: **Terminal** (in Advanced section)

---

### Step 2: Deploy Backend Changes

**Run this ONE command in cPanel Terminal:**

```bash
cd ~/green-permit-api && git pull origin main && touch app.js
```

**Expected Output:**
```
Already on 'main'
Your branch is behind 'origin/main' by 2 commits, and can be fast-forwarded.
Updating 1e79bd1..f9a2b2d
Fast-forward
 PUBLIC_API_QUICK_START.md                         | 350 +++++++++++++++
 PUBLIC_VERIFICATION_API.md                        | 850 ++++++++++++++++++++++++++++++++++
 src/controllers/public/verification.controller.js | 85 ++--
 src/models/Sticker.js                             | 150 +++++--
 test-public-verification-api.sh                   | 300 ++++++++++++
 ...
 16 files changed, 3798 insertions(+), 38 deletions(-)
```

---

### Step 3: Verify Deployment

Check if the app restarted successfully:

```bash
# Check application logs
tail -30 ~/green-permit-api/server.log
```

**Look for:**
```
Server running on port...
Database connected successfully
```

---

### Step 4: Test the API

**Quick Test:**

```bash
curl -X POST https://gtech.gifamz.com/api/v1/public/verify-sticker \
  -H "Content-Type: application/json" \
  -d '{"code": "ONSEY-176757997717816002"}'
```

**Expected Response (if sticker exists):**
```json
{
  "success": true,
  "valid": true,
  "message": "Sticker is valid and active",
  "is_activated": 1,
  "lga_name": "Ifo Local Government",
  "state": "Ogun State",
  "expired": false,
  "code": "ONSEY-176757997717816002",
  "sticker": {
    "id": 128,
    "code": "ONSEY-176757997717816002",
    "lga_name": "Ifo Local Government",
    "state_name": "Ogun State",
    "status": "active",
    "price": "3000.00",
    ...
  }
}
```

---

### Step 5: Run Comprehensive Tests (Optional)

```bash
cd ~/green-permit-api
chmod +x test-public-verification-api.sh
./test-public-verification-api.sh
```

This will test:
- ✅ Valid active stickers
- ✅ Invalid sticker codes
- ✅ Missing parameters
- ✅ Backward compatibility
- ✅ GPS location support
- ✅ Response field validation
- ✅ CORS headers

---

## 🔧 CONFIGURATION (Optional)

### CORS Configuration

If you want to restrict which domains can access the API:

```bash
# Edit .env file
nano ~/green-permit-api/.env

# Add or update this line:
CORS_ORIGIN=https://permitmanager.gifamz.com,http://localhost:5173
```

**Then restart:**
```bash
touch ~/green-permit-api/app.js
```

### Rate Limiting Configuration

Default is 1000 requests/minute. To change:

```bash
# Edit .env file
nano ~/green-permit-api/.env

# Add these lines:
RATE_LIMIT_WINDOW_MS=60000      # 1 minute
RATE_LIMIT_MAX_REQUESTS=100     # 100 requests per minute
```

**Then restart:**
```bash
touch ~/green-permit-api/app.js
```

---

## 📱 FRONTEND TEAM - NEXT STEPS

### 1. Create Verification Page

**Route:** `/verify/:stickerCode`

**Example:** `https://permitmanager.gifamz.com/verify/ONSEY-176757997717816002`

### 2. Implementation Example

```javascript
// pages/VerifySticker.jsx
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function VerifySticker() {
    const { stickerCode } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('https://gtech.gifamz.com/api/v1/public/verify-sticker', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: stickerCode })
        })
        .then(res => res.json())
        .then(data => {
            setData(data);
            setLoading(false);
        })
        .catch(err => {
            console.error('Verification failed:', err);
            setLoading(false);
        });
    }, [stickerCode]);

    if (loading) return <div>Verifying sticker...</div>;
    if (!data) return <div>Failed to verify</div>;

    return (
        <div className="verification-result">
            {/* Display based on status */}
            {data.is_activated === 1 && !data.expired ? (
                <Badge color="green">✅ ACTIVE & VALID</Badge>
            ) : data.is_activated === 0 ? (
                <Badge color="yellow">⚠️ NOT YET ACTIVATED</Badge>
            ) : data.expired ? (
                <Badge color="red">⏰ EXPIRED</Badge>
            ) : (
                <Badge color="red">❌ INVALID</Badge>
            )}

            {data.sticker && (
                <div className="sticker-details">
                    <p><strong>Code:</strong> {data.sticker.code}</p>
                    <p><strong>LGA:</strong> {data.sticker.lga_name}</p>
                    <p><strong>State:</strong> {data.sticker.state_name}</p>
                    <p><strong>Price:</strong> ₦{data.sticker.price}</p>
                    {data.sticker.assigned_to_name && (
                        <>
                            <p><strong>Assigned To:</strong> {data.sticker.assigned_to_name}</p>
                            <p><strong>Phone:</strong> {data.sticker.assigned_to_phone}</p>
                        </>
                    )}
                    {data.sticker.activated_at && (
                        <p><strong>Activated:</strong> {new Date(data.sticker.activated_at).toLocaleDateString()}</p>
                    )}
                    {data.sticker.expires_at && (
                        <p><strong>Expires:</strong> {new Date(data.sticker.expires_at).toLocaleDateString()}</p>
                    )}
                </div>
            )}

            <p className="message">{data.message}</p>
        </div>
    );
}
```

### 3. Documentation for Frontend

Send them these files:
- ✅ `PUBLIC_API_QUICK_START.md` - Quick reference guide
- ✅ `PUBLIC_VERIFICATION_API.md` - Complete API documentation

---

## 📊 TESTING CHECKLIST

After deployment, verify these scenarios:

### Test 1: Active Sticker ✅
```bash
curl -X POST https://gtech.gifamz.com/api/v1/public/verify-sticker \
  -H "Content-Type: application/json" \
  -d '{"code": "ONSEY-176757997717816002"}'
```
**Expected:** `success: true, is_activated: 1`

---

### Test 2: Invalid Sticker ❌
```bash
curl -X POST https://gtech.gifamz.com/api/v1/public/verify-sticker \
  -H "Content-Type: application/json" \
  -d '{"code": "INVALID-000000000000000"}'
```
**Expected:** `success: false, valid: false, sticker: null`

---

### Test 3: Missing Code Parameter ⚠️
```bash
curl -X POST https://gtech.gifamz.com/api/v1/public/verify-sticker \
  -H "Content-Type: application/json" \
  -d '{}'
```
**Expected:** `success: false, message: "Sticker code is required"`

---

### Test 4: Health Check 🏥
```bash
curl https://gtech.gifamz.com/health
```
**Expected:** `{"status": "ok", "timestamp": "..."}`

---

## 📝 DATABASE VERIFICATION

Check if verification logs are being created:

```bash
# Login to MySQL
mysql -u ggtlnplz_gpuser -p'Gifamz@2025@' ggtlnplz_green_permit

# Check recent verification logs
SELECT 
    id,
    sticker_code,
    verification_type,
    verification_result,
    ip_address,
    created_at
FROM sticker_verification_logs
WHERE verification_type = 'public_api'
ORDER BY created_at DESC
LIMIT 10;

# Exit MySQL
exit;
```

**Expected:** Rows with `verification_type = 'public_api'`

---

## 🐛 TROUBLESHOOTING

### Issue 1: API Returns 404

**Problem:** Route not found

**Solution:**
```bash
# Check if routes are loaded
grep -r "public.routes" ~/green-permit-api/src/routes/index.js

# Should see:
# const publicRoutes = require('./public.routes');
# router.use('/public', publicRoutes);
```

---

### Issue 2: Missing LGA Names

**Problem:** `lga_name` is null in response

**Solution:**
```bash
# Check database JOIN
mysql -u ggtlnplz_gpuser -p'Gifamz@2025@' ggtlnplz_green_permit \
  -e "SELECT s.code, l.name as lga_name FROM stickers s 
      LEFT JOIN lgas l ON s.lga_id = l.id 
      WHERE s.code = 'ONSEY-176757997717816002';"
```

---

### Issue 3: CORS Errors

**Problem:** Frontend can't access API

**Solution:**
```bash
# Check CORS configuration
grep CORS_ORIGIN ~/green-permit-api/.env

# If missing, add:
echo "CORS_ORIGIN=https://permitmanager.gifamz.com,http://localhost:5173" >> ~/green-permit-api/.env

# Restart
touch ~/green-permit-api/app.js
```

---

### Issue 4: Rate Limiting Too Strict

**Problem:** Getting 429 errors during testing

**Solution:**
```bash
# Temporarily increase limit for testing
nano ~/green-permit-api/.env

# Change to:
RATE_LIMIT_MAX_REQUESTS=1000

# Restart
touch ~/green-permit-api/app.js

# After testing, reduce back to 100 for production
```

---

## 🔄 ROLLBACK (If Needed)

If something goes wrong:

```bash
cd ~/green-permit-api

# Rollback to previous version
git reset --hard 1e79bd1

# Restart app
touch app.js
```

**Note:** This reverts both QR code URL changes AND public API changes.

---

## 📞 COMMUNICATION

### Message for Frontend Team

```
✅ PUBLIC VERIFICATION API IS LIVE!

Endpoint: POST https://gtech.gifamz.com/api/v1/public/verify-sticker
Documentation: See PUBLIC_API_QUICK_START.md in the repo

Quick Example:
POST https://gtech.gifamz.com/api/v1/public/verify-sticker
Body: {"code": "ONSEY-176757997717816002"}

Response includes:
- success, valid, message
- is_activated (0 or 1)
- lga_name, state
- expired (boolean)
- Full sticker object with all details

NO AUTHENTICATION REQUIRED - Fully public endpoint

Test sticker code: ONSEY-176757997717816002

Please implement the /verify/:code route on your frontend.
Let me know if you need any help!
```

---

### Message for Mobile App Team

```
FYI: PUBLIC VERIFICATION API NOW AVAILABLE

The same verification logic used in the mobile app is now available 
as a public API endpoint for web-based verification.

Endpoint: POST /api/v1/public/verify-sticker

This enables:
- Users scanning QR codes with regular phone cameras
- Web-based sticker verification
- Public verification without app login

Mobile app functionality is NOT affected.
Your existing endpoints continue to work as before.
```

---

## ✅ DEPLOYMENT CHECKLIST

- [x] Code committed to GitHub (commit: f9a2b2d)
- [x] Code pushed to repository
- [x] Documentation created
- [x] Test script created
- [ ] **Deployed to production** ⬅️ DO THIS NOW
- [ ] **Tested with real sticker code**
- [ ] Frontend team notified
- [ ] Mobile team informed (FYI)
- [ ] Verification logs confirmed working
- [ ] CORS tested from frontend domain

---

## 🎯 SUCCESS CRITERIA

After deployment, you should be able to:

1. ✅ Call the API without authentication
2. ✅ Get complete sticker details including LGA name
3. ✅ See verification logs in database
4. ✅ Frontend can access the API (CORS working)
5. ✅ Rate limiting prevents abuse
6. ✅ Error responses are user-friendly

---

## 🚀 DEPLOY NOW!

**Run this command in cPanel Terminal:**

```bash
cd ~/green-permit-api && git pull origin main && touch app.js
```

**Then test:**

```bash
curl -X POST https://gtech.gifamz.com/api/v1/public/verify-sticker \
  -H "Content-Type: application/json" \
  -d '{"code": "ONSEY-176757997717816002"}'
```

**That's it!** The API is ready to use. 🎉

---

**Questions?** Check:
- `PUBLIC_VERIFICATION_API.md` - Full documentation
- `PUBLIC_API_QUICK_START.md` - Quick reference
- `test-public-verification-api.sh` - Run automated tests

**Ready to deploy? Run the command above!** ☝️
