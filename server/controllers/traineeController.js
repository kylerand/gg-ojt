import ProgressTracker from '../services/ProgressTracker.js';
import { AppError } from '../middleware/errorHandler.js';

export const getAllTrainees = async (req, res, next) => {
  try {
    const allProgress = await ProgressTracker.getAllProgress();
    
    // Return summary info
    const trainees = allProgress.map(p => ({
      traineeId: p.traineeId,
      traineeName: p.traineeName,
      cartType: p.cartType,
      startedAt: p.startedAt,
      lastActivity: p.lastActivity,
      completedModules: p.completedModules.length,
      currentModule: p.currentModule,
    }));

    res.json(trainees);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const getTraineeDetails = async (req, res, next) => {
  try {
    const { traineeId } = req.params;
    const progress = await ProgressTracker.getProgress(traineeId);
    
    if (!progress) {
      return res.status(404).json({ message: 'Trainee not found' });
    }

    res.json(progress);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};
