import AppDataSource from '../../config/database';
import { Point } from './point.entity';
import { Session } from '../sessions/session.entity';
import { Student } from '../students/student.entity';
import { AppError } from '../../shared/middleware/error.middleware';
import { FindManyOptions } from 'typeorm';

export interface GetPointsOptions {
  page?: number;
  limit?: number;
  sessionId?: number;
  studentId?: number;
}

export interface CreatePointDto {
  session_id: number;
  student_id: number;
  reason: string;
  points: number;
  action?: string;
}

export interface UpdatePointDto {
  session_id?: number;
  student_id?: number;
  reason?: string;
  points?: number;
  action?: string;
}

export class PointService {
  private get repository() {
    return AppDataSource.getRepository(Point);
  }

  /**
   * Retrieve all points with optional pagination and filtering.
   *
   * @param options.page      - Page number (1-indexed), default 1
   * @param options.limit     - Records per page, default 20 (0 = no limit)
   * @param options.sessionId - Optional filter by session ID
   * @param options.studentId - Optional filter by student ID
   */
  async getAllPoints(
    options: GetPointsOptions = {}
  ): Promise<{ points: Point[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, sessionId, studentId } = options;

    try {
      const skip = limit > 0 ? (page - 1) * limit : 0;

      const queryOptions: FindManyOptions<Point> = {
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

      const [points, total] = await this.repository.findAndCount(queryOptions);

      return { points, total, page, limit };
    } catch (error) {
      throw new AppError('حدث خطأ أثناء جلب النقاط', 500, 'DB_ERROR');
    }
  }

  /**
   * Create a new point record.
   *
   * Validates all required fields, verifies the referenced session and student
   * exist, then persists the new point and returns it with eager-loaded relations.
   *
   * @param dto - CreatePointDto
   * @returns The newly created Point entity
   */
  async createPoint(dto: CreatePointDto): Promise<Point> {
    const { session_id, student_id, reason, points, action } = dto;

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

    // Validate reason
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      throw new AppError('السبب مطلوب', 400, 'MISSING_REASON');
    }
    if (reason.trim().length > 255) {
      throw new AppError('السبب يجب ألا يتجاوز 255 حرفاً', 422, 'INVALID_REASON');
    }

    // Validate points
    if (points === undefined || points === null) {
      throw new AppError('عدد النقاط مطلوب', 400, 'MISSING_POINTS');
    }
    const parsedPoints = Number(points);
    if (!Number.isInteger(parsedPoints)) {
      throw new AppError('عدد النقاط يجب أن يكون رقماً صحيحاً', 400, 'INVALID_POINTS');
    }

    // Validate action if provided
    if (action !== undefined && action !== null && action.trim().length > 100) {
      throw new AppError('الإجراء يجب ألا يتجاوز 100 حرف', 422, 'INVALID_ACTION');
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

      // Create and save the point
      const point = this.repository.create({
        session,
        student,
        reason: reason.trim(),
        points: parsedPoints,
        action: action ? action.trim() : null
      });

      const saved = await this.repository.save(point);

      // Return with relations loaded
      return (await this.repository.findOne({
        where: { id: saved.id },
        relations: ['session', 'student']
      }))!;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('حدث خطأ أثناء إنشاء النقاط', 500, 'DB_ERROR');
    }
  }

  /**
   * Delete a point record by its ID.
   *
   * @param id - The point's numeric primary key
   * @throws AppError 404 if the point is not found
   */
  async deletePoint(id: number): Promise<void> {
    try {
      const point = await this.repository.findOne({ where: { id } });
      if (!point) {
        throw new AppError('سجل النقاط غير موجود', 404, 'POINT_NOT_FOUND');
      }

      await this.repository.remove(point);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('حدث خطأ أثناء حذف سجل النقاط', 500, 'DB_ERROR');
    }
  }

  /**
   * Update an existing point record by its ID.
   *
   * All fields are optional (PATCH-style behavior). At least one field must be
   * provided. Validates each supplied field and verifies referenced entities exist.
   *
   * @param id  - The point's numeric primary key
   * @param dto - Partial update payload
   * @returns The updated Point entity with relations loaded
   */
  async updatePoint(id: number, dto: UpdatePointDto): Promise<Point> {
    const { session_id, student_id, reason, points, action } = dto;

    // Require at least one field
    if (
      session_id === undefined &&
      student_id === undefined &&
      reason === undefined &&
      points === undefined &&
      action === undefined
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

    // Validate reason if provided
    if (reason !== undefined) {
      if (typeof reason !== 'string' || reason.trim().length === 0) {
        throw new AppError('السبب لا يمكن أن يكون فارغاً', 422, 'INVALID_REASON');
      }
      if (reason.trim().length > 255) {
        throw new AppError('السبب يجب ألا يتجاوز 255 حرفاً', 422, 'INVALID_REASON');
      }
    }

    // Validate points if provided
    if (points !== undefined) {
      const parsedPoints = Number(points);
      if (!Number.isInteger(parsedPoints)) {
        throw new AppError('عدد النقاط يجب أن يكون رقماً صحيحاً', 422, 'INVALID_POINTS');
      }
    }

    // Validate action if provided
    if (action !== undefined && action !== null && action.trim().length > 100) {
      throw new AppError('الإجراء يجب ألا يتجاوز 100 حرف', 422, 'INVALID_ACTION');
    }

    try {
      // Check point exists
      const point = await this.repository.findOne({
        where: { id },
        relations: ['session', 'student']
      });
      if (!point) {
        throw new AppError('سجل النقاط غير موجود', 404, 'POINT_NOT_FOUND');
      }

      // Resolve session if session_id provided
      if (session_id !== undefined) {
        const parsedSessionId = Number(session_id);
        const sessionRepo = AppDataSource.getRepository(Session);
        const session = await sessionRepo.findOne({ where: { id: parsedSessionId } });
        if (!session) {
          throw new AppError('الجلسة غير موجودة', 404, 'SESSION_NOT_FOUND');
        }
        point.session = session;
      }

      // Resolve student if student_id provided
      if (student_id !== undefined) {
        const parsedStudentId = Number(student_id);
        const studentRepo = AppDataSource.getRepository(Student);
        const student = await studentRepo.findOne({ where: { id: parsedStudentId } });
        if (!student) {
          throw new AppError('الطالب غير موجود', 404, 'STUDENT_NOT_FOUND');
        }
        point.student = student;
      }

      // Apply scalar updates
      if (reason !== undefined) {
        point.reason = reason.trim();
      }
      if (points !== undefined) {
        point.points = Number(points);
      }
      if (action !== undefined) {
        point.action = action ? action.trim() : null;
      }

      const saved = await this.repository.save(point);

      // Return with relations refreshed
      return (await this.repository.findOne({
        where: { id: saved.id },
        relations: ['session', 'student']
      }))!;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('حدث خطأ أثناء تحديث سجل النقاط', 500, 'DB_ERROR');
    }
  }
}
