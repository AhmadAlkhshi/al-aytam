import { Request, Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError, NotBeforeError } from 'jsonwebtoken';
import { AppError } from './error.middleware';

// Extend Express Request to include user payload
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        role: string;
      };
    }
  }
}

export interface TokenPayload {
  userId: string;
  username: string;
  role: string;
}

/**
 * JWT Authentication Middleware
 *
 * Extracts the Bearer token from the Authorization header, verifies it,
 * and attaches the decoded payload to req.user.
 *
 * Returns:
 *   401 (Unauthorized) - when no token is provided
 *   403 (Forbidden)    - when token is expired, malformed, or has invalid signature
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    // Check Authorization header exists and follows Bearer scheme
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('لم يتم توفير رمز المصادقة', 401, 'NO_TOKEN');
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token) {
      throw new AppError('لم يتم توفير رمز المصادقة', 401, 'NO_TOKEN');
    }

    const jwtSecret = process.env.JWT_SECRET || 'secret';
    const decoded = jwt.verify(token, jwtSecret) as TokenPayload;

    // Attach decoded payload to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      // Re-throw our own errors (e.g. NO_TOKEN → 401)
      return next(error);
    }

    if (error instanceof TokenExpiredError) {
      // Token was valid but has expired → 403
      return next(new AppError('انتهت صلاحية رمز المصادقة', 403, 'TOKEN_EXPIRED'));
    }

    if (error instanceof NotBeforeError) {
      // Token not yet valid → 403
      return next(new AppError('رمز المصادقة غير صالح بعد', 403, 'TOKEN_NOT_BEFORE'));
    }

    if (error instanceof JsonWebTokenError) {
      // Malformed token or invalid signature → 403
      return next(new AppError('رمز المصادقة غير صالح أو مشوه', 403, 'INVALID_TOKEN'));
    }

    // Unknown error → 403 (safer default than 401 for token-related issues)
    return next(new AppError('فشل التحقق من رمز المصادقة', 403, 'TOKEN_VERIFICATION_FAILED'));
  }
};

/**
 * Role-based authorization middleware (applied after authenticate).
 * Returns 403 if the authenticated user does not have one of the allowed roles.
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('لم يتم التحقق من هوية المستخدم', 401, 'NOT_AUTHENTICATED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('ليس لديك صلاحية للقيام بهذا الإجراء', 403, 'INSUFFICIENT_PERMISSIONS'));
    }

    next();
  };
};
