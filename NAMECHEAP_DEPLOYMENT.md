# 🚀 Deploying Green Permit API to Namecheap cPanel

Complete step-by-step guide for deploying your Node.js API to Namecheap cPanel hosting.

---

## 📋 Prerequisites

### What You Need
- ✅ Namecheap Shared/VPS hosting with cPanel access
- ✅ Node.js support enabled on your hosting plan (check with Namecheap)
- ✅ SSH access (usually available on Business/VPS plans)
- ✅ Domain or subdomain for your API (e.g., api.yourdomain.com)
- ✅ MySQL database access in cPanel
- ✅ FTP/SFTP client (FileZilla recommended)

### Important Notes
⚠️ **Shared hosting limitations:**
- Limited Node.js version control
- No PM2 cluster mode (single process only)
- Limited memory (usually 512MB - 2GB)
- No Docker support on shared hosting
- Port restrictions (usually only 80/443 via Apache)

---

## 🗄️ Part 1: Database Setup in cPanel

### Step 1: Create MySQL Database

1. **Login to cPanel**
   - Go to: https://yourdomain.com:2083
   - Enter your cPanel credentials

2. **Navigate to MySQL Databases**
   - Find "Databases" section
   - Click "MySQL Databases"

3. **Create New Database**
   ```
   Database Name: green_permit_db
   ```
   - Enter database name
   - Click "Create Database"
   - Note the full database name (usually: username_green_permit_db)

4. **Create Database User**
   ```
   Username: green_permit_user
   Password: [Generate Strong Password]
   ```
   - Scroll to "MySQL Users" section
   - Enter username and password
   - Click "Create User"
   - **SAVE THESE CREDENTIALS SECURELY**

5. **Assign User to Database**
   - Scroll to "Add User To Database"
   - Select: User: green_permit_user
   - Select: Database: green_permit_db
   - Click "Add"
   - Select "ALL PRIVILEGES"
   - Click "Make Changes"

### Step 2: Import Database Schema

1. **Navigate to phpMyAdmin**
   - In cPanel, find "Databases" section
   - Click "phpMyAdmin"

2. **Select Your Database**
   - Click on your database name in left sidebar

3. **Import Schema**
   - Click "Import" tab at top
   - Click "Choose File"
   - Select `database/schema.sql` from your project
   - Click "Go" at bottom
   - Wait for success message

4. **Import Seed Data (Optional)**
   - Click "Import" tab again
   - Select `database/seed.sql`
   - Click "Go"
   - Verify data imported successfully

### Step 3: Note Database Connection Details

```
DB_HOST: localhost (or specific host provided by Namecheap)
DB_PORT: 3306
DB_NAME: username_green_permit_db (replace with your actual name)
DB_USER: username_green_permit_user (replace with your actual user)
DB_PASSWORD: [Your strong password from Step 1]
```

---

## 📁 Part 2: Prepare Your Application

### Step 1: Prepare Files Locally

1. **Create production environment file**
   ```bash
   cd /path/to/green-permit-api
   cp .env.production .env
   ```

2. **Edit .env file** with cPanel-specific settings:
   ```bash
   # Server Configuration
   NODE_ENV=production
   PORT=3000
   HOST=0.0.0.0
   
   # API Configuration
   API_PREFIX=/api/v1
   
   # CORS Configuration (replace with your actual domain)
   CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
   
   # Database Configuration (use values from Part 1)
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=username_green_permit_db
   DB_USER=username_green_permit_user
   DB_PASSWORD=your_database_password_here
   DB_CONNECTION_LIMIT=10
   
   # JWT Configuration (generate strong secrets)
   JWT_SECRET=your_64_char_random_secret_here
   JWT_EXPIRE=24h
   JWT_REFRESH_SECRET=your_64_char_refresh_secret_here
   JWT_REFRESH_EXPIRE=7d
   
   # Logging
   LOG_LEVEL=info
   
   # Application URLs (replace with your domain)
   APP_URL=https://yourdomain.com
   API_URL=https://api.yourdomain.com
   ```

3. **Generate Strong Secrets**
   ```bash
   # Run this command 3 times to generate 3 different secrets
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   
   # Use output for:
   # - JWT_SECRET
   # - JWT_REFRESH_SECRET
   # - SESSION_SECRET (if added)
   ```

