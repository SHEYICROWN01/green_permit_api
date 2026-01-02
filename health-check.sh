#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# Green Permit API - Server Health Check Script
# ═══════════════════════════════════════════════════════════════
# Run this script to verify the deployment is working correctly
# ═══════════════════════════════════════════════════════════════

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  GREEN PERMIT API - HEALTH CHECK                              ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | grep PORT | xargs)
fi

PORT=${PORT:-3000}

# 1. Check if process is running
echo -e "${BLUE}▶ Checking PM2 process status...${NC}"
if pm2 list | grep -q "green-permit-api"; then
    pm2 list | grep "green-permit-api"
    echo -e "${GREEN}✓ Application is running${NC}"
else
    echo -e "${RED}✗ Application is not running${NC}"
    echo -e "${YELLOW}Start it with: pm2 start ecosystem.config.js${NC}"
    exit 1
fi

echo ""

# 2. Check if port is listening
echo -e "${BLUE}▶ Checking if port ${PORT} is listening...${NC}"
if netstat -tuln 2>/dev/null | grep -q ":${PORT} " || lsof -i :${PORT} 2>/dev/null | grep -q LISTEN; then
    echo -e "${GREEN}✓ Port ${PORT} is listening${NC}"
else
    echo -e "${YELLOW}⚠ Port ${PORT} may not be listening${NC}"
fi

echo ""

# 3. Test health endpoint
echo -e "${BLUE}▶ Testing health endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s http://localhost:${PORT}/health)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Health endpoint responded${NC}"
    echo "Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}✗ Health endpoint failed${NC}"
fi

echo ""

# 4. Test API endpoint
echo -e "${BLUE}▶ Testing API endpoint...${NC}"
API_RESPONSE=$(curl -s http://localhost:${PORT}/api/v1/public/lgas | head -c 100)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ API endpoint responded${NC}"
    echo "Response (first 100 chars): $API_RESPONSE..."
else
    echo -e "${RED}✗ API endpoint failed${NC}"
fi

echo ""

# 5. Check database connection
echo -e "${BLUE}▶ Checking recent application logs...${NC}"
pm2 logs green-permit-api --lines 5 --nostream

echo ""

# 6. Check disk space
echo -e "${BLUE}▶ Checking disk space...${NC}"
df -h . | tail -1

echo ""

# 7. Check memory usage
echo -e "${BLUE}▶ Checking memory usage...${NC}"
free -m 2>/dev/null || vm_stat 2>/dev/null | grep -E "Pages free|Pages active|Pages inactive" || echo "Memory stats unavailable"

echo ""

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  HEALTH CHECK COMPLETE                                        ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Additional commands:"
echo "  • View live logs: pm2 logs green-permit-api"
echo "  • Monitor resources: pm2 monit"
echo "  • Detailed status: pm2 show green-permit-api"
echo "  • Restart app: pm2 restart green-permit-api"
echo ""
