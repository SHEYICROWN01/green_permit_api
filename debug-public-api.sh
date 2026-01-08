#!/bin/bash

# Debug script to test the public verification API

echo "🔍 Testing Public Verification API - Debug Mode"
echo "================================================"
echo ""

API_URL="https://gtech.gifamz.com/api/v1/public/verify-sticker"
STICKER_CODE="ONSEY-176757997717816002"

echo "1️⃣ Testing with curl (JSON body):"
echo "---"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"$STICKER_CODE\"}" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo ""
echo "2️⃣ Testing with different sticker code format:"
echo "---"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"sticker_code": "ONSEY-176757997717816002"}' \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo ""
echo "3️⃣ Testing API health:"
echo "---"
curl -s https://gtech.gifamz.com/health | jq '.'

echo ""
echo ""
echo "4️⃣ Testing with verbose output:"
echo "---"
curl -v -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"code\": \"$STICKER_CODE\"}" 2>&1 | grep -E "^> |^< |HTTP|{\"success"

echo ""
echo ""
echo "5️⃣ Check if body-parser is working (empty body test):"
echo "---"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -s | jq '.'

echo ""
echo "================================================"
echo "Debug complete. Check output above for issues."
