# 🔄 APPLICATION IS STARTING...

## Current Status: PM2 is waiting for app to be ready

This is **NORMAL**! Your app is configured with `wait_ready: true` which means PM2 waits for your application to send a ready signal.

---

## ⏱️ What's Happening Now:

1. PM2 daemon started ✅
2. Application is starting...
3. Waiting for database connection...
4. Waiting for server to listen on port...

**This can take 10-30 seconds depending on your server.**

---

## 📋 NEXT: Check Status (Wait 10 seconds, then run):

```bash
pm2 list
```

### Expected Results:

#### ✅ **Success** - You'll see:
```
┌────┬─────────────────────┬─────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name                │ mode    │ ↺    │ status    │ cpu      │ memory   │
├────┼─────────────────────┼─────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ green-permit-api    │ cluster │ 0    │ online    │ 0%       │ 45.2mb   │
└────┴─────────────────────┴─────────┴──────┴───────────┴──────────┴──────────┘
```
**Status: "online"** = SUCCESS! ✅

#### ⚠️ **Still Starting** - You'll see:
```
│ 0  │ green-permit-api    │ cluster │ 0    │ launching │ 0%       │ 0mb      │
```
**Status: "launching"** = Wait a bit more...

#### ❌ **Error** - You'll see:
```
│ 0  │ green-permit-api    │ cluster │ 5    │ errored   │ 0%       │ 0mb      │
```
**Status: "errored"** = Check logs below

---

## 📊 Check Logs Now:

```bash
pm2 logs green-permit-api --lines 50
```

### What to Look For:

✅ **Good Signs:**
```
Server running on port 3000
Database connected successfully
✓ Ready to handle requests
```

❌ **Error Signs:**
```
Error: connect ECONNREFUSED
Database connection failed
Port 3000 is already in use
Error loading .env
```

---

## 🔧 If Status is "errored":

### 1. Check What Went Wrong:
```bash
pm2 logs green-permit-api --err --lines 100
```

### 2. Common Fixes:

#### Problem: Database Connection Error
```bash
# Check database credentials
cat .env | grep DB_

# Test database connection
mysql -u your_db_user -p -e "SELECT 1;"
```

#### Problem: Port Already in Use
```bash
# Find what's using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Restart PM2
pm2 restart green-permit-api
```

#### Problem: Missing Dependencies
```bash
npm install
pm2 restart green-permit-api
```

#### Problem: .env File Missing
```bash
# Check if .env exists
ls -la .env

# If missing, you need to create it with your credentials
```

---

## 🚀 If Status is "online":

### Test the API:

```bash
# Test locally
curl http://localhost:3000/api/v1/admin/officers

# Test publicly
curl https://gtech.gifamz.com/api/v1/admin/officers
```

**Expected:** HTTP 200 response with officers data ✅

---

## 📱 Test from Frontend:

1. Open: `http://localhost:8081/lga/officers` (or your frontend URL)
2. Should load without errors ✅
3. Try creating a new officer ✅

---

## 🎯 Quick Status Check:

```bash
# All-in-one status check
pm2 list && echo "" && echo "Recent Logs:" && pm2 logs green-permit-api --lines 20 --nostream
```

---

## 💡 Tips:

- **Wait 10-30 seconds** for app to fully start
- **Check logs** if status is "errored"
- **Port conflicts** are common - check with `lsof -i :3000`
- **Database issues** - verify .env credentials

---

## 📞 Still Waiting?

If after 30 seconds it's still "launching":

```bash
# Force restart
pm2 delete green-permit-api
pm2 start ecosystem.config.js --update-env

# Check logs immediately
pm2 logs green-permit-api
```

---

## ✅ Once You See "online":

Run this to verify everything:

```bash
pm2 list
pm2 logs green-permit-api --lines 30 --nostream
curl http://localhost:3000/api/v1/admin/officers
```

**All good = Problem fixed!** 🎉
