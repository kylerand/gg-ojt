import LearningPathLoader from '../services/LearningPathLoader.js';
import AuthService from '../services/AuthService.js';
import { AppError } from '../middleware/errorHandler.js';

export const getAllLearningPaths = async (req, res, next) => {
  try {
    let jobRole = null;
    let userRole = null;

    if (req.user) {
      try {
        const user = await AuthService.getUser(req.user.id);
        if (user) {
          jobRole = user.jobRole;
          userRole = user.role;
        }
      } catch (error) {
        console.warn('Could not get user info for path filtering:', error.message);
      }
    }

    const paths = jobRole || userRole
      ? await LearningPathLoader.getPathsForJobRole(jobRole, userRole)
      : await LearningPathLoader.getAllPaths();

    res.json(paths);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const getLearningPath = async (req, res, next) => {
  try {
    const { pathId } = req.params;
    const path = await LearningPathLoader.getPath(pathId);
    if (!path) {
      return next(new AppError(`Learning path not found: ${pathId}`, 404));
    }
    res.json(path);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};
