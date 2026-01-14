import app from './app';
import { database } from './config/database';
import { logSystemEvent, testLogger } from './utils/logger';
import environment from './config/environment';

async function startServer() {
  try {
    // Test database connection
    const dbConnected = await database.testConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }

    // Test logger
    if (environment.get('isDevelopment')) {
      testLogger();
    }

    // Start the Express server
    app.start();

  } catch (error) {
    logSystemEvent('Failed to start server', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logSystemEvent('Unhandled Promise Rejection', 'error', {
    reason,
    promise,
  });
  
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logSystemEvent('Uncaught Exception', 'error', {
    error: error.message,
    stack: error.stack,
  });
  
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();