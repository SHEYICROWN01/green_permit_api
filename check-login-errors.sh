#!/bin/bash

echo "🔍 Checking Error Logs for Officer Login Issue"
echo "==============================================="
echo ""

echo "📋 Last 50 lines of ERROR log:"
echo "----------------------------------------"
tail -50 ~/.pm2/logs/green-permit-api-error.log
echo ""
echo ""

echo "📋 Last 30 lines of OUTPUT log (checking for errors):"
echo "----------------------------------------"
tail -30 ~/.pm2/logs/green-permit-api-out.log | grep -i "error\|exception\|fail" || echo "No errors found in output log"
echo ""
echo ""

echo "🧪 Testing login again and watching for immediate errors..."
echo "----------------------------------------"

# Start log watching in background
timeout 5 pm2 logs green-permit-api --lines 0 2>&1 &
LOG_PID=$!

# Wait a moment for logs to start
sleep 1

# Make the request
echo "Sending login request..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST https://gtech.gifamz.com/api/v1/officer/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bola","password":"Admin@123"}')

# Kill the log watcher
kill $LOG_PID 2>/dev/null

echo ""
echo "Response:"
echo "$RESPONSE"
echo ""

echo "==============================================="
echo "🔍 Check the error messages above"
echo "==============================================="
