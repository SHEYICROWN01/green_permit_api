# Fix: Sticker PDF Generation Error

**Error:** `ReferenceError: Cannot access 'lgaName' before initialization at renderStickerHTML (StickerManagement.tsx:1331:48)`

**Status:** ⚠️ Frontend code issue - requires manual fix in `StickerManagement.tsx`

---

## 🔍 Problem Analysis

The error occurs because JavaScript variables declared with `const` or `let` are in a "Temporal Dead Zone" (TDZ) from the start of the block until the declaration is reached. Line 1331 is trying to use `lgaName` before line where it's declared with `const`.

### Example of the Problem:
```typescript
// ❌ THIS CAUSES THE ERROR
const renderStickerHTML = async (sticker: any) => {
  console.log('⚠️ No logo found, using placeholder'); // Line 1329
  
  // Line 1331 - Using lgaName in a template string or expression
  const htmlPart1 = `<div>${lgaName}</div>`; // ERROR! lgaName not defined yet
  
  // Line 1335 (or later) - Declaration comes AFTER usage
  const lgaName = sticker.lga_name || 'Unknown LGA';
};
```

---

## ✅ SOLUTION: Step-by-Step Fix

### Step 1: Locate the Problem Code

Open `StickerManagement.tsx` and go to the `renderStickerHTML` function (around line 1320-1350).

Look for this pattern:
```typescript
const renderStickerHTML = async (sticker: any) => {
  console.log('⚠️ No logo found, using placeholder');
  
  // Some code here that uses lgaName...
  
  const lgaName = sticker.lga_name || 'Unknown LGA'; // Declared too late!
};
```

### Step 2: Find Line 1331

**Line 1331 is using `lgaName` BEFORE it's declared.** It might look like:
- `const html = \`...\${lgaName}...\`;`
- `return \`<div>\${lgaName}</div>\`;`
- `const title = lgaName + " Sticker";`
- Or any other usage of `lgaName`

### Step 3: Move ALL Variable Declarations to the TOP

Replace the entire `renderStickerHTML` function with this structure:

