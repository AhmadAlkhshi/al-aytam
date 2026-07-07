import { Request, Response, NextFunction } from 'express';
import { ActivityService } from './activity.service';

const activityService = new ActivityService();

export class ActivityController {
  /**
   * POST /api/activities
   *
   * Creates a new activity record.
   *
   * Body: { session_id: number, student_id: number, activityType: string, count: number }
   * Returns 201 with { success: true, data: activity } on success.
   */
  async createActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { session_id, student_id, activityType, count } = req.body;

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

      // Validate activityType is a non-empty string
      if (typeof activityType !== 'string' || activityType.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_ACTIVITY_TYPE', message: 'نوع النشاط يجب أن يكون نصاً غير فارغ' }
        });
        return;
      }

      // Validate count is a non-negative integer
      const parsedCount = Number(count);
      if (!Number.isInteger(parsedCount) || parsedCount < 0) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_COUNT', message: 'العدد يجب أن يكون رقماً صحيحاً لا يقل عن 0' }
        });
        return;
      }

      const activity = await activityService.createActivity({
        session_id: parsedSessionId,
        student_id: parsedStudentId,
        activityType: activityType.trim(),
        count: parsedCount
      });

      res.status(201).json({
        success: true,
        data: activity
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/activities
   *
   * Returns a paginated list of all activities, with optional filtering by
   * session_id or student_id.
   *
   * Query params:
   *   page       (number, default 1)
   *   limit      (number, default 20; send 0 to retrieve all)
   *   session_id (number, optional) — filter activities by session
   *   student_id (number, optional) — filter activities by student
   */
  async getAllActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const { activities, total, page: currentPage, limit: currentLimit } =
        await activityService.getAllActivities({ page, limit, sessionId, studentId });

      res.json({
        success: true,
        data: activities,
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
   * DELETE /api/activities/:id
   *
   * Deletes an existing activity by its numeric ID.
   *
   * Params:  id (numeric activity ID)
   * Returns 204 No Content on success.
   * Returns 400 if the ID param is invalid.
   * Returns 404 if the activity is not found.
   */
  async deleteActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id ?? '', 10);

      if (isNaN(id) || id <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف النشاط غير صالح'
          }
        });
        return;
      }

      await activityService.deleteActivity(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/activities/:id
   *
   * Updates an existing activity (supports partial updates — all body fields optional).
   *
   * Params: id (numeric activity ID)
   * Body:   { session_id?: number, student_id?: number, activityType?: string, count?: number }
   * Returns 200 with { success: true, data: updatedActivity } on success.
   * Returns 400 if the ID param is invalid or no update fields are provided.
   * Returns 404 if the activity, session, or student is not found.
   * Returns 422 on validation failure.
   */
  async updateActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id ?? '', 10);

      if (isNaN(id) || id <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف النشاط غير صالح'
          }
        });
        return;
      }

      const { session_id, student_id, activityType, count } = req.body;

      // Require at least one field
      if (
        session_id === undefined &&
        student_id === undefined &&
        activityType === undefined &&
        count === undefined
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

      const updatedActivity = await activityService.updateActivity(id, {
        session_id,
        student_id,
        activityType,
        count
      });

      res.json({
        success: true,
        data: updatedActivity
      });
    } catch (error) {
      next(error);
    }
  }
}
