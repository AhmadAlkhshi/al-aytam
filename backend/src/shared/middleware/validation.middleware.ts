import { Request, Response, NextFunction } from 'express';
import { VALIDATION_MESSAGES } from '../utils/arabic-errors';

/**
 * Middleware للتحقق من وجود الحقول المطلوبة في body الطلب.
 *
 * @param requiredFields - مصفوفة بأسماء الحقول المطلوبة
 * @returns Express middleware function
 *
 * @example
 * router.post('/', validateBody(['session_id', 'student_id', 'reason', 'points']), controller.create)
 */
export const validateBody = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    for (const field of requiredFields) {
      const value = (req.body as Record<string, unknown>)[field];

      if (value === undefined || value === null || value === '') {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: VALIDATION_MESSAGES.REQUIRED_FIELD(field),
            field,
          },
        });
        return;
      }
    }

    next();
  };
};
