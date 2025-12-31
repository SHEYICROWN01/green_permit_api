# 🆘 Namecheap cPanel Deployment - FAQ & Troubleshooting

Quick answers to common questions when deploying to Namecheap cPanel.

---

## ❓ Frequently Asked Questions

### Q1: Does my Namecheap hosting plan support Node.js?

**A:** Not all plans do. You need:
- **Shared Hosting:** Business or higher (Stellar Business, Stellar Business Pro)
- **Reseller Hosting:** Most plans support it
- **VPS/Dedicated:** All plans support it

**How to check:**
1. Login to cPanel
2. Look for "Setup Node.js App" in Software section
3. If not found, contact Namecheap support to enable it or upgrade plan

---

### Q2: What Node.js version should I use?

**A:** Use the highest version available (preferably 18.x or higher)
- Check available versions in cPanel → Setup Node.js App
- Our app requires Node.js 16.x minimum
- 18.x is recommended and tested

---

### Q3: Can I use Docker on Namecheap cPanel?

**A:** No, Docker is not supported on shared hosting.
- Docker requires root access
- Only available on VPS/Dedicated servers
- Use the traditional cPanel deployment method instead

---

### Q4: Why can't I use PM2 cluster mode?

**A:** Shared hosting limitations:
- Limited to single process
- No process manager control
- cPanel uses Passenger for Node.js apps
- PM2 only works on VPS with full access

**What to use instead:**
- Let cPanel's Passenger handle process management
- Remove PM2 from startup
- Use `node src/server.js` directly

---

### Q5: Where should I upload my files?

**A:** Recommended locations:
```
Option 1 (Subdomain): ~/public_html/api
Option 2 (Main domain): ~/public_html
Option 3 (Separate): ~/api (then configure cPanel)
```

**Best practice:** Use subdomain (api.yourdomain.com) with ~/public_html/api

---

### Q6: My database name doesn't work, why?

**A:** cPanel prefixes database names:
```
What you create: green_permit_db
Actual name: cpaneluser_green_permit_db

What you create: green_permit_user  
Actual name: cpaneluser_green_permit_user
```

**Solution:** 
- Use FULL name in .env (check phpMyAdmin for exact name)
- Example: `DB_NAME=myusername_green_permit_db`

---

### Q7: How do I get my database credentials?

**A:** Follow these steps:
1. cPanel → MySQL Databases
2. Note the database name (includes prefix)
3. Note the username (includes prefix)
4. Password is what YOU set when creating user
5. Host is always `localhost` on cPanel

---

### Q8: What is my API URL after deployment?

**A:** Depends on your setup:
```
Subdomain: https://api.yourdomain.com/health
Main domain with path: https://yourdomain.com/api/health
Custom port (testing): https://yourdomain.com:3000/health
```

---

### Q9: How do I enable SSH access?

**A:** Two methods:

**Method 1 (Manage SSH in cPanel):**
1. cPanel → Security → SSH Access
2. Manage SSH Keys
3. Generate key pair
4. Authorize key

**Method 2 (Contact Support):**
1. Open ticket with Namecheap
2. Request SSH access
3. They'll enable it (usually within 24 hours)

---

### Q10: Can I use a custom Node.js version?

**A:** Limited options:
- Shared: Only versions provided by cPanel
- VPS: Can install any version using nvm

**Check available versions:**
- cPanel → Setup Node.js App → Version dropdown

---

## 🔧 Common Issues & Solutions

### Issue 1: "Setup Node.js App" not in cPanel

**Problem:** Node.js option missing from cPanel

**Solutions:**
```
1. Contact Namecheap support to enable Node.js
2. Upgrade to Business plan or higher
3. Consider VPS hosting for full control
```

**Alternative:** Use VPS or cloud hosting (see DEPLOYMENT.md)

---

### Issue 2: Application shows "404 Not Found"

**Problem:** API not routing correctly

**Diagnosis:**
```bash
# Check if app is running
curl http://localhost:3000/health

# Check Apache proxy
cat ~/.htaccess
```

**Solutions:**
```
1. Verify Application URL in Node.js App settings
2. Check .htaccess proxy rules
3. Restart application
4. Check Node.js app status (should show "Running")
```

