import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from './attendance.service';

const attendanceService = new AttendanceService();

export class AttendanceController {
  /**
   * GET /api/attendances
   *
   * Returns a paginated list of all attendance records, with optional filtering
   * by session_id or student_id.
   *
   * Query params:
   *   page       (number, default 1)
   *   limit      (number, default 20)
   *   session_id (number, optional)
   *   student_id (number, optional)
   */
  async getAllAttendances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(0, parseInt(req.query.limit as string) || 20);

      const rawSessionId = req.query.session_id as string | undefined;
      const rawStudentId = req.query.student_id as string | undefined;

      const sessionId = rawSessionId !== undefined ? parseInt(rawSessionId, 10) : undefined;
      const studentId = rawStudentId !== undefined ? parseInt(rawStudentId, 10) : undefined;

      if (rawSessionId !== undefined && (isNaN(sessionId!) || sessionId! <= 0)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_SESSION_ID', message: 'معرف الجلسة غير صالح' }
        });
        return;
      }

      if (rawStudentId !== undefined && (isNaN(studentId!) || studentId! <= 0)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STUDENT_ID', message: 'معرف الطالب غير صالح' }
        });
        return;
      }

      const { attendances, total, page: currentPage, limit: currentLimit } =
        await attendanceService.getAllAttendances({ page, limit, sessionId, studentId });

      res.json({
        success: true,
        data: attendances,
        meta: {
          total,
          page: currentPage,
          limit: currentLimit,
          totalPages: currentLimit > 0 ? Math.ceil(total / currentLimit) : 1
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/attendances/bulk
   *
   * Bulk create (or upsert) attendance records for a session.
   *
   * Body: { session_id: number, attendances: [{ student_id: number, status?: string, notes?: string }] }
   * Returns 201 with { success: true, data: [...], meta: { created, updated, total } }
   */
  async bulkCreateAttendances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { session_id, attendances } = req.body;

      // Validate session_id type and value
      const parsedSessionId = Number(session_id);
      if (!Number.isInteger(parsedSessionId) || parsedSessionId <= 0) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_SESSION_ID', message: 'معرف الجلسة يجب أن يكون رقماً صحيحاً موجباً' }
        });
        return;
      }

      // Validate attendances is a non-empty array
      if (!Array.isArray(attendances) || attendances.length === 0) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_ATTENDANCES', message: 'قائمة الحضور يجب أن تكون مصفوفة غير فارغة' }
        });
        return;
      }

      const { attendances: records, created, updated } =
        await attendanceService.bulkCreateAttendances({ session_id: parsedSessionId, attendances });

      res.status(201).json({
        success: true,
        data: records,
        meta: {
          created,
          updated,
          total: records.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/attendances/:id
   *
   * Partially updates an existing attendance record.
   *
   * Params: id (numeric attendance ID)
   * Body:   { status?: string, notes?: string }
   * Returns 200 with { success: true, data: updatedAttendance }
   * Returns 404 if the record is not found.
   */
  async updateAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id ?? '', 10);

      if (isNaN(id) || id <= 0) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_ID', message: 'معرف سجل الحضور غير صالح' }
        });
        return;
      }

      const { status, notes } = req.body;

      if (status === undefined && notes === undefined) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'يجب توفير حقل واحد على الأقل للتحديث' }
        });
        return;
      }

      const updated = await attendanceService.updateAttendance(id, { status, notes });

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/attendances/session/:sessionId
   *
   * Returns all attendance records for a specific session (no pagination).
   *
   * Params: sessionId (numeric session ID)
   * Returns 200 with { success: true, data: [...], meta: { total, sessionId } }
   * Returns 404 if the session is not found.
   */
  async getAttendancesBySession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = parseInt(req.params.sessionId ?? '', 10);

      if (isNaN(sessionId) || sessionId <= 0) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_SESSION_ID', message: 'معرف الجلسة غير صالح' }
        });
        return;
      }

      const { attendances, total } = await attendanceService.getAttendancesBySession(sessionId);

      res.json({
        success: true,
        data: attendances,
        meta: { total, sessionId }
      });
    } catch (error) {
      next(error);
    }
  }
}
