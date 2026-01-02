# ═══════════════════════════════════════════════════════════════════════════════
# NAMECHEAP DEPLOYMENT - QUICK REFERENCE GUIDE
# ═══════════════════════════════════════════════════════════════════════════════
# For detailed step-by-step instructions, see: NAMECHEAP_DEPLOYMENT_COMPLETE_GUIDE.md
# ═══════════════════════════════════════════════════════════════════════════════

## 📋 PRE-DEPLOYMENT CHECKLIST

✅ GitHub repository pushed: https://github.com/SHEYICROWN01/green_permit_api
✅ SSH access enabled on server
✅ Server details confirmed:
   - IP: 192.64.117.46
   - SSH Port: 21098
   - Username: ggtlnplz
   - Server: StellarBus18 (Namecheap Shared Hosting)

## 🚀 AUTOMATED DEPLOYMENT (RECOMMENDED)

### Option 1: Run from your local machine
```bash
./deploy-to-namecheap.sh
```

This script will:
- Test SSH connection
- Clone repository on server
- Install dependencies
- Configure PM2
- Start the application

### Option 2: Manual deployment via SSH
```bash
# 1. Connect to server
ssh -p 21098 ggtlnplz@192.64.117.46

# 2. Clone repository
git clone https://github.com/SHEYICROWN01/green_permit_api.git green-permit-api
cd green-permit-api

# 3. Install dependencies
npm install --production

# 4. Configure environment
cp .env.production .env
nano .env  # Edit with your actual values

# 5. Create database in cPanel (do this in browser)
#    - Database: ggtlnplz_green_permit
#    - User: ggtlnplz_gpuser
#    - Grant ALL privileges

# 6. Import database schema
mysql -h localhost -u ggtlnplz_gpuser -p ggtlnplz_green_permit < database/schema.sql

# 7. Create super admin
node scripts/create-superadmin.js

# 8. Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Follow the instructions shown
```

## 📁 FILES CREATED FOR DEPLOYMENT

| File | Purpose |
|------|---------|
| `deploy-to-namecheap.sh` | Automated deployment from local machine |
| `update-app.sh` | Quick update script (run on server after git push) |
| `backup-production-db.sh` | Database backup script (can be added to cron) |
| `health-check.sh` | Server health verification script |
| `.env.production` | Production environment template |
| `NAMECHEAP_DEPLOYMENT_COMPLETE_GUIDE.md` | Full detailed instructions |

## 🔄 UPDATING YOUR APP (AFTER INITIAL DEPLOYMENT)

### From your local machine:
```bash
# 1. Make changes to code
# 2. Commit and push to GitHub
git add .
git commit -m "Your update message"
git push origin main

# 3. SSH into server and update
ssh -p 21098 ggtlnplz@192.64.117.46
cd ~/green-permit-api
./update-app.sh
```

### What the update script does:
- Pulls latest code from GitHub
- Installs new dependencies
- Restarts the application with PM2
- Shows status

## 🗄️ DATABASE MANAGEMENT

### Create Database in cPanel:
1. Login to cPanel at: https://server.namecheaphosting.com:2083
2. Go to "MySQL Databases"
3. Create database: `ggtlnplz_green_permit`
4. Create user: `ggtlnplz_gpuser` with strong password
5. Add user to database with ALL PRIVILEGES

### Import Schema:
```bash
ssh -p 21098 ggtlnplz@192.64.117.46
cd ~/green-permit-api
mysql -h localhost -u ggtlnplz_gpuser -p ggtlnplz_green_permit < database/schema.sql
```

### Backup Database:
```bash
# Manual backup
./backup-production-db.sh

# Automated daily backup (add to crontab)
crontab -e
# Add this line:
0 2 * * * /home/ggtlnplz/green-permit-api/backup-production-db.sh
```

## 🔐 SECURITY CHECKLIST

- [ ] Change default superadmin password after first login
- [ ] Set strong JWT_SECRET in .env (min 32 characters)
- [ ] Configure CORS_ORIGIN with your actual frontend domains
- [ ] Protect .env file: `chmod 600 .env`
- [ ] Never commit .env to Git
- [ ] Enable SSL certificate in cPanel (Let's Encrypt)
- [ ] Set up automated database backups
- [ ] Configure PM2 to restart on server reboot

## 🔍 MONITORING & TROUBLESHOOTING

### Check application status:
```bash
ssh -p 21098 ggtlnplz@192.64.117.46
cd ~/green-permit-api
./health-check.sh
```

### View logs:
```bash
pm2 logs green-permit-api
pm2 logs green-permit-api --lines 100  # Last 100 lines
```

### Restart application:
```bash
pm2 restart green-permit-api
```

### Check PM2 status:
```bash
pm2 status
pm2 monit  # Interactive monitoring
```

## 🌐 DOMAIN CONFIGURATION

### Access application via domain:
1. In cPanel, go to "Setup Node.js App"
2. Create application with:
   - Node.js version: 18+
   - Application root: green-permit-api
   - Application URL: api.yourdomain.com
   - Application startup file: src/server.js
   - Port: 3000

### OR use Apache reverse proxy:
Create .htaccess in public_html:
```apache
RewriteEngine On
RewriteCond %{HTTP_HOST} ^api\.yourdomain\.com$
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

## 📞 SUPPORT RESOURCES

- **Namecheap cPanel**: https://server.namecheaphosting.com:2083
- **SSH Connection**: `ssh -p 21098 ggtlnplz@192.64.117.46`
- **Application Directory**: `/home/ggtlnplz/green-permit-api`
- **PM2 Logs**: `pm2 logs green-permit-api`
- **Database Backups**: `/home/ggtlnplz/database-backups/`

## 🎯 NEXT STEPS

1. ✅ **Deploy**: Run `./deploy-to-namecheap.sh`
2. ⚙️ **Configure**: Edit .env on server with actual credentials
3. 🗄️ **Database**: Create database in cPanel and import schema
4. 👤 **Admin**: Create superadmin user
5. 🧪 **Test**: Run health check and test endpoints
6. 🔒 **Secure**: Enable SSL and configure domain
7. 📊 **Monitor**: Set up PM2 monitoring and log rotation

## ⚡ QUICK COMMANDS REFERENCE

```bash
# Deploy (from local machine)
./deploy-to-namecheap.sh

# Update (on server)
cd ~/green-permit-api && ./update-app.sh

# Health Check (on server)
cd ~/green-permit-api && ./health-check.sh

# View Logs
pm2 logs green-permit-api

# Restart
pm2 restart green-permit-api

# Backup Database
cd ~/green-permit-api && ./backup-production-db.sh
```

═══════════════════════════════════════════════════════════════════════════════
For complete detailed instructions, see: NAMECHEAP_DEPLOYMENT_COMPLETE_GUIDE.md
═══════════════════════════════════════════════════════════════════════════════
