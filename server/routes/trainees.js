import express from 'express';
import { getAllTrainees, getTraineeDetails } from '../controllers/traineeController.js';

const router = express.Router();

// GET /api/trainees - Get all trainees (summary)
router.get('/', getAllTrainees);

// GET /api/trainees/:traineeId - Get trainee details
router.get('/:traineeId', getTraineeDetails);

export default router;
