import { Router } from 'express';
import { StudentController } from './student.controller';

const router = Router();
const studentController = new StudentController();

// GET /api/students — list all students (paginated)
router.get('/', (req, res, next) => studentController.getAllStudents(req, res, next));

// POST /api/students — create a new student
router.post('/', (req, res, next) => studentController.createStudent(req, res, next));

// PUT /api/students/:id — update an existing student by ID
router.put('/:id', (req, res, next) => studentController.updateStudent(req, res, next));

// DELETE /api/students/:id — delete a student by ID
router.delete('/:id', (req, res, next) => studentController.deleteStudent(req, res, next));

export default router;
