# TypeORM Database Configuration

## Overview

This document describes the TypeORM database configuration for the Student Management System backend. The configuration follows the technical design specifications and implements best practices for PostgreSQL connection management.

## Configuration File

**Location**: `backend/src/config/database.ts`

## Features

### 1. Environment-Based Configuration

The database configuration reads all connection parameters from environment variables:

```typescript
{
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'student_management_system',
}
```

### 2. Connection Pooling

Connection pooling is configured with optimal settings as per the design document:

- **Max Connections**: 20 (maximum number of connections in the pool)
- **Min Connections**: 5 (minimum number of connections to maintain)
- **Idle Timeout**: 30 seconds (closes idle connections)
- **Connection Timeout**: 2 seconds (timeout for acquiring a connection)

```typescript
extra: {
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}
```

### 3. Entity and Migration Management

- **Entities**: Automatically loaded from `src/modules/**/*.entity{.ts,.js}`
- **Migrations**: Loaded from `src/database/migrations/*{.ts,.js}`
- **Synchronize**: Enabled in development, disabled in production (for safety)

### 4. Logging

Intelligent logging based on environment:

- **Development**: Logs queries, errors, and warnings
- **Production**: Only logs errors

### 5. Error Handling

Comprehensive error handling with helpful error messages:

- Connection refused errors
- Authentication failures
- Missing database errors
- Detailed error logging with Winston

### 6. Graceful Shutdown

The configuration includes utilities for graceful database connection management:

- `initializeDatabase()`: Initialize connection with error handling
- `closeDatabase()`: Close connection gracefully
- `isDatabaseConnected()`: Check connection status

## Environment Variables

Create a `.env` file in the `backend/` directory based on `.env.example`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=student_management_system
```

## Usage

### Initialize Database Connection

```typescript
import { initializeDatabase } from './config/database';

async function startApp() {
  try {
    await initializeDatabase();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
}
```

### Close Database Connection

```typescript
import { closeDatabase } from './config/database';

async function shutdown() {
  try {
    await closeDatabase();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database:', error);
  }
}
```

### Check Connection Status

```typescript
import { isDatabaseConnected } from './config/database';

const isConnected = isDatabaseConnected();
console.log(`Database connected: ${isConnected}`);
```

## Database Setup

Before running the application, ensure PostgreSQL is installed and running:

### 1. Install PostgreSQL

- Download from: https://www.postgresql.org/download/
- Or use Docker: `docker-compose up -d` (if using the provided `docker-compose.yml`)

### 2. Create Database

Run the setup script:

```bash
# Windows
cd backend/scripts
./setup-database.ps1

# Linux/Mac
cd backend/scripts
./setup-database.sh
```

Or manually create the database:

```sql
CREATE DATABASE student_management_system;
```

### 3. Configure Environment

Copy the example environment file and update with your credentials:

```bash
cp backend/.env.example backend/.env
```

### 4. Run Migrations

```bash
cd backend
npm run migrate
```

## Connection Pool Monitoring

The connection pool is automatically managed by TypeORM. To monitor pool usage:

1. Enable logging in development mode
2. Check logs for connection acquisition messages
3. Monitor query execution times (queries > 30s are logged)

## Troubleshooting

### Error: ECONNREFUSED

**Cause**: PostgreSQL is not running or not accessible

**Solution**:
- Verify PostgreSQL is running: `pg_isready`
- Check connection details in `.env` file
- Ensure firewall allows connections on port 5432

### Error: password authentication failed

**Cause**: Incorrect database credentials

**Solution**:
- Verify username and password in `.env` file
- Check PostgreSQL user permissions
- Reset password if needed

### Error: database does not exist

**Cause**: Database hasn't been created yet

**Solution**:
- Run the database setup script
- Or manually create the database: `CREATE DATABASE student_management_system;`

### Error: Connection pool exhausted

**Cause**: Too many concurrent database operations

**Solution**:
- Increase `max` connections in pool configuration
- Optimize queries to reduce execution time
- Check for connection leaks in code

## Best Practices

1. **Always use environment variables** for sensitive configuration
2. **Never commit `.env` files** to version control
3. **Use migrations** for schema changes instead of synchronize in production
4. **Monitor connection pool usage** to prevent exhaustion
5. **Close connections gracefully** on application shutdown
6. **Use transactions** for operations that modify multiple tables
7. **Enable logging in development** to debug query issues

## Design Compliance

This configuration implements the following requirements from the design document:

- ✓ PostgreSQL 14+ as the database (Section: Database Architecture)
- ✓ Connection pooling with max 20 connections (Section: Database Architecture)
- ✓ TypeORM for database management (Section: Overview)
- ✓ Environment-based configuration (Section: Configuration)
- ✓ Proper error handling and logging (Section: Error Handling)
- ✓ Graceful shutdown support (Section: Server Management)

## Related Files

- `backend/src/config/database.ts` - Main configuration file
- `backend/src/server.ts` - Server initialization with database connection
- `backend/.env.example` - Environment variables template
- `backend/scripts/setup-database.sql` - Database setup script
- `backend/scripts/docker-compose.yml` - Docker configuration for PostgreSQL

## Testing

Run the database configuration tests:

```bash
npm test -- database.test.ts
```

## Further Reading

- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Connection Pooling](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- [Node.js pg Module](https://node-postgres.com/)
