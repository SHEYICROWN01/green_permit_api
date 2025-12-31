# Login Credentials for Green Permit API

**Last Updated:** December 29, 2025  
**Status:** ✅ All credentials verified and working

**Recent Fixes:**
- ✅ Login passwords fixed (Dec 29, 2025)
- ✅ Sticker prices fixed - now showing ₦3,400 instead of ₦34 (Dec 29, 2025)

---

## 🔐 Officer Login Credentials

All officers use the same password for development/testing:

**Password:** `Officer@123`

### Available Officer Usernames:

| Username | Name | LGA | Supervisor |
|----------|------|-----|------------|
| `obakare` | Oluwaseun Bakare | Ifo LGA | Adebayo Ogunleye |
| `peze` | Peace Eze | Ifo LGA | Adebayo Ogunleye |
| `qlawal` | Quadri Lawal | Ifo LGA | Adebayo Ogunleye |
| `rojo` | Ruth Ojo | Ifo LGA | Adebayo Ogunleye |
| `staiwo` | Samuel Taiwo | Ifo LGA | Adebayo Ogunleye |
| `tajayi` | Tunde Ajayi | Ifo LGA | Adebayo Ogunleye |
| `uokeke` | Uche Okeke | Ifo LGA | Adebayo Ogunleye |
| `vamadi` | Victoria Amadi | Ifo LGA | Adebayo Ogunleye |
| `wokonkwo` | Williams Okonkwo | Ifo LGA | Adebayo Ogunleye |
| `xadamu` | Xavier Adamu | Ifo LGA | Adebayo Ogunleye |

### Example Officer Login Request:
```json
POST /api/v1/officer/auth/login
{
  "username": "obakare",
  "password": "Officer@123"
}
```

---

## 👔 Supervisor Login Credentials

**Password:** `Admin@123`

### Available Supervisor Usernames:

| Username | Name | LGA |
|----------|------|-----|
| `aogunleye` | Adebayo Ogunleye | Ifo LGA |
| `cnwosu` | Chioma Nwosu | Ifo LGA |
| `eokafor` | Emeka Okafor | Ifo LGA |
| `fadeyemi` | Folake Adeyemi | Ifo LGA |
| `gokoro` | Grace Okoro | Abeokuta South LGA |
| `hibrahim` | Hassan Ibrahim | Abeokuta South LGA |
| `iudoh` | Ini Udoh | Abeokuta South LGA |
| `jafolabi` | Janet Afolabi | Abeokuta South LGA |
| `kbalogun` | Kunle Balogun | Ado-Odo/Ota LGA |
| `lmohammed` | Ladi Mohammed | Ado-Odo/Ota LGA |

---

## 🏛️ LGA Admin Login Credentials

**Password:** `Admin@123`

### Available LGA Admin Usernames:

| Username | Name | LGA |
|----------|------|-----|
| `ifo_admin` | John Doe | Ifo Local Government |
| `abs_admin` | Jane Smith | Abeokuta South LGA |
| `ado_admin` | Michael Johnson | Ado-Odo/Ota LGA |
| `sag_admin` | Sarah Williams | Sagamu LGA |
| `ike_admin` | David Brown | Ikenne LGA |

---

## 🔑 Super Admin Login Credentials

**Username:** `superadmin`  
**Password:** `Admin@123`  
**Email:** admin@greenpermit.ng

### Example Super Admin Login Request:
```json
POST /api/v1/admin/auth/login
{
  "username": "superadmin",
  "password": "Admin@123"
}
```

---

## 🔧 Troubleshooting

### Issue: "Invalid username or password"

**Root Cause:** The original seed file had corrupted/incomplete bcrypt hashes.

**Solution:** Passwords have been updated in the database. Use the credentials above.

### Verify Passwords in Database:

```javascript
// Run this to verify passwords are correct
node -e "
const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/database');

async function test() {
  const [users] = await pool.execute('SELECT username, password FROM users WHERE username = ?', ['obakare']);
  const match = await bcrypt.compare('Officer@123', users[0].password);
  console.log('Login test:', match ? '✅ SUCCESS' : '❌ FAILED');
  await pool.end();
}
test();
"
```

### Reset All Passwords:

If you need to reset all passwords to their defaults:

```bash
node -e "
const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/database');

async function reset() {
  const officerHash = await bcrypt.hash('Officer@123', 10);
  const adminHash = await bcrypt.hash('Admin@123', 10);
  
  await pool.execute('UPDATE users SET password = ? WHERE role = ?', [officerHash, 'officer']);
  await pool.execute('UPDATE users SET password = ? WHERE role IN (?, ?, ?)', 
    [adminHash, 'super_admin', 'lga_admin', 'supervisor']);
  
  console.log('✅ Passwords reset successfully');
  await pool.end();
}
reset();
"
```

---

## 📝 Notes

- **Development Only:** These credentials are for development and testing purposes only
- **Password Policy:** In production, implement proper password policies and reset functionality
- **Account Security:** All accounts are active by default; implement proper account management in production
- **Session Duration:** JWT tokens expire after 24 hours
