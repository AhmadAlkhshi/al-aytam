import { Student } from './student.entity';

describe('Student Entity', () => {
  describe('Entity Structure', () => {
    it('should create a student instance with all required fields', () => {
      const student = new Student();
      student.id = 1;
      student.firstName = 'أحمد';
      student.lastName = 'محمد';
      student.guardianName = 'محمد علي';
      student.age = 12;
      student.notes = 'طالب متميز';
      student.createdAt = new Date();
      student.updatedAt = new Date();
      
      // Verify all required fields from المتطلب 1 can be set
      expect(student.id).toBe(1);
      expect(student.firstName).toBe('أحمد');
      expect(student.lastName).toBe('محمد');
      expect(student.guardianName).toBe('محمد علي');
      expect(student.age).toBe(12);
      expect(student.notes).toBe('طالب متميز');
      expect(student.createdAt).toBeInstanceOf(Date);
      expect(student.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a student instance with valid data', () => {
      const student = new Student();
      student.firstName = 'أحمد';
      student.lastName = 'محمد';
      student.guardianName = 'محمد علي';
      student.age = 12;
      student.notes = 'طالب متميز';

      expect(student.firstName).toBe('أحمد');
      expect(student.lastName).toBe('محمد');
      expect(student.guardianName).toBe('محمد علي');
      expect(student.age).toBe(12);
      expect(student.notes).toBe('طالب متميز');
    });

    it('should allow notes to be null', () => {
      const student = new Student();
      student.firstName = 'فاطمة';
      student.lastName = 'حسن';
      student.guardianName = 'حسن علي';
      student.age = 10;
      student.notes = null;

      expect(student.notes).toBeNull();
    });

    it('should have proper field types', () => {
      const student = new Student();
      student.firstName = 'سارة';
      student.lastName = 'أحمد';
      student.guardianName = 'أحمد خالد';
      student.age = 11;
      student.notes = 'ملاحظات اختبارية';

      expect(typeof student.firstName).toBe('string');
      expect(typeof student.lastName).toBe('string');
      expect(typeof student.guardianName).toBe('string');
      expect(typeof student.age).toBe('number');
      expect(typeof student.notes).toBe('string');
    });
  });
});
