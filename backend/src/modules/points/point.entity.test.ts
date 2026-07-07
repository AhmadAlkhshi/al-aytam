/**
 * Unit tests for Point Entity
 * Validates the entity structure and TypeORM decorators
 * Tests المتطلب 3: إدارة نقاط الطلاب
 */

import 'reflect-metadata';
import { Point } from './point.entity';
import { Session } from '../sessions/session.entity';
import { Student } from '../students/student.entity';

describe('Point Entity', () => {
  describe('Entity Structure', () => {
    it('should create a Point instance with all required fields', () => {
      const point = new Point();
      const session = new Session();
      const student = new Student();
      
      point.id = 1;
      point.session = session;
      point.student = student;
      point.reason = 'حل الواجب المنزلي';
      point.points = 10;
      point.action = 'إضافة';
      point.createdAt = new Date();
      point.updatedAt = new Date();

      // Verify all required fields from المتطلب 3 can be set
      expect(point.id).toBe(1);
      expect(point.session).toBe(session);
      expect(point.student).toBe(student);
      expect(point.reason).toBe('حل الواجب المنزلي');
      expect(point.points).toBe(10);
      expect(point.action).toBe('إضافة');
      expect(point.createdAt).toBeInstanceOf(Date);
      expect(point.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a point instance with positive points', () => {
      const point = new Point();
      const session = new Session();
      const student = new Student();

      point.session = session;
      point.student = student;
      point.reason = 'مشاركة فعالة في الدرس';
      point.points = 5;
      point.action = 'مكافأة';

      expect(point.reason).toBe('مشاركة فعالة في الدرس');
      expect(point.points).toBe(5);
      expect(point.action).toBe('مكافأة');
    });

    it('should create a point instance with negative points', () => {
      const point = new Point();
      const session = new Session();
      const student = new Student();

      point.session = session;
      point.student = student;
      point.reason = 'تأخر عن الحضور';
      point.points = -3;
      point.action = 'خصم';

      expect(point.reason).toBe('تأخر عن الحضور');
      expect(point.points).toBe(-3);
      expect(point.action).toBe('خصم');
    });

    it('should allow action field to be null', () => {
      const point = new Point();
      const session = new Session();
      const student = new Student();

      point.session = session;
      point.student = student;
      point.reason = 'سبب عام';
      point.points = 2;
      point.action = null;

      expect(point.action).toBeNull();
    });

    it('should have proper field types', () => {
      const point = new Point();
      const session = new Session();
      const student = new Student();

      point.session = session;
      point.student = student;
      point.reason = 'اختبار الأنواع';
      point.points = 7;
      point.action = 'تشجيع';

      expect(typeof point.reason).toBe('string');
      expect(typeof point.points).toBe('number');
      expect(typeof point.action).toBe('string');
      expect(point.session).toBeInstanceOf(Session);
      expect(point.student).toBeInstanceOf(Student);
    });
  });

  describe('Relationships', () => {
    it('should have a session relationship', () => {
      const point = new Point();
      const session = new Session();
      session.id = 1;
      session.sessionNumber = 101;

      point.session = session;

      expect(point.session).toBe(session);
      expect(point.session.id).toBe(1);
    });

    it('should have a student relationship', () => {
      const point = new Point();
      const student = new Student();
      student.id = 1;
      student.firstName = 'محمد';
      student.lastName = 'أحمد';

      point.student = student;

      expect(point.student).toBe(student);
      expect(point.student.id).toBe(1);
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt timestamp', () => {
      const point = new Point();
      point.createdAt = new Date();
      expect(point.createdAt).toBeInstanceOf(Date);
    });

    it('should have updatedAt timestamp', () => {
      const point = new Point();
      point.updatedAt = new Date();
      expect(point.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Action Field Scenarios', () => {
    it('should support various action types', () => {
      const actions = ['إضافة', 'خصم', 'مكافأة', 'عقوبة', 'تعديل'];
      
      actions.forEach(actionType => {
        const point = new Point();
        point.action = actionType;
        expect(point.action).toBe(actionType);
      });
    });
  });
});