4. **Remove Development Files** (optional, saves space)
   ```bash
   # Create a clean copy for deployment
   mkdir ../green-permit-api-deploy
   rsync -av --exclude='node_modules' \
            --exclude='.git' \
            --exclude='tests' \
            --exclude='coverage' \
            --exclude='*.test.js' \
            --exclude='.vscode' \
            . ../green-permit-api-deploy/
   cd ../green-permit-api-deploy
   ```

---

## 📤 Part 3: Upload Files to cPanel

### Option A: Using File Manager (Easy)

1. **Compress Your Project**
   ```bash
   # On your local machine
   cd /path/to/green-permit-api
   zip -r green-permit-api.zip . -x "node_modules/*" ".git/*" "tests/*" "coverage/*"
   ```

2. **Upload via File Manager**
   - Login to cPanel
   - Navigate to "Files" → "File Manager"
   - Go to `public_html` or create a separate directory (e.g., `api`)
   - Click "Upload"
   - Select `green-permit-api.zip`
   - Wait for upload to complete

3. **Extract Files**
   - Right-click on `green-permit-api.zip`
   - Click "Extract"
   - Select destination
   - Click "Extract Files"
   - Delete zip file after extraction

### Option B: Using FTP/SFTP (Recommended)

1. **Get FTP Credentials**
   - In cPanel, go to "Files" → "FTP Accounts"
   - Note your FTP hostname, username, and password
   - Or create a new FTP account

2. **Connect with FileZilla**
   ```
   Host: ftp.yourdomain.com (or SFTP: yourdomain.com)
   Username: your_ftp_username
   Password: your_ftp_password
   Port: 21 (FTP) or 22 (SFTP)
   ```

3. **Upload Files**
   - Local: Navigate to your project folder
   - Remote: Navigate to `public_html/api` (or your chosen directory)
   - Select all files EXCEPT `node_modules/`
   - Right-click → Upload
   - Wait for transfer to complete

### Option C: Using Git (Best for Updates)

1. **Enable SSH Access**
   - Contact Namecheap support to enable SSH
   - Or check if already enabled in cPanel → "Advanced" → "SSH Access"

2. **Connect via SSH**
   ```bash
   ssh username@yourdomain.com -p 21098
   # Port may vary, check cPanel for exact port
   ```

3. **Clone Repository**
   ```bash
   cd public_html
   git clone https://github.com/your-username/green-permit-api.git api
   cd api
   git checkout main
   ```

---

## 🔧 Part 4: Setup Node.js Application in cPanel

### Step 1: Access Node.js Selector

1. **Navigate to Node.js Setup**
   - In cPanel, find "Software" section
   - Click "Setup Node.js App"
   - (If not available, your plan may not support Node.js)

### Step 2: Create Node.js Application

1. **Click "Create Application"**

2. **Configure Application:**
   ```
   Node.js Version: 18.x (select highest available)
   Application Mode: Production
   Application Root: api (or path to your uploaded files)
   Application URL: api.yourdomain.com (or yourdomain.com/api)
   Application Startup File: src/server.js
   ```

3. **Click "Create"**

### Step 3: Install Dependencies

1. **In the Node.js App interface:**
   - You should see "Run NPM Install" button
   - Click it and wait for installation to complete
   - This may take 5-10 minutes

2. **Alternative: Via SSH**
   ```bash
   cd ~/public_html/api
   npm ci --only=production
   ```

### Step 4: Configure Environment Variables

1. **In Node.js App interface:**
   - Find "Environment Variables" section
   - Add each variable from your `.env` file:
   
   ```
   NODE_ENV = production
   PORT = 3000
   DB_HOST = localhost
   DB_NAME = username_green_permit_db
   DB_USER = username_green_permit_user
   DB_PASSWORD = your_db_password
   JWT_SECRET = your_jwt_secret
   CORS_ORIGIN = https://yourdomain.com
   ```
   
   - Click "Add Variable" for each one

