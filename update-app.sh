#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# Green Permit API - Quick Update Script
# ═══════════════════════════════════════════════════════════════
# Use this script for quick updates after pushing code to GitHub
# Usage: ssh to server, then run: ./update-app.sh
# ═══════════════════════════════════════════════════════════════

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  GREEN PERMIT API - QUICK UPDATE                              ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Navigate to app directory
cd ~/green-permit-api || { echo "Error: App directory not found"; exit 1; }

echo -e "${GREEN}▶ Pulling latest changes from GitHub...${NC}"
git pull origin main

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠ Git pull failed. Trying to resolve...${NC}"
    git stash
    git pull origin main
    echo -e "${YELLOW}⚠ Local changes were stashed. Run 'git stash pop' if needed.${NC}"
fi

echo ""
echo -e "${GREEN}▶ Installing/updating dependencies...${NC}"
npm install --production

echo ""
echo -e "${GREEN}▶ Restarting application with PM2...${NC}"
pm2 restart green-permit-api

echo ""
echo -e "${GREEN}▶ Showing application status...${NC}"
pm2 status

echo ""
echo -e "${GREEN}✓ Update complete!${NC}"
echo ""
echo "Useful commands:"
echo "  • View logs: pm2 logs green-permit-api"
echo "  • Monitor: pm2 monit"
echo "  • Full restart: pm2 restart green-permit-api --update-env"
echo ""
