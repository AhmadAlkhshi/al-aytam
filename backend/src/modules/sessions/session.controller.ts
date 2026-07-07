import { Request, Response, NextFunction } from 'express';
import { SessionService } from './session.service';

const sessionService = new SessionService();

export class SessionController {
  /**
   * POST /api/sessions
   *
   * Creates a new session.
   *
   * Body: { sessionNumber: number, sessionDate: string }
   * Returns 201 with { success: true, data: session } on success.
   */
  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionNumber, sessionDate } = req.body;

      // Validate presence
      if (sessionNumber === undefined || sessionNumber === null || !sessionDate) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'رقم الجلسة وتاريخ الجلسة مطلوبان'
          }
        });
        return;
      }

      const session = await sessionService.createSession(Number(sessionNumber), sessionDate);

      res.status(201).json({
        success: true,
        data: session
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sessions
   *
   * Returns a paginated list of all sessions ordered by sessionNumber ASC.
   *
   * Query params:
   *   page  (number, default 1)
   *   limit (number, default 50; send 0 to retrieve all)
   */
  async getAllSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(0, parseInt(req.query.limit as string) || 50);

      const { sessions, total, page: currentPage, limit: currentLimit } =
        await sessionService.getAllSessions(page, limit);

      res.json({
        success: true,
        data: sessions,
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
   * GET /api/sessions/:id
   *
   * Returns a single session by its numeric ID.
   */
  async getSessionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id ?? '', 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف الجلسة غير صالح'
          }
        });
        return;
      }

      const session = await sessionService.getSessionById(id);

      res.json({
        success: true,
        data: session
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/sessions/:id
   *
   * Updates an existing session.
   *
   * Params: id (numeric session ID)
   * Body:   { sessionNumber?: number, sessionDate?: string }
   * Returns 200 with { success: true, data: updatedSession } on success.
   * Returns 400 if the ID param or body fields are invalid.
   * Returns 404 if no session exists with the given ID.
   * Returns 422 on validation failure.
   */
  async updateSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id ?? '', 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف الجلسة غير صالح'
          }
        });
        return;
      }

      const { sessionNumber, sessionDate } = req.body;

      // Both fields missing → bad request
      if (sessionNumber === undefined && sessionDate === undefined) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'يجب توفير حقل واحد على الأقل للتحديث (رقم الجلسة أو تاريخ الجلسة)'
          }
        });
        return;
      }

      const updatedSession = await sessionService.updateSession(
        id,
        sessionNumber !== undefined ? Number(sessionNumber) : undefined,
        sessionDate
      );

      res.json({
        success: true,
        data: updatedSession
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/sessions/:id
   *
   * Deletes a session by its numeric ID.
   * Returns 204 No Content on success.
   */
  async deleteSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id ?? '', 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف الجلسة غير صالح'
          }
        });
        return;
      }

      await sessionService.deleteSession(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
