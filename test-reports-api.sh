#!/bin/bash

echo "🧪 Testing Reports API Fix"
echo "=========================="
echo ""

# Check if token is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide LGA Admin token"
    echo ""
    echo "Usage: ./test-reports-api.sh YOUR_LGA_ADMIN_TOKEN"
    echo ""
    echo "To get a token, login first:"
    echo "  curl -X POST 'https://gtech.gifamz.com/api/v1/auth/login' \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"username\": \"YOUR_USERNAME\", \"password\": \"YOUR_PASSWORD\"}'"
    exit 1
fi

TOKEN="$1"

echo "📊 Test 1: Reports Summary"
echo "=========================="
echo ""

RESPONSE=$(curl -s -X GET 'https://gtech.gifamz.com/api/v1/admin/reports/summary' \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "success"; then
    echo "✅ API Response received"
    echo ""
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    echo ""
    
    # Extract stats
    ACTIVATIONS=$(echo "$RESPONSE" | grep -o '"activations":[0-9]*' | cut -d':' -f2)
    REVENUE=$(echo "$RESPONSE" | grep -o '"revenue":[0-9.]*' | head -1 | cut -d':' -f2)
    
    echo "📈 Summary Stats:"
    echo "  Activations: $ACTIVATIONS"
    echo "  Revenue: ₦$(echo "scale=2; $REVENUE / 100" | bc 2>/dev/null || echo $REVENUE) (${REVENUE} kobo)"
    echo ""
    
    if [ "$ACTIVATIONS" = "9" ]; then
        echo "✅ PASS: Activations = 9"
    else
        echo "⚠️  Expected 9 activations, got $ACTIVATIONS"
    fi
    
    if [ "$REVENUE" = "7250100" ]; then
        echo "✅ PASS: Revenue = ₦72,501 (7250100 kobo)"
    else
        echo "⚠️  Expected 7250100 kobo, got $REVENUE"
    fi
else
    echo "❌ API Error"
    echo "$RESPONSE"
fi

echo ""
echo "=========================================="
echo ""

echo "📊 Test 2: Supervisors List"
echo "============================"
echo ""

RESPONSE2=$(curl -s -X GET 'https://gtech.gifamz.com/api/v1/admin/reports/supervisors' \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE2" | grep -q "success"; then
    echo "✅ API Response received"
    echo ""
    
    # Count supervisors
    SUPERVISOR_COUNT=$(echo "$RESPONSE2" | grep -o '"supervisor_id"' | wc -l)
    echo "Found $SUPERVISOR_COUNT supervisors"
    echo ""
    
    # Look for Oga SuperVisor
    if echo "$RESPONSE2" | grep -q "Oga SuperVisor"; then
        echo "✅ Found 'Oga SuperVisor' in response"
        
        # Try to extract their stats (rough extraction)
        echo ""
        echo "Supervisor Stats Preview:"
        echo "$RESPONSE2" | python3 -m json.tool 2>/dev/null | grep -A 10 "Oga SuperVisor" | head -15
    else
        echo "⚠️  'Oga SuperVisor' not found in response"
    fi
    
    echo ""
    echo "Full Response:"
    echo "$RESPONSE2" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE2"
else
    echo "❌ API Error"
    echo "$RESPONSE2"
fi

echo ""
echo "=========================================="
echo ""

echo "📊 Test 3: Supervisor Details"
echo "============================="
echo ""
echo "Note: This requires knowing the supervisor_id"
echo "If you see supervisors above, try running:"
echo "  curl -X GET 'https://gtech.gifamz.com/api/v1/admin/reports/supervisors/sup_6' \\"
echo "    -H 'Authorization: Bearer $TOKEN'"
echo ""

echo "🎯 Testing Complete!"
echo ""
echo "Summary:"
echo "--------"
echo "1. Check if activations = 9 and revenue = 7250100 kobo"
echo "2. Check if supervisors list shows 'Oga SuperVisor' with real stats"
echo "3. Frontend should now show correct values instead of zeros"
