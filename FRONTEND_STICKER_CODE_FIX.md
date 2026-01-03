# 🔴 URGENT: Frontend Fix for Sticker Code Column Name

**Issue:** Frontend is using `sticker_code` but backend database column is `code`  
**Impact:** PDF generation failing, sticker management broken  
**Priority:** CRITICAL - Blocks sticker generation workflow

---

## 🐛 Problem

The backend API correctly returns stickers with the `code` property, but the frontend is trying to access `sticker_code` which is undefined, causing this error:

```
Error generating PDF: TypeError: Cannot read properties of undefined (reading 'replace')
    at generatePDF (StickerManagement.tsx:1221:45)
```

### API Response (Correct):
```json
{
  "id": 114,
  "code": "ONSEY-176744285875445013",
  "qr_code_url": "ONSEY-176744285875445013",
  "sticker_code": undefined  // ❌ This doesn't exist!
}
```

---

## ✅ Solution: Replace ALL `sticker_code` with `code`

### Step 1: Find All Occurrences

In your frontend repository, run:

```bash
# Search for all sticker_code references
grep -rn "sticker_code" src/ --include="*.tsx" --include="*.ts"

# Count occurrences
grep -r "sticker_code" src/ --include="*.tsx" --include="*.ts" | wc -l
```

---

## 🔧 Critical Fixes Required

### 1. **StickerManagement.tsx - Line ~1221 (PDF Generation)**

**❌ BEFORE:**
```typescript
// This crashes because sticker.sticker_code is undefined
const sanitizedCode = sticker.sticker_code.replace(/[^a-zA-Z0-9-]/g, '_');
```

**✅ AFTER:**
```typescript
// Use the correct property name
const sanitizedCode = sticker.code.replace(/[^a-zA-Z0-9-]/g, '_');
```

### 2. **TypeScript Interfaces/Types**

**❌ BEFORE:**
```typescript
interface Sticker {
  id: number;
  sticker_code: string;
  qr_code_url: string;
  // ...other fields
}
```

**✅ AFTER:**
```typescript
interface Sticker {
  id: number;
  code: string;  // Changed from sticker_code
  qr_code_url: string;
  // ...other fields
}
```

### 3. **Component Props and State**

**❌ BEFORE:**
```typescript
// Accessing sticker code
const stickerCode = sticker.sticker_code;
const qrValue = sticker.sticker_code;
```

**✅ AFTER:**
```typescript
// Use correct property
const stickerCode = sticker.code;
const qrValue = sticker.code;
```

### 4. **Table Columns / Display Components**

**❌ BEFORE:**
```typescript
<TableCell>{sticker.sticker_code}</TableCell>

// Or in column definitions
{
  field: 'sticker_code',
  headerName: 'Sticker Code',
  // ...
}
```

**✅ AFTER:**
```typescript
<TableCell>{sticker.code}</TableCell>

// Or in column definitions
{
  field: 'code',
  headerName: 'Sticker Code',
  // ...
}
```

### 5. **API Response Handling**

**❌ BEFORE:**
```typescript
const response = await api.get('/stickers');
const codes = response.data.map(s => s.sticker_code);
```

**✅ AFTER:**
```typescript
const response = await api.get('/stickers');
const codes = response.data.map(s => s.code);
```

### 6. **QR Code Generation**

**❌ BEFORE:**
```typescript
<QRCode value={sticker.sticker_code} />

// Or
const qrData = sticker.sticker_code || sticker.qr_code_url;
```

**✅ AFTER:**
```typescript
<QRCode value={sticker.code} />

// Or
const qrData = sticker.code || sticker.qr_code_url;
```

---

## 🔍 Common Locations to Check

1. **StickerManagement.tsx** (Main sticker management component)
   - PDF generation function (~line 1221)
   - Table column definitions
   - Sticker display/preview components
   - QR code rendering

2. **Sticker type definitions** (types.ts, interfaces.ts, or in component files)
   - Interface/type definitions for Sticker objects
   - API response types

3. **API service files** (api.ts, stickerService.ts, etc.)
   - Response data mapping
   - API request/response handlers

4. **Batch management components**
   - Batch details display
   - Sticker list views

5. **PDF/Print components**
   - PDF generation logic
   - Print preview components

---

## 🧪 Testing After Fix

### Test 1: Generate New Stickers
1. Login to super admin dashboard
2. Navigate to Sticker Management
3. Create a new batch
4. Generate stickers
5. **Expected:** PDF generates successfully ✅

### Test 2: View Batch Details
1. Click on any batch (e.g., BATCH-2026-009)
2. View batch details modal
3. **Expected:** Sticker codes display correctly ✅

