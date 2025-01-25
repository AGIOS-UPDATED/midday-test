module.exports = {
  apps: [{
    name: 'dashboard',
    script: 'bun',
    args: 'run start',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}