module.exports = {
  apps: [
    {
      name: 'midday-dashboard',
      script: 'bun',
      args: 'run start',
      cwd: './apps/dashboard',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/midday/dashboard-error.log',
      out_file: '/var/log/midday/dashboard-out.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'midday-api',
      script: 'bun',
      args: 'run start',
      cwd: './apps/api',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: '/var/log/midday/api-error.log',
      out_file: '/var/log/midday/api-out.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'midday-website',
      script: 'bun',
      args: 'run start',
      cwd: './apps/website',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      },
      error_file: '/var/log/midday/website-error.log',
      out_file: '/var/log/midday/website-out.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'midday-engine',
      script: 'bun',
      args: 'run start',
      cwd: './apps/engine',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3004
      },
      error_file: '/var/log/midday/engine-error.log',
      out_file: '/var/log/midday/engine-out.log',
      merge_logs: true,
      time: true,
    }
  ]
}
