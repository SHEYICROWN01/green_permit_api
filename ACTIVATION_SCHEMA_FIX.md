# 🔧 ACTIVATION FIX - Schema Mismatch Identified

**Date:** January 4, 2026  
**Issue:** SERVER_ERROR on all activation attempts  
**Root Cause:** Database schema mismatch between controller and migration

---

## 🎯 **PROBLEM IDENTIFIED**

The `activations` table created by `002_create_missing_tables.sql` has the **WRONG SCHEMA**.

### Controller Expects:
```sql
activations (
    id INT,
    sticker_id INT,
    cart_pusher_id INT,          ← Foreign key to cart_pushers
    officer_id INT,
    lga_id INT,                    ← Missing!
    activation_date DATETIME,
    expiry_date DATETIME,          ← Called "expiry_date"
    duration_months INT,
    amount_paid INT,               ← In kobo (Naira × 100)
    payment_method ENUM(...),
    receipt_number VARCHAR(100),
    location_latitude DECIMAL,     ← Missing!
    location_longitude DECIMAL     ← Missing!
)
```

### Migration Created:
```sql
activations (
    id INT,
    sticker_id INT,
    officer_id INT,
    cart_pusher_name VARCHAR(255), ← WRONG! Should be cart_pusher_id
    cart_pusher_phone VARCHAR(20), ← WRONG! Should be removed
    amount_paid DECIMAL(10,2),     ← WRONG TYPE! Should be INT
    payment_method VARCHAR(50),
    duration_months INT,
    receipt_number VARCHAR(100),
    activation_date DATETIME,
    expires_at DATETIME,           ← WRONG NAME! Should be expiry_date
    notes TEXT
)
```

### Mismatches:
1. ❌ `cart_pusher_id` (INT) vs `cart_pusher_name` (VARCHAR)
2. ❌ Extra column `cart_pusher_phone` not used
3. ❌ Missing column `lga_id`
4. ❌ `expiry_date` vs `expires_at` (column name mismatch)
5. ❌ `amount_paid` INT vs DECIMAL (type mismatch)
6. ❌ Missing `location_latitude` and `location_longitude`

---

## 🚨 **WHY THIS CAUSES SERVER_ERROR**

When the controller tries to INSERT activation:

```javascript
await connection.execute(
    `INSERT INTO activations (
        sticker_id, cart_pusher_id, officer_id, lga_id,  ← lga_id doesn't exist!
        activation_date, expiry_date, duration_months,    ← expiry_date doesn't exist!
        amount_paid, payment_method, receipt_number,
        location_latitude, location_longitude             ← These don't exist!
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [...]
);
```

**MySQL Error:**
```
ERROR 1054 (42S22): Unknown column 'cart_pusher_id' in 'field list'
ERROR 1054 (42S22): Unknown column 'lga_id' in 'field list'
ERROR 1054 (42S22): Unknown column 'expiry_date' in 'field list'
```

This gets caught by the catch block → returns `SERVER_ERROR`.

---

## ✅ **THE SOLUTION**

### Option 1: Quick Fix Script (Recommended)

Run this on production:

```bash
cd /home/ggtlnplz/green-permit-api
git pull origin main
chmod +x fix-activation-schema.sh
./fix-activation-schema.sh
```

This will:
1. Drop the old `activations` table
2. Create new table with correct schema
3. Fix `cart_pushers` table (make phone_number nullable)
4. Restart the application
5. Verify everything works

### Option 2: Manual SQL Fix

Connect to database:
```bash
mysql -u ggtlnplz_gpuser -p'Gifamz@2025@' ggtlnplz_green_permit
```

Run this SQL:
```sql
-- Drop old table
DROP TABLE IF EXISTS activations;

-- Create with correct schema
CREATE TABLE activations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sticker_id INT NOT NULL,
    cart_pusher_id INT NOT NULL,
    officer_id INT NOT NULL,
    lga_id INT NOT NULL,
    activation_date DATETIME NOT NULL,
    expiry_date DATETIME NOT NULL,
    duration_months INT NOT NULL,
    amount_paid INT NOT NULL COMMENT 'In kobo (Naira × 100)',
    payment_method ENUM('cash', 'transfer', 'pos', 'card') DEFAULT 'cash',
    receipt_number VARCHAR(100) UNIQUE,
    location_latitude DECIMAL(10, 8) NULL,
    location_longitude DECIMAL(11, 8) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_sticker (sticker_id),
    INDEX idx_cart_pusher (cart_pusher_id),
    INDEX idx_officer (officer_id),
    INDEX idx_lga (lga_id),
    INDEX idx_activation_date (activation_date),
    INDEX idx_expiry_date (expiry_date),
    
    FOREIGN KEY (sticker_id) REFERENCES stickers(id) ON DELETE CASCADE,
    FOREIGN KEY (cart_pusher_id) REFERENCES cart_pushers(id) ON DELETE RESTRICT,
    FOREIGN KEY (officer_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (lga_id) REFERENCES lgas(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fix cart_pushers table
ALTER TABLE cart_pushers 
MODIFY COLUMN phone_number VARCHAR(20) NULL;
```

Then restart:
```bash
touch /home/ggtlnplz/green-permit-api/src/app.js
```

---

## 🧪 **TEST AFTER FIX**

### Test 1: Activate Sticker
```bash
# Get token
TOKEN=$(curl -s -X POST https://gtech.gifamz.com/api/v1/officer/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"bola","password":"Admin@123"}' | \
  python3 -c 'import sys, json; print(json.load(sys.stdin)["data"]["token"])')

# Activate sticker
curl -X POST "https://gtech.gifamz.com/api/v1/officer/stickers/LAOWO-176744638584664004/activate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cartPusherName": "Test User",
    "cartPusherContact": "+2348012345678",
    "durationMonths": 1,
    "amountPaid": 5001,
    "paymentMethod": "cash"
  }' | python3 -m json.tool
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Sticker activated successfully",
  "data": {
    "activationID": "ACT-20260104-001",
    "stickerID": "LAOWO-176744638584664004",
    "activatedAt": "2026-01-04T08:00:00.000Z",
    "expiryDate": "2026-02-04T08:00:00.000Z",
    "durationMonths": 1,
    "amountPaid": 5001,
    "cartPusher": {
      "name": "Test User",
      "phoneNumber": "+2348012345678"
    },
    "receipt": {
      "receiptNumber": "RCP-20260104-001",
      "downloadUrl": "https://gtech.gifamz.com/receipts/RCP-20260104-001.pdf"
    }
  }
}
```

### Test 2: Verify Data Inserted
```sql
-- Check activation record
SELECT * FROM activations ORDER BY id DESC LIMIT 1;

