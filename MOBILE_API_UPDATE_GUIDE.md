# 📱 Mobile App - Production API Update Guide

**Date:** January 1, 2026  
**Status:** ✅ Production API is LIVE

---

## 🚀 Quick Update Steps

### **1. Update API Base URL**



Update your API configuration file (usually `config.js` or `constants.js`):

```javascript
// OLD (Local Development)
export const API_BASE_URL = 'http://10.0.2.2:3000/api/v1'; // Android Emulator
// or
export const API_BASE_URL = 'http://localhost:3000/api/v1'; // iOS Simulator

// NEW (Production)
export const API_BASE_URL = 'https://gtech.gifamz.com/api/v1';
```

#### **Flutter:**

Update your `lib/constants/api_constants.dart`:

```dart
// OLD
static const String baseUrl = 'http://10.0.2.2:3000/api/v1';

// NEW
static const String baseUrl = 'https://gtech.gifamz.com/api/v1';
```

#### **Native Android (Kotlin/Java):**

Update `ApiConstants.kt` or `ApiClient.java`:

```kotlin
// OLD
const val BASE_URL = "http://10.0.2.2:3000/api/v1/"

// NEW
const val BASE_URL = "https://gtech.gifamz.com/api/v1/"
```

#### **Native iOS (Swift):**

Update your API configuration:

```swift
// OLD
static let baseURL = "http://localhost:3000/api/v1"

// NEW
static let baseURL = "https://gtech.gifamz.com/api/v1"
```

---

### **2. Update Environment Variables (if used)**

If using `.env` files:

```bash
# OLD
API_URL=http://10.0.2.2:3000/api/v1

# NEW
API_URL=https://gtech.gifamz.com/api/v1
```

---

### **3. Test the Connection**

Add this test function to verify connectivity:

#### **React Native:**
```javascript
const testAPI = async () => {
  try {
    const response = await fetch('https://gtech.gifamz.com/health');
    const data = await response.json();
    console.log('API Status:', data);
    Alert.alert('Success', 'Connected to Production API!');
  } catch (error) {
    console.error('API Error:', error);
    Alert.alert('Error', 'Cannot connect to API');
  }
};
```

#### **Flutter:**
```dart
Future<void> testAPI() async {
  try {
    final response = await http.get(
      Uri.parse('https://gtech.gifamz.com/health')
    );
    print('API Status: ${response.body}');
  } catch (e) {
    print('API Error: $e');
  }
}
```

---

## 📋 Production Endpoints

### **Base URL:**
```
https://gtech.gifamz.com/api/v1
```

### **Officer Endpoints (Mobile App):**

**Officer Login:**
```
POST /auth/supervisor/login
Body: {
  "username": "officer-username",
  "password": "officer-password"
}
```

**Activate Sticker:**
```
POST /officer/stickers/activate
Headers: {
  "Authorization": "Bearer {token}"
}
Body: {
  "sticker_code": "IFO-CP-000001",
  "customer_name": "John Doe",
  "customer_phone": "08012345678",
  "location": "Ifo Market"
}
```

**Get Officer Activities:**
```
GET /officer/activities
Headers: {
  "Authorization": "Bearer {token}"
}
```

**Get Assigned Stickers:**
```
GET /officer/stickers
Headers: {
  "Authorization": "Bearer {token}"
}
```

---

## 🔐 Authentication

**Important Changes:**

1. **Login uses `username` not `email`:**

```json
{
  "username": "officer01",
  "password": "YourPassword123"
}
```

2. **Token must be included in all requests:**

```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

3. **Token expires in 24 hours** - implement token refresh logic

---

## 📱 Platform-Specific Notes

### **Android:**
- Ensure `INTERNET` permission is in `AndroidManifest.xml`:
  ```xml
  <uses-permission android:name="android.permission.INTERNET" />
  ```
- Clear network security config if you had localhost exceptions

### **iOS:**
- Update `Info.plist` if you had local network settings
- Remove any `NSAppTransportSecurity` exceptions for localhost

### **React Native:**
- Clear cache: `npx react-native start --reset-cache`
- Rebuild app after URL change

### **Flutter:**
- Clear build: `flutter clean && flutter pub get`
- Rebuild app

---

## ✅ Testing Checklist

- [ ] API base URL updated in all config files
- [ ] Health endpoint test successful
- [ ] Login functionality working
- [ ] JWT token received and stored
- [ ] Sticker activation working
- [ ] Sticker verification working
- [ ] Location data being sent correctly
- [ ] Camera/QR scanner working with production data

---

## 🎯 QR Code Format

Production stickers use this format:
```
IFO-CP-000001
IFO-CP-000002
etc.
```

Make sure your QR scanner validates this format.

---

## 🆘 Troubleshooting

**Network Error?**
- Check internet connection
- Verify URL is correct: `https://gtech.gifamz.com/api/v1`
- Test in browser first

**401 Unauthorized?**
- Check token is being sent in headers
- Token format: `Authorization: Bearer {token}`
- Token may have expired (24h validity)

**SSL Certificate Error?**
- Update app's security config
- Ensure HTTPS is properly handled

**Timeout?**
- Production server may be slower than localhost
- Increase timeout settings in your HTTP client

---

## 🔄 Development vs Production

Keep both configurations for easy switching:

```javascript
const API_CONFIG = {
  development: 'http://10.0.2.2:3000/api/v1',
  production: 'https://gtech.gifamz.com/api/v1'
};

export const API_BASE_URL = __DEV__ 
  ? API_CONFIG.development 
  : API_CONFIG.production;
```

---

## 📞 Support

**Backend Team Contact:**  
Report any API issues immediately.

**API Documentation:**  
```
GET https://gtech.gifamz.com/api/v1
```

---

**Happy coding! 🎉📱**
