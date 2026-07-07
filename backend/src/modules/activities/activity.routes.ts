import { Router } from 'express';
import { ActivityController } from './activity.controller';
import { validateBody } from '../../shared/middleware/validation.middleware';

const router = Router();
const activityController = new ActivityController();

// POST /api/activities     — create a new activity
router.post('/', validateBody(['session_id', 'student_id', 'activityType', 'count']), (req, res, next) => activityController.createActivity(req, res, next));

// GET /api/activities — list all activities (paginated, with optional filters)
router.get('/', (req, res, next) => activityController.getAllActivities(req, res, next));

// PUT /api/activities/:id  — update an existing activity by ID
router.put('/:id', (req, res, next) => activityController.updateActivity(req, res, next));

// DELETE /api/activities/:id — delete an activity by ID
router.delete('/:id', (req, res, next) => activityController.deleteActivity(req, res, next));

export default router;
