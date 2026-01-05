# 🚨 FRONTEND PRICING DISPLAY FIX - URGENT

**Date:** January 5, 2026  
**Issue:** Web dashboard showing wrong prices (300,000 instead of 3,000)  
**Root Cause:** Backend sends prices in **KOBO**, frontend needs to **divide by 100**  
**Priority:** 🔥 CRITICAL

---

## 🎯 THE PROBLEM

### Current Situation:
- **Mobile App:** Correctly shows ₦3,000 ✅
- **Web Dashboard:** Incorrectly shows ₦300,000 ❌

### Root Cause:
The **backend API stores and sends all prices in KOBO** (smallest currency unit), but the **web frontend is displaying the raw KOBO value without converting to Naira**.

### Example:
- Database value: `300000` (kobo)
- Mobile app displays: `₦3,000` (300000 ÷ 100) ✅ CORRECT
- Web displays: `₦300,000` (raw value) ❌ WRONG

---

## 💡 THE SOLUTION FOR FRONTEND TEAM

### What They Need to Do:

**Divide all prices received from the API by 100 before displaying them.**

---

## 📋 INSTRUCTIONS TO GIVE YOUR FRONTEND TEAM

### Quick Fix Summary:
```
"The backend API sends all prices in KOBO (smallest currency unit).
You need to divide any price value by 100 before displaying it to users.

Example:
- API returns: sticker_price: 300000
- Display as: ₦3,000 (300000 / 100)
```

---

## 🔧 TECHNICAL DETAILS FOR FRONTEND DEVELOPERS

### 1. **Price Fields Affected**

All these fields from the API are in KOBO and need conversion:

```javascript
// LGA Endpoints
{
  "sticker_price": 300000,           // Divide by 100 → ₦3,000
  "sticker_price_formatted": "..."  // If provided, use this directly
}

// Sticker Endpoints
{
  "pricePerMonth": 3400,            // Already converted by backend ✅
  "price_per_month": 340000,        // Divide by 100 → ₦3,400
  "sticker_price": 300000           // Divide by 100 → ₦3,000
}

// Activation/Revenue
{
  "amount_paid": 1020000,           // Divide by 100 → ₦10,200
  "total_revenue": 5000000          // Divide by 100 → ₦50,000
}
```

### 2. **Where to Apply the Fix**

#### Option A: Create a Utility Function (RECOMMENDED)

```javascript
/**
 * Convert kobo to Naira
 * @param {number} kobo - Amount in kobo
 * @returns {number} Amount in Naira
 */
export const koboToNaira = (kobo) => {
  if (!kobo || isNaN(kobo)) return 0;
  return parseFloat((kobo / 100).toFixed(2));
};

/**
 * Format kobo as Naira currency
 * @param {number} kobo - Amount in kobo
 * @returns {string} Formatted currency string
 */
export const formatKoboAsNaira = (kobo) => {
  const naira = koboToNaira(kobo);
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(naira);
};

// USAGE EXAMPLES:
koboToNaira(300000)           // Returns: 3000
formatKoboAsNaira(300000)     // Returns: "₦3,000"
formatKoboAsNaira(340000)     // Returns: "₦3,400"
formatKoboAsNaira(450000)     // Returns: "₦4,500"
```

#### Option B: Fix Inline (Quick Fix)

**Find all places displaying prices and update:**

```javascript
// BEFORE (WRONG):
<div>₦{lga.sticker_price.toLocaleString()}</div>
// Shows: ₦300,000 ❌

// AFTER (CORRECT):
<div>₦{(lga.sticker_price / 100).toLocaleString()}</div>
// Shows: ₦3,000 ✅
```

### 3. **React/Vue Component Examples**

#### React Example:

