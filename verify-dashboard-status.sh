#!/bin/bash

echo "🔍 VERIFYING DASHBOARD ENDPOINT STATUS"
echo "======================================"
echo ""

# Test 1: Get fresh token
echo "1️⃣ Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST https://gtech.gifamz.com/api/v1/officer/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bola","password":"Admin@123"}')

echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token"
    exit 1
fi

echo ""
echo "✅ Token received: ${TOKEN:0:50}..."
echo ""

# Test 2: Test dashboard
echo "2️⃣ Testing Dashboard..."
DASHBOARD_RESPONSE=$(curl -s https://gtech.gifamz.com/api/v1/officer/dashboard/overview \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$DASHBOARD_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$DASHBOARD_RESPONSE"

echo ""
echo "======================================"

# Check success status
if echo "$DASHBOARD_RESPONSE" | grep -q '"success":true'; then
    echo "✅ DASHBOARD WORKING!"
    echo ""
    echo "Mobile team can proceed with testing."
else
    echo "❌ DASHBOARD STILL FAILING"
    echo ""
    echo "Backend team needs to investigate."
    echo ""
    echo "Possible issues:"
    echo "  - PM2 not running"
    echo "  - Server needs restart"
    echo "  - Changes not deployed"
    echo "  - Database issues"
fi

echo "======================================"