**Correct .htaccess:**
```apache
RewriteEngine On
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

---

### Issue 3: "Cannot connect to database"

**Problem:** Database connection failing

**Error message:**
```
Error: Access denied for user 'green_permit_user'@'localhost'
```

**Common causes:**
```
❌ Wrong database name (missing cPanel prefix)
❌ Wrong username (missing cPanel prefix)
❌ Wrong password
❌ User not assigned to database
❌ Using 127.0.0.1 instead of localhost
```

**Solutions:**
```bash
1. Verify credentials in phpMyAdmin
   - Login and check database list
   - Note EXACT database and username

2. Update .env with FULL names:
   DB_NAME=cpaneluser_green_permit_db
   DB_USER=cpaneluser_green_permit_user
   DB_HOST=localhost  # NOT 127.0.0.1

3. Verify user privileges:
   - cPanel → MySQL Databases
   - Check user is assigned to database
   - Ensure ALL PRIVILEGES granted

4. Test connection:
   mysql -h localhost -u cpaneluser_green_permit_user -p cpaneluser_green_permit_db
```

---

### Issue 4: "Application keeps crashing"

**Problem:** App restarts repeatedly

**Check logs:**
```bash
# Via SSH
tail -f ~/public_html/api/logs/error-*.log

# Via cPanel
Setup Node.js App → Select app → View Logs
```

**Common causes:**
```
1. Memory limit exceeded
   - Solution: Reduce DB_CONNECTION_LIMIT to 5
   - Contact support to increase memory

2. Missing dependencies
   - Solution: Run npm ci --only=production

3. Port already in use
   - Solution: cPanel assigns port, don't hardcode

4. Environment variables missing
   - Solution: Check all required vars are set

5. Database connection pool exhausted
   - Solution: Lower DB_CONNECTION_LIMIT
```

**Quick fix:**
```bash
cd ~/public_html/api
rm -rf node_modules
npm ci --only=production
# Restart app in cPanel
```

---

### Issue 5: "npm install fails"

**Problem:** Dependencies won't install

**Error examples:**
```
npm ERR! EACCES: permission denied
npm ERR! Maximum call stack size exceeded
npm ERR! Network timeout
```

**Solutions:**

**For permission errors:**
```bash
# Fix permissions
cd ~/public_html/api
chmod -R 755 .
npm cache clean --force
npm ci --only=production
```

**For network errors:**
```bash
# Use different registry
npm config set registry https://registry.npmjs.org/
npm ci --only=production
```

**For timeout errors:**
```bash
# Increase timeout
npm config set fetch-timeout 60000
npm ci --only=production
```

**Last resort:**
```bash
# Install locally and upload
# On your computer:
npm ci --only=production
# Upload entire project including node_modules via FTP
```

---

### Issue 6: "502 Bad Gateway"

**Problem:** Nginx/Apache can't reach Node app

**Diagnosis:**
```bash
# Check if app is running
ps aux | grep node

# Check port
netstat -tulpn | grep 3000

# Check logs
tail -f ~/logs/error_log
```

**Solutions:**
```
1. Restart application in cPanel
2. Check Application Status (should be "Running")
3. Verify port in Node.js App settings
4. Check if Apache proxy is configured
5. Contact support if issue persists
```

---

### Issue 7: CORS errors in browser

**Problem:** Frontend can't access API

**Error in browser console:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solutions:**

**1. Update CORS_ORIGIN in .env:**
```bash
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

**2. If using subdomain:**
```bash
CORS_ORIGIN=https://yourdomain.com,https://api.yourdomain.com
```

**3. Restart app after changing**

**4. Verify in code** (src/app.js should have):
```javascript
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));
```

---

### Issue 8: SSL certificate not working

**Problem:** HTTPS shows "Not Secure"

**Solutions:**

**1. Install SSL via cPanel:**
```
cPanel → SSL/TLS Status → Run AutoSSL
Wait 5-10 minutes for installation
```

**2. Force HTTPS in .htaccess:**
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

**3. Update environment:**
```bash
FORCE_HTTPS=true
API_URL=https://api.yourdomain.com  # Note HTTPS
```

**4. Verify SSL:**
```bash
curl -I https://api.yourdomain.com
# Should return 200 OK, not redirect
```

---

### Issue 9: File upload fails

**Problem:** Can't upload files via API

**Common causes:**
```
1. File size exceeds limit
2. Insufficient disk space
3. Permission denied
4. Wrong upload directory
```

**Solutions:**

**1. Check and increase limits in .env:**
```bash
MAX_FILE_SIZE=5mb
MAX_REQUEST_SIZE=10mb
```

