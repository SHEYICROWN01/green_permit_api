#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# STICKER PRICE VALIDATION FIX - TEST SCRIPT
# ═══════════════════════════════════════════════════════════════
# Tests the updated validation limits for sticker pricing
# New limit: ₦50,000 (5,000,000 kobo) - up from ₦1,000 (100,000 kobo)
# ═══════════════════════════════════════════════════════════════

API_URL="${API_URL:-https://gtech.gifamz.com/api/v1}"
BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ═══════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════

print_header() {
    echo ""
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${BLUE}  $1${NC}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_test() {
    echo -e "${BOLD}TEST $1:${NC} $2"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ PASSED:${NC} $1"
    echo ""
}

print_failure() {
    echo -e "${RED}❌ FAILED:${NC} $1"
    echo ""
}

print_warning() {
    echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
    echo ""
}

print_info() {
    echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

kobo_to_naira() {
    local kobo=$1
    local naira=$(echo "scale=2; $kobo / 100" | bc)
    echo "₦$(printf "%'.0f" $naira)"
}

# ═══════════════════════════════════════════════════════════════
# AUTHENTICATION
# ═══════════════════════════════════════════════════════════════

print_header "STEP 1: AUTHENTICATION"

print_info "Logging in as super admin..."
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/super-admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@greenpermit.com",
    "password": "Admin@123"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"$//')

if [ -z "$TOKEN" ]; then
    print_failure "Failed to get authentication token"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

print_success "Authentication successful"
print_info "Token: ${TOKEN:0:20}...${TOKEN: -10}"
echo ""

# ═══════════════════════════════════════════════════════════════
# TEST SUITE
# ═══════════════════════════════════════════════════════════════

TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=8

print_header "STEP 2: VALIDATION TESTS"

# ───────────────────────────────────────────────────────────────
# Test 1: Minimum valid price (₦1.00 = 100 kobo)
# ───────────────────────────────────────────────────────────────
print_test "1/$TOTAL_TESTS" "Minimum Valid Price - $(kobo_to_naira 100)"

RESPONSE=$(curl -s -X PUT "$API_URL/super-admin/lgas/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sticker_price": 100}')

HTTP_CODE=$(echo "$RESPONSE" | grep -o '"success":true' | wc -l | tr -d ' ')

if [ "$HTTP_CODE" -eq "1" ]; then
    print_success "Minimum price (100 kobo = ₦1.00) accepted"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_failure "Minimum price rejected"
    echo "Response: $RESPONSE"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# ───────────────────────────────────────────────────────────────
# Test 2: Below minimum (should fail)
# ───────────────────────────────────────────────────────────────
print_test "2/$TOTAL_TESTS" "Below Minimum Price - $(kobo_to_naira 50) [Should Fail]"

RESPONSE=$(curl -s -X PUT "$API_URL/super-admin/lgas/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sticker_price": 50}')

SUCCESS=$(echo "$RESPONSE" | grep -o '"success":false' | wc -l | tr -d ' ')

if [ "$SUCCESS" -eq "1" ]; then
    print_success "Below minimum correctly rejected"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_failure "Below minimum should have been rejected"
    echo "Response: $RESPONSE"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# ───────────────────────────────────────────────────────────────
# Test 3: Typical price - ₦3,000
# ───────────────────────────────────────────────────────────────
print_test "3/$TOTAL_TESTS" "Typical Price - $(kobo_to_naira 300000)"

RESPONSE=$(curl -s -X PUT "$API_URL/super-admin/lgas/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sticker_price": 300000}')

SUCCESS=$(echo "$RESPONSE" | grep -o '"success":true' | wc -l | tr -d ' ')

if [ "$SUCCESS" -eq "1" ]; then
    print_success "Typical price (300,000 kobo = ₦3,000) accepted"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_failure "Typical price rejected"
    echo "Response: $RESPONSE"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# ───────────────────────────────────────────────────────────────
# Test 4: High price - ₦5,000
# ───────────────────────────────────────────────────────────────
print_test "4/$TOTAL_TESTS" "High Price - $(kobo_to_naira 500000)"

RESPONSE=$(curl -s -X PUT "$API_URL/super-admin/lgas/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sticker_price": 500000}')

SUCCESS=$(echo "$RESPONSE" | grep -o '"success":true' | wc -l | tr -d ' ')

if [ "$SUCCESS" -eq "1" ]; then
    print_success "High price (500,000 kobo = ₦5,000) accepted"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_failure "High price rejected"
    echo "Response: $RESPONSE"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# ───────────────────────────────────────────────────────────────
# Test 5: Very high price - ₦10,000
# ───────────────────────────────────────────────────────────────
print_test "5/$TOTAL_TESTS" "Very High Price - $(kobo_to_naira 1000000)"

RESPONSE=$(curl -s -X PUT "$API_URL/super-admin/lgas/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sticker_price": 1000000}')

SUCCESS=$(echo "$RESPONSE" | grep -o '"success":true' | wc -l | tr -d ' ')

if [ "$SUCCESS" -eq "1" ]; then
    print_success "Very high price (1,000,000 kobo = ₦10,000) accepted"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_failure "Very high price rejected"
    echo "Response: $RESPONSE"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# ───────────────────────────────────────────────────────────────
# Test 6: Maximum allowed price - ₦50,000
# ───────────────────────────────────────────────────────────────
print_test "6/$TOTAL_TESTS" "Maximum Allowed Price - $(kobo_to_naira 5000000)"

RESPONSE=$(curl -s -X PUT "$API_URL/super-admin/lgas/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sticker_price": 5000000}')

SUCCESS=$(echo "$RESPONSE" | grep -o '"success":true' | wc -l | tr -d ' ')

if [ "$SUCCESS" -eq "1" ]; then
    print_success "Maximum price (5,000,000 kobo = ₦50,000) accepted"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_failure "Maximum price rejected"
    echo "Response: $RESPONSE"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# ───────────────────────────────────────────────────────────────
# Test 7: Above maximum (should fail) - ₦60,000
# ───────────────────────────────────────────────────────────────
print_test "7/$TOTAL_TESTS" "Above Maximum Price - $(kobo_to_naira 6000000) [Should Fail]"

RESPONSE=$(curl -s -X PUT "$API_URL/super-admin/lgas/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sticker_price": 6000000}')

SUCCESS=$(echo "$RESPONSE" | grep -o '"success":false' | wc -l | tr -d ' ')

if [ "$SUCCESS" -eq "1" ]; then
    print_success "Above maximum correctly rejected"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_failure "Above maximum should have been rejected"
    echo "Response: $RESPONSE"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# ───────────────────────────────────────────────────────────────
# Test 8: Create new LGA with valid high price
# ───────────────────────────────────────────────────────────────
print_test "8/$TOTAL_TESTS" "Create New LGA with High Price - $(kobo_to_naira 450000)"

RANDOM_SUFFIX=$RANDOM
RESPONSE=$(curl -s -X POST "$API_URL/super-admin/lgas" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"lga\": {
      \"name\": \"Test LGA $RANDOM_SUFFIX\",
      \"state\": \"Lagos State\",
      \"code\": \"TST$RANDOM_SUFFIX\",
      \"sticker_prefix\": \"TSLA\",
      \"sticker_price\": 450000,
      \"address\": \"Test Address\",
      \"phone\": \"+2348012345678\",
      \"email\": \"test$RANDOM_SUFFIX@testlga.com\"
    },
    \"admin\": {
      \"name\": \"Test Admin\",
      \"email\": \"admin$RANDOM_SUFFIX@testlga.com\",
      \"username\": \"testadmin$RANDOM_SUFFIX\",
      \"password\": \"TestAdmin@123\",
      \"phone\": \"+2348012345678\"
    }
  }")