### Test 3: Download PDF
1. Open batch details
2. Click "Download PDF"
3. **Expected:** PDF downloads with QR codes ✅

### Test 4: Check Console
1. Open browser DevTools console
2. Perform sticker operations
3. **Expected:** No `undefined` errors ✅

---

## 📋 Replacement Checklist

Use this checklist to ensure all occurrences are fixed:

```bash
# Before fixes
- [ ] Run: grep -rn "sticker_code" src/ > before.txt
- [ ] Note the count: grep -r "sticker_code" src/ | wc -l

# During fixes
- [ ] Fix TypeScript interfaces
- [ ] Fix component state/props
- [ ] Fix table columns
- [ ] Fix PDF generation
- [ ] Fix QR code references
- [ ] Fix API response handlers
- [ ] Fix display components

# After fixes
- [ ] Run: grep -rn "sticker_code" src/ > after.txt
- [ ] Count should be 0: grep -r "sticker_code" src/ | wc -l
- [ ] Test all sticker-related features
- [ ] Verify PDF generation works
```

---

## 🚀 Quick Fix Script (Automated)

**⚠️ WARNING:** Back up your code before running automated replacements!

```bash
# Navigate to frontend repository
cd /path/to/frontend-repo

# Backup first!
git add -A
git commit -m "backup: Before sticker_code fix"

# Find and replace (macOS/Linux)
find src/ -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/\.sticker_code/.code/g' {} +

# Find and replace in type definitions
find src/ -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/sticker_code: string/code: string/g' {} +
find src/ -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/sticker_code:/code:/g' {} +
find src/ -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' "s/field: 'sticker_code'/field: 'code'/g" {} +

# Verify changes
git diff

# If looks good, commit
git add -A
git commit -m "fix: Replace sticker_code with code to match backend"
git push origin main
```

---

## 🔗 Backend API Reference

The backend correctly uses `code` in all endpoints:

### Get Sticker Details
```bash
GET /api/v1/officer/stickers/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stickerID": "OGIFO-176734845652006001",  // ✅ Uses 'code' from DB
    "lgaName": "Ifo Local Govt",
    "status": "unused",
    "pricePerMonth": 30,
    "createdAt": "2026-01-02T10:07:36.000Z",
    "activatedAt": null,
    "expiryDate": null,
    "cartPusher": null
  }
}
```

### Get Batch Stickers
```bash
GET /api/v1/super-admin/stickers?batch_id={id}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 114,
      "code": "ONSEY-176744285875445013",  // ✅ Property is 'code'
      "qr_code_url": "ONSEY-176744285875445013",
      "status": "unused",
      "batch_id": 9,
      // ...
    }
  ]
}
```

---

## 📊 Expected Changes Summary

| File Type | Typical Changes |
|-----------|----------------|
| TypeScript Interfaces | 1-5 changes |
| Component Files | 5-20 changes |
| API Service Files | 2-10 changes |
| Table/Display Components | 3-15 changes |
| PDF/Print Components | 2-8 changes |

**Total Expected:** 13-58 occurrences (based on typical React app structure)

---

## ✅ Verification

After making all changes:

1. **No TypeScript Errors:**
   ```bash
   npm run type-check
   # or
   tsc --noEmit
   ```

2. **No Console Errors:**
   - Open DevTools console
   - Should see no `undefined` errors
   - Log shows: `{code: 'ONSEY-176744285875445013', ...}` ✅

3. **PDF Generation Works:**
   - No "Cannot read properties of undefined" error
   - PDF downloads successfully
   - QR codes render correctly

---

## 🆘 Need Help?

If you encounter issues:

1. **Check the API response first:**
   ```javascript
   console.log('🔍 Sticker data from API:', stickerData);
   // Should show 'code', not 'sticker_code'
   ```

2. **Verify TypeScript types match:**
   ```typescript
   // Hover over 'sticker' in VS Code
   // Should show: code: string (not sticker_code: string)
   ```

3. **Test with a single sticker:**
   ```javascript
   const testSticker = stickers[0];
   console.log('Code:', testSticker.code); // ✅ Should work
   console.log('Old:', testSticker.sticker_code); // ❌ Should be undefined
   ```

---

## 📝 Related Documentation

- Backend fix: See commit `d665792` - "fix: Use correct column name 'code'"
- Database schema: `stickers` table uses `code` column (VARCHAR 100, UNIQUE)
- Mobile integration: `MOBILE_INTEGRATION_GUIDE.md`

---

**Last Updated:** January 3, 2026  
**Issue Reported:** PDF generation failing in batch BATCH-2026-009  
**Status:** RESOLVED (Backend) | PENDING (Frontend)
