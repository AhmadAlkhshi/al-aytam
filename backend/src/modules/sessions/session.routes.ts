import { Router } from 'express';
import { SessionController } from './session.controller';

const router = Router();
const sessionController = new SessionController();

// POST /api/sessions       — create a new session
router.post('/', (req, res, next) => sessionController.createSession(req, res, next));

// GET /api/sessions        — list all sessions (paginated)
router.get('/', (req, res, next) => sessionController.getAllSessions(req, res, next));

// GET /api/sessions/:id    — get a single session by ID
router.get('/:id', (req, res, next) => sessionController.getSessionById(req, res, next));

// PUT /api/sessions/:id    — update an existing session by ID
router.put('/:id', (req, res, next) => sessionController.updateSession(req, res, next));

// DELETE /api/sessions/:id — delete a session by ID
router.delete('/:id', (req, res, next) => sessionController.deleteSession(req, res, next));

export default router;
