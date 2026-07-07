import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { logger } from '../shared/utils/logger';

// Load environment variables
dotenv.config();

/**
 * TypeORM DataSource Configuration
 * 
 * This configuration follows the technical design specifications:
 * - PostgreSQL 14+ as the database
 * - Connection pooling with max 20 connections
 * - Proper error handling and logging
 * - Environment-based configuration
 * - Supports DATABASE_URL (injected by Render) or individual DB_* vars
 */

// If DATABASE_URL is set (e.g., on Render), use it; otherwise use individual vars
const databaseUrl = process.env.DATABASE_URL;

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',

  // Use DATABASE_URL when available (Render injects this automatically)
  ...(databaseUrl
    ? { url: databaseUrl, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'student_management_system',
      }),

  // Entity and migration paths
  entities: [__dirname + '/../modules/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  
  // Synchronize should be false in production to prevent data loss
  // Use migrations instead for schema changes
  synchronize: process.env.NODE_ENV === 'development',
  
  // Enable logging in development for debugging
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  
  // Connection pool configuration (max 20 as per design document)
  extra: {
    max: 20,                      // Maximum number of connections in pool
    min: 5,                       // Minimum number of connections to maintain
    idleTimeoutMillis: 30000,     // Close idle connections after 30 seconds
    connectionTimeoutMillis: 2000, // Timeout for acquiring connection (2 seconds)
  },
  
  // Additional options for better reliability
  maxQueryExecutionTime: 30000,    // Log queries that take longer than 30 seconds
  connectTimeoutMS: 10000,         // Initial connection timeout (10 seconds)
};

/**
 * Create and export the DataSource instance
 */
const AppDataSource = new DataSource(dataSourceOptions);

/**
 * Initialize database connection with proper error handling
 * 
 * @returns Promise<DataSource> - Initialized data source
 * @throws Error if connection fails
 */
export const initializeDatabase = async (): Promise<DataSource> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('✓ Database connection established successfully');
      logger.info(`✓ Connected to PostgreSQL at ${process.env.DB_HOST}:${process.env.DB_PORT}`);
      logger.info(`✓ Database: ${process.env.DB_NAME}`);
      logger.info(`✓ Connection pool: ${dataSourceOptions.extra?.max} max connections`);
    }
    return AppDataSource;
  } catch (error) {
    logger.error('✗ Failed to connect to database:', error);
    
    // Provide helpful error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        logger.error('→ Make sure PostgreSQL is running and accessible');
        logger.error(`→ Check connection details: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
      } else if (error.message.includes('password authentication failed')) {
        logger.error('→ Check database credentials in .env file');
      } else if (error.message.includes('database') && error.message.includes('does not exist')) {
        logger.error('→ Database does not exist. Run setup script to create it.');
      }
    }
    
    throw error;
  }
};

/**
 * Close database connection gracefully
 * 
 * @returns Promise<void>
 */
export const closeDatabase = async (): Promise<void> => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('✓ Database connection closed successfully');
    }
  } catch (error) {
    logger.error('✗ Error closing database connection:', error);
    throw error;
  }
};

/**
 * Get the current database connection status
 * 
 * @returns boolean - true if connected, false otherwise
 */
export const isDatabaseConnected = (): boolean => {
  return AppDataSource.isInitialized;
};

// Export the DataSource as default for backward compatibility
export default AppDataSource;
