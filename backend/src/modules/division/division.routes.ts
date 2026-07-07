import { Router } from 'express';
import { DivisionController } from './division.controller';

const router = Router();
const divisionController = new DivisionController();

// POST /api/division/calculate — calculate student division for a session
router.post('/calculate', (req, res, next) => divisionController.calculateDivision(req, res, next));

export default router;
