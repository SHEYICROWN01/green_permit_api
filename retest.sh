#!/bin/bash

# Quick Test Script
# This will pull the latest test script and run it

echo "================================================"
echo "PULLING LATEST TEST SCRIPT WITH FIXED LOGIC"
echo "================================================"
echo ""

cd /home/ggtlnplz/green-permit-api
git pull origin main

echo ""
echo "================================================"
echo "RUNNING TESTS WITH IMPROVED PATTERN MATCHING"
echo "================================================"
echo ""

./test-all-apis.sh

echo ""
echo "================================================"
echo "NOTE: All endpoints returning 'success: true'"
echo "should now show ✅ PASSED"
echo "================================================"
