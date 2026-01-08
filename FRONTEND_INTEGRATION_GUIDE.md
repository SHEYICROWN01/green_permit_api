# 📘 Frontend Integration Guide - Public Sticker Verification

**API Version:** 1.0  
**Date:** January 8, 2026  
**Status:** ✅ Production Ready  
**Base URL:** `https://gtech.gifamz.com/api/v1`

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [API Endpoint](#api-endpoint)
3. [Request & Response](#request--response)
4. [Integration Steps](#integration-steps)
5. [Code Examples](#code-examples)
6. [UI/UX Guidelines](#uiux-guidelines)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

### What You're Building

A **public sticker verification page** that allows anyone to verify the authenticity and status of a Green Permit sticker by scanning a QR code or entering the sticker code manually.

### User Flow

1. User scans QR code with phone camera
2. QR code opens: `https://permitmanager.gifamz.com/verify/ONSEY-176757997717816002`
3. Your frontend extracts the code from URL
4. Frontend calls the verification API
5. Display the sticker status with appropriate badge

### URL Pattern

```
https://permitmanager.gifamz.com/verify/:stickerCode
```

**Example:**
```
https://permitmanager.gifamz.com/verify/ONSEY-176757997717816002
```

---

## 🔌 API Endpoint

### Endpoint Details

```
POST https://gtech.gifamz.com/api/v1/public/verify-sticker
```

- **Method:** `POST`
- **Authentication:** ❌ **None** (Public endpoint)
- **Content-Type:** `application/json`
- **CORS:** ✅ Enabled for your domain

---

## 📥 Request & Response

### Request Format

```json
{
  "code": "ONSEY-176757997717816002"
}
```

**Parameters:**

| Parameter | Type   | Required | Description                          |
|-----------|--------|----------|--------------------------------------|
| `code`    | string | Yes      | The sticker code to verify           |
| `gps_location` | string | No  | GPS coordinates (optional tracking)  |

---

### Response Format - Success Cases

#### ✅ Case 1: Valid Active Sticker

```json
{
  "success": true,
  "valid": true,
  "message": "Sticker is valid and active",
  "sticker": {
    "id": 128,
    "code": "ONSEY-176757997717816002",
    "lga_name": "Ifo Local Government",
    "state_name": "Ogun State",
    "status": "active",
    "is_activated": 1,
    "activated_at": "2025-06-15T10:30:00.000Z",
    "expires_at": "2025-12-15T10:30:00.000Z",
    "price": "5000.00",
    "batch_id": 789,
    "lga_id": 23,
    "created_at": "2025-06-01T08:00:00.000Z",
    "assigned_to_name": "John Doe",
    "assigned_to_phone": "+234801234567"
  },
  "is_activated": 1,
  "lga_name": "Ifo Local Government",
  "state": "Ogun State",
  "expired": false,
  "code": "ONSEY-176757997717816002"
}
```

**Display:** 🟢 Green badge with "ACTIVE & VALID"

---

#### ⚠️ Case 2: Valid But Unused Sticker

```json
{
  "success": true,
  "valid": true,
  "message": "Sticker is valid but not yet activated",
  "sticker": {
    "id": 149,
    "code": "ONSEY-176757997717816002",
    "lga_name": "Seyi LGA",
    "state_name": "Ondo State",
    "status": "unused",
    "is_activated": 0,
    "activated_at": null,
    "expires_at": null,
    "price": "4500.00",
    "batch_id": 13,
    "lga_id": 3,
    "created_at": "2026-01-05T02:26:17.000Z",
    "assigned_to_name": null,
    "assigned_to_phone": null
  },
  "is_activated": 0,
  "lga_name": "Seyi LGA",
  "state": "Ondo State",
  "expired": false,
  "code": "ONSEY-176757997717816002"
}
```

**Display:** 🟡 Yellow badge with "NOT YET ACTIVATED"

---

#### ⏰ Case 3: Expired Sticker

```json
{
  "success": true,
  "valid": true,
  "message": "Sticker has expired",
  "sticker": {
    "id": 100,
    "code": "OLDSTK-123456789012345",
    "lga_name": "Ifo Local Government",
    "state_name": "Ogun State",
    "status": "expired",
    "is_activated": 1,
    "activated_at": "2024-06-15T10:30:00.000Z",
    "expires_at": "2024-12-15T10:30:00.000Z",
    "price": "5000.00",
    "batch_id": 456,
    "lga_id": 23,
    "created_at": "2024-06-01T08:00:00.000Z",
    "assigned_to_name": "Jane Smith",
    "assigned_to_phone": "+234807654321"
  },
  "is_activated": 1,
  "lga_name": "Ifo Local Government",
  "state": "Ogun State",
  "expired": true,
  "code": "OLDSTK-123456789012345"
}
```

**Display:** 🔴 Red badge with "EXPIRED"

---

### Response Format - Error Cases

#### ❌ Case 4: Invalid/Not Found Sticker

```json
{
  "success": false,
  "valid": false,
  "message": "Invalid sticker code. Sticker not found.",
  "sticker": null,
  "is_activated": 0,
  "lga_name": null,
  "state": null,
  "expired": false,
  "code": "INVALID-000000000000000"
}
```

**Display:** 🔴 Red badge with "INVALID STICKER"

---

#### ❌ Case 5: Missing Code Parameter

```json
{
  "success": false,
  "valid": false,
  "message": "Sticker code is required",
  "sticker": null,
  "is_activated": 0,
  "lga_name": null,
  "state": null,
  "expired": false,
  "code": null
}
```

**Display:** Error message: "Please provide a sticker code"

---

## 🛠️ Integration Steps

### Step 1: Create the Verification Route

Add a new route to your frontend application:

```
/verify/:stickerCode
```

**Examples:**
- `/verify/ONSEY-176757997717816002`
- `/verify/LAOWO-176744638584664004`

---

### Step 2: Extract Sticker Code from URL

```javascript
// React Router example
import { useParams } from 'react-router-dom';

function VerifyPage() {
  const { stickerCode } = useParams();
  // stickerCode = "ONSEY-176757997717816002"
}
```

---

### Step 3: Call the Verification API

```javascript
async function verifySticker(stickerCode) {
  try {
    const response = await fetch('https://gtech.gifamz.com/api/v1/public/verify-sticker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: stickerCode })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Verification failed:', error);
    return null;
  }
}
```

---

### Step 4: Display Results Based on Status

```javascript
function getStatusInfo(data) {
  if (!data.success || !data.valid) {
    return {
      badge: 'red',
      icon: '❌',
      title: 'INVALID STICKER',
      description: data.message
    };
  }

  if (data.expired) {
    return {
      badge: 'red',
      icon: '⏰',
      title: 'EXPIRED',
      description: 'This sticker has expired'
    };
  }

  if (data.is_activated === 1) {
    return {
      badge: 'green',
      icon: '✅',
      title: 'ACTIVE & VALID',
      description: 'This sticker is currently active'
    };
  }

  return {
    badge: 'yellow',
    icon: '⚠️',
    title: 'NOT YET ACTIVATED',
    description: 'This sticker is valid but not yet in use'
  };
}
```

---

## 💻 Code Examples

### React Implementation (Complete)

```jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './VerifySticker.css';

function VerifySticker() {
  const { stickerCode } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    verifySticker();
  }, [stickerCode]);

  const verifySticker = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://gtech.gifamz.com/api/v1/public/verify-sticker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: stickerCode })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError('Failed to verify sticker. Please try again.');
      console.error('Verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!data.success || !data.valid) {
      return { color: 'red', text: 'INVALID', icon: '❌' };
    }
    if (data.expired) {
      return { color: 'red', text: 'EXPIRED', icon: '⏰' };
    }
    if (data.is_activated === 1) {
      return { color: 'green', text: 'ACTIVE', icon: '✅' };
    }
    return { color: 'yellow', text: 'UNUSED', icon: '⚠️' };
  };

  if (loading) {
    return (
      <div className="verify-container">
        <div className="spinner">Verifying sticker...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="verify-container">
        <div className="error-message">{error}</div>
        <button onClick={verifySticker}>Try Again</button>
      </div>
    );
  }

  if (!data) return null;

  const badge = getStatusBadge();

  return (
    <div className="verify-container">
      <div className={`status-badge ${badge.color}`}>
        <span className="icon">{badge.icon}</span>
        <span className="text">{badge.text}</span>
      </div>

      <div className="sticker-info">
        <h2>Sticker Code</h2>
        <p className="code">{data.code}</p>

        <div className="info-grid">
          <div className="info-item">
            <label>LGA</label>
            <p>{data.lga_name || 'N/A'}</p>
          </div>

          <div className="info-item">
            <label>State</label>
            <p>{data.state || 'N/A'}</p>
          </div>

          {data.sticker && (
            <>
              <div className="info-item">
                <label>Price</label>
                <p>₦{data.sticker.price}</p>
              </div>

              <div className="info-item">
                <label>Status</label>
                <p>{data.sticker.status}</p>
              </div>

              {data.sticker.assigned_to_name && (
                <>
                  <div className="info-item">
                    <label>Assigned To</label>
                    <p>{data.sticker.assigned_to_name}</p>
                  </div>

                  <div className="info-item">
                    <label>Phone</label>
                    <p>{data.sticker.assigned_to_phone}</p>
                  </div>
                </>
              )}

              {data.sticker.activated_at && (
                <div className="info-item">
                  <label>Activated On</label>
                  <p>{new Date(data.sticker.activated_at).toLocaleDateString()}</p>
                </div>
              )}

              {data.sticker.expires_at && (
                <div className="info-item">
                  <label>Expires On</label>
                  <p>{new Date(data.sticker.expires_at).toLocaleDateString()}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="message">
        <p>{data.message}</p>
      </div>
    </div>
  );
}

export default VerifySticker;
```

---

### Vue.js Implementation

```vue
<template>
  <div class="verify-container">
    <div v-if="loading" class="spinner">
      Verifying sticker...
    </div>

    <div v-else-if="error" class="error-message">
      {{ error }}
      <button @click="verifySticker">Try Again</button>
    </div>

    <div v-else-if="data">
      <div :class="['status-badge', statusBadge.color]">
        <span class="icon">{{ statusBadge.icon }}</span>
        <span class="text">{{ statusBadge.text }}</span>
      </div>

      <div class="sticker-info">
        <h2>Sticker Code</h2>
        <p class="code">{{ data.code }}</p>

        <div class="info-grid">
          <div class="info-item">
            <label>LGA</label>
            <p>{{ data.lga_name || 'N/A' }}</p>
          </div>

          <div class="info-item">
            <label>State</label>
            <p>{{ data.state || 'N/A' }}</p>
          </div>

          <template v-if="data.sticker">
            <div class="info-item">
              <label>Price</label>
              <p>₦{{ data.sticker.price }}</p>
            </div>

            <div class="info-item">
              <label>Status</label>
              <p>{{ data.sticker.status }}</p>
            </div>

            <div v-if="data.sticker.assigned_to_name" class="info-item">
              <label>Assigned To</label>
              <p>{{ data.sticker.assigned_to_name }}</p>
            </div>
          </template>
        </div>
      </div>

      <div class="message">
        <p>{{ data.message }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VerifySticker',
  data() {
    return {
      data: null,
      loading: true,
      error: null
    };
  },
  computed: {
    statusBadge() {
      if (!this.data?.success || !this.data?.valid) {
        return { color: 'red', text: 'INVALID', icon: '❌' };
      }
      if (this.data.expired) {
        return { color: 'red', text: 'EXPIRED', icon: '⏰' };
      }
      if (this.data.is_activated === 1) {
        return { color: 'green', text: 'ACTIVE', icon: '✅' };
      }
      return { color: 'yellow', text: 'UNUSED', icon: '⚠️' };
    }
  },
  mounted() {
    this.verifySticker();
  },
  methods: {
    async verifySticker() {
      this.loading = true;
      this.error = null;

      const stickerCode = this.$route.params.stickerCode;

      try {
        const response = await fetch('https://gtech.gifamz.com/api/v1/public/verify-sticker', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: stickerCode })
        });

        if (!response.ok) throw new Error('Network error');

        this.data = await response.json();
      } catch (err) {
        this.error = 'Failed to verify sticker. Please try again.';
        console.error('Verification error:', err);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

---

### Next.js Implementation

```tsx
// pages/verify/[stickerCode].tsx
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function VerifySticker() {
  const router = useRouter();
  const { stickerCode } = router.query;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (stickerCode) {
      verifySticker(stickerCode as string);
    }
  }, [stickerCode]);

  const verifySticker = async (code: string) => {
    try {
      const response = await fetch('https://gtech.gifamz.com/api/v1/public/verify-sticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* Your UI here */}
    </div>
  );
}
```

---

## 🎨 UI/UX Guidelines

### Status Badge Colors

| Status | Color | Hex Code | Icon |
|--------|-------|----------|------|
| Active & Valid | Green | `#10B981` | ✅ |
| Not Yet Activated | Yellow | `#F59E0B` | ⚠️ |
| Expired | Red | `#EF4444` | ⏰ |
| Invalid | Red | `#EF4444` | ❌ |

---

### Sample CSS

```css
/* VerifySticker.css */
.verify-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.status-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  font-size: 24px;
  font-weight: bold;
}

.status-badge.green {
  background-color: #D1FAE5;
  color: #065F46;
  border: 2px solid #10B981;
}

.status-badge.yellow {
  background-color: #FEF3C7;
  color: #92400E;
  border: 2px solid #F59E0B;
}

.status-badge.red {
  background-color: #FEE2E2;
  color: #991B1B;
  border: 2px solid #EF4444;
}

.status-badge .icon {
  margin-right: 10px;
  font-size: 32px;
}

.sticker-info {
  background: #F9FAFB;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.sticker-info h2 {
  margin-top: 0;
  color: #1F2937;
}

.code {
  font-size: 18px;
  font-weight: bold;
  color: #3B82F6;
  word-break: break-all;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.info-item label {
  display: block;
  font-size: 12px;
  color: #6B7280;
  text-transform: uppercase;
  margin-bottom: 5px;
}

.info-item p {
  font-size: 16px;
  color: #1F2937;
  margin: 0;
}

.message {
  text-align: center;
  padding: 15px;
  background: #EFF6FF;
  border-radius: 8px;
  color: #1E40AF;
}

.spinner {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #6B7280;
}

.error-message {
  text-align: center;
  padding: 20px;
  background: #FEE2E2;
  color: #991B1B;
  border-radius: 8px;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .verify-container {
    padding: 15px;
  }

  .status-badge {
    font-size: 20px;
    padding: 15px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## 🧪 Testing

### Test Cases

#### 1. Test with Valid Unused Sticker
```bash
# Use this sticker code for testing
Code: ONSEY-176757997717816002
Expected: Yellow badge - "NOT YET ACTIVATED"
```

#### 2. Test with Invalid Code
```bash
Code: INVALID-000000000000000
Expected: Red badge - "INVALID STICKER"
```

#### 3. Test with Empty Code
```bash
Code: (empty)
Expected: Error message - "Sticker code is required"
```

---

### Manual Testing Checklist

- [ ] Page loads successfully
- [ ] Loading state displays while fetching
- [ ] Correct badge color for each status
- [ ] All sticker information displays correctly
- [ ] Price shows in naira (₦) with 2 decimals
- [ ] Dates format correctly
- [ ] Mobile responsive design works
- [ ] Error handling works (network failure)
- [ ] Try Again button works after error

---

### Testing with cURL

```bash
# Test the API directly
curl -X POST https://gtech.gifamz.com/api/v1/public/verify-sticker \
  -H "Content-Type: application/json" \
  -d '{"code": "ONSEY-176757997717816002"}'
```

---

## 🐛 Troubleshooting

### Issue 1: CORS Error

**Error:** `Access to fetch has been blocked by CORS policy`

**Solution:** The API supports CORS for your domain. If you see this error:
1. Check if you're using the correct domain
2. Contact backend team to add your domain to CORS whitelist

---

### Issue 2: Network Error

**Error:** `Failed to fetch` or network timeout

**Solution:**
```javascript
// Add timeout and retry logic
async function verifyWithRetry(code, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('https://gtech.gifamz.com/api/v1/public/verify-sticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      return await response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

---

### Issue 3: Response Data is Null

**Check:**
- Is `response.ok` true?
- Is the JSON parsing successful?
- Is the API returning the expected structure?

**Debug:**
```javascript
const response = await fetch(/* ... */);
console.log('Status:', response.status);
console.log('OK:', response.ok);
const text = await response.text();
console.log('Raw response:', text);
```

---

## 📊 Response Fields Reference

### Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Overall request success |
| `valid` | boolean | Whether sticker is valid |
| `message` | string | User-friendly message |
| `is_activated` | number | 0 (unused) or 1 (active) |
| `lga_name` | string/null | LGA name |
| `state` | string/null | State name |
| `expired` | boolean/null | Whether sticker expired |
| `code` | string | Sticker code |
| `sticker` | object/null | Full sticker details |

### Sticker Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Sticker ID |
| `code` | string | Sticker code |
| `lga_name` | string | LGA name |
| `state_name` | string | State name |
| `status` | string | unused/active/expired/cancelled |
| `is_activated` | number | 0 or 1 |
| `activated_at` | string/null | ISO date string |
| `expires_at` | string/null | ISO date string |
| `price` | string | Price in naira (e.g., "5000.00") |
| `batch_id` | number | Batch ID |
| `lga_id` | number | LGA ID |
| `created_at` | string | ISO date string |
| `assigned_to_name` | string/null | Cart pusher name |
| `assigned_to_phone` | string/null | Cart pusher phone |

---

## 📞 Support & Contact

### Questions?

**Backend Team Contact:** [Your contact info]

**API Issues:**
- Check: `https://gtech.gifamz.com/health` (API status)
- Report: Any 500 errors or unexpected responses

### Resources

- **This Document:** Frontend integration guide
- **API Documentation:** `PUBLIC_VERIFICATION_API.md` (full technical details)
- **Test Endpoint:** `POST https://gtech.gifamz.com/api/v1/public/verify-sticker`

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] Tested with all status types (active, unused, expired, invalid)
- [ ] Mobile responsive design verified
- [ ] Loading states implemented
- [ ] Error handling implemented
- [ ] Retry logic for network failures
- [ ] Analytics/tracking added (optional)
- [ ] SEO meta tags added
- [ ] Tested on multiple devices
- [ ] Tested on multiple browsers
- [ ] Performance optimized

---

## 🚀 Quick Start Summary

1. **Create route:** `/verify/:stickerCode`
2. **Extract code** from URL params
3. **Call API:** `POST https://gtech.gifamz.com/api/v1/public/verify-sticker`
4. **Display badge** based on status:
   - Green: Active & Valid
   - Yellow: Not Yet Activated
   - Red: Expired or Invalid
5. **Show details** from `sticker` object
6. **Test** with code: `ONSEY-176757997717816002`

---

**Document Version:** 1.0  
**Last Updated:** January 8, 2026  
**Status:** Production Ready ✅

**Good luck with your implementation! 🎉**
