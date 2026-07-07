import { Request, Response, NextFunction } from 'express';
import { StudentService } from './student.service';

const studentService = new StudentService();

export class StudentController {
  /**
   * GET /api/students
   *
   * Returns a paginated list of all students ordered by id ASC.
   *
   * Query params:
   *   page  (number, default 1)
   *   limit (number, default 20; send 0 to retrieve all)
   */
  async getAllStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(0, parseInt(req.query.limit as string) || 20);

      const { students, total, page: currentPage, limit: currentLimit } =
        await studentService.getAllStudents(page, limit);

      res.json({
        success: true,
        data: students,
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
   * POST /api/students
   *
   * Creates a new student record.
   *
   * Body: { firstName, lastName, guardianName, age, notes? }
   * Returns 201 with { success: true, data: student } on success.
   * Returns 400 if required fields are missing or invalid.
   */
  async createStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { firstName, lastName, guardianName, age, notes } = req.body;

      // Validate that all required fields are present in the request body
      const missingFields: string[] = [];
      if (firstName === undefined || firstName === null) missingFields.push('firstName');
      if (lastName === undefined || lastName === null) missingFields.push('lastName');
      if (guardianName === undefined || guardianName === null) missingFields.push('guardianName');
      if (age === undefined || age === null) missingFields.push('age');

      if (missingFields.length > 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: `الحقول التالية مطلوبة: ${missingFields.join(', ')}`
          }
        });
        return;
      }

      const student = await studentService.createStudent({
        firstName,
        lastName,
        guardianName,
        age,
        notes: notes ?? null
      });

      res.status(201).json({
        success: true,
        data: student
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/students/:id
   *
   * Deletes an existing student record.
   *
   * Params: id (numeric student ID)
   * Returns 204 No Content on success.
   * Returns 400 if the ID param is invalid.
   * Returns 404 if no student exists with the given ID.
   * Returns 409 if the student is referenced by other records (FK constraint).
   */
  async deleteStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id ?? '', 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف الطالب غير صالح'
          }
        });
        return;
      }

      await studentService.deleteStudent(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/students/:id
   *
   * Updates an existing student record.
   *
   * Params: id (numeric student ID)
   * Body:   { firstName?, lastName?, guardianName?, age?, notes? }
   * Returns 200 with { success: true, data: updatedStudent } on success.
   * Returns 400 if the ID param is invalid or no fields are provided.
   * Returns 404 if no student exists with the given ID.
   * Returns 422 on validation failure.
   */
  async updateStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id ?? '', 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'معرف الطالب غير صالح'
          }
        });
        return;
      }

      const { firstName, lastName, guardianName, age, notes } = req.body;

      // At least one field must be present
      if (
        firstName === undefined &&
        lastName === undefined &&
        guardianName === undefined &&
        age === undefined &&
        notes === undefined
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

      const updatedStudent = await studentService.updateStudent(id, {
        firstName,
        lastName,
        guardianName,
        age,
        notes
      });

      res.json({
        success: true,
        data: updatedStudent
      });
    } catch (error) {
      next(error);
    }
  }
}
