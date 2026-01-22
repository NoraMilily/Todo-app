// Конфигурация PM2 для управления процессом Next.js
// Установите PM2: npm install -g pm2
// Запуск: pm2 start ecosystem.config.js
// Просмотр: pm2 list
// Логи: pm2 logs todo-app

module.exports = {
  apps: [
    {
      name: 'todo-app',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