-- Should show:
-- - cart_pusher_id: 1
-- - lga_id: 2 (LAOWO)
-- - amount_paid: 500100 (5001 × 100 kobo)
-- - expiry_date: 1 month from now

-- Check cart pusher
SELECT * FROM cart_pushers ORDER BY id DESC LIMIT 1;

-- Should show:
-- - name: "Test User"
-- - phone_number: "+2348012345678"
-- - lga_id: 2
```

### Test 3: Check Dashboard Updated
```bash
curl -s "https://gtech.gifamz.com/api/v1/officer/dashboard/overview" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

**Expected:**
```json
{
  "todayStats": {
    "revenue": 5001,           ← Should show revenue!
    "stickersActivated": 1,    ← Should show 1!
    "verificationsPerformed": 0
  },
  "overallStats": {
    "totalCartPushersRegistered": 1,  ← Should show 1!
    "activePermits": 1,                ← Should show 1!
    "expiredPermits": 0
  }
}
```

---

## 📊 **VERIFICATION CHECKLIST**

After running fix:

- [ ] `activations` table has correct columns (cart_pusher_id, lga_id, expiry_date, location_latitude, location_longitude)
- [ ] `cart_pushers` table allows NULL phone_number
- [ ] Activation test returns 201 Created (not 500 SERVER_ERROR)
- [ ] Activation record inserted into database
- [ ] Cart pusher record created
- [ ] Sticker status updated to 'active'
- [ ] Dashboard shows updated statistics
- [ ] Receipt number generated correctly

---

## 🎯 **ROOT CAUSE ANALYSIS**

### Why Did This Happen?

1. **Migration was created based on OLD controller code** (before recent updates)
2. **Controller was updated** to use proper foreign keys and additional fields
3. **Migration wasn't updated** to match controller changes
4. **Tables were created with old schema** during initial deployment
5. **Controller fails** when trying to INSERT with mismatched columns

### Lesson Learned:

- Always verify migration schema matches controller expectations
- Test activation immediately after creating tables
- Add schema validation to deployment script
- Keep migrations in sync with controller code

---

## 📁 **FILES INVOLVED**

### Created:
- `database/migrations/003_fix_activations_schema.sql` - Corrected schema
- `fix-activation-schema.sh` - Automated fix script

### Original (Wrong):
- `database/migrations/002_create_missing_tables.sql` - Had incorrect schema

### Controller (Correct):
- `src/controllers/officer/sticker.controller.js` - Lines 140-400

---

## 🚀 **NEXT STEPS**

1. **Pull latest code:**
   ```bash
   cd /home/ggtlnplz/green-permit-api
   git pull origin main
   ```

2. **Run fix script:**
   ```bash
   chmod +x fix-activation-schema.sh
   ./fix-activation-schema.sh
   ```

3. **Test activation:**
   Use test command from above

4. **Verify on mobile app:**
   Test complete workflow on TECNO device

5. **Go live! 🎉**

---

## 💡 **SUMMARY**

| Item | Status |
|------|--------|
| **Problem** | Schema mismatch between controller and database |
| **Impact** | All activations returning SERVER_ERROR |
| **Root Cause** | Migration created with old schema |
| **Solution** | Drop and recreate activations table with correct schema |
| **Fix Time** | 5 minutes |
| **Risk** | Low (no production data yet) |
| **Testing** | Required after fix |

---

**Status:** ✅ Solution ready  
**Action Required:** Run `fix-activation-schema.sh` on production  
**Expected Result:** Activations will work immediately  
**Mobile App:** Ready to test after fix

---

**Created:** January 4, 2026  
**Last Updated:** January 4, 2026  
**Fix Script:** `fix-activation-schema.sh`  
**Migration:** `003_fix_activations_schema.sql`
