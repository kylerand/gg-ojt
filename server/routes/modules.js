import express from 'express';
import { getAllModules, getModule, getCartConfig } from '../controllers/moduleController.js';

const router = express.Router();

// GET /api/modules - Get all modules (metadata)
router.get('/', getAllModules);

// GET /api/modules/:moduleId - Get specific module with full details
router.get('/:moduleId', getModule);

// GET /api/modules/cart/:cartType - Get cart configuration
router.get('/cart/:cartType', getCartConfig);

export default router;
