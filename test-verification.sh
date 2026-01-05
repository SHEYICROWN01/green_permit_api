#!/bin/bash

# Test Officer Sticker Verification Endpoint
# Tests the fixed verification endpoint with various sticker IDs

echo "=========================================="
echo "🧪 TESTING OFFICER STICKER VERIFICATION"
echo "=========================================="
echo ""

# Configuration
BASE_URL="${BASE_URL:-https://gtech.gifamz.com}"
API_URL="$BASE_URL/api/v1/officer"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test sticker IDs (replace with actual IDs from your database)
UNUSED_STICKER="OGIFO-176734845652006001"
ACTIVE_STICKER="LAOWO-176744638584679001"
NONEXISTENT_STICKER="INVALID-123456789"

echo "Testing endpoint: $API_URL/stickers/:stickerID/verify"
echo ""

# ============================================
# Test 1: Verify Unused Sticker (Public - No Auth)
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Test 1: Verify Unused Sticker (No Auth)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Sticker ID: $UNUSED_STICKER"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X GET "$API_URL/stickers/$UNUSED_STICKER/verify" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    if echo "$BODY" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Test 1 PASSED: Unused sticker verified successfully${NC}"
    else
        echo -e "${RED}❌ Test 1 FAILED: Response success is false${NC}"
    fi
else
    echo -e "${RED}❌ Test 1 FAILED: Expected 200, got $HTTP_CODE${NC}"
fi

echo ""
echo ""

# ============================================
# Test 2: Verify Non-existent Sticker
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Test 2: Verify Non-existent Sticker${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Sticker ID: $NONEXISTENT_STICKER"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X GET "$API_URL/stickers/$NONEXISTENT_STICKER/verify" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "404" ]; then
    if echo "$BODY" | grep -q '"errorCode":"STICKER_NOT_FOUND"'; then
        echo -e "${GREEN}✅ Test 2 PASSED: Non-existent sticker returns 404${NC}"
    else
        echo -e "${YELLOW}⚠️  Test 2 PARTIAL: Got 404 but wrong error code${NC}"
    fi
else
    echo -e "${RED}❌ Test 2 FAILED: Expected 404, got $HTTP_CODE${NC}"
fi

echo ""
echo ""

# ============================================
# Test 3: Verify Active Sticker (if available)
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Test 3: Verify Active Sticker${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Sticker ID: $ACTIVE_STICKER"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X GET "$API_URL/stickers/$ACTIVE_STICKER/verify" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    if echo "$BODY" | grep -q '"success":true'; then
        STATUS=$(echo "$BODY" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Test 3 PASSED: Sticker verified with status: $STATUS${NC}"
    else
        echo -e "${RED}❌ Test 3 FAILED: Response success is false${NC}"
    fi
else
    if [ "$HTTP_CODE" = "404" ]; then
        echo -e "${YELLOW}⚠️  Test 3 SKIPPED: Sticker not found (may not be activated yet)${NC}"
    else
        echo -e "${RED}❌ Test 3 FAILED: Expected 200, got $HTTP_CODE${NC}"
    fi
fi

echo ""
echo ""

# ============================================
# Test 4: Verify with Authentication (Officer)
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Test 4: Verify with Officer Authentication${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# First login to get token
echo "Step 1: Officer Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bola",
    "password": "Admin@123"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Test 4 SKIPPED: Could not login (check credentials)${NC}"
    echo "Login Response:"
    echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"
else
    echo -e "${GREEN}✅ Login successful, got token${NC}"
    echo ""
    
    # Now verify with token
    echo "Step 2: Verify sticker with authentication..."
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
      -X GET "$API_URL/stickers/$UNUSED_STICKER/verify" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json")

    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
    BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

    echo "HTTP Status: $HTTP_CODE"
    echo "Response:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    echo ""

    if [ "$HTTP_CODE" = "200" ]; then
        if echo "$BODY" | grep -q '"success":true'; then
            echo -e "${GREEN}✅ Test 4 PASSED: Verification with auth works${NC}"
        else
            echo -e "${RED}❌ Test 4 FAILED: Response success is false${NC}"
        fi
    else
        echo -e "${RED}❌ Test 4 FAILED: Expected 200, got $HTTP_CODE${NC}"
    fi
fi

echo ""
echo ""

# ============================================
# Summary
# ============================================
echo "=========================================="
echo "📊 TEST SUMMARY"
echo "=========================================="
echo ""
echo "Endpoint tested: GET /api/v1/officer/stickers/:stickerID/verify"
echo ""
echo "✅ = Test Passed"
echo "❌ = Test Failed"
echo "⚠️  = Test Skipped/Warning"
echo ""
echo "Check the results above for details."
echo ""
echo "=========================================="
echo "🏁 TESTS COMPLETE"
echo "=========================================="
