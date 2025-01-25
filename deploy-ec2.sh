#!/bin/bash

# Make script executable with: chmod +x deploy-ec2.sh

# Create necessary directories
sudo mkdir -p /var/www/uploads
sudo mkdir -p /var/log/midday

# Set proper permissions
sudo chown -R ec2-user:ec2-user /var/www/uploads
sudo chown -R ec2-user:ec2-user /var/log/midday

# Install bun if not already installed
curl -fsSL https://bun.sh/install | bash

# Install PM2 globally
npm install -g pm2

# Navigate to project directory
cd /path/to/your/project

# Install dependencies
bun install

# Build the project
bun run build:dashboard

# Start the application using PM2
pm2 start ecosystem.config.js
