# EC2 Continuous Deployment Guide

## Initial Setup

1. Launch an EC2 instance:
   - Amazon Linux 2023 AMI
   - t2.medium or larger (for building)
   - At least 30GB storage
   - Security group with ports 22 (SSH) and 3000 (App) open

2. SSH into your instance:
```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

3. Make setup script executable and run it:
```bash
chmod +x ec2-setup.sh
./ec2-setup.sh
```

## Continuous Deployment Setup

1. Create a deployment key for your repository:
```bash
ssh-keygen -t ed25519 -C "ec2-deploy"
```

2. Add the public key to your repository's deploy keys

3. Create a deployment script:
```bash
#!/bin/bash
cd /home/ec2-user/midday

# Pull latest changes
git pull

# Install dependencies
bun install

# Build the project
bun run build --filter=@midday/dashboard...

# Restart the application
pm2 restart midday-dashboard
```

4. Set up a cron job for automatic deployment:
```bash
crontab -e
```

Add this line to check for updates every 5 minutes:
```
*/5 * * * * /home/ec2-user/deploy.sh >> /var/log/midday/deploy.log 2>&1
```

## Managing the Application

### View logs:
```bash
# View all logs
pm2 logs

# View specific app logs
pm2 logs midday-dashboard

# View error logs
tail -f /var/log/midday/error.log

# View output logs
tail -f /var/log/midday/out.log
```

### Monitor the application:
```bash
pm2 monit
```

### Common PM2 commands:
```bash
# List all processes
pm2 list

# Restart application
pm2 restart midday-dashboard

# Stop application
pm2 stop midday-dashboard

# Start application
pm2 start midday-dashboard

# View process details
pm2 show midday-dashboard
```

## Environment Variables

Create a .env file in /home/ec2-user/midday/apps/dashboard:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# Add other required environment variables
```

## Monitoring and Alerts

1. Set up CloudWatch agent:
```bash
sudo yum install -y amazon-cloudwatch-agent
```

2. Configure CloudWatch to monitor:
- CPU usage
- Memory usage
- Disk space
- Application logs

3. Set up CloudWatch alarms for:
- High CPU usage (> 80%)
- High memory usage (> 80%)
- Application errors in logs

## Backup and Recovery

1. Create an AMI of your EC2 instance regularly

2. Set up automatic backups:
```bash
# Create a backup script
#!/bin/bash
timestamp=$(date +%Y%m%d_%H%M%S)
backup_dir="/backup/midday_$timestamp"

# Create backup directory
mkdir -p $backup_dir

# Backup application files
cp -r /home/ec2-user/midday $backup_dir/

# Backup environment variables
cp /home/ec2-user/midday/apps/dashboard/.env $backup_dir/

# Backup PM2 process list
pm2 save
cp ~/.pm2/dump.pm2 $backup_dir/

# Compress backup
tar -czf "$backup_dir.tar.gz" $backup_dir
rm -rf $backup_dir

# Upload to S3 (optional)
aws s3 cp "$backup_dir.tar.gz" s3://your-bucket/backups/
```

## Security Best Practices

1. Keep the system updated:
```bash
sudo yum update -y
```

2. Use AWS IAM roles instead of access keys

3. Regularly rotate SSH keys and credentials

4. Monitor security groups and network access

5. Enable AWS GuardDuty for threat detection

## Troubleshooting

If the application crashes:

1. Check application logs:
```bash
pm2 logs midday-dashboard --lines 1000
```

2. Check system resources:
```bash
top
df -h
free -m
```

3. Restart the application:
```bash
pm2 restart midday-dashboard
```

4. If problems persist:
```bash
# Stop the application
pm2 stop midday-dashboard

# Clear PM2 logs
pm2 flush

# Remove PM2 process
pm2 delete midday-dashboard

# Start fresh
pm2 start apps/dashboard/ecosystem.config.js
```
