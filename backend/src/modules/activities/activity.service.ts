import AppDataSource from '../../config/database';
import { Activity } from './activity.entity';
import { Session } from '../sessions/session.entity';
import { Student } from '../students/student.entity';
import { AppError } from '../../shared/middleware/error.middleware';
import { FindManyOptions } from 'typeorm';

export interface GetActivitiesOptions {
  page?: number;
  limit?: number;
  sessionId?: number;
  studentId?: number;
}

export interface CreateActivityDto {
  session_id: number;
  student_id: number;
  activityType: string;
  count: number;
}

export interface UpdateActivityDto {
  session_id?: number;
  student_id?: number;
  activityType?: string;
  count?: number;
}

export class ActivityService {
  private get repository() {
    return AppDataSource.getRepository(Activity);
  }

  /**
   * Retrieve all activities with optional pagination and filtering.
   *
   * @param options.page      - Page number (1-indexed), default 1
   * @param options.limit     - Records per page, default 20 (0 = no limit)
   * @param options.sessionId - Optional filter by session ID
   * @param options.studentId - Optional filter by student ID
   */
  async getAllActivities(
    options: GetActivitiesOptions = {}
  ): Promise<{ activities: Activity[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, sessionId, studentId } = options;

    try {
      const skip = limit > 0 ? (page - 1) * limit : 0;

      const queryOptions: FindManyOptions<Activity> = {
        order: { id: 'ASC' },
        relations: ['session', 'student'],
        ...(limit > 0 ? { skip, take: limit } : {})
      };

      // Build where clause if filters are provided
      if (sessionId !== undefined && studentId !== undefined) {
        queryOptions.where = {
          session: { id: sessionId },
          student: { id: studentId }
        };
      } else if (sessionId !== undefined) {
        queryOptions.where = { session: { id: sessionId } };
      } else if (studentId !== undefined) {
        queryOptions.where = { student: { id: studentId } };
      }

      const [activities, total] = await this.repository.findAndCount(queryOptions);

      return { activities, total, page, limit };
    } catch (error) {
      throw new AppError('حدث خطأ أثناء جلب النشاطات', 500, 'DB_ERROR');
    }
  }

  /**
   * Create a new activity record.
   *
   * Validates all required fields, verifies the referenced session and student
   * exist, then persists the new activity and returns it with eager-loaded
   * relations (session, student).
   *
   * @param dto - CreateActivityDto
   * @returns The newly created Activity entity
   */
  async createActivity(dto: CreateActivityDto): Promise<Activity> {
    const { session_id, student_id, activityType, count } = dto;

    // Validate session_id
    if (session_id === undefined || session_id === null) {
      throw new AppError('معرف الجلسة مطلوب', 400, 'MISSING_SESSION_ID');
    }
    const parsedSessionId = Number(session_id);
    if (!Number.isInteger(parsedSessionId) || parsedSessionId <= 0) {
      throw new AppError('معرف الجلسة غير صالح', 400, 'INVALID_SESSION_ID');
    }

    // Validate student_id
    if (student_id === undefined || student_id === null) {
      throw new AppError('معرف الطالب مطلوب', 400, 'MISSING_STUDENT_ID');
    }
    const parsedStudentId = Number(student_id);
    if (!Number.isInteger(parsedStudentId) || parsedStudentId <= 0) {
      throw new AppError('معرف الطالب غير صالح', 400, 'INVALID_STUDENT_ID');
    }

    // Validate activityType
    if (!activityType || typeof activityType !== 'string' || activityType.trim().length === 0) {
      throw new AppError('نوع النشاط مطلوب', 400, 'MISSING_ACTIVITY_TYPE');
    }
    if (activityType.trim().length > 50) {
      throw new AppError('نوع النشاط يجب ألا يتجاوز 50 حرفاً', 422, 'INVALID_ACTIVITY_TYPE');
    }

    // Validate count
    if (count === undefined || count === null) {
      throw new AppError('العدد مطلوب', 400, 'MISSING_COUNT');
    }
    const parsedCount = Number(count);
    if (!Number.isInteger(parsedCount) || parsedCount < 0) {
      throw new AppError('العدد يجب أن يكون رقماً صحيحاً لا يقل عن 0', 400, 'INVALID_COUNT');
    }

    try {
      // Verify the session exists
      const sessionRepo = AppDataSource.getRepository(Session);
      const session = await sessionRepo.findOne({ where: { id: parsedSessionId } });
      if (!session) {
        throw new AppError('الجلسة غير موجودة', 404, 'SESSION_NOT_FOUND');
      }

      // Verify the student exists
      const studentRepo = AppDataSource.getRepository(Student);
      const student = await studentRepo.findOne({ where: { id: parsedStudentId } });
      if (!student) {
        throw new AppError('الطالب غير موجود', 404, 'STUDENT_NOT_FOUND');
      }

      // Create and save the activity
      const activity = this.repository.create({
        session,
        student,
        activityType: activityType.trim(),
        count: parsedCount
      });

      const saved = await this.repository.save(activity);

      // Return with relations loaded
      return (await this.repository.findOne({
        where: { id: saved.id },
        relations: ['session', 'student']
      }))!;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('حدث خطأ أثناء إنشاء النشاط', 500, 'DB_ERROR');
    }
  }

