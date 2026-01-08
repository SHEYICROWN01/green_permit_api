#!/bin/bash

# Quick Deploy Script for Sticker Verification Fix
# This script deploys the fix to production and tests it

echo "=========================================="
echo "🚀 DEPLOYING STICKER VERIFICATION FIX"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Step 1: Connecting to production server...${NC}"
echo ""

# Production server details
SERVER_USER="ggtlnplz"
SERVER_IP="192.64.117.46"
SERVER_PORT="21098"
PROJECT_DIR="~/green-permit-api"

echo "Server: $SERVER_USER@$SERVER_IP:$SERVER_PORT"
echo "Project: $PROJECT_DIR"
echo ""

# Deploy commands
echo -e "${BLUE}Step 2: Pulling latest code from GitHub...${NC}"
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP << 'ENDSSH'
    cd ~/green-permit-api
    
    echo "📥 Pulling from GitHub..."
    git pull origin main
    
    if [ $? -eq 0 ]; then
        echo "✅ Code pulled successfully"
    else
        echo "❌ Failed to pull code"
        exit 1
    fi
    
    echo ""
    echo "📝 Verifying changes..."
    if grep -q "db.query" src/controllers/officer/sticker.controller.js; then
        echo "✅ Verification fix detected in code"
    else
        echo "⚠️  Warning: Fix may not be present"
    fi
    
    echo ""
    echo "🔄 Restarting application..."
    touch app.js
    
    echo "✅ Application restart triggered"
    echo ""
    echo "⏳ Waiting 5 seconds for app to restart..."
    sleep 5
    
    echo ""
    echo "🏥 Checking application health..."
    
    # Test if app is responding
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null || echo "000")
    
    if [ "$RESPONSE" = "200" ]; then
        echo "✅ Application is running (HTTP 200)"
    else
        echo "⚠️  Application may not be fully started yet (HTTP $RESPONSE)"
        echo "   Check cPanel: Setup Node.js App → View Status"
    fi
ENDSSH

DEPLOY_STATUS=$?

echo ""
echo "=========================================="

if [ $DEPLOY_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Test the endpoint:"
    echo "   ./test-verification.sh"
    echo ""
    echo "2. Or quick manual test:"
    echo "   curl https://gtech.gifamz.com/api/v1/officer/stickers/OGIFO-176734845652006001/verify"
    echo ""
    echo "3. Check cPanel if needed:"
    echo "   https://gtech.gifamz.com:2083 → Setup Node.js App"
else
    echo -e "${RED}❌ DEPLOYMENT FAILED${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check SSH connection"
    echo "2. Verify GitHub access on server"
    echo "3. Check cPanel application status"
fi

echo "=========================================="
