# Parameter Order Bug Fix - Supervisors Query

**Date:** January 9, 2026  
**Issue:** Supervisors API returning empty array despite 4 supervisors existing in database  
**Status:** ✅ **FIXED**

---

## 🐛 The Problem

The `/api/v1/admin/reports/supervisors` endpoint was returning:
```json
{
  "supervisors": [],  // ❌ EMPTY!
  "summary": {
    "total_supervisors": 4  // ✅ Correct count
  }
}
```

Even though:
- Database had 4 supervisors
- SQL query worked correctly when run directly in MySQL
- Code had COALESCE fixes for NULL handling

---

## 🔍 Root Cause Analysis

### The Bug

In `src/models/Report.js`, the `getSupervisorReportsSummary()` method had a **parameter order mismatch**:

**SQL Query Structure:**
```sql
SELECT 
  -- ... columns ...
  COUNT(DISTINCT CASE WHEN a.created_at >= ? AND a.created_at <= ? THEN a.id END),
  COALESCE(SUM(CASE WHEN a.created_at >= ? AND a.created_at <= ? THEN a.amount_paid ELSE 0 END), 0)
FROM users u
WHERE u.lga_id = ? AND u.role = "supervisor"
```

The SQL has **5 parameter placeholders (`?`)** in this order:
1. `?` - dateFrom (SELECT clause)
2. `?` - dateTo (SELECT clause)
3. `?` - dateFrom (SELECT clause)
4. `?` - dateTo (SELECT clause)
5. `?` - lgaId (WHERE clause)

**BROKEN Code (Before Fix):**
```javascript
// Line 79
const params = [lgaId];  // ❌ lgaId first

// Line 139 (after SQL is built)
params.push(dateRange.from, dateRange.to, dateRange.from, dateRange.to);

// Result: [lgaId, date1, date2, date3, date4] ❌ WRONG ORDER!
```

**Why It Failed:**
- SQL expected: `[date1, date2, date3, date4, lgaId]`
- Code provided: `[lgaId, date1, date2, date3, date4]`
- Result: WHERE clause got a date value, dates got wrong values
- MySQL likely rejected the query or returned 0 rows

---

## ✅ The Solution

**Fixed Code (Commit 65a86bb):**
```javascript
// Line 79 - Initialize params with dates FIRST
const params = [dateRange.from, dateRange.to, dateRange.from, dateRange.to, lgaId];

// Line 141 - Removed duplicate push
// params.push(dateRange.from, dateRange.to, dateRange.from, dateRange.to); ❌ REMOVED

// Result: [date1, date2, date3, date4, lgaId] ✅ CORRECT ORDER!
```

### Changes Made:
1. **Line 79:** Initialize params array with dates first, then lgaId
2. **Line 141:** Removed the duplicate `params.push()` call
3. **Added comment:** Clarified parameter initialization

---

## 🧪 Testing

### Before Fix:
```bash
$ node test-supervisors-query.js
Supervisors count: 0  ❌
```

### After Fix:
```bash
$ node test-supervisors-query.js
Supervisors count: 4  ✅

Supervisors: [
  { name: "Hello World", ... },
  { name: "Oga Ola Oba", ... },
  { name: "Oga SuperVisor", total_activations: 9, total_revenue: "7250100" },
  { name: "Ola Wale", ... }
]
```

### API Test:
```bash
$ curl 'https://gtech.gifamz.com/api/v1/admin/reports/supervisors?period=all' \
  -H "Authorization: Bearer $TOKEN" \
  | grep -c '"supervisor_id"'

5  ✅ (4 in array + 1 in top_supervisor)
```

---

## 📊 Impact

**Before:**
- Reports page showed "No supervisors found"
- Frontend displayed empty table
- Summary showed correct count (4) but no supervisor rows

**After:**
- Reports page displays all 4 supervisors
- Each supervisor shows correct stats (officers, activations, revenue)
- Oga SuperVisor shows 9 activations, ₦72,501
- Other supervisors show 0 activations, ₦0

---

## 🚀 Deployment

### Commit:
```
commit 65a86bb
fix: correct parameter order in supervisors query - date params must come before WHERE clause params
```

### Deploy Commands:
```bash
cd ~/green-permit-api
git stash  # Save local changes
git pull origin main
pkill -9 node
rm -rf tmp/ && mkdir -p tmp && touch tmp/restart.txt
sleep 20
```

### Verification:
```bash
# Test with script
node test-supervisors-query.js

# Test API
curl -X GET 'https://gtech.gifamz.com/api/v1/admin/reports/supervisors?period=all' \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📝 Lessons Learned

### Why This Happened:

1. **Complex Query Evolution:**
   - Query was initially simpler
   - Date filtering was added to SELECT clause later
   - Parameters were added in wrong order

2. **Positional Parameters:**
   - SQL uses `?` positional placeholders
   - Order MUST match exactly
   - No compile-time checking

3. **Late Parameter Binding:**
   - Params array built incrementally
   - Date params added AFTER SQL string was built
   - Easy to lose track of order

### Prevention Strategies:

1. **Named Parameters:**
   - Consider using `:paramName` syntax if supported
   - Makes order irrelevant

2. **Parameter Validation:**
   - Count placeholders in SQL
   - Assert params.length matches expected count

3. **Query Builder:**
   - Use query builder libraries
   - They handle parameter order automatically

4. **Better Testing:**
   - Unit tests for model methods
   - Test with actual database
   - Don't just test controllers

---

## 🔗 Related Issues

This bug was discovered while fixing the **Empty Supervisors Array** issue (Commit 98022a6).

**Timeline:**
1. **First Fix (98022a6):** Added COALESCE for NULL handling
2. **Symptom:** Still returned empty array despite COALESCE fix
3. **Investigation:** Discovered parameter order mismatch
4. **Second Fix (65a86bb):** Corrected parameter order ✅

---

## ✅ Verification Checklist

- [x] Direct model test returns 4 supervisors
- [x] API endpoint returns 4 supervisors in array
- [x] Frontend Reports page shows supervisor table
- [x] Oga SuperVisor shows 9 activations, ₦72,501
- [x] Other supervisors show correct data (0 activations)
- [x] Summary totals match individual rows
- [x] Sorting by name/activations/revenue works
- [x] No SQL errors in logs

---

## 📁 Files Modified

- `src/models/Report.js` - Lines 79, 141
  - Fixed parameter order
  - Removed duplicate params.push()

---

**Status:** ✅ **DEPLOYED AND VERIFIED**  
**Commit:** 65a86bb  
**Date:** January 9, 2026

---

## 🎯 Summary

**Root Cause:** SQL parameter order mismatch  
**Symptom:** Empty supervisors array  
**Solution:** Initialize params array with dates before lgaId  
**Result:** All 4 supervisors now returned correctly! 🎉
