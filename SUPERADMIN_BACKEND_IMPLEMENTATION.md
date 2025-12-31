# ✅ SUPER ADMIN BACKEND IMPLEMENTATION COMPLETE

**Date:** December 29, 2025  
**Version:** 1.0  
**Status:** 🟢 **READY FOR FRONTEND INTEGRATION**

---

## 🎉 IMPLEMENTATION SUMMARY

All backend APIs required for the Super Admin module have been successfully implemented and are ready for testing and frontend integration.

### ✅ What Was Implemented

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/v1/super-admin/lgas/:id/details` | GET | LGA comprehensive details with stats | ✅ **COMPLETE** (Already Existed) |
| `/api/v1/super-admin/reports` | GET | System-wide reports and analytics | ✅ **COMPLETE** (Newly Created) |
| `/api/v1/super-admin/personnel` | GET | All personnel with pagination/search | ✅ **COMPLETE** (Newly Created) |
| `/api/v1/super-admin/settings` | GET | Get system settings | ✅ **COMPLETE** (Newly Created) |
| `/api/v1/super-admin/settings` | PUT | Update system settings | ✅ **COMPLETE** (Newly Created) |

---

## 📁 Files Created/Modified

### New Controller Files
1. **`src/controllers/superAdmin/reports.controller.js`** - System-wide reports endpoint
2. **`src/controllers/superAdmin/personnel.controller.js`** - Personnel management endpoint  
3. **`src/controllers/superAdmin/settings.controller.js`** - Settings management endpoints

### Modified Files
1. **`src/routes/superAdmin.routes.js`** - Added new routes for reports, personnel, and settings

### Database Schema
- **`system_settings` table** - Already exists in `database/super_admin_schema.sql` ✅

---

## 🔌 API ENDPOINT DOCUMENTATION

### 1. LGA Details Endpoint

**Note:** This endpoint already existed and is fully functional!

```http
GET /api/v1/super-admin/lgas/:id/details
```

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `include_stats` | boolean | No | true | Include LGA statistics |
| `include_admin` | boolean | No | true | Include admin details |
| `include_charts` | boolean | No | true | Include chart data |
| `include_top_officers` | boolean | No | true | Include top performers |
| `include_recent_activity` | boolean | No | true | Include recent activities |

#### Sample Request
```bash
curl -X GET "http://localhost:3000/api/v1/super-admin/lgas/1/details?include_stats=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Sample Response
```json
{
  "success": true,
  "message": "LGA details retrieved successfully",
  "data": {
    "lga": {
      "id": 1,
      "name": "Ifo Local Government",
      "state": "Ogun",
      "code": "IFO",
      "sticker_prefix": "IFO-CP",
      "address": "LGA Secretariat, Ifo Town",
      "phone": "+234 803 456 7890",
      "email": "info@ifolga.gov.ng",
      "sticker_price": 350000,
      "sticker_price_formatted": "₦3,500.00",
      "is_active": true,
      "status": "active",
      "admin": {
        "id": 2,
        "name": "Adebayo Johnson",
        "email": "adebayo@ifo.lga.gov.ng",
        "phone": "+234 801 234 5678",
        "username": "adebayo.johnson",
        "role": "lga_admin",
        "last_login": "2025-12-29T08:30:00Z"
      },
      "stats": {
        "total_officers": 45,
        "total_supervisors": 8,
        "active_officers": 42,
        "total_stickers": 5000,
        "active_stickers": 3250,
        "pending_stickers": 1750,
        "total_revenue": 11375000,
        "total_revenue_formatted": "₦113,750.00",
        "monthly_revenue": 2450000,
        "weekly_revenue": 612500
      },
      "monthly_revenue_chart": [
        {
          "month": "Jul",
          "month_full": "July",
          "value": 1800000,
          "value_formatted": "₦18,000.00",
          "activations": 600,
          "year": 2024,
          "month_number": 7
        }
      ],
      "weekly_activations_chart": [
        {
          "week": "Week 1",
          "value": 320,
          "revenue": 1120000,
          "revenue_formatted": "₦11,200.00"
        }
      ],
      "top_officers": [
        {
          "id": 15,
          "name": "Oluwaseun Adeyemi",
          "email": "seun@ifo.lga.gov.ng",
          "phone": "+234 806 789 0123",
          "total_activations": 245,
          "active_stickers": 230,
          "total_revenue": 857500,
          "total_revenue_formatted": "₦8,575.00",
          "rank": 1
        }
      ],
      "recent_activities": [
        {
          "id": 100,
          "type": "officer",
          "category": "personnel",
          "title": "New Officer Added",
          "message": "New officer 'Ibrahim Musa' added",
          "timestamp": "2025-12-29T06:30:00Z",
          "actor": "Admin Name"
        }
      ]
    }
  }
}
```

