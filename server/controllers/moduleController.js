import ModuleLoader from '../services/ModuleLoader.js';
import { AppError } from '../middleware/errorHandler.js';

export const getAllModules = async (req, res, next) => {
  try {
    const modules = await ModuleLoader.getModuleList();
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
