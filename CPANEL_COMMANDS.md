# 🎯 CPANEL TERMINAL - COPY & PASTE COMMANDS

## ✅ All Code Pushed to GitHub Successfully!

**Latest Commit:** `41e4f6f`

---

## 🚀 NOW: Run These Commands in cPanel Terminal

### Method 1: Interactive Script (Recommended) 🌟

```bash
cd ~/green-permit-api
git pull origin main
bash cpanel-fix-now.sh
```

This will:
- ✅ Pull latest code
- ✅ Run database migration
- ✅ Check PM2 status
- ✅ Restart your application
- ✅ Show logs

---

### Method 2: Manual Step-by-Step

```bash
# 1. Navigate to project
cd ~/green-permit-api

# 2. Pull latest code
git pull origin main

# 3. Run the simplified database fix
node scripts/fix-officer-code-simple.js

# 4. Check PM2 status
pm2 list

# 5. Restart application (choose one):
pm2 restart all
# OR if app not running:
pm2 start ecosystem.config.js
# OR start specific app:
pm2 start src/server.js --name green-permit-api

# 6. Check logs
pm2 logs --lines 20

# 7. Verify success
pm2 list
```

---

### Method 3: If Scripts Don't Work - Manual SQL

**Use cPanel phpMyAdmin:**

1. Login to cPanel
2. Click **phpMyAdmin**
3. Select your database
4. Click **SQL** tab
5. Paste this SQL:

```sql
-- Check if column exists
SHOW COLUMNS FROM users WHERE Field = 'officer_code';

-- If no results, run these:
ALTER TABLE users 
ADD COLUMN officer_code VARCHAR(50) NULL UNIQUE 
AFTER username;

CREATE INDEX idx_officer_code ON users(officer_code);

UPDATE users u
INNER JOIN lgas l ON u.lga_id = l.id
SET u.officer_code = CONCAT('OFF-', l.code, '-', YEAR(NOW()), '-', LPAD(u.id, 4, '0'))
WHERE u.role = 'officer' 
AND u.officer_code IS NULL;

-- Verify
SELECT id, name, officer_code FROM users WHERE role='officer' LIMIT 3;
```

6. Then in terminal:
```bash
cd ~/green-permit-api
pm2 restart all
```

---

## 🔍 Troubleshooting

### Issue: "Cannot read properties of undefined"
✅ **Fixed!** The new `fix-officer-code-simple.js` script handles this.

### Issue: "PM2 Process not found"
```bash
# Check what's running
pm2 list

# Start your app
pm2 start ecosystem.config.js

# OR
pm2 start src/server.js --name green-permit-api
```

See `PM2_FIX_GUIDE.md` for more details.

### Issue: "Column already exists"
✅ **Good!** Just restart your app:
```bash
pm2 restart all
```

---

## ✅ Success Checklist

After running commands, verify:

```bash
# 1. Check PM2 is running
pm2 list
# Should show your app as "online"

# 2. Check logs for errors
pm2 logs --lines 30
# Should not show "Unknown column" error

# 3. Test API (replace port if different)
curl http://localhost:3000/api/v1/admin/officers
# OR
curl https://gtech.gifamz.com/api/v1/admin/officers
# Should return 200, not 500

# 4. Check database
mysql -u your_user -p your_database -e "SELECT id, name, officer_code FROM users WHERE role='officer' LIMIT 3;"
# Should show officers with codes like OFF-IFO-2025-0001
```

---

## 📚 Available Documentation

All these files are now in your repository:

| File | Purpose |
|------|---------|
| `cpanel-fix-now.sh` | Interactive one-command fix ⭐ |
| `scripts/fix-officer-code-simple.js` | Simplified migration script ⭐ |
| `PM2_FIX_GUIDE.md` | PM2 troubleshooting ⭐ |
| `QUICK_FIX.md` | Quick reference |
| `CPANEL_UPDATE_GUIDE.md` | Detailed step-by-step |
| `PRODUCTION_FIX_OFFICER_CODE.md` | Full documentation |

---

## 🎊 Expected Results

### Before Fix:
```
❌ Error: Unknown column 'o.officer_code' in 'SELECT'
❌ GET /api/v1/admin/officers → 500 Internal Server Error
❌ Cannot view officers in LGA dashboard
```

### After Fix:
```
✅ Database has officer_code column
✅ GET /api/v1/admin/officers → 200 OK
✅ Officers have codes: OFF-IFO-2025-0001, OFF-LAKOS-2025-0002, etc.
✅ Can view and create officers in dashboard
```

---

## 🚨 Still Having Issues?

1. **Check Application Logs:**
   ```bash
   pm2 logs --lines 50
   tail -f ~/green-permit-api/logs/error.log
   ```

2. **Check Database Connection:**
   ```bash
   node -e "require('./src/config/database').query('SELECT 1').then(() => console.log('✅ DB Connected')).catch(e => console.error('❌', e.message))"
   ```

3. **Restart Everything:**
   ```bash
   pm2 delete all
   pm2 start ecosystem.config.js
   pm2 save
   ```

4. **Check Environment Variables:**
   ```bash
   cat .env | grep DB_
   ```

---

## 📞 Quick Reference

**Project Directory:** `~/green-permit-api`  
**Git Repo:** `github.com/SHEYICROWN01/green_permit_api`  
**Latest Commit:** `41e4f6f`  

**Essential Commands:**
```bash
cd ~/green-permit-api
git pull origin main
node scripts/fix-officer-code-simple.js
pm2 restart all
pm2 logs --lines 20
```

---

## ✨ You're All Set!

Just run the commands above in your cPanel terminal and you're done! 🎉

The error will be fixed and your LGA dashboard will work perfectly.
