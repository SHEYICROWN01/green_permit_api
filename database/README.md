# MySQL Database Setup Guide

## Prerequisites

Make sure you have MySQL installed on your system:

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Ubuntu/Debian:**
```bash
sudo apt-get install mysql-server
sudo systemctl start mysql
```

**Windows:**
Download and install from [MySQL Downloads](https://dev.mysql.com/downloads/mysql/)

## Configuration

1. **Update your `.env` file** with your MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=green_permit_db
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_CONNECTION_LIMIT=10
```

2. **Secure your MySQL installation** (recommended):
```bash
sudo mysql_secure_installation
```

## Database Initialization

### Option 1: Automated Setup (Recommended)

Run the initialization script to create the database, tables, and seed data:

```bash
npm run db:init
```

This will:
- Create the `green_permit_db` database
- Create all tables from `database/schema.sql`
- Insert seed data from `database/seed.sql`

### Option 2: Manual Setup

**Step 1: Create the database**
```bash
mysql -u root -p
```

```sql
CREATE DATABASE green_permit_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;
```

**Step 2: Run schema**
```bash
npm run db:schema
# or manually:
mysql -u root -p green_permit_db < database/schema.sql
```

**Step 3: Run seed data** (optional)
```bash
npm run db:seed
# or manually:
mysql -u root -p green_permit_db < database/seed.sql
```

## Verify Setup

1. **Check database connection:**
```bash
npm run dev
```

You should see:
```
✅ MySQL Database connected successfully
```

2. **Test API endpoints:**

Get all examples:
```bash
curl http://localhost:3000/api/v1/examples
```

3. **Access MySQL directly:**
```bash
mysql -u root -p green_permit_db
```

```sql
SHOW TABLES;
SELECT * FROM examples;
```

## Common Issues

### Connection Error: ER_NOT_SUPPORTED_AUTH_MODE

If you get authentication errors, update the MySQL user password format:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

### Access Denied Error

Make sure your `.env` file has the correct credentials:
- Check username (usually `root`)
- Check password
- Verify MySQL is running: `mysql --version`

### Database Not Found

Run the database initialization:
```bash
npm run db:init
```

## Database Scripts

| Command | Description |
|---------|-------------|
| `npm run db:init` | Complete database setup (create DB, schema, seed) |
| `npm run db:schema` | Run schema only |
| `npm run db:seed` | Run seed data only |

## Database Structure

### Tables

**examples** - Sample table demonstrating the structure
- `id` - Auto-increment primary key
- `name` - VARCHAR(100), required
- `description` - TEXT, optional
- `created_at` - Timestamp (auto)
- `updated_at` - Timestamp (auto-update)

## Adding New Tables

1. Add your table definition to `database/schema.sql`:
```sql
CREATE TABLE your_table (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- your columns here
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

2. Create a model in `src/models/YourModel.js`

3. Create a controller in `src/controllers/yourModel.controller.js`

4. Create routes in `src/routes/yourModel.routes.js`

5. Register routes in `src/routes/index.js`

## Backup & Restore

**Backup:**
```bash
mysqldump -u root -p green_permit_db > backup.sql
```

**Restore:**
```bash
mysql -u root -p green_permit_db < backup.sql
```

## Production Considerations

1. **Use environment variables** for sensitive data
2. **Enable SSL/TLS** for database connections
3. **Implement connection pooling** (already configured)
4. **Set up regular backups**
5. **Use database migrations** for schema changes
6. **Monitor connection pool** usage and performance
