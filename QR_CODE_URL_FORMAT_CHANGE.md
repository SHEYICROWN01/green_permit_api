# ✅ QR CODE URL FORMAT CHANGE

**Date:** January 8, 2026  
**Status:** ✅ IMPLEMENTED  
**Priority:** Medium  
**Impact:** QR codes, Mobile app, Public verification

---

## 🎯 WHAT CHANGED

### Before:
QR codes contained only the sticker code:
```
ONSEY-176757997717816002
```

### After:
QR codes now contain a full verification URL:
```
https://permitmanager.gifamz.com/verify/ONSEY-176757997717816002
```

---

## 💡 WHY THIS CHANGE?

### Problem:
- Regular phone cameras can't open a website from just a code
- Users had to manually type the code into a website
- Poor user experience for public verification

### Solution:
- QR codes now contain full URLs
- Any phone camera can scan and open the verification page directly
- Better user experience for cart pushers and public

---

## 📝 CHANGES MADE

### File: `src/utils/stickerCodeGenerator.js`

**Function:** `generateQRCodeData(stickerCode)`

**Old Implementation:**
```javascript
function generateQRCodeData(stickerCode) {
    return stickerCode;  // Just the code
}
```

**New Implementation:**
```javascript
function generateQRCodeData(stickerCode) {
    const baseUrl = process.env.VERIFICATION_URL || 'https://permitmanager.gifamz.com';
    return `${baseUrl}/verify/${stickerCode}`;  // Full URL
}
```

---

## 🔧 CONFIGURATION

### Environment Variable (Optional):

Add to `.env` file to customize the base URL:

```env
VERIFICATION_URL=https://permitmanager.gifamz.com
```

**Default:** `https://permitmanager.gifamz.com` (if not set)

---

## 📱 MOBILE APP TEAM INSTRUCTIONS

### ⚠️ BREAKING CHANGE FOR MOBILE APP

Your QR scanner will now receive a **URL** instead of just a code.

### What You Need to Do:

#### Option 1: Extract Code from URL (Recommended)

Update your QR scanner to extract the sticker code from the URL:

```javascript
// When QR code is scanned
function onQRCodeScanned(qrData) {
    let stickerCode;
    
    // Check if it's a URL or just a code
    if (qrData.includes('/verify/')) {
        // New format: Extract code from URL
        const parts = qrData.split('/verify/');
        stickerCode = parts[1];
    } else {
        // Old format: Use as-is (for backward compatibility)
        stickerCode = qrData;
    }
    
    // Continue with activation
    activateSticker(stickerCode);
}
```

#### Option 2: Handle Both Formats

```javascript
function extractStickerCode(qrData) {
    // Try to extract from URL first
    const urlMatch = qrData.match(/\/verify\/([A-Z0-9-]+)/);
    if (urlMatch) {
        return urlMatch[1];  // Return code from URL
    }
    
    // If not a URL, assume it's just the code
    return qrData;
}

// Usage
const stickerCode = extractStickerCode(scannedData);
activateSticker(stickerCode);
```

#### Option 3: Regex Pattern Matching

```javascript
function getStickerCodeFromQR(qrData) {
    // Pattern: LGA_CODE-DIGITS
    const codePattern = /([A-Z]{2,10}-\d{13,20})/;
    const match = qrData.match(codePattern);
    
    return match ? match[1] : qrData;
}
```

---

## 🌐 FRONTEND WEB TEAM INSTRUCTIONS

### Verification Page Route

Create or update the verification page route:

**Route:** `/verify/:stickerCode`

**Example URLs:**
```
https://permitmanager.gifamz.com/verify/ONSEY-176757997717816002
https://permitmanager.gifamz.com/verify/LAOWO-176744638584664004
https://permitmanager.gifamz.com/verify/OGIFO-176734845652006001
```

### Implementation Example (React Router):

```javascript
// routes.js
import VerifySticker from './pages/VerifySticker';

const routes = [
    {
        path: '/verify/:stickerCode',
        component: VerifySticker
    }
];
```

### Verification Page Component:

```javascript
// pages/VerifySticker.jsx
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function VerifySticker() {
    const { stickerCode } = useParams();
    const [stickerData, setStickerData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        // Call backend verification API
        fetch(`/api/v1/officer/stickers/${stickerCode}/verify`)
            .then(res => res.json())
            .then(data => {
                setStickerData(data.data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Verification failed:', err);
                setLoading(false);
            });
    }, [stickerCode]);
    
    if (loading) return <div>Verifying sticker...</div>;
    
    return (
        <div className="verify-page">
            <h1>Sticker Verification</h1>
            <div className="sticker-code">{stickerCode}</div>
            
            {stickerData ? (
                <div className="verification-result">
                    <p>Status: {stickerData.status}</p>
                    <p>LGA: {stickerData.lgaName}</p>
                    <p>Valid: {stickerData.isValid ? 'Yes' : 'No'}</p>
                    {/* Add more details */}
                </div>
            ) : (
                <div className="error">Sticker not found</div>
            )}
        </div>
    );
}
```

---

## 🧪 TESTING

### Test Case 1: Generate New Sticker

```bash
# Generate a new batch of stickers
# Check the qr_code_url field in database

mysql> SELECT id, code, qr_code_url FROM stickers ORDER BY id DESC LIMIT 5;
```

