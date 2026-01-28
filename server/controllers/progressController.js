import ProgressTracker from '../services/ProgressTracker.js';
import Validator from '../services/Validator.js';
import ModuleLoader from '../services/ModuleLoader.js';
import { AppError } from '../middleware/errorHandler.js';

export const getProgress = async (req, res, next) => {
  try {
    const { traineeId } = req.params;
    const progress = await ProgressTracker.getProgress(traineeId);
    
    if (!progress) {
      return res.status(404).json({ message: 'Progress not found' });
    }
    
    res.json(progress);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const createProgress = async (req, res, next) => {
  try {
    const { traineeId, traineeName, cartType } = req.body;
    
    if (!traineeId || !traineeName || !cartType) {
      return next(new AppError('Missing required fields', 400));
    }

    const progress = await ProgressTracker.createProgress(traineeId, traineeName, cartType);
    res.status(201).json(progress);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const updateStepProgress = async (req, res, next) => {
  try {
    const { traineeId } = req.params;
    const { moduleId, stepId, completed, stepData } = req.body;

    // Load module to validate step
    const module = await ModuleLoader.getModule(moduleId);
    const step = module.steps.find(s => s.id === stepId);

    if (!step) {
      return next(new AppError('Step not found', 404));
    }

    // Validate step completion
    const validation = Validator.validateStepCompletion(step, stepData || {});
    if (!validation.valid) {
      return next(new AppError(validation.message, 400));
    }

    const progress = await ProgressTracker.updateStepProgress(traineeId, moduleId, stepId, completed);
    res.json(progress);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const completeModule = async (req, res, next) => {
  try {
    const { traineeId } = req.params;
    const { moduleId, knowledgeCheckScore } = req.body;

    const progress = await ProgressTracker.completeModule(traineeId, moduleId, knowledgeCheckScore);
    res.json(progress);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const addSupervisorSignoff = async (req, res, next) => {
  try {
    const { traineeId } = req.params;
    const { moduleId, supervisorName } = req.body;

    if (!supervisorName) {
      return next(new AppError('Supervisor name is required', 400));
    }

    const progress = await ProgressTracker.addSupervisorSignoff(traineeId, moduleId, supervisorName);
    res.json(progress);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};
