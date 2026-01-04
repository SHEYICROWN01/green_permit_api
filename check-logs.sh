#!/bin/bash

# Check application logs for activation errors
# This will help us see the actual error

echo "=============================================="
echo "CHECKING ACTIVATION ERROR LOGS"
echo "=============================================="
echo ""

# Check if running in cPanel or PM2
if [ -f "/home/ggtlnplz/green-permit-api/logs/app.log" ]; then
    echo "Checking app.log..."
    tail -100 /home/ggtlnplz/green-permit-api/logs/app.log | grep -A 20 "ACTIVATE"
    echo ""
fi

if [ -f "/home/ggtlnplz/green-permit-api/logs/error.log" ]; then
    echo "Checking error.log..."
    tail -100 /home/ggtlnplz/green-permit-api/logs/error.log | grep -A 20 "activate"
    echo ""
fi

# Check cPanel Node.js logs
if [ -f "/home/ggtlnplz/logs/green-permit-api.log" ]; then
    echo "Checking cPanel Node.js logs..."
    tail -100 /home/ggtlnplz/logs/green-permit-api.log | grep -A 20 -i "error\|activate"
    echo ""
fi

# Check stderr
if [ -f "/home/ggtlnplz/green-permit-api/stderr.log" ]; then
    echo "Checking stderr.log..."
    tail -100 /home/ggtlnplz/green-permit-api/stderr.log
    echo ""
fi

# Check stdout
if [ -f "/home/ggtlnplz/green-permit-api/stdout.log" ]; then
    echo "Checking stdout.log..."
    tail -100 /home/ggtlnplz/green-permit-api/stdout.log | grep -A 20 "ACTIVATE"
    echo ""
fi

echo "=============================================="
echo "LOOKING FOR SPECIFIC ERROR PATTERNS"
echo "=============================================="
echo ""

# Look for common errors
echo "Searching for SQL errors..."
tail -200 /home/ggtlnplz/green-permit-api/logs/*.log 2>/dev/null | grep -i "sql\|mysql\|errno" | tail -20
echo ""

echo "Searching for 'Unknown column' errors..."
tail -200 /home/ggtlnplz/green-permit-api/logs/*.log 2>/dev/null | grep -i "unknown column" | tail -10
echo ""

echo "Searching for foreign key errors..."
tail -200 /home/ggtlnplz/green-permit-api/logs/*.log 2>/dev/null | grep -i "foreign key\|constraint" | tail -10
echo ""

echo "=============================================="
echo "MANUAL LOG CHECK"
echo "=============================================="
echo ""
echo "If no logs found above, manually check:"
echo "  tail -200 /home/ggtlnplz/green-permit-api/logs/app.log"
echo "  tail -200 /home/ggtlnplz/logs/green-permit-api.log"
echo ""
echo "Or show all console output:"
echo "  tail -200 /home/ggtlnplz/green-permit-api/stdout.log"