---

### 2. System Reports Endpoint

**NEW ENDPOINT - Freshly Implemented!**

```http
GET /api/v1/super-admin/reports
```

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | enum | No | `last_30_days` | Time period: `last_7_days`, `last_30_days`, `last_90_days`, `this_year`, `custom` |
| `start_date` | string (ISO 8601) | No* | - | Start date (required if `period=custom`) |
| `end_date` | string (ISO 8601) | No* | - | End date (required if `period=custom`) |
| `lga_id` | integer | No | - | Filter by specific LGA |

#### Sample Request
```bash
curl -X GET "http://localhost:3000/api/v1/super-admin/reports?period=last_30_days" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Sample Response
```json
{
  "success": true,
  "message": "Reports retrieved successfully",
  "data": {
    "period": {
      "type": "last_30_days",
      "start_date": "2025-11-29",
      "end_date": "2025-12-29"
    },
    "summary": {
      "total_revenue": 11100000,
      "total_stickers_generated": 24000,
      "total_stickers_activated": 15150,
      "activation_rate": 63.1,
      "total_personnel": 245,
      "total_lgas": 5,
      "revenue_growth": 18.5,
      "activation_growth": 12.3
    },
    "revenue_by_lga": [
      {
        "lga_id": 1,
        "lga_name": "Ifo Local Government",
        "lga_code": "IFO",
        "revenue": 2450000
      },
      {
        "lga_id": 2,
        "lga_name": "Abeokuta South LGA",
        "lga_code": "ABS",
        "revenue": 3100000
      }
    ],
    "stickers_by_lga": [
      {
        "lga_id": 1,
        "lga_name": "Ifo Local Government",
        "generated": 5000,
        "activated": 3250,
        "activation_rate": 65.0
      }
    ],
    "monthly_trend": [
      {
        "month": "2025-01",
        "revenue": 8500000,
        "activations": 2800
      },
      {
        "month": "2025-02",
        "revenue": 9200000,
        "activations": 3100
      }
    ],
    "status_distribution": [
      {
        "status": "active",
        "count": 4200
      },
      {
        "status": "expired",
        "count": 850
      },
      {
        "status": "unused",
        "count": 1450
      }
    ],
    "lga_details": [
      {
        "lga_id": 1,
        "lga_name": "Ifo LGA",
        "lga_code": "IFO",
        "total_revenue": 2450000,
        "stickers_generated": 5000,
        "stickers_activated": 3250,
        "activation_rate": 65.0,
        "officers_count": 45,
        "supervisors_count": 8,
        "avg_revenue_per_officer": 54444
      }
    ]
  }
}
```

---

### 3. All Personnel Endpoint

**NEW ENDPOINT - Freshly Implemented!**

```http
GET /api/v1/super-admin/personnel
```

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 50 | Items per page (max: 100) |
| `search` | string | No | - | Search by name, email, phone |
| `role` | enum | No | `all` | Filter: `super_admin`, `lga_admin`, `supervisor`, `officer`, `all` |
| `lga_id` | integer | No | - | Filter by LGA |
| `status` | enum | No | `all` | Filter: `active`, `inactive`, `suspended`, `all` |
| `sort_by` | enum | No | `name` | Sort field: `name`, `email`, `role`, `activations`, `created_at` |
| `sort_order` | enum | No | `asc` | Sort order: `asc`, `desc` |

#### Sample Request
```bash
curl -X GET "http://localhost:3000/api/v1/super-admin/personnel?page=1&limit=50&role=officer&status=active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Sample Response
```json
{
  "success": true,
  "message": "Personnel retrieved successfully",
  "data": {
    "personnel": [
      {
        "id": 1,
        "name": "Adebayo Johnson",
        "email": "adebayo@lga.gov.ng",
        "phone": "+234 801 234 5678",
        "role": "super_admin",
        "lga_id": null,
        "lga_name": "System Wide",
        "lga_code": null,
        "supervisor_id": null,
        "supervisor_name": null,
        "status": "active",
        "is_online": true,
        "total_activations": 0,
        "total_revenue": 0,
        "created_at": "2024-01-15T10:30:00Z",
        "last_login": "2025-12-29T08:30:00Z"
      },
      {
        "id": 15,
        "name": "Oluwaseun Bakare",
        "email": "seun@ifo.lga.gov.ng",
        "phone": "+234 806 789 0123",
        "role": "officer",
        "lga_id": 1,
        "lga_name": "Ifo LGA",
        "lga_code": "IFO",
        "supervisor_id": 10,
        "supervisor_name": "Emmanuel Adekunle",
        "status": "active",
        "is_online": true,
        "total_activations": 156,
        "total_revenue": 546000,
        "created_at": "2024-03-10T11:00:00Z",
        "last_login": "2025-12-29T09:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_count": 225,
      "per_page": 50,
      "has_next": true,
      "has_prev": false
    },
    "statistics": {
      "total_personnel": 225,
      "super_admins": 1,
      "lga_admins": 5,
      "supervisors": 40,
      "officers": 179,
      "active_count": 215,
      "inactive_count": 10
    }
  }
}
```

