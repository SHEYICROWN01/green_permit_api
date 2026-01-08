#!/bin/bash

echo "🧪 Testing Officers List API Fix"
echo "================================="
echo ""

# Check if token is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide LGA Admin token"
    echo ""
    echo "Usage: ./test-officers-list.sh YOUR_LGA_ADMIN_TOKEN"
    echo ""
    echo "Example:"
    echo "  ./test-officers-list.sh eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    exit 1
fi

TOKEN="$1"

echo "📊 Fetching Officers List..."
echo ""

# Make API call and save response
RESPONSE=$(curl -s -X GET 'https://gtech.gifamz.com/api/v1/admin/officers' \
  -H "Authorization: Bearer $TOKEN")

# Check if response is valid JSON
if echo "$RESPONSE" | grep -q "success"; then
    echo "✅ API Response received successfully!"
    echo ""
    
    # Pretty print the response
    echo "📋 Full Response:"
    echo "================="
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    echo ""
    
    # Extract key data points
    echo "🔍 Key Data Points:"
    echo "==================="
    
    # Summary stats
    TOTAL_ACTIVATIONS=$(echo "$RESPONSE" | grep -o '"total_activations":[0-9]*' | head -1 | cut -d':' -f2)
    TOTAL_REVENUE=$(echo "$RESPONSE" | grep -o '"total_revenue":[0-9.]*' | head -1 | cut -d':' -f2)
    
    echo "Summary Card:"
    echo "  Total Activations: $TOTAL_ACTIVATIONS"
    echo "  Total Revenue: ₦$(echo "scale=2; $TOTAL_REVENUE / 100" | bc) (${TOTAL_REVENUE} kobo)"
    echo ""
    
    # First officer stats
    echo "First Officer Stats:"
    FIRST_OFFICER_NAME=$(echo "$RESPONSE" | grep -o '"name":"[^"]*"' | head -2 | tail -1 | cut -d'"' -f4)
    FIRST_OFFICER_ACTIVATIONS=$(echo "$RESPONSE" | grep -o '"activations_count":[0-9]*' | head -1 | cut -d':' -f2)
    FIRST_OFFICER_REVENUE=$(echo "$RESPONSE" | grep -o '"total_revenue":[0-9.]*' | head -2 | tail -1 | cut -d':' -f2)
    
    echo "  Name: $FIRST_OFFICER_NAME"
    echo "  Activations: $FIRST_OFFICER_ACTIVATIONS"
    echo "  Revenue: ₦$(echo "scale=2; $FIRST_OFFICER_REVENUE / 100" | bc) (${FIRST_OFFICER_REVENUE} kobo)"
    echo ""
    
    # Verification
    echo "✅ VERIFICATION:"
    echo "================"
    
    if [ "$TOTAL_ACTIVATIONS" = "9" ]; then
        echo "✅ Summary shows 9 activations (CORRECT!)"
    else
        echo "⚠️  Summary shows $TOTAL_ACTIVATIONS activations (expected 9)"
    fi
    
    if [ "$FIRST_OFFICER_ACTIVATIONS" = "9" ]; then
        echo "✅ Bola Ahmed shows 9 activations (CORRECT!)"
    else
        echo "⚠️  First officer shows $FIRST_OFFICER_ACTIVATIONS activations (expected 9)"
    fi
    
    if [ "$TOTAL_REVENUE" = "$FIRST_OFFICER_REVENUE" ]; then
        echo "✅ Summary revenue matches first officer revenue (CONSISTENT!)"
    else
        echo "⚠️  Revenue mismatch: Summary=$TOTAL_REVENUE vs First Officer=$FIRST_OFFICER_REVENUE"
    fi
    
    echo ""
    echo "🎉 FIX VERIFICATION COMPLETE!"
    
else
    echo "❌ API Error or Invalid Response"
    echo ""
    echo "Response:"
    echo "$RESPONSE"
    echo ""
    echo "Possible issues:"
    echo "  1. Invalid or expired token"
    echo "  2. Server error"
    echo "  3. Network issue"
fi
