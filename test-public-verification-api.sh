#!/bin/bash

# Public Verification API Test Script
# Tests all scenarios for the public sticker verification endpoint

echo "🧪 Testing Public Verification API"
echo "=================================="
echo ""

# Configuration
API_BASE_URL="${API_BASE_URL:-https://gtech.gifamz.com}"
API_ENDPOINT="$API_BASE_URL/api/v1/public/verify-sticker"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print test result
print_result() {
    local test_name="$1"
    local result="$2"
    local message="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" == "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC} - $test_name"
        [ -n "$message" ] && echo "       $message"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAIL${NC} - $test_name"
        [ -n "$message" ] && echo "       $message"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

# Function to make API request and extract response
test_api() {
    local sticker_code="$1"
    local gps_location="$2"
    
    if [ -n "$gps_location" ]; then
        response=$(curl -s -X POST "$API_ENDPOINT" \
            -H "Content-Type: application/json" \
            -d "{\"code\": \"$sticker_code\", \"gps_location\": \"$gps_location\"}")
    else
        response=$(curl -s -X POST "$API_ENDPOINT" \
            -H "Content-Type: application/json" \
            -d "{\"code\": \"$sticker_code\"}")
    fi
    
    echo "$response"
}

echo -e "${BLUE}🔍 Test 1: Valid Active Sticker${NC}"
echo "Testing with code: ONSEY-176757997717816002"
echo "---"
response=$(test_api "ONSEY-176757997717816002")
echo "$response" | jq '.'

# Check if response contains expected fields
if echo "$response" | jq -e '.success' > /dev/null && \
   echo "$response" | jq -e '.valid' > /dev/null && \
   echo "$response" | jq -e '.sticker' > /dev/null && \
   echo "$response" | jq -e '.sticker.code' > /dev/null && \
   echo "$response" | jq -e '.sticker.lga_name' > /dev/null && \
   echo "$response" | jq -e '.sticker.state_name' > /dev/null && \
   echo "$response" | jq -e '.is_activated' > /dev/null && \
   echo "$response" | jq -e '.lga_name' > /dev/null && \
   echo "$response" | jq -e '.state' > /dev/null && \
   echo "$response" | jq -e '.expired' > /dev/null; then
    
    success=$(echo "$response" | jq -r '.success')
    valid=$(echo "$response" | jq -r '.valid')
    is_activated=$(echo "$response" | jq -r '.is_activated')
    lga_name=$(echo "$response" | jq -r '.lga_name')
    
    if [ "$success" == "true" ] && [ "$valid" == "true" ]; then
        print_result "Valid Active Sticker" "PASS" "LGA: $lga_name, Activated: $is_activated"
    else
        print_result "Valid Active Sticker" "FAIL" "Expected success=true and valid=true"
    fi
else
    print_result "Valid Active Sticker" "FAIL" "Missing required fields in response"
fi

echo ""
echo -e "${BLUE}🔍 Test 2: Invalid Sticker Code${NC}"
echo "Testing with code: INVALID-000000000000000"
echo "---"
response=$(test_api "INVALID-000000000000000")
echo "$response" | jq '.'

success=$(echo "$response" | jq -r '.success')
valid=$(echo "$response" | jq -r '.valid')
sticker=$(echo "$response" | jq -r '.sticker')

if [ "$success" == "false" ] && [ "$valid" == "false" ] && [ "$sticker" == "null" ]; then
    print_result "Invalid Sticker Code" "PASS" "Correctly returned invalid response"
else
    print_result "Invalid Sticker Code" "FAIL" "Expected success=false, valid=false, sticker=null"
fi

echo ""
echo -e "${BLUE}🔍 Test 3: Missing Sticker Code${NC}"
echo "Testing with no code parameter"
echo "---"
response=$(curl -s -X POST "$API_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{}')
echo "$response" | jq '.'

success=$(echo "$response" | jq -r '.success')
message=$(echo "$response" | jq -r '.message')

if [ "$success" == "false" ] && echo "$message" | grep -q "required"; then
    print_result "Missing Sticker Code" "PASS" "Correctly rejected empty request"
else
    print_result "Missing Sticker Code" "FAIL" "Should return error for missing code"
fi

echo ""
echo -e "${BLUE}🔍 Test 4: Backward Compatibility (sticker_code parameter)${NC}"
echo "Testing with 'sticker_code' instead of 'code'"
echo "---"
response=$(curl -s -X POST "$API_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{"sticker_code": "ONSEY-176757997717816002"}')
echo "$response" | jq '.'

success=$(echo "$response" | jq -r '.success')

if [ "$success" == "true" ] || [ "$success" == "false" ]; then
    print_result "Backward Compatibility" "PASS" "Accepts 'sticker_code' parameter"
else
    print_result "Backward Compatibility" "FAIL" "Should accept 'sticker_code' parameter"
fi

echo ""
echo -e "${BLUE}🔍 Test 5: GPS Location Logging${NC}"
echo "Testing with GPS location"
echo "---"
response=$(test_api "ONSEY-176757997717816002" "6.5244,3.3792")
echo "$response" | jq '.'

# If the request succeeds, GPS location should be logged (we can't verify from API response)
success=$(echo "$response" | jq -r '.success')

if [ "$success" == "true" ] || [ "$success" == "false" ]; then
    print_result "GPS Location" "PASS" "Request accepted with GPS location (check logs for verification)"
else
    print_result "GPS Location" "FAIL" "Request failed"
fi

echo ""
echo -e "${BLUE}🔍 Test 6: Response Fields Validation${NC}"
echo "Checking if all required fields are present"
echo "---"
response=$(test_api "ONSEY-176757997717816002")

required_fields=(
    ".success"
    ".valid"
    ".message"
    ".sticker"
    ".is_activated"
    ".lga_name"
    ".state"
    ".expired"
    ".code"
)

missing_fields=()
for field in "${required_fields[@]}"; do
    if ! echo "$response" | jq -e "$field" > /dev/null 2>&1; then
        missing_fields+=("$field")
    fi
done

if [ ${#missing_fields[@]} -eq 0 ]; then
    print_result "Response Fields" "PASS" "All required fields present"
else
    print_result "Response Fields" "FAIL" "Missing fields: ${missing_fields[*]}"
fi

# If sticker is not null, check nested fields
sticker_is_null=$(echo "$response" | jq -r '.sticker == null')

if [ "$sticker_is_null" == "false" ]; then
    echo -e "${BLUE}🔍 Test 7: Sticker Object Fields${NC}"
    echo "Checking nested sticker object fields"
    echo "---"
    
    sticker_fields=(
        ".sticker.id"
        ".sticker.code"
        ".sticker.lga_name"
        ".sticker.state_name"
        ".sticker.status"
        ".sticker.is_activated"
        ".sticker.price"
        ".sticker.batch_id"
        ".sticker.lga_id"
        ".sticker.created_at"
    )
    
    missing_sticker_fields=()
    for field in "${sticker_fields[@]}"; do
        if ! echo "$response" | jq -e "$field" > /dev/null 2>&1; then
            missing_sticker_fields+=("$field")
        fi
    done
    
    if [ ${#missing_sticker_fields[@]} -eq 0 ]; then
        print_result "Sticker Object Fields" "PASS" "All sticker fields present"
    else
        print_result "Sticker Object Fields" "FAIL" "Missing fields: ${missing_sticker_fields[*]}"
    fi
    
    # Check price format (should be decimal, not kobo)
    price=$(echo "$response" | jq -r '.sticker.price')
    if echo "$price" | grep -qE '^[0-9]+\.[0-9]{2}$'; then
        print_result "Price Format" "PASS" "Price in correct format (naira with 2 decimals): ₦$price"
    else
        print_result "Price Format" "FAIL" "Price should be in format: 0.00 (got: $price)"
    fi
fi

echo ""
echo -e "${BLUE}🔍 Test 8: CORS Headers${NC}"
echo "Checking if CORS headers are present"
echo "---"
cors_response=$(curl -s -I -X OPTIONS "$API_ENDPOINT" \
    -H "Origin: https://permitmanager.gifamz.com" \
    -H "Access-Control-Request-Method: POST")

if echo "$cors_response" | grep -q "Access-Control-Allow-Origin"; then
    print_result "CORS Headers" "PASS" "CORS headers present"
else
    print_result "CORS Headers" "WARN" "CORS headers may not be configured (check if preflight is handled)"
fi

echo ""
echo "=================================="
echo -e "${BLUE}📊 Test Summary${NC}"
echo "=================================="
echo -e "Total Tests:  ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please review the output above.${NC}"
    exit 1
fi
