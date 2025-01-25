#!/bin/bash

# Update system packages
sudo yum update -y
sudo yum install -y git gcc-c++ make

# Install Node.js 18.x
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install 18
nvm use 18

# Install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Install PM2 globally
npm install -g pm2

# Create necessary directories
sudo mkdir -p /var/www/midday
sudo mkdir -p /var/log/midday
sudo mkdir -p /var/www/uploads

# Set proper permissions
sudo chown -R ec2-user:ec2-user /var/www/midday
sudo chown -R ec2-user:ec2-user /var/log/midday
sudo chown -R ec2-user:ec2-user /var/www/uploads

# Clone your repository (replace with your repo URL)
cd /var/www/midday
git clone https://github.com/yourusername/midday.git .

# Install dependencies
bun install

# Build all applications
bun run build

# Copy environment files (you'll need to manually add the actual env values)
cp apps/dashboard/.env.example apps/dashboard/.env
cp apps/api/.env.example apps/api/.env

# Start the applications using PM2
pm2 start ecosystem.config.js

# Save PM2 process list and configure to start on system startup
pm2 save
sudo env PATH=$PATH:/home/ec2-user/.nvm/versions/node/v18.x.x/bin /home/ec2-user/.nvm/versions/node/v18.x.x/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user

# Display status
pm2 status
