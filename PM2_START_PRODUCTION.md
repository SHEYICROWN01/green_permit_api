# 🚀 START APPLICATION ON PRODUCTION SERVER

## ⚠️ Current Issue
PM2 process was not running, so restart failed with:
```
[PM2][ERROR] Process or Namespace green-permit-api not found
```

## ✅ Solution - Start the Application

Run these commands on the **production server** (as user `ggtlnplz`):

```bash
cd ~/green-permit-api

# Delete any existing process (if any)
pm2 delete green-permit-api 2>/dev/null || true

# Start the application fresh
pm2 start src/server.js \
  --name green-permit-api \
  --max-memory-restart 400M \
  --log ~/.pm2/logs/green-permit-api.log

# Wait for startup
sleep 3

# Check status
pm2 list

# View logs
pm2 logs green-permit-api --lines 30 --nostream

# Save PM2 configuration (so it persists)
pm2 save

# Setup PM2 to start on server reboot
pm2 startup
```

---

## 🧪 Test Officer Login

After starting the application, test the endpoint:

```bash
curl -X POST https://gtech.gifamz.com/api/v1/officer/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bola","password":"Admin@123"}'
```

### Expected Success Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "officer": {
      "id": "OFF-IFO-2025-0001",
      "name": "Bola Officer",
      "lgaAssigned": "Ifo",
      "lgaCode": "IFO",
      "phoneNumber": "08012345678",
      "role": "field_officer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

---

## 🔍 Troubleshooting

### If you still get "Login failed" error:

#### 1. Check if application is running:
```bash
pm2 list
```
Should show `green-permit-api` with status `online`.

#### 2. Check application logs for errors:
```bash
pm2 logs green-permit-api --lines 50
```
Look for startup errors or database connection issues.

#### 3. Check database connection:
```bash
mysql -u ggtlnplz_green_permit -p ggtlnplz_green_permit_db -e "SELECT 1"
```

#### 4. Verify officer exists in database:
```bash
mysql -u ggtlnplz_green_permit -p ggtlnplz_green_permit_db -e \
  "SELECT id, name, username, officer_code, role, is_active FROM users WHERE username='bola'"
```

#### 5. Check if officer password is set:
```bash
mysql -u ggtlnplz_green_permit -p ggtlnplz_green_permit_db -e \
  "SELECT id, username, CASE WHEN password IS NULL OR password = '' THEN 'NOT SET' ELSE 'SET' END as password_status FROM users WHERE username='bola'"
```

#### 6. Check environment variables:
```bash
cd ~/green-permit-api
cat .env | grep -E "(DB_|JWT_|PORT)"
```

Make sure these are set:
- `DB_HOST` (usually localhost or 127.0.0.1)
- `DB_PORT` (usually 3306)
- `DB_USER` (ggtlnplz_green_permit)
- `DB_PASSWORD` (your database password)
- `DB_NAME` (ggtlnplz_green_permit_db)
- `JWT_SECRET` (any secure random string)
- `PORT` (usually 3000)

---

## 📊 Monitoring

### Real-time logs:
```bash
pm2 logs green-permit-api
```
Press `Ctrl+C` to stop viewing.

### Application status:
```bash
pm2 status
```

### Memory usage:
```bash
pm2 monit
```

### Restart after code changes:
```bash
cd ~/green-permit-api
git pull origin main
pm2 restart green-permit-api
sleep 3
pm2 logs green-permit-api --lines 20 --nostream
```

---

## 🔄 Common PM2 Commands

```bash
# Start application
pm2 start src/server.js --name green-permit-api

# Stop application
pm2 stop green-permit-api

# Restart application
pm2 restart green-permit-api

# Delete process
pm2 delete green-permit-api

# View logs
pm2 logs green-permit-api

# View status
pm2 list

# Save current process list
pm2 save

# Resurrect saved processes (after server reboot)
pm2 resurrect
```

---

## 🎯 Next Steps

1. **Start the application** with the commands above
2. **Test officer login** endpoint
3. **Check logs** for any errors
4. **Notify mobile team** once working
5. **Setup PM2 startup** to auto-start on reboot

---

## 📝 Notes

- **Shared Hosting:** Uses fork mode (not cluster) due to memory limits
- **Memory Limit:** 400M max to prevent process killing
- **Log Location:** `~/.pm2/logs/green-permit-api.log`
- **Auto-restart:** PM2 will auto-restart if app crashes

---

**Start the application and test! If you encounter errors, check the logs first.** 🚀
