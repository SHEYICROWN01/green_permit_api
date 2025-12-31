const app = require('./app');
const config = require('./config/env.config');
const db = require('./config/database');

const PORT = config.port;
const HOST = config.host;

// Test database connection before starting server
db.testConnection().then((connected) => {
    if (!connected) {
        console.error('⚠️  Warning: Database connection failed. Server will start but database operations may fail.');
    }

    const server = app.listen(PORT, () => {
        console.log(`
  ╔════════════════════════════════════════╗
  ║   Green Permit API Server Started     ║
  ╠════════════════════════════════════════╣
  ║   Environment: ${config.node_env.padEnd(24)}║
  ║   URL: http://${HOST}:${PORT.toString().padEnd(18)}║
  ║   Health: http://${HOST}:${PORT}/health${' '.repeat(6)}║
  ╚════════════════════════════════════════╝
  `);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
        console.log(`\n${signal} received. Starting graceful shutdown...`);

        server.close(async () => {
            console.log('Server closed.');

            // Close database connection pool
            await db.closePool();

            console.log('Process terminating...');
            process.exit(0);
        });

        // Force shutdown after 10 seconds
        setTimeout(() => {
            console.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        gracefulShutdown('unhandledRejection');
    });
});
