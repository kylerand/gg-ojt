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

    // Calculate step-based completion percentage
    try {
      const modules = await ModuleLoader.getAllModules();
      const totalSteps = modules.reduce((sum, m) => sum + (m.steps?.length || 0), 0);
      const totalModules = modules.length;

      // Create a map of module id to step count
      const moduleStepCounts = {};
      modules.forEach(m => {
        moduleStepCounts[m.id] = m.steps?.length || 0;
      });

      // Count completed steps
      let completedSteps = 0;
      let completedModulesCount = 0;

      Object.entries(progress.moduleProgress || {}).forEach(([moduleId, modProgress]) => {
        if (modProgress.status === 'completed') {
          completedSteps += moduleStepCounts[moduleId] || 0;
          completedModulesCount++;
        } else if (modProgress.completedSteps) {
          completedSteps += modProgress.completedSteps.length;
        }
      });

      // Add completion stats to response
      progress.completionPercentage = totalSteps > 0 
        ? Math.round((completedSteps / totalSteps) * 100) 
        : 0;
      progress.totalSteps = totalSteps;
      progress.completedStepsCount = completedSteps;
      progress.totalModules = totalModules;
      progress.completedModulesCount = completedModulesCount;
    } catch (moduleError) {
      console.error('Could not calculate step completion:', moduleError);
      // Continue without step stats if module loading fails
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
