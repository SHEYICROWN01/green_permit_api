# Database Migrations

Place your database migration files here with the following naming convention:

YYYY-MM-DD-HH-MM-description.sql

Example:
2024-01-15-10-30-add-officer-status-column.sql

Migrations are executed in chronological order.

## Creating a Migration

1. Create a new SQL file with timestamp and description
2. Write your SQL DDL statements
3. Run: npm run db:migrate

## Rollback (optional)

Create a corresponding rollback file:
YYYY-MM-DD-HH-MM-description.rollback.sql

Run rollback:
node scripts/migrate.js rollback