  /**
   * Delete an activity by its ID.
   *
   * @param id - The activity's numeric primary key
   * @throws AppError 404 if the activity is not found
   */
  async deleteActivity(id: number): Promise<void> {
    try {
      const activity = await this.repository.findOne({ where: { id } });
      if (!activity) {
        throw new AppError('النشاط غير موجود', 404, 'ACTIVITY_NOT_FOUND');
      }

      await this.repository.remove(activity);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('حدث خطأ أثناء حذف النشاط', 500, 'DB_ERROR');
    }
  }

  /**
   * Update an existing activity by its ID.
   *
   * All fields are optional (PATCH-style behavior). At least one field must be
   * provided. Validates each supplied field and verifies that referenced
   * session/student entities exist before persisting the update.
   *
   * @param id  - The activity's numeric primary key
   * @param dto - Partial update payload
   * @returns The updated Activity entity with relations loaded
   */
  async updateActivity(id: number, dto: UpdateActivityDto): Promise<Activity> {
    const { session_id, student_id, activityType, count } = dto;

    // Require at least one field
    if (
      session_id === undefined &&
      student_id === undefined &&
      activityType === undefined &&
      count === undefined
    ) {
      throw new AppError(
        'يجب توفير حقل واحد على الأقل للتحديث',
        400,
        'NO_UPDATE_FIELDS'
      );
    }

    // Validate session_id if provided
    if (session_id !== undefined) {
      const parsedSessionId = Number(session_id);
      if (!Number.isInteger(parsedSessionId) || parsedSessionId <= 0) {
        throw new AppError('معرف الجلسة غير صالح', 422, 'INVALID_SESSION_ID');
      }
    }

    // Validate student_id if provided
    if (student_id !== undefined) {
      const parsedStudentId = Number(student_id);
      if (!Number.isInteger(parsedStudentId) || parsedStudentId <= 0) {
        throw new AppError('معرف الطالب غير صالح', 422, 'INVALID_STUDENT_ID');
      }
    }

    // Validate activityType if provided
    if (activityType !== undefined) {
      if (typeof activityType !== 'string' || activityType.trim().length === 0) {
        throw new AppError('نوع النشاط لا يمكن أن يكون فارغاً', 422, 'INVALID_ACTIVITY_TYPE');
      }
      if (activityType.trim().length > 50) {
        throw new AppError('نوع النشاط يجب ألا يتجاوز 50 حرفاً', 422, 'INVALID_ACTIVITY_TYPE');
      }
    }

    // Validate count if provided
    if (count !== undefined) {
      const parsedCount = Number(count);
      if (!Number.isInteger(parsedCount) || parsedCount < 0) {
        throw new AppError('العدد يجب أن يكون رقماً صحيحاً لا يقل عن 0', 422, 'INVALID_COUNT');
      }
    }

    try {
      // Check activity exists
      const activity = await this.repository.findOne({
        where: { id },
        relations: ['session', 'student']
      });
      if (!activity) {
        throw new AppError('النشاط غير موجود', 404, 'ACTIVITY_NOT_FOUND');
      }

      // Resolve session if session_id provided
      if (session_id !== undefined) {
        const parsedSessionId = Number(session_id);
        const sessionRepo = AppDataSource.getRepository(Session);
        const session = await sessionRepo.findOne({ where: { id: parsedSessionId } });
        if (!session) {
          throw new AppError('الجلسة غير موجودة', 404, 'SESSION_NOT_FOUND');
        }
        activity.session = session;
      }

      // Resolve student if student_id provided
      if (student_id !== undefined) {
        const parsedStudentId = Number(student_id);
        const studentRepo = AppDataSource.getRepository(Student);
        const student = await studentRepo.findOne({ where: { id: parsedStudentId } });
        if (!student) {
          throw new AppError('الطالب غير موجود', 404, 'STUDENT_NOT_FOUND');
        }
        activity.student = student;
      }

      // Apply scalar updates
      if (activityType !== undefined) {
        activity.activityType = activityType.trim();
      }
      if (count !== undefined) {
        activity.count = Number(count);
      }

      const saved = await this.repository.save(activity);

      // Return with relations refreshed
      return (await this.repository.findOne({
        where: { id: saved.id },
        relations: ['session', 'student']
      }))!;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('حدث خطأ أثناء تحديث النشاط', 500, 'DB_ERROR');
    }
  }
}
