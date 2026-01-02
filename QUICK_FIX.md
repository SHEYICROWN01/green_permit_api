# 🚀 QUICK START: Fix Production Now!

## ⚡ Super Fast Fix (2 Minutes)

### 1️⃣ SSH into cPanel Terminal
Log into: `https://gtech.gifamz.com:2083` → Click **Terminal**

### 2️⃣ Run These Commands
```bash
cd ~/green-permit-api
git pull origin main
node scripts/fix-officer-code-simple.js
pm2 list
pm2 restart all
```

### 3️⃣ Done! ✅
Test: `https://gtech.gifamz.com/api/v1/admin/officers`

---

## 🆘 If Script Fails: Manual SQL Fix

### Via cPanel phpMyAdmin:
1. Open **phpMyAdmin** in cPanel
2. Click **SQL** tab
3. Paste and run:

```sql
ALTER TABLE users ADD COLUMN officer_code VARCHAR(50) NULL UNIQUE AFTER username;
CREATE INDEX idx_officer_code ON users(officer_code);
UPDATE users u INNER JOIN lgas l ON u.lga_id = l.id SET u.officer_code = CONCAT('OFF-', l.code, '-', YEAR(NOW()), '-', LPAD(u.id, 4, '0')) WHERE u.role = 'officer' AND u.officer_code IS NULL;
```

4. Restart app: `pm2 restart all` or `pm2 start ecosystem.config.js`

---

## 🔧 If PM2 Not Found or Errors

```bash
# Check what's running
pm2 list

# If nothing running, start app
pm2 start ecosystem.config.js

# OR
pm2 start src/server.js --name green-permit-api

# Check logs
pm2 logs --lines 20
```

See `PM2_FIX_GUIDE.md` for detailed PM2 troubleshooting.

---

## 📚 Full Guides Available:
- `PM2_FIX_GUIDE.md` - PM2 troubleshooting ⭐ NEW
- `CPANEL_UPDATE_GUIDE.md` - Complete step-by-step instructions
- `PRODUCTION_FIX_OFFICER_CODE.md` - Detailed troubleshooting
- `scripts/fix-officer-code-simple.js` - Simplified fix script ⭐ NEW

---

## ✅ Verify Success:
```bash
pm2 list                    # Check app is running
pm2 logs --lines 20         # Check for errors
curl http://localhost:YOUR_PORT/api/v1/admin/officers  # Test API
```

**Problem Solved!** 🎉
