#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# Green Permit API - Namecheap Deployment Script
# ═══════════════════════════════════════════════════════════════
# This script automates the deployment to Namecheap shared hosting
# Usage: ./deploy-to-namecheap.sh
# ═══════════════════════════════════════════════════════════════

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Server configuration
SERVER_IP="192.64.117.46"
SSH_USER="ggtlnplz"
SSH_PORT="21098"
APP_DIR="green-permit-api"
REPO_URL="https://github.com/SHEYICROWN01/green_permit_api.git"

# Functions
print_header() {
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  GREEN PERMIT API - NAMECHEAP DEPLOYMENT                      ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${GREEN}▶ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Main deployment
main() {
    print_header
    
    print_info "Target Server: ${SSH_USER}@${SERVER_IP}:${SSH_PORT}"
    print_info "Repository: ${REPO_URL}"
    echo ""
    
    # Confirm deployment
    echo -e "${YELLOW}This will deploy your API to Namecheap production server.${NC}"
    echo -e "${YELLOW}Make sure you have:${NC}"
    echo "  • SSH access configured"
    echo "  • Database created in cPanel"
    echo "  • Environment variables prepared"
    echo ""
    read -p "Continue with deployment? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_error "Deployment cancelled"
        exit 1
    fi
    
    echo ""
    print_step "Step 1: Testing SSH Connection"
    ssh -p $SSH_PORT -o ConnectTimeout=10 ${SSH_USER}@${SERVER_IP} "echo 'SSH connection successful'" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        print_success "SSH connection successful"
    else
        print_error "SSH connection failed. Please check your credentials."
        exit 1
    fi
    
    echo ""
    print_step "Step 2: Deploying Application"
    
    # Create deployment commands
    DEPLOY_COMMANDS=$(cat <<'EOF'
#!/bin/bash

echo "═══════════════════════════════════════════════"
echo "DEPLOYING GREEN PERMIT API"
echo "═══════════════════════════════════════════════"
echo ""

# Check if Node.js is installed
echo "▶ Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not found. Installing..."
    
    # Try to install via NVM
    if command -v nvm &> /dev/null; then
        nvm install 18
        nvm use 18
        nvm alias default 18
    else
        echo "⚠ NVM not found. Please install Node.js manually or contact support."
        exit 1
    fi
else
    echo "✓ Node.js $(node --version) found"
fi

# Check if PM2 is installed
echo "▶ Checking PM2 installation..."
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
else
    echo "✓ PM2 $(pm2 --version) found"
fi

# Navigate to home directory
cd ~

# Clone or update repository
if [ -d "green-permit-api" ]; then
    echo "▶ Updating existing repository..."
    cd green-permit-api
    git pull origin main
else
    echo "▶ Cloning repository..."
    git clone https://github.com/SHEYICROWN01/green_permit_api.git green-permit-api
    cd green-permit-api
fi

# Install dependencies
echo "▶ Installing dependencies..."
npm install --production

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠ .env file not found!"
    echo "Please create .env file with your configuration."
    echo ""
    echo "Run this command to create from template:"
    echo "cp .env.example .env"
    echo "nano .env"
    echo ""
    exit 1
fi

# Start or restart with PM2
echo "▶ Starting application with PM2..."
if pm2 list | grep -q "green-permit-api"; then
    echo "Restarting existing application..."
    pm2 restart green-permit-api
else
    echo "Starting new application..."
    pm2 start ecosystem.config.js --env production
    pm2 save
fi

# Show status
echo ""
echo "═══════════════════════════════════════════════"
echo "DEPLOYMENT COMPLETE"
echo "═══════════════════════════════════════════════"
echo ""
pm2 status
echo ""
echo "✓ Application deployed successfully!"
echo ""
echo "View logs: pm2 logs green-permit-api"
echo "Check status: pm2 status"
echo "Restart: pm2 restart green-permit-api"
echo ""
EOF
)
    
    # Execute deployment on server
    ssh -p $SSH_PORT ${SSH_USER}@${SERVER_IP} "bash -s" <<< "$DEPLOY_COMMANDS"
    
    if [ $? -eq 0 ]; then
        echo ""
        print_success "Deployment completed successfully!"
        echo ""
        print_info "Your API should now be running on the server"
        print_info "SSH into server to check: ssh -p ${SSH_PORT} ${SSH_USER}@${SERVER_IP}"
        print_info "Then run: pm2 status"
    else
        print_error "Deployment failed. Check the error messages above."
        exit 1
    fi
    
    echo ""
    print_step "Step 3: Post-Deployment Instructions"
    echo ""
    echo "Next steps:"
    echo "1. SSH into your server: ssh -p ${SSH_PORT} ${SSH_USER}@${SERVER_IP}"
    echo "2. Navigate to app: cd ~/green-permit-api"
    echo "3. Configure .env file if not done: nano .env"
    echo "4. Create super admin: node scripts/create-superadmin.js"
    echo "5. Test API: curl http://localhost:3000/health"
    echo "6. Check logs: pm2 logs green-permit-api"
    echo ""
    
    print_success "Deployment script completed!"
}

# Run main function
main
