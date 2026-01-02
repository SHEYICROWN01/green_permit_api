# 🌐 Web Frontend - Production API Update Guide

**Date:** January 1, 2026  
**Status:** ✅ Production API is LIVE

---

## 🚀 Quick Update Steps

### **1. Update Your Environment Variables**

Open your `.env` or `.env.production` file and update:

```bash
# OLD (Local Development)
REACT_APP_API_URL=http://localhost:3000/api/v1

# NEW (Production)
REACT_APP_API_URL=https://gtech.gifamz.com/api/v1
```

**Or if using Vite/Next.js:**

```bash
# Vite
VITE_API_URL=https://gtech.gifamz.com/api/v1

# Next.js
NEXT_PUBLIC_API_URL=https://gtech.gifamz.com/api/v1
```

---

### **2. Update API Base URL (if hardcoded)**

If you have the API URL in your config files:

```javascript
// OLD
const API_BASE_URL = 'http://localhost:3000/api/v1';

// NEW
const API_BASE_URL = 'https://gtech.gifamz.com/api/v1';
```

---

### **3. Test the Connection**

Run this in your browser console or API client:

```javascript
fetch('https://gtech.gifamz.com/health')
  .then(res => res.json())
  .then(data => console.log('API Status:', data));
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-01T...",
  "uptime": 1234.56
}
```

---

## 📋 Production Endpoints

### **Base URL:**
```
https://gtech.gifamz.com/api/v1
```

### **Key Endpoints:**

**Super Admin Login:**
```
POST /auth/super-admin/login
Body: {
  "username": "superadmin",
  "password": "Admin@2025"
}
```

**LGA Admin/Supervisor Login:**
```
POST /auth/supervisor/login
Body: {
  "username": "your-username",
  "password": "your-password"
}
```

**Get Current User:**
```
GET /auth/me
Headers: {
  "Authorization": "Bearer {your-token}"
}
```

**Dashboard:**
```
GET /admin/dashboard
GET /super-admin/dashboard
Headers: {
  "Authorization": "Bearer {your-token}"
}
```

---

## 🔐 Authentication Changes

**Important:** Login now uses `username` instead of `email`:

```javascript
// OLD
{
  "email": "admin@example.com",
  "password": "password"
}

// NEW
{
  "username": "superadmin",
  "password": "Admin@2025"
}
```

---

## ✅ Verification Checklist

- [ ] Environment variables updated
- [ ] API base URL changed in all config files
- [ ] Tested health endpoint
- [ ] Tested login endpoint
- [ ] JWT token received successfully
- [ ] Dashboard loads with real data
- [ ] All CRUD operations working

---

## 🆘 Troubleshooting

**CORS Error?**
- Check that your frontend domain is whitelisted
- Contact backend team to add your domain to CORS

**401 Unauthorized?**
- Verify JWT token is being sent in headers
- Check token format: `Authorization: Bearer {token}`

**404 Not Found?**
- Verify endpoint path is correct
- Check API documentation for route changes

---

## 📞 Support

**Backend Team Contact:**  
If you encounter any issues, contact the backend team immediately.

**API Documentation:**  
All available endpoints are listed at:
```
GET https://gtech.gifamz.com/api/v1
```

---

**Happy coding! 🎉**
