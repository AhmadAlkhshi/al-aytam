import { Router } from 'express';
import { PointController } from './point.controller';
import { validateBody } from '../../shared/middleware/validation.middleware';

const router = Router();
const pointController = new PointController();

// POST /api/points         — create a new point record
router.post('/', validateBody(['session_id', 'student_id', 'reason', 'points']), (req, res, next) => pointController.createPoint(req, res, next));

// GET /api/points          — list all points (paginated, with optional filters)
router.get('/', (req, res, next) => pointController.getAllPoints(req, res, next));

// PUT /api/points/:id      — update an existing point record by ID
router.put('/:id', (req, res, next) => pointController.updatePoint(req, res, next));

// DELETE /api/points/:id   — delete a point record by ID
router.delete('/:id', (req, res, next) => pointController.deletePoint(req, res, next));

export default router;
