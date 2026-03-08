module.exports = {
  apps: [{
    name: 'dotycat-bot',
    script: 'index.js',
    cwd: __dirname,
    watch: false,
    autorestart: true,
    restart_delay: 5000,
    max_restarts: 10,
    env: {
      NODE_ENV: 'production'
    }
  }]
};
