import ModuleLoader from '../services/ModuleLoader.js';
import AuthService from '../services/AuthService.js';
import { AppError } from '../middleware/errorHandler.js';

export const getAllModules = async (req, res, next) => {
  try {
    let jobRole = null;
    let userRole = null;

    // If user is authenticated, get their job role
    if (req.user) {
      try {
        const user = await AuthService.getUser(req.user.id);
        if (user) {
          jobRole = user.jobRole;
          userRole = user.role;
        }
      } catch (error) {
        // If we can't get user info, just return all modules
        console.warn('Could not get user info for module filtering:', error.message);
      }
    }

    const modules = await ModuleLoader.getModuleList(jobRole, userRole);
    res.json(modules);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const getModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const module = await ModuleLoader.getModule(moduleId);
    res.json(module);
  } catch (error) {
    next(new AppError(error.message, 404));
  }
};

export const getCartConfig = async (req, res, next) => {
  try {
    const { cartType } = req.params;
    const config = await ModuleLoader.getCartConfig(cartType);
    res.json(config);
  } catch (error) {
    next(new AppError(error.message, 404));
  }
};
