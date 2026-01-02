# 🚀 Namecheap Deployment Guide - Green Permit API

**Server:** Namecheap Shared Hosting (StellarBus18)  
**Date:** December 31, 2025  
**Status:** Ready for Deployment

---

## 📋 Server Information

```
Server IP:     192.64.117.46
SSH Username:  ggtlnplz
SSH Port:      21098
cPanel:        Version 126.0 (build 37)
Apache:        2.4.66
Database:      MariaDB 11.4.9
Architecture:  x86_64
OS:            Linux
```

---

## 🎯 Deployment Overview

We'll deploy your Node.js API to Namecheap shared hosting using:
1. ✅ SSH access for deployment
2. ✅ Git to pull code from GitHub
3. ✅ PM2 for process management
4. ✅ MySQL database for data storage
5. ✅ Apache reverse proxy (or direct port access)

---

## 📝 Prerequisites Checklist

Before we start, ensure you have:

- [x] SSH access enabled (✅ Done - see screenshot)
- [x] GitHub repository ready (✅ Done - code pushed)
- [ ] Domain name (what domain will you use?)
- [ ] Node.js installed on server (we'll check/install)
- [ ] MySQL database created in cPanel
- [ ] SSL certificate (optional, but recommended)

---

## 🔧 Step-by-Step Deployment

### Step 1: Connect to Your Server via SSH

Open your terminal and connect:

```bash
ssh -p 21098 ggtlnplz@192.64.117.46
```

**First-time connection:**
- You'll be asked "Are you sure you want to continue connecting?" 
- Type: `yes`
- Enter your password when prompted

---

### Step 2: Check Node.js Installation

Once connected, run:

```bash
node --version
npm --version
```

**If Node.js is NOT installed:**

```bash
# Check available Node.js versions
nvm list-remote

# Install Node.js 18 LTS (recommended)
nvm install 18
nvm use 18
nvm alias default 18

# Verify installation
node --version
npm --version
```

**If NVM is not available**, request Node.js installation from Namecheap support or use:

```bash
# Alternative: Install Node.js manually
cd ~
wget https://nodejs.org/dist/v18.19.0/node-v18.19.0-linux-x64.tar.xz
tar -xf node-v18.19.0-linux-x64.tar.xz
echo 'export PATH=$HOME/node-v18.19.0-linux-x64/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
node --version
```

---

### Step 3: Install PM2 (Process Manager)

```bash
npm install -g pm2
pm2 --version
```

---

### Step 4: Create Application Directory

```bash
# Navigate to your home directory
cd ~

# Create application folder
mkdir -p green-permit-api
cd green-permit-api
```

---

### Step 5: Clone Repository from GitHub

```bash
# Clone your repository
git clone https://github.com/SHEYICROWN01/green_permit_api.git .

# Verify files
ls -la

# You should see all your project files
```

---

### Step 6: Install Dependencies

```bash
# Install production dependencies
npm install --production

# This may take a few minutes
```

---

### Step 7: Create Database in cPanel

1. **Login to cPanel** at: `https://192.64.117.46:2083`
2. **Go to:** MySQL Databases
3. **Create Database:**
   - Database Name: `ggtlnplz_green_permit`
   - Click "Create Database"
4. **Create Database User:**
   - Username: `ggtlnplz_gpuser`
   - Password: *Choose a strong password*
   - Click "Create User"
5. **Add User to Database:**
   - User: `ggtlnplz_gpuser`
   - Database: `ggtlnplz_green_permit`
   - Privileges: **ALL PRIVILEGES**
   - Click "Add"

**Note your credentials:**
```
DB_HOST=localhost
DB_NAME=ggtlnplz_green_permit
DB_USER=ggtlnplz_gpuser
DB_PASSWORD=your_chosen_password
```

---

### Step 8: Import Database Schema

```bash
# From your server SSH session
cd ~/green-permit-api

# Import main schema
mysql -u ggtlnplz_gpuser -p ggtlnplz_green_permit < database/schema.sql

# Import super admin schema
mysql -u ggtlnplz_gpuser -p ggtlnplz_green_permit < database/super_admin_schema.sql

# Enter password when prompted
```

---

### Step 9: Configure Environment Variables

```bash
# Create production .env file
nano .env
```

**Paste this configuration** (update with your values):

```bash
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# API Configuration
API_PREFIX=/api/v1

# CORS Configuration (UPDATE with your frontend domain)
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ggtlnplz_green_permit
DB_USER=ggtlnplz_gpuser
DB_PASSWORD=your_database_password_here
DB_CONNECTION_LIMIT=10

# JWT Configuration (CHANGE THIS!)
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
JWT_EXPIRE=24h

# Logging
LOG_LEVEL=info
```

**Save and exit:**
- Press `CTRL + X`
- Press `Y`
- Press `ENTER`

---

### Step 10: Create Super Admin Account

```bash
node scripts/create-superadmin.js
```

**Save the credentials shown!**

---

### Step 11: Start Application with PM2

```bash
# Start the application
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 to start on server reboot
pm2 startup
# Run the command it outputs

# Check status
pm2 status
pm2 logs green-permit-api
```

---

### Step 12: Test the API

```bash
# Test health endpoint
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"...","uptime":...}
```

---

### Step 13: Configure Apache Reverse Proxy (Optional)

If you want to use a domain (e.g., `api.yourdomain.com`):

1. **Login to cPanel**
2. **Go to:** Domains → Subdomains
3. **Create subdomain:** `api`
4. **Go to:** File Manager → `public_html/api/.htaccess`
5. **Add this content:**

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] SSH connection successful
- [ ] Node.js and npm installed
- [ ] PM2 installed and running
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Database created and schema imported
- [ ] .env file configured
- [ ] Super admin created
- [ ] API running (pm2 status shows "online")
- [ ] Health endpoint responds
- [ ] Can login as super admin

---

## 🔄 Future Updates (Easy!)

To update your application:

```bash
# SSH into server
ssh -p 21098 ggtlnplz@192.64.117.46

# Navigate to app directory
cd ~/green-permit-api

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install --production

# Restart application
pm2 restart green-permit-api

# Check logs
pm2 logs green-permit-api --lines 50
```

---

## 🆘 Troubleshooting

### Issue: Port 3000 already in use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process (replace PID with actual number)
kill -9 PID

# Or use a different port in .env
PORT=3001
```

### Issue: Permission denied

```bash
# Fix permissions
chmod -R 755 ~/green-permit-api
```

### Issue: PM2 not found

```bash
# Reinstall PM2
npm install -g pm2
```

### Issue: Database connection failed

```bash
# Test database connection
mysql -u ggtlnplz_gpuser -p ggtlnplz_green_permit -e "SHOW TABLES;"
```

### Issue: Out of memory

```bash
# Check memory
free -h

# Restart PM2 with memory limit
pm2 restart green-permit-api --max-memory-restart 500M
```

---

## 📞 Need Help?

If you encounter issues:
1. Check PM2 logs: `pm2 logs green-permit-api`
2. Check error logs: `cat ~/green-permit-api/logs/error.log`
3. Restart application: `pm2 restart green-permit-api`
4. Contact Namecheap support for server issues

---

## 🎉 Next Steps

After successful deployment:

1. **Test all endpoints** using Postman or curl
2. **Configure SSL** for HTTPS (cPanel → SSL/TLS)
3. **Setup backups** (daily database backups)
4. **Configure monitoring** (PM2 monitoring)
5. **Update frontend** with production API URL

---

**Deployment Guide Version:** 1.0  
**Last Updated:** December 31, 2025

**Ready to deploy? Follow the steps above or use the automated deployment script!** 🚀
