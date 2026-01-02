#!/bin/bash
# ==============================================================================
# COPY AND PASTE THIS INTO CPANEL TERMINAL
# ==============================================================================
# This will fix the officer_code error in one go
# ==============================================================================

echo "🚀 Starting Production Fix..."
echo ""

# Step 1: Navigate to project
echo "📂 Step 1: Navigating to project directory..."
cd ~/green-permit-api || { echo "❌ Project directory not found!"; exit 1; }
pwd
echo ""

# Step 2: Pull latest code
echo "📥 Step 2: Pulling latest code from GitHub..."
git pull origin main
echo ""

# Step 3: Check which fix script to use
if [ -f "scripts/fix-officer-code-simple.js" ]; then
    echo "✅ Found simplified fix script"
    echo "🔧 Step 3: Running database migration..."
    node scripts/fix-officer-code-simple.js
else
    echo "⚠️  Simplified script not found, using original..."
    node scripts/add-officer-code-column.js
fi
echo ""

# Step 4: Check PM2 status
echo "📊 Step 4: Checking PM2 status..."
pm2 list
echo ""

# Step 5: Restart application
echo "🔄 Step 5: Restarting application..."
echo "Available options:"
echo "  1. pm2 restart all          (restarts all apps)"
echo "  2. pm2 start ecosystem.config.js  (if app not running)"
echo "  3. pm2 restart <app-name>   (specific app)"
echo ""
echo "Choose option (1/2/3) or press Enter for option 1:"
read -t 10 choice || choice="1"

case $choice in
    2)
        echo "Starting with ecosystem.config.js..."
        pm2 start ecosystem.config.js
        ;;
    3)
        echo "Enter app name:"
        read appname
        pm2 restart "$appname"
        ;;
    *)
        echo "Restarting all..."
        pm2 restart all
        ;;
esac
echo ""

# Step 6: Show logs
echo "📋 Step 6: Checking logs..."
pm2 logs --lines 20 --nostream
echo ""

# Step 7: Final status
echo "✨ Fix complete! Current status:"
pm2 list
echo ""

echo "🎯 Next steps:"
echo "   1. Test API: curl http://localhost:YOUR_PORT/api/v1/admin/officers"
echo "   2. Check frontend: http://localhost:8081/lga/officers"
echo "   3. Try creating a new officer"
echo ""
echo "📚 If you still have issues, check:"
echo "   - PM2_FIX_GUIDE.md"
echo "   - CPANEL_UPDATE_GUIDE.md"
echo ""
echo "✅ Done! 🎉"
