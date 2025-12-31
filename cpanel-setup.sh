#!/bin/bash

##############################################
# Quick Setup Script for cPanel Deployment
# Run this AFTER uploading to cPanel via SSH
##############################################

echo "======================================"
echo "Green Permit API - cPanel Setup"
echo "======================================"
echo ""

# Check if running on cPanel
if [ ! -f ~/.cpanel/username ]; then
    echo "⚠️  Warning: This script is designed for cPanel hosting"
    echo "Continue anyway? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Get current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📁 Current directory: $SCRIPT_DIR"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo ""
    echo "Please create .env file with your configuration:"
    echo "  cp .env.production .env"
    echo "  nano .env"
    echo ""
    exit 1
fi

echo "✅ Found .env file"

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Node.js version: $NODE_VERSION"
else
    echo "❌ Node.js not found!"
    echo "Please enable Node.js in cPanel"
    exit 1
fi

# Check npm
NPM_VERSION=$(npm --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ npm version: $NPM_VERSION"
else
    echo "❌ npm not found!"
    exit 1
fi

echo ""
echo "📦 Installing dependencies..."
echo "This may take 5-10 minutes..."
echo ""

# Install dependencies
npm ci --only=production

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🗄️  Setting up database..."

# Check if database credentials are in .env
if grep -q "DB_NAME=" .env && grep -q "DB_USER=" .env; then
    echo "✅ Database credentials found in .env"
    
    # Ask if user wants to run migrations
    echo ""
    echo "Do you want to run database migrations? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "Running migrations..."
        node scripts/migrate.js
        
        if [ $? -eq 0 ]; then
            echo "✅ Migrations completed successfully"
        else
            echo "⚠️  Migration failed - you may need to import schema.sql manually"
        fi
    fi
else
    echo "⚠️  Database credentials not found in .env"
    echo "Please configure DB_NAME, DB_USER, DB_PASSWORD in .env"
fi

echo ""
echo "📝 Creating necessary directories..."

# Create logs directory if not exists
mkdir -p logs
mkdir -p backups
mkdir -p tmp

echo "✅ Directories created"

echo ""
echo "🔧 Setting permissions..."

# Set proper permissions
chmod -R 755 .
chmod 644 .env
chmod 755 scripts/*.js

echo "✅ Permissions set"

echo ""
echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Go to cPanel → Setup Node.js App"
echo "2. Create/Edit your application:"
echo "   - Application Root: $(basename $SCRIPT_DIR)"
echo "   - Application Startup File: src/server.js"
echo "   - Node.js Version: 18.x (or highest available)"
echo ""
echo "3. Start the application"
echo ""
echo "4. Test your API:"
echo "   curl https://your-domain.com/health"
echo ""
echo "📚 For detailed instructions, see:"
echo "   NAMECHEAP_DEPLOYMENT.md"
echo ""
