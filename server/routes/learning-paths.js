import express from 'express';
import LearningPathLoader from '../services/LearningPathLoader.js';
import ModuleLoader from '../services/ModuleLoader.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// GET /api/learning-paths - Get all learning paths (metadata)
router.get('/', async (req, res, next) => {
  try {
    const learningPaths = await LearningPathLoader.getLearningPathList();
    res.json(learningPaths);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
});

// GET /api/learning-paths/:learningPathId - Get specific learning path with full details
router.get('/:learningPathId', async (req, res, next) => {
  try {
    const { learningPathId } = req.params;
    const learningPath = await LearningPathLoader.getLearningPath(learningPathId);

    if (!learningPath) {
      throw new AppError('Learning path not found', 404);
    }

    // Enrich with module metadata
    const modules = await Promise.all(
      (learningPath.moduleIds || []).map(async (moduleId) => {
        try {
          const module = await ModuleLoader.getModule(moduleId);
          return module
            ? {
                id: module.id,
                title: module.title,
                description: module.description,
                estimatedTime: module.estimatedTime,
                thumbnailUrl: module.thumbnailUrl,
                stepCount: module.steps?.length || 0,
                requiresSupervisorSignoff: module.requiresSupervisorSignoff || false,
              }
            : null;
        } catch {
          return null;
        }
      })
    );

    res.json({
      ...learningPath,
      modules: modules.filter(Boolean),
    });
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 404));
  }
});

export default router;
