import { Request, Response, NextFunction } from 'express';
import { PointService } from './point.service';

const pointService = new PointService();

export class PointController {
  /**
   * POST /api/points
   *
   * Creates a new point record.
   *
   * Body: { session_id: number, student_id: number, reason: string, points: number, action?: string }
   * Returns 201 with { success: true, data: point } on success.
   */
  async createPoint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { session_id, student_id, reason, points, action } = req.body;

      // Validate session_id type and value
      const parsedSessionId = Number(session_id);
      if (!Number.isInteger(parsedSessionId) || parsedSessionId <= 0) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_SESSION_ID', message: 'معرف الجلسة يجب أن يكون رقماً صحيحاً موجباً' }
        });
        return;
      }

      // Validate student_id type and value
      const parsedStudentId = Number(student_id);
      if (!Number.isInteger(parsedStudentId) || parsedStudentId <= 0) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STUDENT_ID', message: 'معرف الطالب يجب أن يكون رقماً صحيحاً موجباً' }
        });
        return;
      }

      // Validate reason is a non-empty string
      if (typeof reason !== 'string' || reason.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_REASON', message: 'السبب يجب أن يكون نصاً غير فارغ' }
        });
        return;
      }

      // Validate points is an integer
      const parsedPoints = Number(points);
      if (!Number.isInteger(parsedPoints)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_POINTS', message: 'عدد النقاط يجب أن يكون رقماً صحيحاً' }
        });
        return;
      }

      const point = await pointService.createPoint({
        session_id: parsedSessionId,
        student_id: parsedStudentId,
        reason: reason.trim(),
        points: parsedPoints,
        action
      });

      res.status(201).json({
        success: true,
        data: point
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/points
   *
   * Returns a paginated list of all point records, with optional filtering by
   * session_id or student_id.
   *
   * Query params:
   *   page       (number, default 1)
   *   limit      (number, default 20; send 0 to retrieve all)
   *   session_id (number, optional) — filter points by session
   *   student_id (number, optional) — filter points by student
   */
  async getAllPoints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(0, parseInt(req.query.limit as string) || 20);

      const rawSessionId = req.query.session_id as string | undefined;
      const rawStudentId = req.query.student_id as string | undefined;

      const sessionId = rawSessionId !== undefined ? parseInt(rawSessionId, 10) : undefined;
      const studentId = rawStudentId !== undefined ? parseInt(rawStudentId, 10) : undefined;

      // Validate optional filter IDs when provided
      if (rawSessionId !== undefined && (isNaN(sessionId!) || sessionId! <= 0)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SESSION_ID',
            message: 'معرف الجلسة غير صالح'
          }
        });
        return;
      }

      if (rawStudentId !== undefined && (isNaN(studentId!) || studentId! <= 0)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STUDENT_ID',
            message: 'معرف الطالب غير صالح'
          }
        });
        return;
      }

      const { points, total, page: currentPage, limit: currentLimit } =
        await pointService.getAllPoints({ page, limit, sessionId, studentId });

      res.json({
        success: true,
        data: points,
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
   * DELETE /api/points/:id
   *
   * Deletes an existing point record by its numeric ID.
   *
   * Params:  id (numeric point ID)
   * Returns 204 No Content on success.
   * Returns 400 if the ID param is invalid.
   * Returns 404 if the point is not found.
   */
  async deletePoint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id ?? '', 10);

      if (isNaN(id) || id <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف سجل النقاط غير صالح'
          }
        });
        return;
      }

      await pointService.deletePoint(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/points/:id
   *
   * Updates an existing point record (supports partial updates — all body fields optional).
   *
   * Params: id (numeric point ID)
   * Body:   { session_id?: number, student_id?: number, reason?: string, points?: number, action?: string }
   * Returns 200 with { success: true, data: updatedPoint } on success.
   * Returns 400 if the ID param is invalid or no update fields are provided.
   * Returns 404 if the point, session, or student is not found.
   * Returns 422 on validation failure.
   */
  async updatePoint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id ?? '', 10);

      if (isNaN(id) || id <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف سجل النقاط غير صالح'
          }
        });
        return;
      }

      const { session_id, student_id, reason, points, action } = req.body;

      // Require at least one field
      if (
        session_id === undefined &&
        student_id === undefined &&
        reason === undefined &&
        points === undefined &&
        action === undefined
      ) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'يجب توفير حقل واحد على الأقل للتحديث'
          }
        });
        return;
      }

      const updatedPoint = await pointService.updatePoint(id, {
        session_id,
        student_id,
        reason,
        points,
        action
      });

      res.json({
        success: true,
        data: updatedPoint
      });
    } catch (error) {
      next(error);
    }
  }
}