```typescript
const renderStickerHTML = async (sticker: any) => {
  // ========================================
  // STEP 1: DECLARE ALL VARIABLES FIRST
  // ========================================
  const lgaName = sticker.lga_name || sticker.lgaName || 'Unknown LGA';
  const lgaCode = sticker.lga_code || sticker.lgaCode || '';
  const stickerCode = sticker.sticker_code || sticker.stickerCode || '';
  const stickerPrefix = sticker.prefix || '';
  const stickerNumber = sticker.sticker_number || sticker.stickerNumber || '';
  const vehicleNumber = sticker.vehicle_number || sticker.vehicleNumber || '';
  const vehicleType = sticker.vehicle_type || sticker.vehicleType || '';
  const ownerName = sticker.owner_name || sticker.ownerName || '';
  const phoneNumber = sticker.phone_number || sticker.phoneNumber || '';
  const address = sticker.address || '';
  const expiryDate = sticker.expiry_date || sticker.expiryDate || '';
  const issueDate = sticker.issue_date || sticker.issueDate || new Date().toISOString().split('T')[0];
  
  // ========================================
  // STEP 2: LOGGING (After variables are declared)
  // ========================================
  console.log('⚠️ No logo found, using placeholder');
  console.log('🔍 Rendering sticker:', stickerCode, 'for', lgaName);
  
  // ========================================
  // STEP 3: GENERATE HTML (Now you can use all variables safely)
  // ========================================
  const logoUrl = `/api/v1/public/lga-logo/${lgaCode}` || 'data:image/svg+xml,...'; // Your placeholder
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        .sticker {
          width: 100mm;
          height: 100mm;
          border: 2px solid #000;
          padding: 10px;
          font-family: Arial, sans-serif;
        }
        .header {
          text-align: center;
          font-weight: bold;
          font-size: 18px;
          margin-bottom: 10px;
        }
        .logo {
          width: 50px;
          height: 50px;
          margin: 0 auto 10px;
          display: block;
        }
        .code {
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          margin: 10px 0;
          color: #d32f2f;
        }
        .details {
          font-size: 12px;
          line-height: 1.6;
        }
        .qr-code {
          text-align: center;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="sticker">
        <img src="${logoUrl}" alt="LGA Logo" class="logo" />
        <div class="header">${lgaName}</div>
        <div class="code">${stickerCode}</div>
        <div class="details">
          <div><strong>Vehicle:</strong> ${vehicleNumber}</div>
          <div><strong>Type:</strong> ${vehicleType}</div>
          <div><strong>Owner:</strong> ${ownerName}</div>
          <div><strong>Phone:</strong> ${phoneNumber}</div>
          <div><strong>Issued:</strong> ${issueDate}</div>
          <div><strong>Expires:</strong> ${expiryDate}</div>
        </div>
        <div class="qr-code">
          <!-- QR Code generation here -->
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${stickerCode}" alt="QR Code" />
        </div>
      </div>
    </body>
    </html>
  `;
};
```

---

## 🎯 Quick Fix Template

If you want to keep your existing HTML structure, just ensure this order:

```typescript
const renderStickerHTML = async (sticker: any) => {
  // 1️⃣ DECLARE EVERYTHING FIRST (lines should be before 1331)
  const lgaName = sticker.lga_name || 'Unknown LGA';
  const stickerCode = sticker.sticker_code || '';
  // ... all other variables
  
  // 2️⃣ THEN your existing code (logging, HTML generation, etc.)
  console.log('⚠️ No logo found, using placeholder');
  
  // 3️⃣ NOW you can safely use lgaName anywhere
  return `your HTML with ${lgaName} and ${stickerCode}`;
};
```

---

## 🐛 Debugging Steps

### Step A: Add Debug Logging

Add this at the **very top** of `renderStickerHTML`:

```typescript
const renderStickerHTML = async (sticker: any) => {
  console.log('🔍 DEBUG: Sticker object received:', sticker);
  console.log('🔍 DEBUG: Available keys:', Object.keys(sticker));
  console.log('🔍 DEBUG: lga_name value:', sticker.lga_name);
  console.log('🔍 DEBUG: lgaName value:', sticker.lgaName);
  
  // NOW declare variables based on what you see in the console
  const lgaName = sticker.lga_name || sticker.lgaName || 'Unknown LGA';
  
  // Rest of your code...
};
```

### Step B: Check API Response

The logs show: `📄 Stickers response for PDF: (10) [{…}, {…}, ...]`

Expand one of those objects in your browser console to see the actual property names:
1. Open Chrome DevTools (F12)
2. Click on the `[{…}, {…}, ...]` in the console
3. Expand the first object
4. Check if the property is `lga_name` or `lgaName` or something else

### Step C: Verify Data Structure

Add this in the `generatePDF` function before calling `renderStickerHTML`:

```typescript
const generatePDF = async (batchId: string) => {
  try {
    const response = await fetch(`/api/v1/admin/stickers/batch/${batchId}`);
    const data = await response.json();
    
    console.log('📄 Stickers response for PDF:', data.data);
    console.log('📄 Stickers array:', data.data?.stickers?.length, 'stickers');
    
    const stickers = data.data?.stickers || [];
    
    // 🔍 ADD THIS DEBUG LINE
    console.log('📄 First sticker structure:', JSON.stringify(stickers[0], null, 2));
    
    // Generate HTML for each sticker
    const htmlPromises = stickers.map(sticker => renderStickerHTML(sticker));
    const htmlArray = await Promise.all(htmlPromises);
    
    // ... rest of code
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};
```

---

## 📋 Checklist

- [ ] Open `StickerManagement.tsx`
- [ ] Find the `renderStickerHTML` function (around line 1320)
- [ ] Identify line 1331 that's using `lgaName`
- [ ] Move ALL `const` declarations to the TOP of the function (before line 1331)
- [ ] Ensure `lgaName` is declared before line 1331
- [ ] Save the file
- [ ] Refresh your browser
- [ ] Test PDF generation again

---

## 🔧 Alternative: Use Function Parameters

If the above doesn't work, you might have a scope issue. Try this approach:

```typescript
const renderStickerHTML = async (sticker: any) => {
  // Destructure everything at the top
  const {
    lga_name = 'Unknown LGA',
    lga_code = '',
    sticker_code = '',
    vehicle_number = '',
    vehicle_type = '',
    owner_name = '',
    phone_number = '',
    issue_date = new Date().toISOString().split('T')[0],
    expiry_date = ''
  } = sticker;
  
  // Rename if needed
  const lgaName = lga_name;
  const lgaCode = lga_code;
  const stickerCode = sticker_code;
  
  console.log('⚠️ No logo found, using placeholder');
  
  // Now use the variables
  return `HTML with ${lgaName} and ${stickerCode}`;
};
```

---

## 🆘 Still Not Working?

If you've tried everything above and it still doesn't work, please share:

1. **Lines 1320-1340** of your `StickerManagement.tsx` file
2. The full `renderStickerHTML` function
3. A screenshot of the expanded sticker object from the console

Then I can provide a more specific fix!

---

## ✅ Expected Result

After the fix, you should see:
```
📄 Stickers response for PDF: (10) [{…}, {…}, ...]
📄 Stickers array: 10 stickers
⚠️ No logo found, using placeholder
🔍 Rendering sticker: IFO-CP-0001 for Ifo Local Government
✅ PDF generated successfully!
```

No more `ReferenceError: Cannot access 'lgaName' before initialization` errors!
