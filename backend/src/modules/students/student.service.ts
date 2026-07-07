import AppDataSource from '../../config/database';
import { Student } from './student.entity';
import { AppError } from '../../shared/middleware/error.middleware';

export interface CreateStudentDto {
  firstName: string;
  lastName: string;
  guardianName: string;
  age: number;
  notes?: string | null;
}

export interface UpdateStudentDto {
  firstName?: string;
  lastName?: string;
  guardianName?: string;
  age?: number;
  notes?: string | null;
}

export class StudentService {
  private get repository() {
    return AppDataSource.getRepository(Student);
  }

  /**
   * Retrieve all students ordered by id ascending.
   * Supports optional pagination via page/limit query params.
   *
   * @param page  - Page number (1-indexed), default 1
   * @param limit - Records per page, default 20 (0 = no limit)
   */
  async getAllStudents(
    page = 1,
    limit = 20
  ): Promise<{ students: Student[]; total: number; page: number; limit: number }> {
    try {
      const skip = limit > 0 ? (page - 1) * limit : 0;

      const [students, total] = await this.repository.findAndCount({
        order: { id: 'ASC' },
        ...(limit > 0 ? { skip, take: limit } : {})
      });

      return { students, total, page, limit };
    } catch (error) {
      throw new AppError('حدث خطأ أثناء جلب الطلاب', 500, 'DB_ERROR');
    }
  }

  /**
   * Update an existing student record by ID.
   *
   * - Returns 404 if no student exists with the given ID.
   * - Validates the supplied fields the same way createStudent does.
   * - The student's ID is never changed (Property 2: ID Preservation on Update).
   *
   * @param id  - Numeric primary key of the student to update
   * @param dto - Partial UpdateStudentDto; at least one field must be present
   */
  async updateStudent(id: number, dto: UpdateStudentDto): Promise<Student> {
    const { firstName, lastName, guardianName, age, notes } = dto;

    // At least one field must be provided
    const hasFields =
      firstName !== undefined ||
      lastName !== undefined ||
      guardianName !== undefined ||
      age !== undefined ||
      notes !== undefined;

    if (!hasFields) {
      throw new AppError('يجب توفير حقل واحد على الأقل للتحديث', 400, 'NO_UPDATE_FIELDS');
    }

    // Validate firstName if provided
    if (firstName !== undefined) {
      if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
        throw new AppError('اسم الطالب لا يمكن أن يكون فارغاً', 422, 'INVALID_FIRST_NAME');
      }
      if (firstName.trim().length > 100) {
        throw new AppError('اسم الطالب يجب ألا يتجاوز 100 حرف', 422, 'INVALID_FIRST_NAME');
      }
    }

    // Validate lastName if provided
    if (lastName !== undefined) {
      if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
        throw new AppError('كنية الطالب لا يمكن أن تكون فارغة', 422, 'INVALID_LAST_NAME');
      }
      if (lastName.trim().length > 100) {
        throw new AppError('كنية الطالب يجب ألا تتجاوز 100 حرف', 422, 'INVALID_LAST_NAME');
      }
    }

    // Validate guardianName if provided
    if (guardianName !== undefined) {
      if (!guardianName || typeof guardianName !== 'string' || guardianName.trim().length === 0) {
        throw new AppError('اسم الولي لا يمكن أن يكون فارغاً', 422, 'INVALID_GUARDIAN_NAME');
      }
      if (guardianName.trim().length > 100) {
        throw new AppError('اسم الولي يجب ألا يتجاوز 100 حرف', 422, 'INVALID_GUARDIAN_NAME');
      }
    }

    // Validate age if provided
    if (age !== undefined) {
      const parsedAge = Number(age);
      if (!Number.isInteger(parsedAge) || parsedAge <= 0 || parsedAge >= 100) {
        throw new AppError('العمر يجب أن يكون رقماً صحيحاً بين 1 و99', 422, 'INVALID_AGE');
      }
    }

    try {
      const student = await this.repository.findOne({ where: { id } });

      if (!student) {
        throw new AppError('الطالب غير موجود', 404, 'STUDENT_NOT_FOUND');
      }

      // Apply updates — ID is never touched (Property 2)
      if (firstName !== undefined) student.firstName = firstName.trim();
      if (lastName !== undefined) student.lastName = lastName.trim();
      if (guardianName !== undefined) student.guardianName = guardianName.trim();
      if (age !== undefined) student.age = Number(age);
      if (notes !== undefined) student.notes = notes ? notes.trim() : null;

      return await this.repository.save(student);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('حدث خطأ أثناء تحديث بيانات الطالب', 500, 'DB_ERROR');
    }
  }

  /**
   * Delete a student record by ID.
   *
   * - Returns 404 if no student exists with the given ID.
   * - Throws a 409 error if a foreign key constraint prevents deletion.
   *
   * @param id - Numeric primary key of the student to delete
   */
  async deleteStudent(id: number): Promise<void> {
    try {
      const student = await this.repository.findOne({ where: { id } });

      if (!student) {
        throw new AppError('الطالب غير موجود', 404, 'STUDENT_NOT_FOUND');
      }

      await this.repository.delete(id);
    } catch (error) {
      if (error instanceof AppError) throw error;

      // PostgreSQL foreign key violation
      const dbError = error as any;
      if (dbError?.code === '23503') {
        throw new AppError(
          'لا يمكن حذف هذا السجل لأنه مرتبط بسجلات أخرى',
          409,
          'FK_CONSTRAINT_VIOLATION'
        );
      }

      throw new AppError('حدث خطأ أثناء حذف الطالب', 500, 'DB_ERROR');
    }
  }

  /**
   * Create a new student record.
   *
   * @param dto - CreateStudentDto with firstName, lastName, guardianName, age, notes
   * @returns The newly created Student entity
   */
  async createStudent(dto: CreateStudentDto): Promise<Student> {
    const { firstName, lastName, guardianName, age, notes } = dto;

    // Validate firstName
    if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
      throw new AppError('اسم الطالب مطلوب', 400, 'INVALID_FIRST_NAME');
    }
    if (firstName.trim().length > 100) {
      throw new AppError('اسم الطالب يجب ألا يتجاوز 100 حرف', 422, 'INVALID_FIRST_NAME');
    }

    // Validate lastName
    if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
      throw new AppError('كنية الطالب مطلوبة', 400, 'INVALID_LAST_NAME');
    }
    if (lastName.trim().length > 100) {
      throw new AppError('كنية الطالب يجب ألا تتجاوز 100 حرف', 422, 'INVALID_LAST_NAME');
    }

    // Validate guardianName
    if (!guardianName || typeof guardianName !== 'string' || guardianName.trim().length === 0) {
      throw new AppError('اسم الولي مطلوب', 400, 'INVALID_GUARDIAN_NAME');
    }
    if (guardianName.trim().length > 100) {
      throw new AppError('اسم الولي يجب ألا يتجاوز 100 حرف', 422, 'INVALID_GUARDIAN_NAME');
    }

    // Validate age
    const parsedAge = Number(age);
    if (!Number.isInteger(parsedAge) || parsedAge <= 0 || parsedAge >= 100) {
      throw new AppError('العمر يجب أن يكون رقماً صحيحاً بين 1 و99', 400, 'INVALID_AGE');
    }

    try {
      const student = this.repository.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        guardianName: guardianName.trim(),
        age: parsedAge,
        notes: notes ? notes.trim() : null
      });

      return await this.repository.save(student);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('حدث خطأ أثناء إنشاء الطالب', 500, 'DB_ERROR');
    }
  }
}