```jsx
import { formatKoboAsNaira } from '@/utils/currency';

function LGACard({ lga }) {
  return (
    <div className="lga-card">
      <h3>{lga.name}</h3>
      <div className="price-section">
        <label>STICKER PRICE</label>
        {/* OPTION 1: Use utility function */}
        <p className="price">{formatKoboAsNaira(lga.sticker_price)}</p>
        
        {/* OPTION 2: Inline conversion */}
        <p className="price">
          ₦{(lga.sticker_price / 100).toLocaleString()}
        </p>
      </div>
      <div className="revenue">
        Revenue: {formatKoboAsNaira(lga.total_revenue)}
      </div>
    </div>
  );
}
```

#### Vue Example:

```vue
<template>
  <div class="lga-card">
    <h3>{{ lga.name }}</h3>
    <div class="price-section">
      <label>STICKER PRICE</label>
      <!-- OPTION 1: Use utility method -->
      <p class="price">{{ formatKoboAsNaira(lga.sticker_price) }}</p>
      
      <!-- OPTION 2: Inline conversion -->
      <p class="price">
        ₦{{ (lga.sticker_price / 100).toLocaleString() }}
      </p>
    </div>
  </div>
</template>

<script>
import { formatKoboAsNaira } from '@/utils/currency';

export default {
  methods: {
    formatKoboAsNaira
  }
}
</script>
```

### 4. **Files to Check**

Tell them to search their codebase for:

```bash
# Search for price-related variables
- "sticker_price"
- "price_per_month"
- "amount_paid"
- "total_revenue"
- "pricePerMonth"
- Any field ending in "_price" or starting with "price_"
```

**Common locations:**
- Dashboard components (LGA cards, statistics)
- Sticker detail pages
- Revenue reports
- Pricing tables
- Payment summaries
- Charts/graphs showing financial data

### 5. **Check for Backend Fields**

Some fields are **already converted** by the backend:

```javascript
// These are ALREADY in Naira (don't divide again):
{
  "pricePerMonth": 3400,              // ✅ Already in Naira
  "amountPaid": 10200,                // ✅ Already in Naira (if from formatted response)
  "sticker_price_formatted": "₦3,000" // ✅ Already formatted
}

// These are in KOBO (need conversion):
{
  "sticker_price": 340000,            // ❌ Divide by 100
  "price_per_month": 340000,          // ❌ Divide by 100
  "total_revenue": 5000000            // ❌ Divide by 100
}
```

**How to identify:** If the value looks like it should be ₦3,000 but shows ₦300,000, it needs conversion.

---

## 🧪 TESTING THE FIX

### Test Cases for Frontend Team:

1. **LGA Dashboard Cards**
   - ✅ Oluwaseyi LGA: Should show ₦3,000 (not ₦300,000)
   - ✅ Seyi LGA: Should show ₦4,500 (not ₦450,000)
   - ✅ Oworo LGA: Should show ₦5,001 (not ₦500,100)
   - ✅ Ifo Local Govt: Should show ₦3,000 (not ₦300,000)

2. **Sticker Details**
   - ✅ Monthly price should be in thousands (₦3,000-₦5,000 range)
   - ✅ Not in hundreds of thousands

3. **Revenue Reports**
   - ✅ Total revenue should make sense
   - ✅ If 10 stickers at ₦3,000 each = ₦30,000 (not ₦3,000,000)

### Visual Check:
```
WRONG ❌          CORRECT ✅
₦300,000    →     ₦3,000
₦450,000    →     ₦4,500
₦500,100    →     ₦5,001
₦340,000    →     ₦3,400
```

---

## 📝 WHY THE BACKEND USES KOBO

### Technical Reason:
Storing prices in the **smallest currency unit (kobo)** is a standard practice because:

1. **No decimal precision loss** in database (integer vs float)
2. **Accurate calculations** (no rounding errors)
3. **Payment gateway compatibility** (Paystack, Flutterwave use kobo)
4. **Standard practice** in financial applications

### Analogy:
- Just like credit card amounts are stored in **cents** ($1.00 = 100 cents)
- Nigerian Naira amounts are stored in **kobo** (₦1.00 = 100 kobo)

**The mobile app already handles this correctly.** The web frontend just needs to do the same.

---

