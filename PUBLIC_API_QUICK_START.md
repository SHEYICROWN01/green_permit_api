# 🚀 QUICK START - Public Verification API

## 📍 Endpoint
```
POST https://gtech.gifamz.com/api/v1/public/verify-sticker
```

## 🔓 Authentication
**NONE** - This is a public endpoint

---

## 📨 Request

### Headers
```
Content-Type: application/json
```

### Body
```json
{
  "code": "ONSEY-176757997717816002"
}
```

---

## 📬 Response

### ✅ Active Sticker
```json
{
  "success": true,
  "valid": true,
  "message": "Sticker is valid and active",
  "is_activated": 1,
  "lga_name": "Ifo Local Government",
  "state": "Ogun State",
  "expired": false,
  "code": "ONSEY-176757997717816002",
  "sticker": {
    "id": 128,
    "code": "ONSEY-176757997717816002",
    "lga_name": "Ifo Local Government",
    "state_name": "Ogun State",
    "status": "active",
    "is_activated": 1,
    "activated_at": "2025-01-07T10:30:00.000Z",
    "expires_at": "2025-07-07T10:30:00.000Z",
    "price": "3000.00",
    "assigned_to_name": "John Doe",
    "assigned_to_phone": "+234801234567"
  }
}
```

### ⚠️ Unused Sticker
```json
{
  "success": true,
  "valid": true,
  "message": "Sticker is valid but not yet activated",
  "is_activated": 0,
  "expired": false
}
```

### ❌ Invalid Sticker
```json
{
  "success": false,
  "valid": false,
  "message": "Invalid sticker code. Sticker not found.",
  "sticker": null
}
```

---

## 💻 Code Example

### JavaScript/Fetch
```javascript
async function verifySticker(code) {
    const response = await fetch(
        'https://gtech.gifamz.com/api/v1/public/verify-sticker',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        }
    );
    return await response.json();
}

// Usage
const result = await verifySticker('ONSEY-176757997717816002');
if (result.success && result.valid) {
    console.log('Sticker is valid!');
}
```

### React
```jsx
function VerifyPage() {
    const { code } = useParams();
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch('https://gtech.gifamz.com/api/v1/public/verify-sticker', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        })
        .then(res => res.json())
        .then(setData);
    }, [code]);

    if (!data) return <Spinner />;

    return (
        <div>
            {data.is_activated === 1 && !data.expired ? (
                <Badge color="green">ACTIVE</Badge>
            ) : data.is_activated === 0 ? (
                <Badge color="yellow">UNUSED</Badge>
            ) : data.expired ? (
                <Badge color="red">EXPIRED</Badge>
            ) : (
                <Badge color="red">INVALID</Badge>
            )}
        </div>
    );
}
```

---

## 🎨 UI Display Logic

```javascript
function getStickerStatus(data) {
    if (!data.success || !data.valid) {
        return { color: 'red', label: 'INVALID', icon: '❌' };
    }
    
    if (data.expired) {
        return { color: 'red', label: 'EXPIRED', icon: '⏰' };
    }
    
    if (data.is_activated === 1) {
        return { color: 'green', label: 'ACTIVE', icon: '✅' };
    }
    
    return { color: 'yellow', label: 'UNUSED', icon: '⚠️' };
}
```

---

## 🧪 Test It Now!

### cURL
```bash
curl -X POST https://gtech.gifamz.com/api/v1/public/verify-sticker \
  -H "Content-Type: application/json" \
  -d '{"code": "ONSEY-176757997717816002"}'
```

### Browser Console
```javascript
fetch('https://gtech.gifamz.com/api/v1/public/verify-sticker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'ONSEY-176757997717816002' })
})
.then(r => r.json())
.then(console.log);
```

---

## 📊 Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Overall request success |
| `valid` | boolean | Whether sticker is valid |
| `message` | string | User-friendly message |
| `is_activated` | number | 0 or 1 |
| `lga_name` | string | LGA name |
| `state` | string | State name |
| `expired` | boolean | Whether sticker expired |
| `code` | string | Sticker code |
| `sticker` | object | Full sticker details (null if not found) |

### Sticker Object Fields
| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Sticker ID |
| `code` | string | Sticker code |
| `lga_name` | string | LGA name |
| `state_name` | string | State name |
| `status` | string | unused/active/expired/cancelled |
| `is_activated` | number | 0 or 1 |
| `activated_at` | string | ISO date or null |
| `expires_at` | string | ISO date or null |
| `price` | string | Price in naira (e.g., "3000.00") |
| `assigned_to_name` | string | Cart pusher name (if activated) |
| `assigned_to_phone` | string | Cart pusher phone (if activated) |

---

## 🎯 Status Logic

```javascript
const STATUS_PRIORITY = {
    INVALID: { 
        check: (d) => !d.success || !d.valid,
        badge: 'red',
        label: 'Invalid Sticker'
    },
    EXPIRED: { 
        check: (d) => d.expired,
        badge: 'red',
        label: 'Expired'
    },
    ACTIVE: { 
        check: (d) => d.is_activated === 1,
        badge: 'green',
        label: 'Active & Valid'
    },
    UNUSED: { 
        check: (d) => d.is_activated === 0,
        badge: 'yellow',
        label: 'Not Yet Activated'
    }
};

function getStatus(data) {
    for (const [key, config] of Object.entries(STATUS_PRIORITY)) {
        if (config.check(data)) return config;
    }
}
```

---

## ⚡ Rate Limit
- **100 requests per minute** per IP
- **Response:** `429 Too Many Requests`
- **Retry:** Wait 1 minute

---

## 🆘 Error Handling

```javascript
async function safeVerifySticker(code) {
    try {
        const res = await fetch('https://gtech.gifamz.com/api/v1/public/verify-sticker', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });

        if (res.status === 429) {
            return { 
                error: 'Too many requests. Please wait a moment.' 
            };
        }

        if (!res.ok) {
            return { 
                error: 'Network error. Please try again.' 
            };
        }

        return await res.json();

    } catch (error) {
        console.error('Verification failed:', error);
        return { 
            error: 'Unable to verify sticker. Please check your connection.' 
        };
    }
}
```

---

## 📞 Support

**Full Documentation:** `PUBLIC_VERIFICATION_API.md`  
**Test Script:** `./test-public-verification-api.sh`  
**API Status:** `https://gtech.gifamz.com/health`

---

## ✅ Checklist for Frontend

- [ ] Create `/verify/:code` route
- [ ] Extract code from URL parameter
- [ ] Call API with extracted code
- [ ] Display appropriate badge based on response
- [ ] Show sticker details (LGA, state, status)
- [ ] Handle error states (invalid, expired, network error)
- [ ] Add loading state while fetching
- [ ] Make page mobile-friendly
- [ ] Test with all status types
- [ ] Deploy to production

---

**Ready to use!** No API key required. Just POST and get the response. 🚀
