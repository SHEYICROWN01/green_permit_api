#!/bin/bash

echo "🔍 COMPREHENSIVE LOGIN DEBUG"
echo "============================"
echo ""

# 1. Check if officer exists
echo "1️⃣ Checking if officer 'bola' exists in database..."
echo "----------------------------------------------------"
mysql -u ggtlnplz_green_permit -pggtlnplz_green_permit@2024 ggtlnplz_green_permit_db << 'EOF'
SELECT 
  id,
  name,
  username,
  officer_code,
  role,
  is_active,
  CASE 
    WHEN password IS NULL OR password = '' THEN '❌ NOT SET' 
    ELSE '✅ SET (bcrypt hash)' 
  END as password_status,
  SUBSTRING(password, 1, 20) as password_preview,
  lga_id,
  failed_login_attempts,
  locked_until
FROM users 
WHERE username = 'bola';
EOF

echo ""
echo ""

# 2. Check environment variables
echo "2️⃣ Checking environment variables..."
echo "----------------------------------------------------"
cd ~/green-permit-api
if [ -f .env ]; then
    echo "✅ .env file exists"
    echo ""
    echo "Database config:"
    cat .env | grep -E "^DB_" | sed 's/=.*/@hidden/'
    echo ""
    echo "JWT config:"
    if grep -q "^JWT_SECRET" .env; then
        echo "✅ JWT_SECRET is set"
    else
        echo "❌ JWT_SECRET is NOT set"
    fi
else
    echo "❌ .env file not found!"
fi

echo ""
echo ""

# 3. Check PM2 status
echo "3️⃣ Checking PM2 status..."
echo "----------------------------------------------------"
pm2 list

echo ""
echo ""

# 4. Check actual output logs (not just errors)
echo "4️⃣ Checking recent application output logs..."
echo "----------------------------------------------------"
tail -20 ~/.pm2/logs/green-permit-api-out.log

echo ""
echo ""

# 5. Test with detailed output
echo "5️⃣ Testing login with verbose curl..."
echo "----------------------------------------------------"

# Restart PM2 to clear any issues
pm2 restart green-permit-api --update-env
sleep 2

echo "Sending login request..."
curl -v -X POST https://gtech.gifamz.com/api/v1/officer/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bola","password":"Admin@123"}' 2>&1

echo ""
echo ""

# 6. Check logs immediately after test
echo "6️⃣ Checking logs after login attempt..."
echo "----------------------------------------------------"
echo "Last 30 lines of output log:"
tail -30 ~/.pm2/logs/green-permit-api-out.log

echo ""
echo ""

echo "============================"
echo "🔍 DEBUG COMPLETE"
echo "============================"
echo ""
echo "📋 SUMMARY:"
echo "- Check if officer 'bola' exists with password set"
echo "- Verify JWT_SECRET is configured"
echo "- Look for console.log messages in output logs"
echo "- Check curl response for specific error"
echo ""
