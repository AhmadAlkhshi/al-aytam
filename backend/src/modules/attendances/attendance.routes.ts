import { Router } from 'express';
import { AttendanceController } from './attendance.controller';
import { validateBody } from '../../shared/middleware/validation.middleware';

const router = Router();
const attendanceController = new AttendanceController();

// GET /api/attendances           — list all attendance records (paginated, with optional filters)
router.get('/', (req, res, next) => attendanceController.getAllAttendances(req, res, next));

// POST /api/attendances/bulk     — bulk create / upsert attendance records for a session
router.post('/bulk', validateBody(['session_id', 'attendances']), (req, res, next) => attendanceController.bulkCreateAttendances(req, res, next));

// GET /api/attendances/session/:sessionId  — get all attendance records for a specific session
router.get('/session/:sessionId', (req, res, next) => attendanceController.getAttendancesBySession(req, res, next));

// PUT /api/attendances/:id       — partially update an attendance record
router.put('/:id', (req, res, next) => attendanceController.updateAttendance(req, res, next));

export default router;
