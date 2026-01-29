import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import ProgressTracker from '../services/ProgressTracker.js';
import ModuleLoader from '../services/ModuleLoader.js';
import StorageService from '../services/StorageService.js';
import { AppError } from '../middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for memory storage (to upload to Supabase)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only videos and images are allowed.'));
    }
  }
});

// GET /api/admin/trainees - Get all trainees with full details
router.get('/trainees', async (req, res, next) => {
  try {
    const allProgress = await ProgressTracker.getAllProgress();
    res.json(allProgress);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
});

// GET /api/admin/trainees/:traineeId - Get single trainee details
router.get('/trainees/:traineeId', async (req, res, next) => {
  try {
    const { traineeId } = req.params;
    const progress = await ProgressTracker.getProgress(traineeId);
    if (!progress) {
      throw new AppError('Trainee not found', 404);
    }
    res.json(progress);
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
});

// PUT /api/admin/trainees/:traineeId - Update trainee profile
router.put('/trainees/:traineeId', async (req, res, next) => {
  try {
    const { traineeId } = req.params;
    const updates = req.body;
    
    const progress = await ProgressTracker.updateProfile(traineeId, updates);
    res.json({ success: true, trainee: progress });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
});

// POST /api/admin/trainees/:traineeId/reset-password - Reset trainee password
router.post('/trainees/:traineeId/reset-password', async (req, res, next) => {
  try {
    const { traineeId } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 4) {
      throw new AppError('Password must be at least 4 characters', 400);
    }
    
    // Simple hash for demo (in production, use bcrypt)
    const simpleHash = Buffer.from(newPassword).toString('base64');
    
    const result = await ProgressTracker.resetPassword(traineeId, simpleHash);
    res.json(result);
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
});

// PUT /api/admin/trainees/:traineeId/modules/:moduleId - Set specific module progress
router.put('/trainees/:traineeId/modules/:moduleId', async (req, res, next) => {
  try {
    const { traineeId, moduleId } = req.params;
    const moduleProgress = req.body;
    
    const progress = await ProgressTracker.setModuleProgress(traineeId, moduleId, moduleProgress);
    res.json({ success: true, progress });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
});

// DELETE /api/admin/trainees/:traineeId/modules/:moduleId - Reset specific module progress
router.delete('/trainees/:traineeId/modules/:moduleId', async (req, res, next) => {
  try {
    const { traineeId, moduleId } = req.params;
    
    const progress = await ProgressTracker.resetModuleProgress(traineeId, moduleId);
    res.json({ success: true, progress });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
});

// DELETE /api/admin/progress/:traineeId - Reset trainee progress
router.delete('/progress/:traineeId', async (req, res, next) => {
  try {
    const { traineeId } = req.params;
    const progress = await ProgressTracker.resetProgress(traineeId);
    res.json({ message: 'Progress reset successfully', progress });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
});

// POST /api/admin/cache/clear - Clear module cache
router.post('/cache/clear', (req, res) => {
  ModuleLoader.clearCache();
  res.json({ message: 'Cache cleared successfully' });
});

// =====================================================
// FILE UPLOAD ENDPOINTS
// =====================================================

// POST /api/admin/upload - Upload video or image to Supabase Storage
router.post('/upload', upload.any(), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new AppError('No file uploaded', 400);
    }

    const file = req.files[0];
    const isVideo = file.mimetype.startsWith('video/');
    
    let result;
    if (isVideo) {
      result = await StorageService.uploadVideo(
        file.buffer,
        file.originalname,
        file.mimetype
      );
    } else {
      const imageType = req.body.type || 'images';
      result = await StorageService.uploadImage(
        file.buffer,
        file.originalname,
        file.mimetype,
        imageType
      );
    }

    res.json({ 
      success: true,
      url: result.url,
      path: result.path,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });
  } catch (error) {
    console.error('Upload error:', error);
    next(new AppError(error.message, 500));
  }
});

// =====================================================
// MODULE MANAGEMENT ENDPOINTS
// =====================================================

// POST /api/admin/modules - Create new module
router.post('/modules', async (req, res, next) => {
  try {
    const moduleData = req.body;
    
    if (!moduleData.id || !moduleData.title) {
      throw new AppError('Module ID and title are required', 400);
    }

    // Check if module already exists
    const existingModules = await ModuleLoader.getAllModules();
    if (existingModules.some(m => m.id === moduleData.id)) {
      throw new AppError('Module with this ID already exists', 409);
    }

    // Save module to file
    const modulePath = path.join(__dirname, '../../data/modules', `${moduleData.id}.json`);
    await fs.writeFile(modulePath, JSON.stringify(moduleData, null, 2));

    // Clear cache to reload modules
    ModuleLoader.clearCache();

    res.status(201).json({ success: true, module: moduleData });
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
});

// PUT /api/admin/modules/:id - Update existing module
router.put('/modules/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const moduleData = req.body;
    
    if (!moduleData.title) {
      throw new AppError('Module title is required', 400);
    }

    // Ensure ID matches
    moduleData.id = id;

    // Check if module exists
    const modulePath = path.join(__dirname, '../../data/modules', `${id}.json`);
    try {
      await fs.access(modulePath);
    } catch {
      throw new AppError('Module not found', 404);
    }

    // Save updated module
    await fs.writeFile(modulePath, JSON.stringify(moduleData, null, 2));

    // Clear cache to reload modules
    ModuleLoader.clearCache();

    res.json({ success: true, module: moduleData });
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
});

// DELETE /api/admin/modules/:id - Delete module
router.delete('/modules/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const modulePath = path.join(__dirname, '../../data/modules', `${id}.json`);
    
    try {
      await fs.access(modulePath);
    } catch {
      throw new AppError('Module not found', 404);
    }

    await fs.unlink(modulePath);

    // Clear cache to reload modules
    ModuleLoader.clearCache();

    res.json({ success: true, message: 'Module deleted successfully' });
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
});

// GET /api/admin/modules/:id - Get single module for editing
router.get('/modules/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const module = await ModuleLoader.getModule(id);
    
    if (!module) {
      throw new AppError('Module not found', 404);
    }

    res.json(module);
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
});

export default router;
