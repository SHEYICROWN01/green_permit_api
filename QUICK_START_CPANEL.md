# 📦 Namecheap cPanel Deployment - Quick Start

**Your complete guide to deploying Green Permit API to Namecheap cPanel in 30 minutes.**

---

## 🎯 What You'll Need

- ✅ Namecheap hosting (Business plan or higher)
- ✅ cPanel access credentials
- ✅ Domain name configured
- ✅ 30 minutes of your time

---

## 🚀 5-Step Deployment Process

### Step 1: Database Setup (5 minutes)
```
1. Login to cPanel
2. Go to "MySQL Databases"
3. Create database: green_permit_db
4. Create user: green_permit_user (with strong password)
5. Assign user to database with ALL PRIVILEGES
6. Go to phpMyAdmin
7. Import database/schema.sql
8. Import database/seed.sql (optional)
```

**✅ Checkpoint:** You should see tables in phpMyAdmin

---

### Step 2: Prepare Files (10 minutes)

**On your computer:**

```bash
# 1. Navigate to project
cd green-permit-api

# 2. Create environment file
cp .env.cpanel .env

# 3. Edit .env with your details
# Update these CRITICAL values:
#   - DB_NAME (with cPanel prefix: cpaneluser_green_permit_db)
#   - DB_USER (with cPanel prefix: cpaneluser_green_permit_user)
#   - DB_PASSWORD (from Step 1)
#   - JWT_SECRET (generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
#   - CORS_ORIGIN (your domain: https://yourdomain.com)

# 4. Create zip file (WITHOUT node_modules)
zip -r green-permit-api.zip . -x "node_modules/*" ".git/*" "tests/*"
```

**✅ Checkpoint:** You have green-permit-api.zip ready

---

### Step 3: Upload to cPanel (5 minutes)

```
1. Login to cPanel
2. Go to "File Manager"
3. Navigate to public_html
4. Create folder "api"
5. Open the "api" folder
6. Click "Upload"
7. Upload green-permit-api.zip
8. Right-click zip → "Extract"
9. Delete zip file after extraction
10. Find .env file and edit it with your credentials
```

**✅ Checkpoint:** Files visible in public_html/api

---

### Step 4: Setup Node.js App (5 minutes)

```
1. In cPanel, find "Software" section
2. Click "Setup Node.js App"
3. Click "Create Application"
4. Fill in:
   - Node.js version: 18.x (highest available)
   - Application mode: Production
   - Application root: api
   - Application URL: api.yourdomain.com (or yourdomain.com/api)
   - Application startup file: src/server.js
5. Click "Create"
6. Click "Run NPM Install" (wait 5-10 minutes)
7. Once done, click "Start App"
```

**✅ Checkpoint:** Status shows "Running"

---

### Step 5: Test & Verify (5 minutes)

```bash
# Test health endpoint
curl https://api.yourdomain.com/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}

# Test login endpoint
curl -X POST https://api.yourdomain.com/api/v1/officer/auth/login \
  -H "Content-Type: application/json" \
  -d '{"officerId":"OFC-TEST-001","pin":"1234"}'

# Expected: JWT token in response
```

**✅ Checkpoint:** Both endpoints return successful responses

---

## 🎉 Success!

Your API is now live! 

**Your API URL:** https://api.yourdomain.com

---

## 🔥 Common Issues?

### Issue: "Setup Node.js App" not found
**Solution:** Your plan doesn't support Node.js. Contact Namecheap to upgrade to Business plan.

### Issue: Database connection fails
**Solution:** Check database name includes cPanel username prefix (e.g., `myuser_green_permit_db`)

### Issue: App won't start
**Solution:** 
1. Check logs: Setup Node.js App → View Logs
2. Verify .env has correct DB credentials
3. Run NPM install again

### Issue: 404 Not Found
**Solution:** 
1. Verify Application URL in Node.js settings
2. Check subdomain DNS propagation
3. Wait 10 minutes and try again

---

## 📚 Full Documentation

For detailed instructions and troubleshooting:

1. **[NAMECHEAP_DEPLOYMENT.md](./NAMECHEAP_DEPLOYMENT.md)** - Complete step-by-step guide
2. **[CPANEL_FAQ.md](./CPANEL_FAQ.md)** - Troubleshooting and FAQ
3. **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** - Pre-launch checklist

---

## 🆘 Need Help?

**Namecheap Support:**
- Live Chat: https://www.namecheap.com/support/
- Check documentation first, then contact support

**Your API Status:**
- Health: https://api.yourdomain.com/health
- cPanel: https://yourdomain.com:2083

---

## 📝 Quick Reference

### Database Credentials Format
```
DB_NAME: cpaneluser_green_permit_db
DB_USER: cpaneluser_green_permit_user
DB_PASSWORD: YourStrongPassword123
DB_HOST: localhost
```

### Required Environment Variables
```
NODE_ENV=production
DB_NAME=cpaneluser_green_permit_db
DB_USER=cpaneluser_green_permit_user  
DB_PASSWORD=YourPassword
JWT_SECRET=64CharRandomString
CORS_ORIGIN=https://yourdomain.com
```

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Test Commands
```bash
# Health check
curl https://api.yourdomain.com/health

# Login test
curl -X POST https://api.yourdomain.com/api/v1/officer/auth/login \
  -H "Content-Type: application/json" \
  -d '{"officerId":"OFC-TEST-001","pin":"1234"}'
```

---

**Time to Deploy:** ~30 minutes  
**Difficulty:** Beginner-Friendly  
**Cost:** Included with Namecheap hosting

✅ **You're ready to deploy!**
