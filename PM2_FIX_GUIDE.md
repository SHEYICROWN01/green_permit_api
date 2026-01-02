# 🚀 PM2 Quick Fix Guide

## Issue: PM2 Process Not Found

When you see: `[PM2][ERROR] Process or Namespace green-permit-api not found`

---

## ✅ Solution: Start/Restart Your Application

### Step 1: Check What's Running

```bash
pm2 list
```

**What you might see:**
- Empty list (nothing running)
- Different app name than "green-permit-api"
- Multiple processes

---

### Step 2A: If Nothing is Running

```bash
# Start the application using ecosystem file
pm2 start ecosystem.config.js

# OR start directly
pm2 start src/server.js --name green-permit-api
```

---

### Step 2B: If App Has Different Name

```bash
# List all processes to see the actual name
pm2 list

# Restart using the actual name you see
pm2 restart <actual-app-name>

# OR restart all
pm2 restart all
```

---

### Step 2C: If Using ecosystem.config.js

```bash
# Check what's defined in ecosystem file
cat ecosystem.config.js

# Start using ecosystem config
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
```

---

## 🔧 Complete Restart Commands

```bash
# Method 1: Restart all PM2 processes
pm2 restart all

# Method 2: Stop all and start fresh
pm2 delete all
pm2 start ecosystem.config.js
pm2 save

# Method 3: Start specific file
pm2 start src/server.js --name green-permit-api

# Method 4: Using npm script (if configured)
pm2 start npm --name green-permit-api -- start
```

---

## 📊 Check Status

```bash
# List all PM2 processes
pm2 list

# Check logs
pm2 logs

# Check specific app logs
pm2 logs green-permit-api --lines 50

# Monitor in real-time
pm2 monit
```

---

## 🎯 After Fixing officer_code Issue

### Complete Update Process:

```bash
# 1. Pull latest code
cd ~/green-permit-api
git pull origin main

# 2. Fix database (use the simple script)
node scripts/fix-officer-code-simple.js

# 3. Check PM2 status
pm2 list

# 4. Restart (choose one):
pm2 restart all
# OR if you see your app name:
pm2 restart <your-app-name>
# OR start fresh:
pm2 start ecosystem.config.js

# 5. Verify it's running
pm2 list
pm2 logs --lines 20
```

---

## 🔍 Troubleshooting

### If pm2 command not found:
```bash
npm install -g pm2
```

### If port is already in use:
```bash
# Find process using port (e.g., 3000)
lsof -i :3000

# Kill the process
kill -9 <PID>

# Then start PM2
pm2 start ecosystem.config.js
```

### If app keeps crashing:
```bash
# Check logs for errors
pm2 logs --err --lines 50

# Check if .env file exists
ls -la .env

# Check database connection
node -e "require('./src/config/database').query('SELECT 1').then(() => console.log('✅ DB OK')).catch(e => console.error('❌ DB Error:', e.message))"
```

---

## ✨ Success Checklist

- [ ] PM2 process is running (`pm2 list` shows your app)
- [ ] App status is "online" (not errored or stopped)
- [ ] No errors in logs (`pm2 logs`)
- [ ] API responds: `curl http://localhost:YOUR_PORT/api/health` or similar
- [ ] Can access officers endpoint without errors

---

## 📝 Save Your PM2 Configuration

```bash
# After everything works, save the config
pm2 save

# Set PM2 to startup on reboot
pm2 startup
# Then run the command it gives you (starts with sudo)
```

---

## 🎉 Quick Test

```bash
# Test if your API is working
curl http://localhost:YOUR_PORT/api/v1/admin/officers

# Or check health endpoint
curl http://localhost:YOUR_PORT/health
```

Replace `YOUR_PORT` with your actual port (check `.env` or ecosystem.config.js)
