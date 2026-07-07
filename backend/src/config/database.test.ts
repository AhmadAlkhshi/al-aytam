/**
 * Test file for database configuration
 * This verifies the TypeORM configuration is properly set up
 */

import { dataSourceOptions, isDatabaseConnected } from './database';

describe('Database Configuration', () => {
  describe('dataSourceOptions', () => {
    it('should have correct database type', () => {
      expect(dataSourceOptions.type).toBe('postgres');
    });

    it('should read configuration from environment variables', () => {
      expect(dataSourceOptions.host).toBeDefined();
      expect(dataSourceOptions.port).toBeDefined();
      expect(dataSourceOptions.username).toBeDefined();
      expect(dataSourceOptions.database).toBeDefined();
    });

    it('should have entity paths configured', () => {
      expect(dataSourceOptions.entities).toBeDefined();
      expect(Array.isArray(dataSourceOptions.entities)).toBe(true);
      expect(dataSourceOptions.entities?.length).toBeGreaterThan(0);
    });

    it('should have migrations path configured', () => {
      expect(dataSourceOptions.migrations).toBeDefined();
      expect(Array.isArray(dataSourceOptions.migrations)).toBe(true);
    });

    it('should have connection pool configured with max 20 connections', () => {
      expect(dataSourceOptions.extra).toBeDefined();
      expect(dataSourceOptions.extra?.max).toBe(20);
      expect(dataSourceOptions.extra?.min).toBe(5);
    });

    it('should have proper timeout settings', () => {
      expect(dataSourceOptions.extra?.idleTimeoutMillis).toBe(30000);
      expect(dataSourceOptions.extra?.connectionTimeoutMillis).toBe(2000);
    });

    it('should have logging configured based on environment', () => {
      expect(dataSourceOptions.logging).toBeDefined();
    });
  });

  describe('Connection Status', () => {
    it('should return connection status', () => {
      const isConnected = isDatabaseConnected();
      expect(typeof isConnected).toBe('boolean');
    });
  });
});
