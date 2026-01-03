#!/bin/bash

echo "🧪 Testing Officer Login Endpoint"
echo "=================================="
echo ""
echo "Sending login request..."
echo ""

curl -X POST https://gtech.gifamz.com/api/v1/officer/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bola","password":"Admin@123"}' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -v

echo ""
echo "=================================="
echo "✅ Check the PM2 logs window for any errors!"
echo "=================================="
