import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import * as dotenv from 'dotenv';
import { initializeDatabase, closeDatabase, isDatabaseConnected } from './config/database';
import authRoutes from './modules/auth/auth.routes';
import sessionRoutes from './modules/sessions/session.routes';
import studentRoutes from './modules/students/student.routes';
import activityRoutes from './modules/activities/activity.routes';
import pointRoutes from './modules/points/point.routes';
import attendanceRoutes from './modules/attendances/attendance.routes';
import divisionRoutes from './modules/division/division.routes';
import { errorMiddleware } from './shared/middleware/error.middleware';
import { authenticate } from './shared/middleware/auth.middleware';
import { logger } from './shared/utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
// Public routes (no auth required)
app.use('/api/auth', authRoutes);

// Protected routes (require valid JWT)
app.use('/api/sessions', authenticate, sessionRoutes);
app.use('/api/students', authenticate, studentRoutes);
app.use('/api/activities', authenticate, activityRoutes);
app.use('/api/points', authenticate, pointRoutes);
app.use('/api/attendances', authenticate, attendanceRoutes);
app.use('/api/division', authenticate, divisionRoutes);

// Health check with database status
app.get('/health', (_req, res) => {
  const dbStatus = isDatabaseConnected();
  res.json({ 
    status: dbStatus ? 'OK' : 'DEGRADED',
    database: dbStatus ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString() 
  });
});

// 404 handler for undefined routes (must be before errorMiddleware)
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'المسار المطلوب غير موجود',
    },
  });
});

// Error handling
app.use(errorMiddleware);

/**
 * Start the application server
 */
const startServer = async () => {
  try {
    // Initialize database connection with proper error handling
    await initializeDatabase();
    
    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info('='.repeat(50));
      logger.info(`✓ Server is running on port ${PORT}`);
      logger.info(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`✓ API Base URL: http://localhost:${PORT}/api`);
      logger.info(`✓ Health Check: http://localhost:${PORT}/health`);
      logger.info('='.repeat(50));
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      // Close server to stop accepting new connections
      server.close(async () => {
        logger.info('✓ HTTP server closed');
        
        // Close database connection
        try {
          await closeDatabase();
          logger.info('✓ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('✗ Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds if graceful shutdown fails
      setTimeout(() => {
        logger.error('✗ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Listen for shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (error) {
    logger.error('✗ Failed to start server:', error);
    console.error('✗ STARTUP ERROR:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