SUCCESS=$(echo "$RESPONSE" | grep -o '"success":true' | wc -l | tr -d ' ')

if [ "$SUCCESS" -eq "1" ]; then
    print_success "New LGA created with high price (450,000 kobo = ₦4,500)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    
    # Clean up: Try to get the created LGA ID and note it
    NEW_LGA_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
    if [ ! -z "$NEW_LGA_ID" ]; then
        print_info "New LGA ID: $NEW_LGA_ID (can be deleted if needed)"
    fi
else
    print_failure "Failed to create new LGA with high price"
    echo "Response: $RESPONSE"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# ═══════════════════════════════════════════════════════════════
# TEST SUMMARY
# ═══════════════════════════════════════════════════════════════

print_header "TEST SUMMARY"

echo -e "${BOLD}Total Tests:${NC} $TOTAL_TESTS"
echo -e "${GREEN}${BOLD}Passed:${NC} $TESTS_PASSED"
echo -e "${RED}${BOLD}Failed:${NC} $TESTS_FAILED"
echo ""

PASS_RATE=$(echo "scale=1; ($TESTS_PASSED * 100) / $TOTAL_TESTS" | bc)
echo -e "${BOLD}Pass Rate:${NC} $PASS_RATE%"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}${BOLD}  ✅ ALL TESTS PASSED - VALIDATION FIX SUCCESSFUL!${NC}"
    echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    print_success "Sticker price validation now supports up to ₦50,000 (5,000,000 kobo)"
    print_info "Frontend team can now set realistic LGA prices"
    print_info "System is ready for production deployment"
    echo ""
    exit 0
else
    echo -e "${RED}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}${BOLD}  ❌ SOME TESTS FAILED - REVIEW REQUIRED${NC}"
    echo -e "${RED}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    print_warning "Review the failed tests above"
    print_info "Check if the API server has been restarted with the new validation"
    echo ""
    exit 1
fi
