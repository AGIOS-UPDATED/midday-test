#!/bin/bash

# Update system
sudo yum update -y

# Install required tools
sudo yum install -y git docker

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PM2 globally
sudo npm install -p pm2@latest -g

# Install Bun
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Start Docker service
sudo service docker start
sudo usermod -a -G docker ec2-user

# Create log directory
sudo mkdir -p /var/log/midday
sudo chown -R ec2-user:ec2-user /var/log/midday

# Clone repository (replace with your repository URL)
git clone https://github.com/your-repo/midday.git /home/ec2-user/midday
cd /home/ec2-user/midday

# Install dependencies
bun install

# Build the project
bun run build --filter=@midday/dashboard...

# Start with PM2
pm2 start apps/dashboard/ecosystem.config.js

# Save PM2 process list and set to start on system startup
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
