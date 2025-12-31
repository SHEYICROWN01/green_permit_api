module.exports = {
    apps: [
        {
            name: 'green-permit-api',
            script: './src/server.js',
            instances: process.env.PM2_INSTANCES || 'max', // Use all CPU cores or specify number
            exec_mode: 'cluster', // Enable cluster mode for load balancing

            // Environment variables
            env: {
                NODE_ENV: 'development',
                PORT: 3000,
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000,
            },

            // Restart policy
            autorestart: true,
            watch: false, // Disable in production
            max_memory_restart: '1G', // Restart if memory exceeds 1GB
            restart_delay: 4000, // Wait 4s before restart

            // Error handling
            min_uptime: '10s', // Minimum uptime before considering stable
            max_restarts: 10, // Max restarts within 1 minute before stopping

            // Logging
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            error_file: './logs/pm2-error.log',
            out_file: './logs/pm2-out.log',
            merge_logs: true,
            log_file: './logs/pm2-combined.log',

            // Advanced features
            kill_timeout: 5000, // Time to wait before force kill (ms)
            wait_ready: true, // Wait for app to be ready before considering online
            listen_timeout: 10000, // Time to wait for listen event (ms)
            shutdown_with_message: true, // Graceful shutdown

            // Monitoring
            pmx: true,
            instance_var: 'INSTANCE_ID',

            // Cron restart (optional - restart daily at 2 AM)
            cron_restart: '0 2 * * *',

            // Source map support (for better error traces)
            source_map_support: true,

            // Node.js args
            node_args: '--max-old-space-size=2048', // Increase heap size to 2GB
        },
    ],

    // Deployment configuration (optional)
    deploy: {
        production: {
            user: 'ubuntu', // SSH user
            host: ['your-production-server.com'], // Server hostname or IP
            ref: 'origin/main', // Git branch
            repo: 'git@github.com:your-username/green-permit-api.git', // Git repository
            path: '/var/www/green-permit-api', // Deploy path on server
            'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
            'pre-setup': 'npm install pm2 -g',
            env: {
                NODE_ENV: 'production',
            },
        },
        staging: {
            user: 'ubuntu',
            host: ['your-staging-server.com'],
            ref: 'origin/develop',
            repo: 'git@github.com:your-username/green-permit-api.git',
            path: '/var/www/green-permit-api-staging',
            'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging',
            env: {
                NODE_ENV: 'staging',
            },
        },
    },
};
