import { Activity } from './activity.entity';
import { Session } from '../sessions/session.entity';
import { Student } from '../students/student.entity';
import { DataSource } from 'typeorm';

describe('Activity Entity', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'student_management_test',
      entities: [Activity, Session, Student],
      synchronize: true,
      dropSchema: true,
    });

    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  describe('Entity Structure', () => {
    it('should have all required fields', () => {
      const activity = new Activity();
      
      expect(activity).toHaveProperty('id');
      expect(activity).toHaveProperty('session');
      expect(activity).toHaveProperty('student');
      expect(activity).toHaveProperty('activityType');
      expect(activity).toHaveProperty('count');
      expect(activity).toHaveProperty('createdAt');
      expect(activity).toHaveProperty('updatedAt');
    });

    it('should create activity with predefined activity types', async () => {
      const sessionRepo = dataSource.getRepository(Session);
      const studentRepo = dataSource.getRepository(Student);
      const activityRepo = dataSource.getRepository(Activity);

      // Create session
      const session = await sessionRepo.save({
        sessionNumber: 1,
        sessionDate: new Date('2024-01-01'),
      });

      // Create student
      const student = await studentRepo.save({
        firstName: 'أحمد',
        lastName: 'محمد',
        guardianName: 'محمد علي',
        age: 15,
      });

      // Create activity with predefined type
      const activity = await activityRepo.save({
        session,
        student,
        activityType: 'ضغط',
        count: 20,
      });

      expect(activity.id).toBeDefined();
      expect(activity.activityType).toBe('ضغط');
      expect(activity.count).toBe(20);
      expect(activity.createdAt).toBeDefined();
      expect(activity.updatedAt).toBeDefined();
    });

    it('should create activity with custom activity type', async () => {
      const sessionRepo = dataSource.getRepository(Session);
      const studentRepo = dataSource.getRepository(Student);
      const activityRepo = dataSource.getRepository(Activity);

      // Get existing session and student
      const session = await sessionRepo.findOne({ where: { sessionNumber: 1 } });
      const student = await studentRepo.findOne({ where: { firstName: 'أحمد' } });

      // Create activity with custom type
      const activity = activityRepo.create({
        session: session!,
        student: student!,
        activityType: 'قفز حر',
        count: 15,
      });
      const savedActivity = await activityRepo.save(activity);

      expect(savedActivity.id).toBeDefined();
      expect(savedActivity.activityType).toBe('قفز حر');
      expect(savedActivity.count).toBe(15);
    });

    it('should load relationships eagerly', async () => {
      const activityRepo = dataSource.getRepository(Activity);

      const activity = await activityRepo.findOne({
        where: { activityType: 'ضغط' },
      });

      expect(activity).toBeDefined();
      expect(activity!.session).toBeDefined();
      expect(activity!.session.sessionNumber).toBe(1);
      expect(activity!.student).toBeDefined();
      expect(activity!.student.firstName).toBe('أحمد');
    });

    it('should have bidirectional relationship with Session', async () => {
      const sessionRepo = dataSource.getRepository(Session);

      const session = await sessionRepo.findOne({
        where: { sessionNumber: 1 },
        relations: ['activities'],
      });

      expect(session).toBeDefined();
      expect(session!.activities).toBeDefined();
      expect(session!.activities.length).toBeGreaterThan(0);
    });

    it('should have bidirectional relationship with Student', async () => {
      const studentRepo = dataSource.getRepository(Student);

      const student = await studentRepo.findOne({
        where: { firstName: 'أحمد' },
        relations: ['activities'],
      });

      expect(student).toBeDefined();
      expect(student!.activities).toBeDefined();
      expect(student!.activities.length).toBeGreaterThan(0);
    });

    it('should support all three predefined activity types', async () => {
      const sessionRepo = dataSource.getRepository(Session);
      const studentRepo = dataSource.getRepository(Student);
      const activityRepo = dataSource.getRepository(Activity);

      const session = await sessionRepo.findOne({ where: { sessionNumber: 1 } });
      const student = await studentRepo.findOne({ where: { firstName: 'أحمد' } });

      const activityTypes = ['ضغط', 'ثابت', 'تحمل'];

      for (const type of activityTypes) {
        const activity = activityRepo.create({
          session: session!,
          student: student!,
          activityType: type,
          count: 10,
        });
        const savedActivity = await activityRepo.save(activity);

        expect(savedActivity.activityType).toBe(type);
      }
    });

    it('should cascade delete when session is deleted', async () => {
      const sessionRepo = dataSource.getRepository(Session);
      const activityRepo = dataSource.getRepository(Activity);

      // Create a new session
      const session = await sessionRepo.save({
        sessionNumber: 2,
        sessionDate: new Date('2024-01-02'),
      });

      const student = await dataSource.getRepository(Student).findOne({
        where: { firstName: 'أحمد' },
      });

      // Create activities for this session
      const activity = activityRepo.create({
        session,
        student: student!,
        activityType: 'ضغط',
        count: 5,
      });
      await activityRepo.save(activity);

      const activitiesBefore = await activityRepo.count({
        where: { session: { id: session.id } },
      });
      expect(activitiesBefore).toBe(1);

      // Delete the session
      await sessionRepo.remove(session);

      // Verify activities are deleted (cascade)
      const activitiesAfter = await activityRepo.count({
        where: { session: { id: session.id } },
      });
      expect(activitiesAfter).toBe(0);
    });
  });
});
