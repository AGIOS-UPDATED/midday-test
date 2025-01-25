#!/bin/bash

# Navigate to application directory
cd /var/www/midday

# Pull latest changes
git pull

# Install dependencies
bun install

# Build all applications
bun run build

# Restart PM2 processes
pm2 restart ecosystem.config.js

# Display status
pm2 status
