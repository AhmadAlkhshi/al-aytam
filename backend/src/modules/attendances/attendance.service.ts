import AppDataSource from '../../config/database';
import { Attendance } from './attendance.entity';
import { Session } from '../sessions/session.entity';
import { Student } from '../students/student.entity';
import { AppError } from '../../shared/middleware/error.middleware';
import { FindManyOptions } from 'typeorm';

export interface GetAttendancesOptions {
  page?: number;
  limit?: number;
  sessionId?: number;
  studentId?: number;
}

export interface AttendanceItemDto {
  student_id: number;
  status?: string;
  notes?: string;
}

export interface BulkCreateAttendanceDto {
  session_id: number;
  attendances: AttendanceItemDto[];
}

export interface UpdateAttendanceDto {
  status?: string;
  notes?: string;
}

const VALID_STATUSES = ['present', 'absent', 'late'];

export class AttendanceService {
  private get repository() {
    return AppDataSource.getRepository(Attendance);
  }

  /**
   * Retrieve all attendance records with optional pagination and filtering.
   */
  async getAllAttendances(
    options: GetAttendancesOptions = {}
  ): Promise<{ attendances: Attendance[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, sessionId, studentId } = options;

    try {
      const skip = limit > 0 ? (page - 1) * limit : 0;

      const queryOptions: FindManyOptions<Attendance> = {
        order: { id: 'ASC' },
        relations: ['session', 'student'],
        ...(limit > 0 ? { skip, take: limit } : {})
      };

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

      const [attendances, total] = await this.repository.findAndCount(queryOptions);

      return { attendances, total, page, limit };
    } catch (error) {
      throw new AppError('حدث خطأ أثناء جلب سجلات الحضور', 500, 'DB_ERROR');
    }
  }

  /**
   * Bulk create (or upsert) attendance records for a session.
   * If a student already has a record for the session, it is updated.
   */
  async bulkCreateAttendances(
    dto: BulkCreateAttendanceDto
  ): Promise<{ attendances: Attendance[]; created: number; updated: number }> {
    const { session_id, attendances } = dto;

    // Validate session_id
    if (session_id === undefined || session_id === null) {
      throw new AppError('معرف الجلسة مطلوب', 400, 'MISSING_SESSION_ID');
    }
    const parsedSessionId = Number(session_id);
    if (!Number.isInteger(parsedSessionId) || parsedSessionId <= 0) {
      throw new AppError('معرف الجلسة غير صالح', 400, 'INVALID_SESSION_ID');
    }

    // Validate attendances array
    if (!Array.isArray(attendances) || attendances.length === 0) {
      throw new AppError('قائمة الحضور مطلوبة ويجب أن تحتوي على عنصر واحد على الأقل', 400, 'MISSING_ATTENDANCES');
    }

    // Validate each attendance item
    let itemIndex = 0;
    for (const item of attendances) {
      itemIndex++;
      if (item.student_id === undefined || item.student_id === null) {
        throw new AppError(`معرف الطالب مطلوب في العنصر ${itemIndex}`, 400, 'MISSING_STUDENT_ID');
      }
      const parsedStudentId = Number(item.student_id);
      if (!Number.isInteger(parsedStudentId) || parsedStudentId <= 0) {
        throw new AppError(`معرف الطالب غير صالح في العنصر ${itemIndex}`, 400, 'INVALID_STUDENT_ID');
      }
      if (item.status !== undefined && !VALID_STATUSES.includes(item.status)) {
        throw new AppError(
          `الحالة غير صالحة في العنصر ${itemIndex}. القيم المقبولة: ${VALID_STATUSES.join(', ')}`,
          400,
          'INVALID_STATUS'
        );
      }
    }

    try {
      // Verify session exists
      const sessionRepo = AppDataSource.getRepository(Session);
      const session = await sessionRepo.findOne({ where: { id: parsedSessionId } });
      if (!session) {
        throw new AppError('الجلسة غير موجودة', 404, 'SESSION_NOT_FOUND');
      }

      const studentRepo = AppDataSource.getRepository(Student);
      const results: Attendance[] = [];
      let created = 0;
      let updated = 0;

      for (const item of attendances) {
        const parsedStudentId = Number(item.student_id);

        // Verify student exists
        const student = await studentRepo.findOne({ where: { id: parsedStudentId } });
        if (!student) {
          throw new AppError(`الطالب بالمعرف ${parsedStudentId} غير موجود`, 404, 'STUDENT_NOT_FOUND');
        }

        // Check for existing record (upsert logic)
        const existing = await this.repository.findOne({
          where: { session: { id: parsedSessionId }, student: { id: parsedStudentId } },
          relations: ['session', 'student']
        });

        if (existing) {
          // Update existing record
          if (item.status !== undefined) existing.status = item.status;
          if (item.notes !== undefined) existing.notes = item.notes;
          const saved = await this.repository.save(existing);
          results.push(saved);
          updated++;
        } else {
          // Create new record
          const attendance = this.repository.create({
            session,
            student,
            status: item.status ?? 'present',
            notes: item.notes ?? null
          });
          const saved = await this.repository.save(attendance);
          results.push(saved);
          created++;
        }
      }

      // Reload with relations
      const finalRecords = await Promise.all(
        results.map(r =>
          this.repository.findOne({ where: { id: r.id }, relations: ['session', 'student'] })
        )
      );

      return {
        attendances: finalRecords.filter((r): r is Attendance => r !== null),
        created,
        updated
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('حدث خطأ أثناء إنشاء سجلات الحضور', 500, 'DB_ERROR');
    }
  }

  /**
   * Update an existing attendance record (partial update).
   */
  async updateAttendance(id: number, dto: UpdateAttendanceDto): Promise<Attendance> {
    const { status, notes } = dto;

    if (status === undefined && notes === undefined) {
      throw new AppError('يجب توفير حقل واحد على الأقل للتحديث', 400, 'NO_UPDATE_FIELDS');
    }

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      throw new AppError(
        `الحالة غير صالحة. القيم المقبولة: ${VALID_STATUSES.join(', ')}`,
        400,
        'INVALID_STATUS'
      );
    }

    try {
      const attendance = await this.repository.findOne({
        where: { id },
        relations: ['session', 'student']
      });

      if (!attendance) {
        throw new AppError('سجل الحضور غير موجود', 404, 'ATTENDANCE_NOT_FOUND');
      }

      if (status !== undefined) attendance.status = status;
      if (notes !== undefined) attendance.notes = notes;

      const saved = await this.repository.save(attendance);

      return (await this.repository.findOne({
        where: { id: saved.id },
        relations: ['session', 'student']
      }))!;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('حدث خطأ أثناء تحديث سجل الحضور', 500, 'DB_ERROR');
    }
  }

  /**
   * Get all attendance records for a specific session (no pagination).
   */
  async getAttendancesBySession(
    sessionId: number
  ): Promise<{ attendances: Attendance[]; total: number }> {
    try {
      // Verify session exists
      const sessionRepo = AppDataSource.getRepository(Session);
      const session = await sessionRepo.findOne({ where: { id: sessionId } });
      if (!session) {
        throw new AppError('الجلسة غير موجودة', 404, 'SESSION_NOT_FOUND');
      }

      const attendances = await this.repository.find({
        where: { session: { id: sessionId } },
        relations: ['session', 'student'],
        order: { id: 'ASC' }
      });

      return { attendances, total: attendances.length };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('حدث خطأ أثناء جلب سجلات الحضور', 500, 'DB_ERROR');
    }
  }
}
