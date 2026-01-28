import { join } from 'path';
import { config } from '../utils/config.js';
import { readJSON, writeJSON, ensureDir, listFiles } from '../storage/fileStorage.js';
import { existsSync } from 'fs';

class ProgressTracker {
  constructor() {
    this.progressPath = config.progressPath;
  }

  // Initialize progress tracking
  async init() {
    await ensureDir(this.progressPath);
  }

  // Create new trainee progress
  async createProgress(traineeId, traineeName, cartType) {
    const progress = {
      traineeId,
      traineeName,
      cartType,
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      completedModules: [],
      currentModule: null,
      currentStep: null,
      moduleProgress: {},
    };

    await this.saveProgress(traineeId, progress);
    return progress;
  }

  // Get trainee progress
  async getProgress(traineeId) {
    try {
      const filePath = join(this.progressPath, `${traineeId}.json`);
      if (!existsSync(filePath)) {
        return null;
      }
      return await readJSON(filePath);
    } catch (error) {
      throw new Error(`Failed to load progress for ${traineeId}: ${error.message}`);
    }
  }

  // Save trainee progress
  async saveProgress(traineeId, progress) {
    await this.init();
    const filePath = join(this.progressPath, `${traineeId}.json`);
    progress.lastActivity = new Date().toISOString();
    await writeJSON(filePath, progress);
  }

  // Update step progress
  async updateStepProgress(traineeId, moduleId, stepId, completed = true) {
    const progress = await this.getProgress(traineeId);
    if (!progress) {
      throw new Error(`Progress not found for trainee: ${traineeId}`);
    }

    if (!progress.moduleProgress[moduleId]) {
      progress.moduleProgress[moduleId] = {
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        completedSteps: [],
        knowledgeCheckScore: null,
        supervisorSignoff: false,
      };
    }

    if (completed && !progress.moduleProgress[moduleId].completedSteps.includes(stepId)) {
      progress.moduleProgress[moduleId].completedSteps.push(stepId);
    }

    progress.currentModule = moduleId;
    progress.currentStep = stepId;

    await this.saveProgress(traineeId, progress);
    return progress;
  }

  // Complete a module
  async completeModule(traineeId, moduleId, knowledgeCheckScore) {
    const progress = await this.getProgress(traineeId);
    if (!progress) {
      throw new Error(`Progress not found for trainee: ${traineeId}`);
    }

    if (!progress.moduleProgress[moduleId]) {
      throw new Error(`Module ${moduleId} not started`);
    }

    progress.moduleProgress[moduleId].status = 'completed';
    progress.moduleProgress[moduleId].completedAt = new Date().toISOString();
    progress.moduleProgress[moduleId].knowledgeCheckScore = knowledgeCheckScore;

    if (!progress.completedModules.includes(moduleId)) {
      progress.completedModules.push(moduleId);
    }

    await this.saveProgress(traineeId, progress);
    return progress;
  }

  // Add supervisor signoff
  async addSupervisorSignoff(traineeId, moduleId, supervisorName) {
    const progress = await this.getProgress(traineeId);
    if (!progress) {
      throw new Error(`Progress not found for trainee: ${traineeId}`);
    }

    if (!progress.moduleProgress[moduleId]) {
      throw new Error(`Module ${moduleId} not found in progress`);
    }

    progress.moduleProgress[moduleId].supervisorSignoff = true;
    progress.moduleProgress[moduleId].supervisorName = supervisorName;
    progress.moduleProgress[moduleId].signoffAt = new Date().toISOString();

    await this.saveProgress(traineeId, progress);
    return progress;
  }

  // Get all trainee progress (for admin)
  async getAllProgress() {
    await this.init();
    const files = await listFiles(this.progressPath);
    const progressFiles = files.filter(f => f.endsWith('.json'));

    const allProgress = await Promise.all(
      progressFiles.map(async (file) => {
        const traineeId = file.replace('.json', '');
        return await this.getProgress(traineeId);
      })
    );

    return allProgress.filter(Boolean);
  }