---

### 4. System Settings Endpoints

**NEW ENDPOINTS - Freshly Implemented!**

#### 4.1 Get Settings

```http
GET /api/v1/super-admin/settings
```

##### Sample Request
```bash
curl -X GET "http://localhost:3000/api/v1/super-admin/settings" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

##### Sample Response
```json
{
  "success": true,
  "message": "Settings retrieved successfully",
  "data": {
    "general": {
      "system_name": "Green Permit Hub",
      "timezone": "Africa/Lagos"
    },
    "notifications": {
      "enable_email_notifications": true,
      "enable_sms_notifications": false
    },
    "security": {
      "max_login_attempts": 5,
      "session_timeout_minutes": 30,
      "password_min_length": 8
    },
    "features": {
      "maintenance_mode": false,
      "auto_sticker_expiry": true
    },
    "pricing": {
      "currency_symbol": "₦",
      "currency_code": "NGN",
      "min_sticker_price": 1000,
      "max_sticker_price": 10000
    },
    "updated_at": "2025-12-29T10:30:00Z"
  }
}
```

#### 4.2 Update Settings

```http
PUT /api/v1/super-admin/settings
```

##### Request Body
```json
{
  "category": "notifications",
  "settings": {
    "enable_email_notifications": false,
    "enable_sms_notifications": true
  }
}
```

##### Sample Request
```bash
curl -X PUT "http://localhost:3000/api/v1/super-admin/settings" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "notifications",
    "settings": {
      "enable_email_notifications": false,
      "enable_sms_notifications": true
    }
  }'
```

##### Sample Response
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "general": { ... },
    "notifications": {
      "enable_email_notifications": false,
      "enable_sms_notifications": true
    },
    "security": { ... },
    "features": { ... },
    "pricing": { ... },
    "updated_at": "2025-12-29T11:00:00Z"
  }
}
```

---

## 🧪 TESTING GUIDE

### Prerequisites
1. **Server Running:** Ensure your API server is running on `http://localhost:3000`
2. **Database Setup:** Run the super admin schema and seed files
3. **Authentication:** You need a valid super admin JWT token

### Getting a Super Admin Token

```bash
# Login as Super Admin
curl -X POST "http://localhost:3000/api/v1/super-admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "Admin@123"
  }'

# Response includes token:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

### Test Each Endpoint

#### Test 1: LGA Details
```bash
export TOKEN="your_jwt_token_here"

curl -X GET "http://localhost:3000/api/v1/super-admin/lgas/2/details" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** 200 OK with LGA details, stats, charts, top officers

