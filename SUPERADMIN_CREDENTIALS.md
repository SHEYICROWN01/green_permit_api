# 🔐 SUPERADMIN QUICK REFERENCE

## LOGIN CREDENTIALS

| Field    | Value                    |
|----------|--------------------------|
| Email    | admin@greenpermit.com    |
| Username | superadmin               |
| Password | Admin@2025               |
| Role     | super_admin              |

**Login Options:**
- ✅ Login with email: `admin@greenpermit.com`
- ✅ Login with username: `superadmin`

---

## API ENDPOINTS FOR TESTING

### Authentication
```bash
POST /api/superadmin/auth/login
Body: {
  "login": "admin@greenpermit.com",  # or "superadmin"
  "password": "Admin@2025"
}
```

### Dashboard
```bash
GET /api/superadmin/dashboard
Headers: Authorization: Bearer <token>
```

---

## QUICK TEST COMMANDS

### Check Database Status
```bash
node -e "const mysql = require('mysql2/promise'); const config = require('./src/config/env.config'); (async () => { const conn = await mysql.createConnection({host: config.database.host, user: config.database.user, password: config.database.password, database: config.database.name}); const [users] = await conn.query('SELECT COUNT(*) as count FROM users'); const [lgas] = await conn.query('SELECT COUNT(*) as count FROM lgas'); const [stickers] = await conn.query('SELECT COUNT(*) as count FROM stickers'); console.log('Users:', users[0].count, '| LGAs:', lgas[0].count, '| Stickers:', stickers[0].count); await conn.end(); })()"
```

### Reset Database & Recreate Superadmin
```bash
node scripts/setup-fresh-database.js
```

---

## 🎯 FIRST STEPS FOR TESTING

1. **Login**: Use credentials above
2. **Create LGA**: Add your first real LGA
3. **Create Users**: Add admins, supervisors, officers
4. **Generate Stickers**: Create sticker batches
5. **Test Activation**: Activate stickers
6. **Check Reports**: View revenue and activity

---

**Database Status:** ✅ Clean & Ready  
**Superadmin Status:** ✅ Active  
**Ready for Production Testing:** ✅ YES
