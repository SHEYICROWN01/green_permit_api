#!/bin/bash

echo "🔍 TESTING REQUEST ROUTING"
echo "=========================="
echo ""

echo "1️⃣ Test Health Endpoint (should work):"
echo "--------------------------------------"
curl -i https://gtech.gifamz.com/health
echo ""
echo ""

echo "2️⃣ Test API Welcome Route:"
echo "--------------------------------------"
curl -i https://gtech.gifamz.com/api/v1/
echo ""
echo ""

echo "3️⃣ Test Officer Login (with verbose):"
echo "--------------------------------------"
curl -i -X POST https://gtech.gifamz.com/api/v1/officer/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bola","password":"Admin@123"}'
echo ""
echo ""

echo "4️⃣ Check if logs show any requests:"
echo "--------------------------------------"
tail -50 ~/.pm2/logs/green-permit-api-out.log | grep -E "LOGIN|POST|GET|===|Error" || echo "No request logs found"
echo ""
echo ""

echo "=========================="
echo "🔍 ANALYSIS"
echo "=========================="
echo "If health endpoint works but login doesn't show logs,"
echo "the issue is likely:"
echo "  - Request not reaching the /api/v1/officer/auth/login route"
echo "  - Nginx/cPanel proxy misconfiguration"
echo "  - Console.log not working in production"
echo ""