#### Test 2: System Reports
```bash
# Last 30 days
curl -X GET "http://localhost:3000/api/v1/super-admin/reports?period=last_30_days" \
  -H "Authorization: Bearer $TOKEN"

# Custom date range
curl -X GET "http://localhost:3000/api/v1/super-admin/reports?period=custom&start_date=2025-01-01&end_date=2025-12-31" \
  -H "Authorization: Bearer $TOKEN"

# Filter by LGA
curl -X GET "http://localhost:3000/api/v1/super-admin/reports?period=last_30_days&lga_id=2" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** 200 OK with summary, revenue/sticker breakdowns, trends, status distribution

#### Test 3: Personnel List
```bash
# All personnel (default)
curl -X GET "http://localhost:3000/api/v1/super-admin/personnel" \
  -H "Authorization: Bearer $TOKEN"

# Filter by role
curl -X GET "http://localhost:3000/api/v1/super-admin/personnel?role=officer&status=active" \
  -H "Authorization: Bearer $TOKEN"

# Search
curl -X GET "http://localhost:3000/api/v1/super-admin/personnel?search=john" \
  -H "Authorization: Bearer $TOKEN"

# Pagination
curl -X GET "http://localhost:3000/api/v1/super-admin/personnel?page=2&limit=20" \
  -H "Authorization: Bearer $TOKEN"

# Filter by LGA
curl -X GET "http://localhost:3000/api/v1/super-admin/personnel?lga_id=2" \
  -H "Authorization: Bearer $TOKEN"

# Sort by activations (descending)
curl -X GET "http://localhost:3000/api/v1/super-admin/personnel?sort_by=activations&sort_order=desc" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** 200 OK with personnel array, pagination, statistics

#### Test 4: Settings
```bash
# Get all settings
curl -X GET "http://localhost:3000/api/v1/super-admin/settings" \
  -H "Authorization: Bearer $TOKEN"

# Update settings
curl -X PUT "http://localhost:3000/api/v1/super-admin/settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "general",
    "settings": {
      "system_name": "Updated Green Permit Hub"
    }
  }'
```

**Expected:** 200 OK with all settings grouped by category

---

## 📊 POSTMAN COLLECTION

Import this JSON into Postman for quick testing:

```json
{
  "info": {
    "name": "Super Admin API - Green Permit Hub",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Super Admin",
      "item": [
        {
          "name": "LGA Details",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{base_url}}/api/v1/super-admin/lgas/2/details",
              "host": ["{{base_url}}"],
              "path": ["api", "v1", "super-admin", "lgas", "2", "details"]
            }
          }
        },
        {
          "name": "System Reports",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{base_url}}/api/v1/super-admin/reports?period=last_30_days",
              "host": ["{{base_url}}"],
              "path": ["api", "v1", "super-admin", "reports"],
              "query": [
                {
                  "key": "period",
                  "value": "last_30_days"
                }
              ]
            }
          }
        },
        {
          "name": "All Personnel",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{base_url}}/api/v1/super-admin/personnel?page=1&limit=50",
              "host": ["{{base_url}}"],
              "path": ["api", "v1", "super-admin", "personnel"],
              "query": [
                {
                  "key": "page",
                  "value": "1"
                },
                {
                  "key": "limit",
                  "value": "50"
                }
              ]
            }
          }
        },
        {
          "name": "Get Settings",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{base_url}}/api/v1/super-admin/settings",
              "host": ["{{base_url}}"],
              "path": ["api", "v1", "super-admin", "settings"]
            }
          }
        },
        {
          "name": "Update Settings",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}",
                "type": "text"
              },
              {
                "key": "Content-Type",
                "value": "application/json",
                "type": "text"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"category\": \"general\",\n  \"settings\": {\n    \"system_name\": \"Green Permit Hub Updated\"\n  }\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/v1/super-admin/settings",
              "host": ["{{base_url}}"],
              "path": ["api", "v1", "super-admin", "settings"]
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000"
    },
    {
      "key": "token",
      "value": "YOUR_JWT_TOKEN_HERE"
    }
  ]
}
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION

All endpoints require:
1. **Bearer Token:** Valid JWT in `Authorization` header
2. **Super Admin Role:** User must have `role = 'super_admin'`

### Middleware Chain
```
authenticate → requireSuperAdmin → controller
```

### Error Responses

**401 Unauthorized** (Invalid/Missing Token):
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No token provided"
  }
}
```

**403 Forbidden** (Not Super Admin):
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied. Super Admin role required."
  }
}
```

---

## 🎯 FRONTEND INTEGRATION CHECKLIST

### For Frontend Team

#### Step 1: Create API Service Functions

**File:** `src/services/adminService.ts`

```typescript
// Add these functions to your admin service