**2. Set directory permissions:**
```bash
mkdir -p ~/public_html/api/uploads
chmod 755 ~/public_html/api/uploads
```

**3. Check disk space:**
```bash
df -h ~
```

**4. Increase PHP limits** (if using PHP proxy):
```
cPanel → MultiPHP INI Editor
upload_max_filesize = 10M
post_max_size = 10M
```

---

### Issue 10: Slow API responses

**Problem:** API is very slow

**Diagnosis:**
```bash
# Check database query times
tail -f logs/combined-*.log | grep "ms"

# Check memory usage
top
```

**Optimizations:**

**1. Reduce database connections:**
```bash
# In .env
DB_CONNECTION_LIMIT=5  # Lower for shared hosting
```

**2. Add database indexes** (if missing):
```sql
CREATE INDEX idx_sticker_code ON stickers(sticker_code);
CREATE INDEX idx_officer_id ON users(officer_id);
```

**3. Enable compression** (should be default):
```javascript
// Already in app.js
app.use(compression());
```

**4. Optimize queries:**
```javascript
// Use SELECT specific columns, not SELECT *
// Add WHERE clauses to limit results
// Use pagination for large datasets
```

**5. Consider upgrading:**
- Shared hosting → VPS
- More memory/CPU resources

---

## 📋 Deployment Checklist

Use this before going live:

### Pre-Deployment
- [ ] Node.js version 18.x selected in cPanel
- [ ] Database created with correct prefix
- [ ] Database user created and assigned
- [ ] Schema imported via phpMyAdmin
- [ ] All files uploaded (except node_modules)
- [ ] .env file configured with correct values
- [ ] All secrets generated (JWT_SECRET, etc.)
- [ ] CORS_ORIGIN set to actual domain

### In cPanel
- [ ] Node.js app created
- [ ] Application root path correct
- [ ] Startup file set to src/server.js
- [ ] Environment variables set
- [ ] Dependencies installed (npm install)
- [ ] Application started
- [ ] Status shows "Running"

### Domain/SSL
- [ ] Subdomain created (if using)
- [ ] DNS propagated (check with ping)
- [ ] SSL certificate installed
- [ ] HTTPS forced via .htaccess
- [ ] CORS configured for domain

### Testing
- [ ] /health endpoint returns 200
- [ ] /api/v1/officer/auth/login works
- [ ] All endpoints tested
- [ ] CORS works from frontend
- [ ] File uploads work (if applicable)
- [ ] No errors in logs

### Monitoring
- [ ] Log files being created
- [ ] Error logging working
- [ ] Backup script tested
- [ ] Cron job for backups (optional)

---

## 🆘 Getting Help

### 1. Check Logs First
```bash
# Error logs
tail -50 ~/public_html/api/logs/error-*.log

# Application logs  
tail -50 ~/public_html/api/logs/combined-*.log

# Apache logs
tail -50 ~/logs/error_log
```

### 2. Verify Configuration
```bash
# Check .env
cat ~/public_html/api/.env | grep -v PASSWORD

# Check Node.js app settings
# cPanel → Setup Node.js App → Click app name

# Test database connection
mysql -h localhost -u USER -p DATABASE
```

### 3. Contact Support

**Namecheap Support:**
- Live Chat: https://www.namecheap.com/support/
- Ticket: Via cPanel or account dashboard
- Phone: Check your account for number

**What to include:**
- Exact error message
- Steps to reproduce
- Log file excerpts
- cPanel username
- Domain name

### 4. Community Resources
- Namecheap Community: https://www.namecheap.com/support/knowledgebase/
- cPanel Documentation: https://docs.cpanel.net/
- Node.js cPanel Guide: Search "cPanel Node.js application"

---

## 📚 Additional Resources

### Official Documentation
- [NAMECHEAP_DEPLOYMENT.md](./NAMECHEAP_DEPLOYMENT.md) - Complete deployment guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - General deployment options
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) - Pre-launch checklist

### Namecheap Guides
- [How to use Node.js on cPanel](https://www.namecheap.com/support/knowledgebase/article.aspx/10146/2182/how-to-use-nodejs-on-cpanel/)
- [MySQL Database Management](https://www.namecheap.com/support/knowledgebase/category.aspx/213/mysql/)
- [SSL Installation](https://www.namecheap.com/support/knowledgebase/category.aspx/68/ssl-certificates/)

---

**Last Updated:** December 27, 2024  
**For:** Namecheap cPanel Hosting
