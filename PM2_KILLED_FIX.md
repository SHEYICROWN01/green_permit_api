# 🚨 PM2 Process Was Killed - Quick Fix

## What Happened?

The PM2 daemon was killed, usually due to:
- ❌ Memory limits on shared hosting
- ❌ Too many cluster instances requested
- ❌ Server resource constraints
- ❌ Application error during startup

---

## ✅ SOLUTION: Use Single Instance Mode

Your `ecosystem.config.js` is configured for **cluster mode** with multiple instances. On shared hosting (cPanel), this can cause issues.

---

## 🚀 QUICK FIX - Copy & Paste:

### Option 1: Start with Single Instance (Recommended for cPanel)

```bash
cd ~/green-permit-api
pm2 start src/server.js --name green-permit-api --max-memory-restart 500M
pm2 save
pm2 list
```

---

### Option 2: Modify Ecosystem Config

```bash
cd ~/green-permit-api

# Backup original config
cp ecosystem.config.js ecosystem.config.js.backup

# Start with production settings (single instance)
pm2 start ecosystem.config.js --env production --only green-permit-api -- --instances 1

pm2 save
pm2 list
```

---

### Option 3: Start Without Cluster Mode

```bash
cd ~/green-permit-api

# Start in fork mode (not cluster)
NODE_ENV=production pm2 start src/server.js \
  --name green-permit-api \
  --max-memory-restart 500M \
  --log-date-format="YYYY-MM-DD HH:mm:ss" \
  --error logs/error.log \
  --output logs/output.log

pm2 save
pm2 list
```

---

## 🔍 Check What Went Wrong:

```bash
# Check PM2 logs
cat ~/.pm2/pm2.log

# Check system logs
dmesg | tail -20

# Check if PM2 daemon is running
ps aux | grep PM2
```

---

## 💡 If Memory is the Issue:

### Create a Lightweight Config:

```bash
cd ~/green-permit-api

# Start with minimal settings
pm2 start src/server.js \
  --name green-permit-api \
  --instances 1 \
  --max-memory-restart 300M \
  --node-args="--max-old-space-size=256"

pm2 save
pm2 list
```

---

## 🎯 Recommended for Shared Hosting (cPanel):

```bash
cd ~/green-permit-api

# Simple start command
pm2 start src/server.js --name green-permit-api

# Save configuration
pm2 save

# Check status
pm2 list

# Monitor logs
pm2 logs green-permit-api
```

---

## 📊 After Starting, Verify:

```bash
# Check PM2 status
pm2 list

# Check application logs
pm2 logs green-permit-api --lines 30

# Test API
curl http://localhost:3000/api/v1/admin/officers

# Check memory usage
pm2 monit
```

---

## 🔧 If Still Getting Killed:

### Check Server Resources:

```bash
# Check available memory
free -h

# Check CPU usage
top -bn1 | head -20

# Check disk space
df -h
```

### Reduce Memory Usage:

Edit `ecosystem.config.js` to reduce memory:

```javascript
max_memory_restart: '256M',  // Reduce from 1G
instances: 1,                 // Use single instance
exec_mode: 'fork',           // Use fork mode instead of cluster
```

---

## 🆘 Emergency Start (Simplest Method):

```bash
cd ~/green-permit-api

# Kill any existing PM2
pm2 kill

# Start fresh with minimal config
pm2 start src/server.js --name green-permit-api --watch false

# Save
pm2 save

# Check
pm2 list && pm2 logs --lines 20 --nostream
```

---

## ✅ Success Indicators:

After running the commands, you should see:

```
┌────┬──────────────────────┬─────────┬──────┬────────┬──────────┬──────────┐
│ id │ name                 │ mode    │ ↺    │ status │ cpu      │ memory   │
├────┼──────────────────────┼─────────┼──────┼────────┼──────────┼──────────┤
│ 0  │ green-permit-api     │ fork    │ 0    │ online │ 0%       │ 35.2mb   │
└────┴──────────────────────┴─────────┴──────┴────────┴──────────┴──────────┘
```

**Status: "online"** = Success! ✅

---

## 🎯 RECOMMENDED COMMAND (COPY THIS):

```bash
cd ~/green-permit-api && pm2 kill && pm2 start src/server.js --name green-permit-api --max-memory-restart 400M && pm2 save && pm2 list && pm2 logs --lines 30 --nostream
```

This will:
1. Kill any existing PM2 processes
2. Start your app with memory limits
3. Save the configuration
4. Show status
5. Display recent logs

---

## 📝 Note:

Shared hosting (cPanel) has resource limits. Using **fork mode** with **single instance** and **memory limits** is recommended instead of cluster mode.
