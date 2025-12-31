# 🚀 START HERE - Namecheap cPanel Deployment

## Quick Navigation

### 🎯 I Want to Deploy to Namecheap cPanel NOW!

**👉 [QUICK_START_CPANEL.md](./QUICK_START_CPANEL.md)** ⭐ **START HERE!**

This is your **30-minute** deployment guide with 5 simple steps.

---

### 📚 I Need Detailed Instructions

**👉 [NAMECHEAP_DEPLOYMENT.md](./NAMECHEAP_DEPLOYMENT.md)**

Complete guide with:
- Database setup (step-by-step with screenshots placeholders)
- File preparation and upload methods
- Node.js app configuration
- SSL certificate setup
- Troubleshooting guide
- Performance optimization

---

### ❓ I'm Having Issues

**👉 [CPANEL_FAQ.md](./CPANEL_FAQ.md)**

Answers to 10+ common questions:
- "Setup Node.js App" not found
- Database connection fails
- Application won't start
- 502 Bad Gateway
- CORS errors
- And more...

---

### ✅ I Want to Verify Everything Before Launch

**👉 [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)**

Complete pre-launch checklist covering:
- Environment configuration
- Security verification
- Database setup
- Monitoring & logging
- Performance optimization

---

### 🐳 I Want to Use Docker or Other Platforms

**👉 [DEPLOYMENT.md](./DEPLOYMENT.md)**

Deployment guides for:
- Docker & Docker Compose
- Traditional VPS (Ubuntu/Debian)
- AWS (Elastic Beanstalk, EC2, ECS)
- DigitalOcean (App Platform, Droplets)
- Heroku
- Google Cloud Platform
- And more...

---

## 📦 What's in This Package?

### Namecheap cPanel Files (5 files)
- `NAMECHEAP_DEPLOYMENT.md` - Complete guide
- `CPANEL_FAQ.md` - FAQ & troubleshooting
- `QUICK_START_CPANEL.md` - 30-minute quick start
- `.env.cpanel` - Environment template for cPanel
- `cpanel-setup.sh` - Automated setup script

### Production Deployment Files (5 files)
- `Dockerfile` - Multi-stage Docker build
- `docker-compose.yml` - Container orchestration
- `.dockerignore` - Docker optimization
- `ecosystem.config.js` - PM2 process management
- `.env.production` - Production environment template

### Scripts & Automation (3 files)
- `scripts/migrate.js` - Database migrations
- `scripts/backup-database.js` - Automated backups
- `.github/workflows/ci-cd.yml` - CI/CD pipeline

### Documentation (6 files)
- `DEPLOYMENT.md` - General deployment guide
- `PRODUCTION_CHECKLIST.md` - Pre-launch checklist
- `PRODUCTION_SETUP.md` - Setup summary
- `DEPLOYMENT_COMPLETE.md` - Complete deployment summary
- `README.md` - Updated main README
- This file!

---

## ⚡ Super Quick Start

```bash
# 1. Prepare environment
cp .env.cpanel .env
# Edit .env with your database credentials

# 2. Generate secrets (run 3 times)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 3. Create deployment package
zip -r green-permit-api.zip . -x "node_modules/*" ".git/*" "tests/*"

# 4. Upload to cPanel and follow QUICK_START_CPANEL.md
```

---

## 🎯 Recommended Reading Order

### For Beginners (First Time Deploying)
1. `QUICK_START_CPANEL.md` (5 minutes)
2. `NAMECHEAP_DEPLOYMENT.md` (Reference as needed)
3. `CPANEL_FAQ.md` (When you encounter issues)

### For Experienced Developers
1. `PRODUCTION_CHECKLIST.md` (Verify everything)
2. `NAMECHEAP_DEPLOYMENT.md` (cPanel-specific details)
3. `DEPLOYMENT.md` (Alternative deployment options)

---

## 💡 Key Information

### Database Setup
- cPanel adds username prefix to database names
- Format: `cpaneluser_green_permit_db`
- Always use `localhost` for `DB_HOST`, not `127.0.0.1`

### Environment Variables
- Generate strong JWT secrets (64 characters)
- Set CORS_ORIGIN to your actual domain
- Configure all database credentials correctly

### Requirements
- Namecheap Business plan or higher
- Node.js 18.x (select in cPanel)
- MySQL database access
- Domain or subdomain configured

---

## 🆘 Getting Help

### Check First
1. Error logs in cPanel → "Setup Node.js App" → "View Logs"
2. `CPANEL_FAQ.md` for common issues
3. Database credentials are correct

### Contact Support
- **Namecheap Support:** Live chat or ticket
- **Technical Issues:** Check documentation first

---

## ✅ Success Checklist

Your deployment is successful when:

- [ ] `/health` endpoint returns 200 OK
- [ ] Officer login works
- [ ] All API endpoints respond
- [ ] HTTPS/SSL is working
- [ ] No errors in logs
- [ ] Database backups configured

Test commands:
```bash
# Health check
curl https://api.yourdomain.com/health

# Login test
curl -X POST https://api.yourdomain.com/api/v1/officer/auth/login \
  -H "Content-Type: application/json" \
  -d '{"officerId":"OFC-TEST-001","pin":"1234"}'
```

---

## 📞 Quick Reference

### Important Files
- Configuration: `.env`
- Database Schema: `database/schema.sql`
- Database Seed: `database/seed.sql`

### Important Commands
```bash
# Generate secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Create deployment zip
zip -r green-permit-api.zip . -x "node_modules/*" ".git/*"

# Test deployment
curl https://api.yourdomain.com/health
```

### Important URLs
- cPanel: `https://yourdomain.com:2083`
- API: `https://api.yourdomain.com`
- Health: `https://api.yourdomain.com/health`

---

## 🎉 You're Ready!

**Start with:** [QUICK_START_CPANEL.md](./QUICK_START_CPANEL.md)

**Time to deploy:** ~30 minutes

**Good luck!** 🚀

---

**Last Updated:** December 27, 2024  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
