# 🚀 Production Deployment Guide

Complete guide for deploying Green Permit API to production environments.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment Methods](#deployment-methods)
  - [Docker Deployment](#docker-deployment)
  - [Traditional VPS Deployment](#traditional-vps-deployment)
  - [Cloud Platform Deployments](#cloud-platform-deployments)
- [Database Setup](#database-setup)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Monitoring & Logging](#monitoring--logging)
- [Backup & Recovery](#backup--recovery)
- [Security Checklist](#security-checklist)
- [Troubleshooting](#troubleshooting)

---

## 📦 Prerequisites

### Required Software
- **Node.js**: v18.x or higher
- **MySQL**: v8.0 or higher
- **PM2**: v5.x (for process management)
- **Docker & Docker Compose**: Latest version (for containerized deployment)
- **Nginx**: Latest version (for reverse proxy)

### Required Accounts/Services
- Domain name and DNS access
- SSL certificate (Let's Encrypt recommended)
- Cloud hosting account (AWS, DigitalOcean, Azure, etc.)
- SMTP service for emails (optional)
- SMS service for notifications (optional)

---

## 🔧 Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-username/green-permit-api.git
cd green-permit-api
```

### 2. Install Dependencies

```bash
npm ci --only=production
```

### 3. Configure Environment Variables

Copy and configure production environment file:

```bash
cp .env.production .env
```

**Critical configurations to update:**

```bash
# Generate strong secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update in .env file
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
SESSION_SECRET=<generated-secret>

# Database credentials
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=<strong-password>
DB_NAME=green_permit_db

# CORS origin
CORS_ORIGIN=https://your-production-domain.com

# Email/SMS services
SMTP_HOST=your-smtp-host
SMTP_USER=your-smtp-user
SMTP_PASSWORD=<smtp-password>
```

---

## 🚢 Deployment Methods

### Option 1: Docker Deployment (Recommended)

#### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+

#### Steps

1. **Build and start services:**

```bash
# Build the Docker image
npm run docker:build

# Start all services
npm run docker:run

# Verify services are running
docker-compose ps
```

2. **Check logs:**

```bash
npm run docker:logs
```

3. **Stop services:**

```bash
npm run docker:stop
```

#### Production Docker Compose

For production with Nginx and SSL:

```bash
# Start with Nginx reverse proxy
docker-compose --profile with-nginx up -d

# Start with Redis caching
docker-compose --profile with-redis up -d
```

---

### Option 2: Traditional VPS Deployment

#### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

#### Step 2: MySQL Configuration

```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
```

```sql
CREATE DATABASE green_permit_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'green_permit_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON green_permit_db.* TO 'green_permit_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Step 3: Deploy Application

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/your-username/green-permit-api.git
cd green-permit-api

# Install dependencies
sudo npm ci --only=production

# Setup environment
sudo cp .env.production .env
sudo nano .env  # Configure all variables

# Run database migrations
npm run db:migrate

# Start with PM2
npm run start:pm2

# Configure PM2 to start on boot
pm2 startup
pm2 save
```

#### Step 4: Nginx Configuration

```bash
# Copy nginx config
sudo cp nginx/nginx.conf /etc/nginx/sites-available/green-permit-api

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/green-permit-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

### Option 3: Cloud Platform Deployments

#### AWS (Elastic Beanstalk)

1. **Install EB CLI:**

```bash
pip install awsebcli
```

2. **Initialize and deploy:**

```bash
eb init green-permit-api --platform node.js --region us-east-1
eb create production
eb deploy
```

3. **Configure RDS database:**
- Create RDS MySQL instance
- Update environment variables in EB console

#### DigitalOcean (App Platform)

1. **Create app.yaml:**

```yaml
name: green-permit-api
services:
  - name: api
    github:
      repo: your-username/green-permit-api
      branch: main
    build_command: npm ci --only=production
    run_command: npm run start:prod
    envs:
      - key: NODE_ENV
        value: production
    health_check:
      http_path: /health
databases:
  - name: mysql-db
    engine: MYSQL
    version: "8"
```

2. **Deploy:**

```bash
doctl apps create --spec app.yaml
```

#### Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create green-permit-api

# Add MySQL addon
heroku addons:create jawsdb:kitefin

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret

# Deploy
git push heroku main

# Run migrations
heroku run npm run db:migrate
```

#### Google Cloud Platform (Cloud Run)

```bash
# Build and push container
gcloud builds submit --tag gcr.io/PROJECT_ID/green-permit-api

# Deploy to Cloud Run
gcloud run deploy green-permit-api \
  --image gcr.io/PROJECT_ID/green-permit-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 💾 Database Setup

### Initial Schema Setup

```bash
# Run migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### Creating Migrations

Create migration files in `database/migrations/` with timestamp naming:

```
2024-01-01-create-users-table.sql
2024-01-02-add-index-to-officers.sql
```

### Backup Configuration

```bash
# Manual backup
npm run db:backup

# Automated daily backups (cron)
crontab -e

# Add this line (daily at 2 AM)
0 2 * * * cd /var/www/green-permit-api && npm run db:backup
```

---

## 🔒 SSL/TLS Configuration

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.your-domain.com

# Auto-renewal (already configured with Certbot)
sudo certbot renew --dry-run
```

### Manual SSL Certificate

1. Place certificates in `nginx/ssl/`:
   - `fullchain.pem` (certificate chain)
   - `privkey.pem` (private key)

2. Update nginx configuration with paths

---

## 📊 Monitoring & Logging

### PM2 Monitoring

```bash
# Monitor processes
npm run monit:pm2

# View logs
npm run logs:pm2

# Web dashboard
pm2 install pm2-server-monit
```

### Application Logs

Logs are stored in `logs/` directory:
- `error-YYYY-MM-DD.log` - Error logs
- `combined-YYYY-MM-DD.log` - All logs
- `http-YYYY-MM-DD.log` - HTTP requests

### Health Checks

```bash
# Check API health
curl https://api.your-domain.com/health

# Expected response
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345.67
}
```

### Monitoring Tools Integration

- **Datadog**: Add datadog APM
- **New Relic**: Install newrelic package
- **Sentry**: Configure error tracking
- **Prometheus**: Expose /metrics endpoint

---

## 🔄 Backup & Recovery

### Automated Backups

```bash
# List all backups
node scripts/backup-database.js list

# Create backup
node scripts/backup-database.js backup

# Restore from backup
node scripts/backup-database.js restore backup-file.sql.gz
```

### Backup Strategy

1. **Daily automated backups** (retention: 30 days)
2. **Weekly backups** to external storage (S3, GCS)
3. **Pre-deployment backups** (before migrations)

### External Backup (AWS S3)

```bash
# Install AWS CLI
sudo apt install awscli

# Configure AWS credentials
aws configure

# Sync backups to S3
aws s3 sync ./backups s3://your-bucket/green-permit-backups/
```

---

## 🛡️ Security Checklist

### Pre-Deployment Security

- [ ] All environment variables use strong, unique values
- [ ] JWT secrets are cryptographically random (64+ bytes)
- [ ] Database passwords are strong (16+ characters)
- [ ] CORS is configured for specific domains (no wildcards)
- [ ] Rate limiting is enabled
- [ ] Helmet.js security headers configured
- [ ] HTTPS/TLS enforced (no HTTP in production)
- [ ] Database user has minimum required privileges
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] SSH key-based authentication (disable password auth)
- [ ] Regular security updates scheduled
- [ ] Backup encryption enabled
- [ ] Logs don't contain sensitive data
- [ ] API versioning implemented
- [ ] Input validation on all endpoints

### Post-Deployment Security

```bash
# Update firewall rules
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable

# Disable root SSH login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd

# Setup fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

---

## 🐛 Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs green-permit-api

# Check system logs
sudo journalctl -u nginx
sudo tail -f /var/log/mysql/error.log

# Verify environment variables
pm2 env 0
```

### Database Connection Issues

```bash
# Test MySQL connection
mysql -h DB_HOST -u DB_USER -p -e "SELECT 1"

# Check MySQL status
sudo systemctl status mysql

# Review connection settings
cat .env | grep DB_
```

### High Memory Usage

```bash
# Increase Node.js heap size
node --max-old-space-size=2048 src/server.js

# Or update ecosystem.config.js
# node_args: '--max-old-space-size=2048'
pm2 restart green-permit-api
```

### Nginx 502 Bad Gateway

```bash
# Check if API is running
curl http://localhost:3000/health

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify upstream configuration
sudo nginx -T | grep upstream
```

### SSL Certificate Issues

```bash
# Test SSL certificate
openssl s_client -connect api.your-domain.com:443

# Renew Let's Encrypt certificate
sudo certbot renew --force-renewal

# Check certificate expiry
echo | openssl s_client -connect api.your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## 🔄 Deployment Workflow

### Standard Deployment Process

1. **Pre-deployment:**
   ```bash
   # Run tests locally
   npm run test:ci
   
   # Create backup
   npm run db:backup
   ```

2. **Deploy:**
   ```bash
   # Pull latest code
   git pull origin main
   
   # Install dependencies
   npm ci --only=production
   
   # Run migrations
   npm run db:migrate
   
   # Restart application
   pm2 reload ecosystem.config.js --env production
   ```

3. **Post-deployment:**
   ```bash
   # Verify health
   curl https://api.your-domain.com/health
   
   # Monitor logs
   pm2 logs --lines 100
   ```

### Rollback Procedure

```bash
# Revert to previous version
git checkout <previous-commit-hash>

# Restore database backup
node scripts/backup-database.js restore <backup-file>

# Restart application
pm2 reload green-permit-api
```

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks

- **Daily**: Monitor logs and error rates
- **Weekly**: Review backups, check disk space
- **Monthly**: Update dependencies, security patches
- **Quarterly**: Review and rotate secrets

### Performance Optimization

```bash
# Enable PM2 cluster mode (use all CPU cores)
# Already configured in ecosystem.config.js

# Monitor performance
pm2 monit

# Analyze Node.js performance
node --prof src/server.js
```

---

## 📚 Additional Resources

- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [MySQL Performance Tuning](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)

---

## 📄 License

Copyright © 2024 Green Permit API. All rights reserved.
