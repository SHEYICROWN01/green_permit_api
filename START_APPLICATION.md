# 🚀 START YOUR APPLICATION NOW

## ✅ Database Migration Complete!

The `officer_code` column has been added successfully. Now start your application:

---

## 📋 Copy & Paste These Commands:

```bash
# Make sure you're in the project directory
cd ~/green-permit-api

# Start the application with PM2
pm2 start ecosystem.config.js

# Save the PM2 configuration
pm2 save

# Check status
pm2 list

# View logs
pm2 logs green-permit-api --lines 30
```

---

## 🎯 One-Line Command (Fastest):

```bash
cd ~/green-permit-api && pm2 start ecosystem.config.js && pm2 save && pm2 list
```

---

## ✅ Expected Output:

After running `pm2 list`, you should see:

```
┌────┬─────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name                │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼─────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ green-permit-api    │ cluster  │ 0    │ online    │ 0%       │ 45.2mb   │
└────┴─────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

**Status should be "online"** ✅

---

## 🔍 Verify Everything Works:

### 1. Check Application Logs
```bash
pm2 logs green-permit-api --lines 50
```

Look for:
- ✅ "Server running on port..."
- ✅ "Database connected"
- ❌ No error messages

### 2. Test the API Endpoint
```bash
# Test locally (replace 3000 with your actual port)
curl http://localhost:3000/api/v1/admin/officers

# OR test publicly
curl https://gtech.gifamz.com/api/v1/admin/officers
```

Should return HTTP 200 (not 500) ✅

### 3. Test from Browser
Open your LGA dashboard:
- Navigate to: `http://localhost:8081/lga/officers` (or your frontend URL)
- Should load officers list without errors ✅
- Try creating a new officer ✅

---

## 🚨 Troubleshooting

### If "pm2 start" fails:

```bash
# Check for syntax errors
node src/server.js

# If it works, stop it (Ctrl+C) and start with PM2
pm2 start ecosystem.config.js
```

### If port is already in use:

```bash
# Find what's using the port (e.g., 3000)
lsof -i :3000

# Kill that process
kill -9 <PID>

# Then start PM2 again
pm2 start ecosystem.config.js
```

### If app keeps crashing:

```bash
# Check logs for errors
pm2 logs green-permit-api --err --lines 100

# Common issues:
# 1. Database connection - check .env file
cat .env | grep DB_

# 2. Missing dependencies
npm install

# 3. Port already in use (see above)
```

---

## 💾 Save Your Setup (Important!)

```bash
# After everything works, save PM2 config
pm2 save

# Setup PM2 to start on server reboot
pm2 startup

# Run the command it gives you (will start with "sudo")
```

---

## 📊 Useful PM2 Commands

```bash
# Check status
pm2 list

# View logs (live)
pm2 logs green-permit-api

# View logs (last N lines)
pm2 logs green-permit-api --lines 50

# Restart app
pm2 restart green-permit-api

# Stop app
pm2 stop green-permit-api

# Delete app from PM2
pm2 delete green-permit-api

# Monitor resource usage
pm2 monit

# Show detailed info
pm2 show green-permit-api
```

---

## ✨ Success Checklist

- [ ] PM2 started successfully
- [ ] `pm2 list` shows "online" status
- [ ] No errors in `pm2 logs`
- [ ] API endpoint returns 200
- [ ] LGA dashboard loads officers
- [ ] Can create new officers
- [ ] PM2 configuration saved

---

## 🎉 You're Done!

Once you see "online" status and no errors in logs, your application is ready!

The `Unknown column 'o.officer_code'` error is now fixed. ✅

---

## 📞 Still Need Help?

Check these files:
- `PM2_FIX_GUIDE.md` - PM2 troubleshooting
- `CPANEL_UPDATE_GUIDE.md` - Full deployment guide
- `ecosystem.config.js` - PM2 configuration

Or check your application logs:
```bash
pm2 logs green-permit-api --lines 100
```
