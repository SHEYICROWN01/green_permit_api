# 🚀 QUICK START: Fix Production Now!

## ⚡ Super Fast Fix (2 Minutes)

### 1️⃣ SSH into cPanel Terminal
Log into: `https://gtech.gifamz.com:2083` → Click **Terminal**

### 2️⃣ Run These Commands
```bash
cd ~/green-permit-api
git pull origin main
node scripts/add-officer-code-column.js
pm2 restart green-permit-api
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

4. Restart app: `pm2 restart green-permit-api`

---

## 📚 Full Guides Available:
- `CPANEL_UPDATE_GUIDE.md` - Complete step-by-step instructions
- `PRODUCTION_FIX_OFFICER_CODE.md` - Detailed troubleshooting
- `scripts/add-officer-code-column.js` - Automated fix script

---

## ✅ Verify Success:
```bash
mysql -u your_user -p -e "SELECT id, name, officer_code FROM users WHERE role='officer' LIMIT 3;" your_database
```

**Problem Solved!** 🎉
