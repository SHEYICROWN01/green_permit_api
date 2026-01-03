#!/bin/bash

echo "🔍 CHECKING ROUTING AND PROXY CONFIGURATION"
echo "==========================================="
echo ""

echo "1️⃣ Check if .htaccess exists:"
echo "-------------------------------"
if [ -f ~/green-permit-api/.htaccess ]; then
    echo "✅ .htaccess found:"
    cat ~/green-permit-api/.htaccess
else
    echo "❌ No .htaccess file"
fi
echo ""
echo ""

echo "2️⃣ Check if public_html has routing:"
echo "--------------------------------------"
if [ -f ~/public_html/.htaccess ]; then
    echo "✅ public_html/.htaccess found:"
    cat ~/public_html/.htaccess
else
    echo "❌ No public_html/.htaccess"
fi
echo ""
echo ""

echo "3️⃣ Check Node.js app setup in cPanel:"
echo "---------------------------------------"
ls -la ~/public_html/ | head -20
echo ""
echo ""

echo "4️⃣ Test if Node.js app is receiving ANY requests:"
echo "---------------------------------------------------"
echo "Testing health endpoint..."
curl -v https://gtech.gifamz.com/health 2>&1 | grep -E "HTTP|Server|X-Powered"
echo ""
echo ""

echo "5️⃣ Check what's listening on port 3000:"
echo "-----------------------------------------"
netstat -tuln | grep 3000 || ss -tuln | grep 3000
echo ""
echo ""

echo "6️⃣ Test direct connection to Node.js app (localhost:3000):"
echo "-------------------------------------------------------------"
curl http://localhost:3000/health
echo ""
echo ""

echo "7️⃣ Test officer login on localhost:3000:"
echo "------------------------------------------"
curl -X POST http://localhost:3000/api/v1/officer/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bola","password":"Admin@123"}'
echo ""
echo ""

echo "8️⃣ Check if debug log was created NOW:"
echo "----------------------------------------"
if [ -f ~/green-permit-api/officer-login-debug.log ]; then
    echo "✅ Debug log found:"
    cat ~/green-permit-api/officer-login-debug.log
else
    echo "❌ Still no debug log - request not reaching Node.js app"
fi
echo ""
echo ""

echo "==========================================="
echo "🔍 ANALYSIS"
echo "==========================================="
echo ""
echo "If localhost:3000 works but https://gtech.gifamz.com doesn't,"
echo "then cPanel/Apache is not forwarding requests to Node.js app."
echo ""
echo "You need to configure cPanel Node.js app to handle the domain."
echo ""
