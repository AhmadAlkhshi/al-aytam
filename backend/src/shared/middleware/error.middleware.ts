import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { DATABASE_ERROR_MESSAGES } from '../utils/arabic-errors';

// ----------------------------------------------------------------
// AppError — kept fully backward-compatible
// ----------------------------------------------------------------

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ----------------------------------------------------------------
// Internal helpers
// ----------------------------------------------------------------

/** Shape of a PostgreSQL / TypeORM QueryFailedError */
interface QueryFailedError extends Error {
  code?: string;        // PostgreSQL error code  (e.g. "23505")
  driverError?: {
    code?: string;
  };
}

const isDevelopment = process.env.NODE_ENV === 'development';

/** Build the base JSON response body */
function buildErrorBody(
  code: string,
  message: string,
  stack?: string
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    success: false,
    error: { code, message },
  };

  if (isDevelopment && stack) {
    body.stack = stack;
  }

  return body;
}

/** Extract the PostgreSQL error code from a TypeORM QueryFailedError */
function getPgCode(err: QueryFailedError): string | undefined {
  return err.code ?? err.driverError?.code;
}

// ----------------------------------------------------------------
// Global error middleware
// ----------------------------------------------------------------

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // 1. Known application errors
  if (err instanceof AppError) {
    res
      .status(err.statusCode)
      .json(buildErrorBody(err.code, err.message, err.stack));
    return;
  }

  // 2. JSON parse / SyntaxError from express.json()
  if (err instanceof SyntaxError && 'body' in err) {
    res
      .status(400)
      .json(buildErrorBody('INVALID_JSON', 'صيغة البيانات المرسلة غير صحيحة', err.stack));
    return;
  }

  // 3. TypeORM / PostgreSQL database errors
  const pgCode = getPgCode(err as QueryFailedError);

  if (pgCode) {
    switch (pgCode) {
      case '23505': // unique_violation
        res
          .status(409)
          .json(
            buildErrorBody(
              'DUPLICATE_ENTRY',
              DATABASE_ERROR_MESSAGES.DUPLICATE_ENTRY,
              err.stack
            )
          );
        return;

      case '23503': // foreign_key_violation
        res
          .status(400)
          .json(
            buildErrorBody(
              'FOREIGN_KEY_VIOLATION',
              DATABASE_ERROR_MESSAGES.FOREIGN_KEY_VIOLATION,
              err.stack
            )
          );
        return;

      case '23502': // not_null_violation
        res
          .status(400)
          .json(
            buildErrorBody(
              'NOT_NULL_VIOLATION',
              DATABASE_ERROR_MESSAGES.NOT_NULL_VIOLATION,
              err.stack
            )
          );
        return;

      case '22P02': // invalid_text_representation
        res
          .status(400)
          .json(
            buildErrorBody(
              'INVALID_INPUT',
              DATABASE_ERROR_MESSAGES.INVALID_TEXT_REPRESENTATION,
              err.stack
            )
          );
        return;

      default:
        // Unknown DB error — fall through to 500
        break;
    }
  }

  // 4. Unhandled / unexpected errors
  res
    .status(500)
    .json(buildErrorBody('INTERNAL_SERVER_ERROR', 'حدث خطأ في الخادم', err.stack));
};