  // Reset trainee progress
  async resetProgress(traineeId) {
    const progress = await this.getProgress(traineeId);
    if (!progress) {
      throw new Error(`Progress not found for trainee: ${traineeId}`);
    }

    progress.moduleProgress = {};
    progress.completedModules = [];
    progress.currentModule = null;
    progress.currentStep = null;
    progress.lastActivity = new Date().toISOString();

    await this.saveProgress(traineeId, progress);
    return progress;
  }

  // Update trainee profile (name, etc.)
  async updateProfile(traineeId, updates) {
    const progress = await this.getProgress(traineeId);
    if (!progress) {
      throw new Error(`Progress not found for trainee: ${traineeId}`);
    }

    // Update allowed fields
    if (updates.traineeName !== undefined) {
      progress.traineeName = updates.traineeName;
    }
    if (updates.cartType !== undefined) {
      progress.cartType = updates.cartType;
    }
    if (updates.email !== undefined) {
      progress.email = updates.email;
    }
    if (updates.department !== undefined) {
      progress.department = updates.department;
    }
    if (updates.supervisor !== undefined) {
      progress.supervisor = updates.supervisor;
    }
    if (updates.hireDate !== undefined) {
      progress.hireDate = updates.hireDate;
    }
    if (updates.jobRole !== undefined) {
      progress.jobRole = updates.jobRole;
    }
    if (updates.certifications !== undefined) {
      progress.certifications = updates.certifications;
    }
    if (updates.phone !== undefined) {
      progress.phone = updates.phone;
    }
    if (updates.emergencyContact !== undefined) {
      progress.emergencyContact = updates.emergencyContact;
    }
    if (updates.notes !== undefined) {
      progress.notes = updates.notes;
    }

    await this.saveProgress(traineeId, progress);
    return progress;
  }

  // Set module progress precisely
  async setModuleProgress(traineeId, moduleId, moduleProgress) {
    const progress = await this.getProgress(traineeId);
    if (!progress) {
      throw new Error(`Progress not found for trainee: ${traineeId}`);
    }

    // Set or update module progress
    progress.moduleProgress[moduleId] = {
      status: moduleProgress.status || 'not_started',
      startedAt: moduleProgress.startedAt || new Date().toISOString(),
      completedAt: moduleProgress.completedAt || null,
      completedSteps: moduleProgress.completedSteps || [],
      knowledgeCheckScore: moduleProgress.knowledgeCheckScore || null,
      supervisorSignoff: moduleProgress.supervisorSignoff || false,
      supervisorName: moduleProgress.supervisorName || null,
      signoffAt: moduleProgress.signoffAt || null,
    };

    // Update completedModules array
    if (moduleProgress.status === 'completed') {
      if (!progress.completedModules.includes(moduleId)) {
        progress.completedModules.push(moduleId);
      }
    } else {
      progress.completedModules = progress.completedModules.filter(m => m !== moduleId);
    }

    await this.saveProgress(traineeId, progress);
    return progress;
  }

  // Reset specific module progress
  async resetModuleProgress(traineeId, moduleId) {
    const progress = await this.getProgress(traineeId);
    if (!progress) {
      throw new Error(`Progress not found for trainee: ${traineeId}`);
    }

    delete progress.moduleProgress[moduleId];
    progress.completedModules = progress.completedModules.filter(m => m !== moduleId);
    
    // If current module was reset, clear it
    if (progress.currentModule === moduleId) {
      progress.currentModule = null;
      progress.currentStep = null;
    }

    await this.saveProgress(traineeId, progress);
    return progress;
  }

  // Reset password (store hashed password)
  async resetPassword(traineeId, newPasswordHash) {
    const progress = await this.getProgress(traineeId);
    if (!progress) {
      throw new Error(`Progress not found for trainee: ${traineeId}`);
    }

    progress.passwordHash = newPasswordHash;
    progress.passwordResetAt = new Date().toISOString();
    progress.passwordResetByAdmin = true;

    await this.saveProgress(traineeId, progress);
    return { success: true, message: 'Password reset successfully' };
  }
}

export default new ProgressTracker();
