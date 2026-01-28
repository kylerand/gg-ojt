import express from 'express';
import {
  getProgress,
  createProgress,
  updateStepProgress,
  completeModule,
  addSupervisorSignoff,
} from '../controllers/progressController.js';

const router = express.Router();

// GET /api/progress/:traineeId - Get trainee progress
router.get('/:traineeId', getProgress);

// POST /api/progress - Create new progress
router.post('/', createProgress);

// PUT /api/progress/:traineeId/step - Update step progress
router.put('/:traineeId/step', updateStepProgress);

// PUT /api/progress/:traineeId/complete-module - Complete a module
router.put('/:traineeId/complete-module', completeModule);

// PUT /api/progress/:traineeId/supervisor-signoff - Add supervisor signoff
router.put('/:traineeId/supervisor-signoff', addSupervisorSignoff);

export default router;