## 🚀 DEPLOYMENT STEPS FOR FRONTEND TEAM

1. **Create utility function** (`utils/currency.js`)
2. **Find all price displays** (search for "sticker_price", "amount", "revenue")
3. **Apply conversion** (divide by 100 or use utility function)
4. **Test on development** (verify all prices look correct)
5. **Deploy to production**

---

## ⚠️ IMPORTANT NOTES

### DO NOT:
- ❌ Don't ask backend to change API responses
- ❌ Don't multiply/divide randomly without understanding
- ❌ Don't convert the same value twice (check if already converted)

### DO:
- ✅ Create a reusable utility function
- ✅ Apply consistently across all components
- ✅ Test with real data from production API
- ✅ Document which fields are in kobo vs naira

---

## 🆘 IF THEY NEED HELP

### Questions to Ask Them:

1. **"What framework are you using?"** (React, Vue, Angular, etc.)
2. **"Where are you displaying LGA prices?"** (which components/files)
3. **"Do you have a utils/helpers folder?"** (where to put utility function)
4. **"Can you show me the API response?"** (to verify structure)

### Example API Response (for reference):

```json
GET /api/v1/super-admin/lgas
{
  "success": true,
  "data": {
    "lgas": [
      {
        "id": 1,
        "name": "Oluwaseyi LGA",
        "state": "Lagos State",
        "sticker_price": 300000,  // ← THIS IS IN KOBO (₦3,000)
        "stats": {
          "total_revenue": 5000000  // ← THIS IS IN KOBO (₦50,000)
        }
      }
    ]
  }
}
```

### Quick Test Command:

```bash
# They can test the API directly:
curl https://gtech.gifamz.com/api/v1/super-admin/lgas | jq '.data.lgas[0].sticker_price'

# Expected: 300000 (kobo)
# Display as: ₦3,000 (naira)
```

---

## 📞 SUMMARY MESSAGE TO SEND

**Copy-paste this to your frontend team:**

---

**Subject: URGENT - Fix LGA Sticker Price Display**

Hi Frontend Team,

We've identified why the web dashboard is showing incorrect prices (₦300,000 instead of ₦3,000).

**Problem:** The backend API sends all prices in **kobo** (smallest currency unit), but the web is displaying the raw kobo value without converting to Naira.

**Solution:** Divide all price values by 100 before displaying them.

**Example:**
- API returns: `sticker_price: 300000` (kobo)
- Display as: `₦3,000` (300000 ÷ 100)

The mobile app already does this correctly. Please apply the same conversion on the web.

**Fields to fix:**
- `sticker_price`
- `price_per_month`
- `amount_paid`
- `total_revenue`
- Any other price/amount fields

**Utility function example:**
```javascript
export const formatKoboAsNaira = (kobo) => {
  const naira = kobo / 100;
  return `₦${naira.toLocaleString()}`;
};
```

**Test cases:**
- Oluwaseyi LGA: Should show ₦3,000 (currently shows ₦300,000)
- Seyi LGA: Should show ₦4,500 (currently shows ₦450,000)

See attached document `FRONTEND_PRICING_DISPLAY_FIX.md` for complete details.

Please prioritize this fix as it's blocking production launch.

Thanks!

---

## ✅ CHECKLIST FOR FRONTEND TEAM

- [ ] Read this document completely
- [ ] Create `utils/currency.js` with conversion functions
- [ ] Search codebase for all price-related displays
- [ ] Apply conversion (÷ 100) to all kobo values
- [ ] Test on development environment
- [ ] Verify all prices match mobile app
- [ ] Deploy to production
- [ ] Confirm with screenshots that prices are correct

---

## 📸 BEFORE & AFTER EXAMPLES

### BEFORE (Wrong):
```
Oluwaseyi LGA
Lagos State
STICKER PRICE
₦300,000 per month    ← WRONG
```

### AFTER (Correct):
```
Oluwaseyi LGA
Lagos State
STICKER PRICE
₦3,000 per month      ← CORRECT
```

---

**End of Document**