**Expected:**
```
qr_code_url: https://permitmanager.gifamz.com/verify/ONSEY-176757997717816002
```

### Test Case 2: Scan with Phone Camera

1. Generate a QR code with the new URL format
2. Print or display on screen
3. Scan with regular phone camera (not app)
4. Should open: `https://permitmanager.gifamz.com/verify/{CODE}`

### Test Case 3: Mobile App Scanning

1. Scan QR code with mobile app
2. App should extract code from URL
3. Activation should work as before

---

## 🔄 BACKWARD COMPATIBILITY

### Old Stickers (Already Printed)

Old stickers have QR codes with just the code (no URL).

**Mobile App Solution:**
The code extraction logic handles both formats:
- New format: Extracts code from URL
- Old format: Uses code directly

**No changes needed for old stickers!** ✅

---

## 🚀 DEPLOYMENT

### Step 1: Backend Deployment

```bash
# Commit changes
git add src/utils/stickerCodeGenerator.js QR_CODE_URL_FORMAT_CHANGE.md
git commit -m "feat: update QR codes to include full verification URL

- QR codes now contain: https://permitmanager.gifamz.com/verify/{CODE}
- Regular phone cameras can scan and open verification page directly
- Configurable via VERIFICATION_URL environment variable
- Mobile apps need to extract code from URL (backward compatible)

Improves user experience for public sticker verification.
Maintains backward compatibility with existing stickers."

# Push to GitHub
git push origin main

# Deploy to production
cd ~/green-permit-api && git pull origin main && touch app.js
```

### Step 2: Environment Variable (Optional)

Add to production `.env` if you want to customize:

```bash
echo "VERIFICATION_URL=https://permitmanager.gifamz.com" >> .env
```

### Step 3: Coordinate with Teams

**Mobile App Team:**
- Update QR scanner to extract code from URL
- Test with both old and new QR formats
- Deploy updated app version

**Frontend Team:**
- Implement `/verify/:stickerCode` route
- Create verification page
- Test with sample sticker codes

---

## 📊 IMPACT ANALYSIS

### Affected Systems:

1. **Backend API:** ✅ Fixed (QR code generation)
2. **Database:** ⚠️ New stickers will have URL format
3. **Mobile App:** ⚠️ Needs update to extract code from URL
4. **Frontend Web:** ⚠️ Needs verification page route
5. **QR Code Printers:** ✅ No change (still print QR codes)

### Data Migration:

**Not needed!** Old stickers work as-is. Only new stickers get URL format.

---

## 🎯 USER EXPERIENCE

### Before:
1. User scans QR code with phone
2. Phone shows: "ONSEY-176757997717816002"
3. User has to manually open browser and type code
4. ❌ Poor experience

### After:
1. User scans QR code with phone
2. Phone automatically opens: `permitmanager.gifamz.com/verify/ONSEY-...`
3. Website shows verification details
4. ✅ Great experience!

---

## ⚠️ IMPORTANT NOTES

### For Mobile App Developers:

1. **Update scanner BEFORE backend deployment** (for smooth transition)
2. **Handle both formats** (URL and plain code) for backward compatibility
3. **Test thoroughly** with both old and new QR codes

### For Frontend Developers:

1. **Create verification page** at `/verify/:stickerCode`
2. **Make it public** (no authentication required)
3. **Mobile-friendly design** (users will open on phones)
4. **Show clear verification status** (valid/invalid, activated/unused)

### For Backend Developers:

1. **Environment variable is optional** (has sensible default)
2. **Existing stickers unchanged** (only new ones get URL format)
3. **No database migration needed**

---

## 📞 COMMUNICATION

### Message for Mobile App Team:

```
IMPORTANT: QR Code Format Change

Starting [DATE], QR codes will contain full URLs instead of just codes.

OLD FORMAT: ONSEY-176757997717816002
NEW FORMAT: https://permitmanager.gifamz.com/verify/ONSEY-176757997717816002

ACTION REQUIRED:
Update your QR scanner to extract the code from the URL.

Code example provided in: QR_CODE_URL_FORMAT_CHANGE.md

Please update and test before [DEPLOYMENT DATE].
```

### Message for Frontend Team:

```
NEW FEATURE: Public Sticker Verification Page

We're adding full URLs to QR codes so users can verify stickers easily.

REQUIRED: Implement route: /verify/:stickerCode

This page should:
- Be publicly accessible (no login)
- Call: GET /api/v1/officer/stickers/:code/verify
- Display sticker status, LGA, validity, etc.
- Be mobile-friendly

Details in: QR_CODE_URL_FORMAT_CHANGE.md
```

---

## ✅ CHECKLIST

### Backend Team:
- [x] Update QR code generation function
- [x] Add environment variable support
- [ ] Commit and push changes
- [ ] Deploy to production
- [ ] Verify new stickers have URL format

### Mobile App Team:
- [ ] Update QR scanner logic
- [ ] Test with old format (plain code)
- [ ] Test with new format (URL)
- [ ] Deploy updated app
- [ ] Confirm activation works

### Frontend Team:
- [ ] Create `/verify/:stickerCode` route
- [ ] Implement verification page
- [ ] Test with sample codes
- [ ] Deploy to production
- [ ] Verify page opens from QR scan

---

**Document Version:** 1.0  
**Last Updated:** January 8, 2026  
**Status:** Backend Ready, Waiting for Frontend/Mobile
