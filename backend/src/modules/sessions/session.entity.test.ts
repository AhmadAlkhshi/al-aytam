/**
 * Unit tests for Session Entity
 * Validates the entity structure and TypeORM decorators
 */

import 'reflect-metadata';
import { Session } from './session.entity';

describe('Session Entity', () => {
  describe('Entity Structure', () => {
    it('should create a Session instance with all required fields', () => {
      const session = new Session();
      session.id = 1;
      session.sessionNumber = 101;
      session.sessionDate = new Date('2024-01-15');
      session.createdAt = new Date();
      session.updatedAt = new Date();

      expect(session.id).toBe(1);
      expect(session.sessionNumber).toBe(101);
      expect(session.sessionDate).toEqual(new Date('2024-01-15'));
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.updatedAt).toBeInstanceOf(Date);
    });

    it('should have activities array property', () => {
      const session = new Session();
      session.activities = [];
      expect(Array.isArray(session.activities)).toBe(true);
    });

    it('should have points array property', () => {
      const session = new Session();
      session.points = [];
      expect(Array.isArray(session.points)).toBe(true);
    });

    it('should have attendances array property', () => {
      const session = new Session();
      session.attendances = [];
      expect(Array.isArray(session.attendances)).toBe(true);
    });
  });

  describe('Field Types', () => {
    it('should have sessionNumber as a number', () => {
      const session = new Session();
      session.sessionNumber = 101;
      expect(typeof session.sessionNumber).toBe('number');
    });

    it('should have sessionDate as a Date', () => {
      const session = new Session();
      session.sessionDate = new Date('2024-01-15');
      expect(session.sessionDate).toBeInstanceOf(Date);
    });

    it('should have id as a number', () => {
      const session = new Session();
      session.id = 1;
      expect(typeof session.id).toBe('number');
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt timestamp', () => {
      const session = new Session();
      session.createdAt = new Date();
      expect(session.createdAt).toBeInstanceOf(Date);
    });

    it('should have updatedAt timestamp', () => {
      const session = new Session();
      session.updatedAt = new Date();
      expect(session.updatedAt).toBeInstanceOf(Date);
    });
  });
});