export const getSystemReports = async (params: {
  period?: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_year' | 'custom';
  start_date?: string;
  end_date?: string;
  lga_id?: number;
}) => {
  const response = await apiClient.get('/super-admin/reports', { params });
  return response.data;
};

export const getAllPersonnel = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  lga_id?: number;
  status?: string;
  sort_by?: string;
  sort_order?: string;
}) => {
  const response = await apiClient.get('/super-admin/personnel', { params });
  return response.data;
};

export const getSystemSettings = async () => {
  const response = await apiClient.get('/super-admin/settings');
  return response.data;
};

export const updateSystemSettings = async (data: {
  category: string;
  settings: Record<string, any>;
}) => {
  const response = await apiClient.put('/super-admin/settings', data);
  return response.data;
};

export const getLGADetails = async (lgaId: number, params?: {
  include_stats?: boolean;
  include_admin?: boolean;
  include_charts?: boolean;
  include_top_officers?: boolean;
  include_recent_activity?: boolean;
}) => {
  const response = await apiClient.get(`/super-admin/lgas/${lgaId}/details`, { params });
  return response.data;
};
```

#### Step 2: Create React Query Hooks

**File:** `src/hooks/useAdminReports.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { getSystemReports } from '@/services/adminService';

export const useAdminReports = (params: {
  period?: string;
  start_date?: string;
  end_date?: string;
  lga_id?: number;
}) => {
  return useQuery({
    queryKey: ['admin-reports', params],
    queryFn: () => getSystemReports(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
```

**File:** `src/hooks/useAllPersonnel.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { getAllPersonnel } from '@/services/adminService';

export const useAllPersonnel = (params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  lga_id?: number;
  status?: string;
  sort_by?: string;
  sort_order?: string;
}) => {
  return useQuery({
    queryKey: ['all-personnel', params],
    queryFn: () => getAllPersonnel(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};
```

**File:** `src/hooks/useSystemSettings.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSystemSettings, updateSystemSettings } from '@/services/adminService';

export const useSystemSettings = () => {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: getSystemSettings,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useUpdateSystemSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateSystemSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
  });
};
```

**File:** `src/hooks/useLGADetails.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { getLGADetails } from '@/services/adminService';

export const useLGADetails = (lgaId: number, params?: any) => {
  return useQuery({
    queryKey: ['lga-details', lgaId, params],
    queryFn: () => getLGADetails(lgaId, params),
    enabled: !!lgaId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
```

#### Step 3: Update Component Files

**`src/pages/admin/LGADetails.tsx`** - Replace hardcoded data:

```typescript
// ❌ REMOVE:
const lgaData = { ... hardcoded values ... };

// ✅ ADD:
import { useLGADetails } from '@/hooks/useLGADetails';

const { data, isLoading, error } = useLGADetails(lgaId, {
  include_stats: true,
  include_charts: true,
  include_top_officers: true,
  include_recent_activity: true
});

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;

const lgaData = data?.data?.lga;
```

**`src/pages/admin/SuperAdminReports.tsx`** - Replace hardcoded data:

```typescript
// ❌ REMOVE:
const revenueByLGA = [ ... ];
const monthlyTrend = [ ... ];

// ✅ ADD:
import { useAdminReports } from '@/hooks/useAdminReports';

const [period, setPeriod] = useState('last_30_days');
const { data, isLoading } = useAdminReports({ period });

const reportData = data?.data;
const revenueByLGA = reportData?.revenue_by_lga || [];
const monthlyTrend = reportData?.monthly_trend || [];
```

**`src/pages/admin/AllPersonnel.tsx`** - Replace hardcoded data:

```typescript
// ❌ REMOVE:
const personnelData = [ ... ];

// ✅ ADD:
import { useAllPersonnel } from '@/hooks/useAllPersonnel';

const [page, setPage] = useState(1);
const [filters, setFilters] = useState({ role: 'all', status: 'all' });

const { data, isLoading } = useAllPersonnel({ 
  page, 
  limit: 50,
  ...filters 
});

const personnel = data?.data?.personnel || [];
const pagination = data?.data?.pagination;
```

**`src/pages/admin/SystemSettings.tsx`** - Replace local state:

```typescript
// ❌ REMOVE:
const [settings, setSettings] = useState({ ... });

// ✅ ADD:
import { useSystemSettings, useUpdateSystemSettings } from '@/hooks/useSystemSettings';

const { data, isLoading } = useSystemSettings();
const updateMutation = useUpdateSystemSettings();

const settings = data?.data;

const handleSave = (category: string, updatedSettings: any) => {
  updateMutation.mutate({ category, settings: updatedSettings }, {
    onSuccess: () => {
      toast.success('Settings updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update settings');
    }
  });
};
```

---

## ⚠️ IMPORTANT NOTES

### 1. Date Handling
- All dates are in ISO 8601 format
- Backend uses MySQL `TIMESTAMP` fields
- Frontend should use `new Date().toISOString()` for custom dates

### 2. Currency Values
- All amounts are in **kobo** (100 kobo = ₦1)
- Example: `340000` kobo = ₦3,400.00
- Backend converts for display where needed

### 3. Pagination
- Default: `page=1, limit=50`
- Max limit: `100` (enforced by backend)
- Use `has_next` and `has_prev` for navigation

### 4. Caching Strategy
- Reports: 5 minutes stale time
- Personnel: 2 minutes stale time
- Settings: 10 minutes stale time
- LGA Details: 5 minutes stale time

### 5. Error Handling
All endpoints return consistent error format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

---

## 🐛 TROUBLESHOOTING

### Issue: 401 Unauthorized
**Solution:** Check JWT token is valid and not expired. Re-login if needed.

### Issue: 403 Forbidden
**Solution:** Ensure logged-in user has `role = 'super_admin'`.

### Issue: Empty data arrays
**Solution:** Check database has seed data. Run `super_admin_seed.sql`.

### Issue: Slow response times
**Solution:** 
- Check database indexes exist
- Limit date ranges for reports
- Use pagination for personnel

### Issue: Settings not persisting
**Solution:** 
- Verify `system_settings` table exists
- Check PUT request includes `category` and `settings`
- Verify no database errors in server logs

---

## 📈 PERFORMANCE BENCHMARKS

Expected response times (with proper indexes):

| Endpoint | Expected Time | Notes |
|----------|---------------|-------|
| LGA Details | < 300ms | Includes multiple JOINs |
| Reports (30 days) | < 500ms | Large aggregations |
| Personnel (50 items) | < 200ms | With pagination |
| Settings GET | < 100ms | Simple SELECT |
| Settings PUT | < 200ms | Multiple UPDATEs |

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] Run database migrations (`super_admin_schema.sql`)
- [ ] Seed initial settings (`INSERT INTO system_settings ...`)
- [ ] Test all 5 endpoints with Postman
- [ ] Verify authentication works
- [ ] Check error handling for invalid inputs
- [ ] Test pagination edge cases (page 0, negative limits)
- [ ] Verify date range validation
- [ ] Test concurrent requests (load testing)
- [ ] Enable CORS for frontend domain
- [ ] Set up rate limiting (optional)
- [ ] Configure logging for production
- [ ] Document API in Swagger/OpenAPI (optional)

---

## 📞 SUPPORT

**Backend Team Lead:** [Your Name]  
**Email:** [your.email@domain.com]  
**Slack:** `#backend-api-integration`

**Questions about:**
- API endpoints → Ask in Slack
- Database schema → Check `database/super_admin_schema.sql`
- Frontend integration → See checklist above

---

## 🎓 ADDITIONAL RESOURCES

- **Existing Dashboard API:** Already implemented (`GET /super-admin/dashboard`)
- **LGA Management:** Fully functional CRUD operations
- **Sticker Management:** Comprehensive batch/sticker APIs
- **Authentication Flow:** See `src/controllers/superAdmin/auth.controller.js`

---

**🎉 CONGRATULATIONS! All backend APIs are ready for frontend integration!**

**Next Steps:**
1. Frontend team integrates using checklist above
2. QA tests all endpoints thoroughly
3. Frontend team removes hardcoded data
4. Full end-to-end testing
5. Deploy to production

---

**Document Version:** 1.0  
**Last Updated:** December 29, 2025  
**Status:** ✅ COMPLETE & READY

