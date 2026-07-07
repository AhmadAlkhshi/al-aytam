import AppDataSource from '../../config/database';
import { Session } from './session.entity';
import { AppError } from '../../shared/middleware/error.middleware';

export class SessionService {
  private get repository() {
    return AppDataSource.getRepository(Session);
  }

  /**
   * Retrieve all sessions ordered by sessionNumber ascending.
   * Supports optional pagination via page/limit query params.
   *
   * @param page  - Page number (1-indexed), default 1
   * @param limit - Records per page, default 50 (0 = no limit)
   */
  async getAllSessions(
    page = 1,
    limit = 50
  ): Promise<{ sessions: Session[]; total: number; page: number; limit: number }> {
    try {
      const skip = limit > 0 ? (page - 1) * limit : 0;

      const [sessions, total] = await this.repository.findAndCount({
        order: { sessionNumber: 'ASC' },
        ...(limit > 0 ? { skip, take: limit } : {})
      });

      return { sessions, total, page, limit };
    } catch (error) {
      throw new AppError('حدث خطأ أثناء جلب الجلسات', 500, 'DB_ERROR');
    }
  }

  /**
   * Create a new session.
   *
   * @param sessionNumber - Unique positive integer identifier for the session
   * @param sessionDate   - ISO date string (YYYY-MM-DD)
   */
  async createSession(sessionNumber: number, sessionDate: string): Promise<Session> {
    // Validate sessionNumber is a positive integer
    if (!Number.isInteger(sessionNumber) || sessionNumber <= 0) {
      throw new AppError('رقم الجلسة يجب أن يكون رقماً صحيحاً موجباً', 400, 'INVALID_SESSION_NUMBER');
    }

    // Validate sessionDate is a valid date string
    const parsedDate = new Date(sessionDate);
    if (isNaN(parsedDate.getTime())) {
      throw new AppError('تاريخ الجلسة غير صالح', 400, 'INVALID_SESSION_DATE');
    }

    try {
      // Check for duplicate sessionNumber
      const existing = await this.repository.findOne({ where: { sessionNumber } });
      if (existing) {
        throw new AppError('رقم الجلسة موجود مسبقاً', 409, 'DUPLICATE_SESSION_NUMBER');
      }

      const session = this.repository.create({ sessionNumber, sessionDate: parsedDate });
      return await this.repository.save(session);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('حدث خطأ أثناء إنشاء الجلسة', 500, 'DB_ERROR');
    }
  }

  /**
   * Retrieve a single session by its ID.
   */
  async getSessionById(id: number): Promise<Session> {
    try {
      const session = await this.repository.findOne({ where: { id } });

      if (!session) {
        throw new AppError('الجلسة غير موجودة', 404, 'SESSION_NOT_FOUND');
      }

      return session;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('حدث خطأ أثناء جلب الجلسة', 500, 'DB_ERROR');
    }
  }

  /**
   * Delete a session by its ID.
   */
  async deleteSession(id: number): Promise<void> {
    try {
      const session = await this.repository.findOne({ where: { id } });

      if (!session) {
        throw new AppError('الجلسة غير موجودة', 404, 'SESSION_NOT_FOUND');
      }

      await this.repository.delete(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('حدث خطأ أثناء حذف الجلسة', 500, 'DB_ERROR');
    }
  }

  /**
   * Update an existing session by its ID.
   *
   * @param id            - The session's numeric primary key
   * @param sessionNumber - (optional) New unique positive integer session number
   * @param sessionDate   - (optional) New ISO date string (YYYY-MM-DD)
   */
  async updateSession(
    id: number,
    sessionNumber?: number,
    sessionDate?: string
  ): Promise<Session> {
    // Validate at least one field is provided
    if (sessionNumber === undefined && sessionDate === undefined) {
      throw new AppError(
        'يجب توفير حقل واحد على الأقل للتحديث (رقم الجلسة أو تاريخ الجلسة)',
        400,
        'NO_UPDATE_FIELDS'
      );
    }

    // Validate sessionNumber if provided
    if (sessionNumber !== undefined) {
      if (!Number.isInteger(sessionNumber) || sessionNumber <= 0) {
        throw new AppError(
          'رقم الجلسة يجب أن يكون رقماً صحيحاً موجباً',
          422,
          'INVALID_SESSION_NUMBER'
        );
      }
    }

    // Validate sessionDate if provided
    let parsedDate: Date | undefined;
    if (sessionDate !== undefined) {
      parsedDate = new Date(sessionDate);
      if (isNaN(parsedDate.getTime())) {
        throw new AppError('تاريخ الجلسة غير صالح', 422, 'INVALID_SESSION_DATE');
      }
    }

    try {
      // Check session exists
      const session = await this.repository.findOne({ where: { id } });
      if (!session) {
        throw new AppError('الجلسة غير موجودة', 404, 'SESSION_NOT_FOUND');
      }

      // Check for duplicate sessionNumber (only if changing it)
      if (sessionNumber !== undefined && sessionNumber !== session.sessionNumber) {
        const duplicate = await this.repository.findOne({ where: { sessionNumber } });
        if (duplicate) {
          throw new AppError('رقم الجلسة موجود مسبقاً', 409, 'DUPLICATE_SESSION_NUMBER');
        }
      }

      // Apply updates
      if (sessionNumber !== undefined) {
        session.sessionNumber = sessionNumber;
      }
      if (parsedDate !== undefined) {
        session.sessionDate = parsedDate;
      }

      return await this.repository.save(session);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('حدث خطأ أثناء تحديث الجلسة', 500, 'DB_ERROR');
    }
  }
}