2. **Or upload .env file via File Manager** (if interface doesn't support env vars)
   - Upload your configured `.env` file to application root

### Step 5: Start Application

1. **Click "Start App" button** in Node.js interface

2. **Check Status:**
   - Status should show "Running"
   - Note the port number assigned

3. **View Logs:**
   - Click "View Logs" to check for errors
   - Look for: "Green Permit API Server Started"

---

## 🌐 Part 5: Configure Domain/Subdomain

### Option A: Subdomain (Recommended)

1. **Create Subdomain**
   - cPanel → "Domains" → "Subdomains"
   - Subdomain: `api`
   - Domain: `yourdomain.com`
   - Document Root: `/public_html/api` (or your app path)
   - Click "Create"

2. **Configure Apache Proxy**
   - cPanel → "Software" → "Setup Node.js App"
   - Select your app
   - Check "Proxy requests from URL to port"
   - This should be automatic

### Option B: Main Domain

If you want API on main domain:

1. **Update Document Root**
   - cPanel → "Domains" → "Domains"
   - Find your domain
   - Click "Manage"
   - Update "Document Root" to your app folder
   - Save

2. **Configure .htaccess** (if needed)
   - Create/edit `.htaccess` in document root
   ```apache
   RewriteEngine On
   RewriteRule ^api/(.*)$ http://localhost:3000/api/$1 [P,L]
   RewriteRule ^health$ http://localhost:3000/health [P,L]
   ```

---

## 🔒 Part 6: SSL Certificate Setup

### Step 1: Install SSL Certificate

1. **Free SSL with Let's Encrypt**
   - cPanel → "Security" → "SSL/TLS Status"
   - Find your domain/subdomain
   - Click "Run AutoSSL"
   - Wait for certificate installation

2. **Or use Namecheap PositiveSSL**
   - cPanel → "Security" → "SSL/TLS"
   - Install your purchased certificate

### Step 2: Force HTTPS

1. **Update .htaccess** in your document root:
   ```apache
   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

2. **Update CORS_ORIGIN** in environment variables:
   ```
   CORS_ORIGIN=https://api.yourdomain.com
   ```

---

## ✅ Part 7: Verify Deployment

### Step 1: Test Health Endpoint

```bash
# Replace with your actual domain
curl https://api.yourdomain.com/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

### Step 2: Test Officer Login

```bash
curl -X POST https://api.yourdomain.com/api/v1/officer/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "officerId": "OFC-TEST-001",
    "pin": "1234"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "officer": { ... },
    "token": "eyJhbG...",
    "expiresIn": 86400
  }
}
```

### Step 3: Test All Endpoints

Visit your API documentation and test each endpoint:
- Authentication endpoints
- Dashboard endpoints
- Sticker management
- Reports and activities

---

## 📊 Part 8: Monitoring & Maintenance

### View Application Logs

1. **Via cPanel:**
   - "Setup Node.js App" → Select app → "View Logs"

2. **Via SSH:**
   ```bash
   cd ~/public_html/api
   tail -f logs/combined-$(date +%Y-%m-%d).log
   tail -f logs/error-$(date +%Y-%m-%d).log
   ```

3. **Via File Manager:**
   - Navigate to `api/logs`
   - Download and view log files

### Restart Application

1. **Via cPanel:**
   - "Setup Node.js App" → Select app → "Restart"

2. **Via SSH:**
   ```bash
   cd ~/public_html/api
   touch tmp/restart.txt  # Passenger restart
   ```

### Database Backups

1. **Manual Backup via phpMyAdmin:**
   - Select database → "Export" tab
   - Click "Go"
   - Save .sql file

2. **Automated Backups:**
   - cPanel → "Files" → "Backup"
   - Enable automatic backups if available

3. **Using Your Backup Script:**
   ```bash
   # Via SSH
   cd ~/public_html/api
   node scripts/backup-database.js backup
   ```

### Set Up Cron Jobs for Automated Tasks

1. **Navigate to Cron Jobs**
   - cPanel → "Advanced" → "Cron Jobs"

2. **Add Daily Backup (2 AM)**
   ```bash
   0 2 * * * cd ~/public_html/api && /usr/bin/node scripts/backup-database.js backup
   ```

3. **Add Log Cleanup (Weekly)**
   ```bash
   0 3 * * 0 find ~/public_html/api/logs -name "*.log" -mtime +14 -delete
   ```

---

## 🔧 Troubleshooting Common Issues

### Issue 1: Application Won't Start

**Solution:**
```bash
# Check logs
tail -f ~/public_html/api/logs/error-*.log

# Common causes:
# - Missing node_modules: Run npm install
# - Wrong Node.js version: Update in cPanel Node.js selector
# - Database connection: Verify credentials in .env
```

### Issue 2: Database Connection Fails

**Solution:**
```bash
# Test database connection
mysql -h localhost -u username_green_permit_user -p username_green_permit_db

# If fails:
# 1. Verify database exists in phpMyAdmin
# 2. Check user privileges
# 3. Confirm DB_HOST is 'localhost' not '127.0.0.1'
# 4. Check DB_ credentials in .env match cPanel
```

### Issue 3: 502 Bad Gateway

**Solution:**
1. Check if app is running in Node.js selector
2. Restart application
3. Check Apache error logs in cPanel
4. Verify port forwarding is configured

### Issue 4: CORS Errors

**Solution:**
```bash
# Update CORS_ORIGIN in environment variables
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Restart app after changing
```

### Issue 5: High Memory Usage (App Crashes)

**Solution:**
```bash
# Reduce database connection pool
DB_CONNECTION_LIMIT=5

# Check memory limit
# Contact Namecheap to increase if needed
```

### Issue 6: Permission Denied Errors

**Solution:**
```bash
# Via SSH, set correct permissions
cd ~/public_html
chmod -R 755 api
chmod 644 api/.env
chmod 755 api/scripts/*.js
```

---

## 📈 Performance Optimization for cPanel

### 1. Enable Compression
Already configured in app, but verify Apache compression:
```apache
# Add to .htaccess
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE application/json
</IfModule>
```

### 2. Reduce Database Connections
```bash
# In .env
DB_CONNECTION_LIMIT=5  # Lower for shared hosting
```

### 3. Enable Caching (if available)
```bash
# Add to environment variables
REDIS_ENABLED=false  # Shared hosting usually doesn't support Redis
```

### 4. Optimize Logging
```bash
# In .env
LOG_LEVEL=warn  # Reduce log volume
```

---

## 🔄 Updating Your Application

### Method 1: Using Git (Recommended)

```bash
# SSH into server
ssh username@yourdomain.com -p 21098

# Navigate to app
cd ~/public_html/api

# Pull latest changes
git pull origin main

# Install new dependencies
npm ci --only=production

# Run migrations
node scripts/migrate.js

# Restart app
# Via cPanel: Node.js App → Restart
# Or create restart file
touch tmp/restart.txt
```

### Method 2: Manual Upload

1. Update files locally
2. Upload changed files via FTP
3. Restart app in cPanel

---

## 📞 Support Resources

### Namecheap Support
- Live Chat: https://www.namecheap.com/support/
- Knowledge Base: https://www.namecheap.com/support/knowledgebase/
- Ticket System: Via cPanel or Namecheap account

### Common Help Topics
- "How to install Node.js application"
- "Setting up MySQL database"
- "SSL certificate installation"
- "SSH access setup"

---

## ✅ Deployment Checklist

- [ ] MySQL database created in cPanel
- [ ] Database user created with all privileges
- [ ] Schema and seed data imported
- [ ] Application files uploaded to server
- [ ] node_modules installed via npm
- [ ] .env file configured with correct credentials
- [ ] Node.js app created in cPanel
- [ ] Environment variables set
- [ ] Application started successfully
- [ ] Domain/subdomain configured
- [ ] SSL certificate installed
- [ ] HTTPS forced via .htaccess
- [ ] Health endpoint returns 200 OK
- [ ] Login endpoint tested successfully
- [ ] All API endpoints tested
- [ ] Logs are being generated
- [ ] Automated backups configured
- [ ] Error monitoring set up

---

## 🎯 Quick Reference

### Important Paths
```
Application Root: ~/public_html/api
Logs: ~/public_html/api/logs
Backups: ~/public_html/api/backups
Environment: ~/public_html/api/.env
```

### Important URLs
```
API Base: https://api.yourdomain.com
Health Check: https://api.yourdomain.com/health
cPanel: https://yourdomain.com:2083
phpMyAdmin: https://yourdomain.com:2083/phpMyAdmin
```

### Important Commands
```bash
# Restart app
touch ~/public_html/api/tmp/restart.txt

# View logs
tail -f ~/public_html/api/logs/error-*.log

# Backup database
node ~/public_html/api/scripts/backup-database.js backup

# Test connection
curl https://api.yourdomain.com/health
```

---

**Last Updated:** December 27, 2024  
**Version:** 1.0.0  
**Platform:** Namecheap cPanel Shared/VPS Hosting

---

## 🎉 Congratulations!

Your Green Permit API should now be running successfully on Namecheap cPanel hosting!

For ongoing support and updates, refer to:
- `PRODUCTION_CHECKLIST.md` - Pre-deployment verification
- `DEPLOYMENT.md` - General deployment guide
- Namecheap support for hosting-specific issues
