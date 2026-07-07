import { Request, Response, NextFunction } from 'express';
import { DivisionService } from './division.service';

const divisionService = new DivisionService();

export class DivisionController {
  /**
   * POST /api/division/calculate
   *
   * Calculates the student division for a given session.
   *
   * Body:    { session_id: number }
   * Returns: 200 { success: true, data: DivisionResult }
   * Returns: 400 if session_id is missing or invalid
   * Returns: 404 if the session does not exist
   */
  async calculateDivision(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { session_id } = req.body;

      // Validate presence
      if (session_id === undefined || session_id === null) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_SESSION_ID', message: 'معرف الجلسة مطلوب' }
        });
        return;
      }

      // Validate type / value
      const parsedSessionId = Number(session_id);
      if (!Number.isInteger(parsedSessionId) || parsedSessionId <= 0) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_SESSION_ID', message: 'معرف الجلسة غير صالح' }
        });
        return;
      }

      const result = await divisionService.calculateDivision(parsedSessionId);

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
