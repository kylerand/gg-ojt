import express from 'express';
import { getAllLearningPaths, getLearningPath } from '../controllers/learningPathController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/learning-paths - Get all learning paths with module metadata
router.get('/', optionalAuth, getAllLearningPaths);

// GET /api/learning-paths/:pathId - Get a specific learning path
router.get('/:pathId', optionalAuth, getLearningPath);

export default router;
