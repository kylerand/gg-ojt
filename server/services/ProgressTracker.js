import { join } from 'path';
import { config } from '../utils/config.js';
import { readJSON, writeJSON, ensureDir, listFiles } from '../storage/fileStorage.js';
import { existsSync } from 'fs';
import { supabase, isSupabaseConfigured } from './supabase.js';

class ProgressTracker {
  constructor() {
    this.progressPath = config.progressPath;
    this.useSupabase = isSupabaseConfigured();
    if (this.useSupabase) {
      console.log('🔗 ProgressTracker using Supabase');
    } else {
      console.log('📁 ProgressTracker using file storage');
    }
  }

  async init() {
    if (!this.useSupabase) {
      await ensureDir(this.progressPath);
    }
  }

  // ============================================
  // CREATE PROGRESS
  // ============================================
  async createProgress(traineeId, traineeName, cartType) {
    if (this.useSupabase) {
      // Create main progress record
      const { data: progressData, error: progressError } = await supabase
        .from('progress')
        .insert({
          trainee_id: traineeId,
          trainee_name: traineeName,
          cart_type: cartType,
        })
        .select()
        .single();

      if (progressError) throw new Error(progressError.message);
      
      return this.mapProgressFromDb(progressData, []);
    } else {
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
  }

  // ============================================
  // GET PROGRESS
  // ============================================
  async getProgress(traineeId) {
    if (this.useSupabase) {
      // Get main progress record
      const { data: progressData, error: progressError } = await supabase
        .from('progress')
        .select('*')
        .eq('trainee_id', traineeId)
        .single();

      if (progressError || !progressData) return null;

      // Get module progress
      const { data: moduleData } = await supabase
        .from('module_progress')
        .select('*')
        .eq('trainee_id', traineeId);

      // Get step progress
      const { data: stepData } = await supabase
        .from('step_progress')
        .select('*')
        .eq('trainee_id', traineeId);

      return this.mapProgressFromDb(progressData, moduleData || [], stepData || []);
    } else {
      try {
        const filePath = join(this.progressPath, `${traineeId}.json`);
        if (!existsSync(filePath)) return null;
        return await readJSON(filePath);
      } catch (error) {
        throw new Error(`Failed to load progress for ${traineeId}: ${error.message}`);
      }
    }
  }

  // ============================================
  // SAVE PROGRESS
  // ============================================
  async saveProgress(traineeId, progress) {
    if (this.useSupabase) {
      // Update main progress
      await supabase
        .from('progress')
        .update({
          trainee_name: progress.traineeName,
          cart_type: progress.cartType,
          last_activity: new Date().toISOString(),
        })
        .eq('trainee_id', traineeId);

      // Update module progress
      for (const [moduleId, modProgress] of Object.entries(progress.moduleProgress || {})) {
        await supabase
          .from('module_progress')
          .upsert({
            trainee_id: traineeId,
            module_id: moduleId,
            status: modProgress.status || 'not-started',
            current_step: modProgress.currentStep || 0,
            started_at: modProgress.startedAt,
            completed_at: modProgress.completedAt,
          }, { onConflict: 'trainee_id,module_id' });
      }
    } else {
      await this.init();
      const filePath = join(this.progressPath, `${traineeId}.json`);
      progress.lastActivity = new Date().toISOString();
      await writeJSON(filePath, progress);
    }
  }

  // ============================================
  // UPDATE STEP PROGRESS
  // ============================================
  async updateStepProgress(traineeId, moduleId, stepId, completed = true) {
    const progress = await this.getProgress(traineeId);
    if (!progress) {
      throw new Error(`Progress not found for trainee: ${traineeId}`);
    }

    if (this.useSupabase) {
      // Upsert module progress
      await supabase
        .from('module_progress')
        .upsert({
          trainee_id: traineeId,
          module_id: moduleId,
          status: 'in-progress',
          started_at: new Date().toISOString(),
        }, { onConflict: 'trainee_id,module_id' });

      // Upsert step progress
      if (completed) {
        await supabase
          .from('step_progress')
          .upsert({
            trainee_id: traineeId,
            module_id: moduleId,
            step_id: stepId,
            status: 'completed',
            completed_at: new Date().toISOString(),
          }, { onConflict: 'trainee_id,module_id,step_id' });
      }

      // Update last activity
      await supabase
        .from('progress')
        .update({ last_activity: new Date().toISOString() })
        .eq('trainee_id', traineeId);

      return await this.getProgress(traineeId);
    } else {
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
  }

  // ============================================
  // COMPLETE MODULE
  // ============================================
  async completeModule(traineeId, moduleId, knowledgeCheckScore) {
    const progress = await this.getProgress(traineeId);
    if (!progress) {
      throw new Error(`Progress not found for trainee: ${traineeId}`);
    }

    if (this.useSupabase) {
      await supabase
        .from('module_progress')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('trainee_id', traineeId)
        .eq('module_id', moduleId);

      // Record quiz attempt
      if (knowledgeCheckScore !== null && knowledgeCheckScore !== undefined) {
        await supabase
          .from('quiz_attempts')
          .insert({
            trainee_id: traineeId,
            module_id: moduleId,
            score: knowledgeCheckScore,
            total_questions: 100, // Assuming percentage
            passed: knowledgeCheckScore >= 80,
          });
      }

      return await this.getProgress(traineeId);
    } else {
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
  }

  // ============================================
  // SUPERVISOR SIGNOFF
  // ============================================
  async addSupervisorSignoff(traineeId, moduleId, supervisorName) {
    const progress = await this.getProgress(traineeId);
    if (!progress) {
      throw new Error(`Progress not found for trainee: ${traineeId}`);
    }

    if (this.useSupabase) {
      await supabase
        .from('module_progress')
        .update({
          supervisor_signoff: true,
          supervisor_name: supervisorName,
          signoff_at: new Date().toISOString(),
        })
        .eq('trainee_id', traineeId)
        .eq('module_id', moduleId);

      return await this.getProgress(traineeId);
    } else {
      if (!progress.moduleProgress[moduleId]) {
        throw new Error(`Module ${moduleId} not found in progress`);
      }

      progress.moduleProgress[moduleId].supervisorSignoff = true;
      progress.moduleProgress[moduleId].supervisorName = supervisorName;
      progress.moduleProgress[moduleId].signoffAt = new Date().toISOString();

      await this.saveProgress(traineeId, progress);
      return progress;
    }
  }

  // ============================================
  // GET ALL PROGRESS (ADMIN)
  // ============================================
  async getAllProgress() {
    await this.init();

    if (this.useSupabase) {
      const { data: allProgress, error } = await supabase
        .from('progress')
        .select('*')
        .order('last_activity', { ascending: false });

      if (error) throw new Error(error.message);

      // Get all module progress
      const { data: allModuleProgress } = await supabase
        .from('module_progress')
        .select('*');

      // Get all step progress - THIS WAS MISSING!
      const { data: allStepProgress } = await supabase
        .from('step_progress')
        .select('*');

      // Map and combine
      return allProgress.map(p => {
        const moduleProgress = (allModuleProgress || []).filter(
          mp => mp.trainee_id === p.trainee_id
        );
        const stepProgress = (allStepProgress || []).filter(
          sp => sp.trainee_id === p.trainee_id
        );
        return this.mapProgressFromDb(p, moduleProgress, stepProgress);
      });
    } else {
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
  }

  // ============================================
  // RESET PROGRESS
  // ============================================
  async resetProgress(traineeId) {
    const progress = await this.getProgress(traineeId);
    if (!progress) {
      throw new Error(`Progress not found for trainee: ${traineeId}`);
    }

    if (this.useSupabase) {
      // Delete all module progress
      await supabase
        .from('module_progress')
        .delete()
        .eq('trainee_id', traineeId);

      // Delete all step progress
      await supabase
        .from('step_progress')
        .delete()
        .eq('trainee_id', traineeId);

      // Update main progress
      await supabase
        .from('progress')
        .update({
          completed_at: null,
          last_activity: new Date().toISOString(),
        })
        .eq('trainee_id', traineeId);

      return await this.getProgress(traineeId);
    } else {
      progress.moduleProgress = {};
      progress.completedModules = [];
      progress.currentModule = null;
      progress.currentStep = null;
      progress.lastActivity = new Date().toISOString();

      await this.saveProgress(traineeId, progress);
      return progress;
    }
  }

  // ============================================
  // UPDATE PROFILE
  // ============================================
  async updateProfile(traineeId, updates) {
    const progress = await this.getProgress(traineeId);
    if (!progress) {
      throw new Error(`Progress not found for trainee: ${traineeId}`);
    }

    if (this.useSupabase) {
      // Update progress table
      const progressUpdates = {};
      if (updates.traineeName !== undefined) progressUpdates.trainee_name = updates.traineeName;
      if (updates.cartType !== undefined) progressUpdates.cart_type = updates.cartType;
      if (updates.email !== undefined) progressUpdates.email = updates.email;
      if (updates.phone !== undefined) progressUpdates.phone = updates.phone;
      if (updates.department !== undefined) progressUpdates.department = updates.department;
      if (updates.supervisor !== undefined) progressUpdates.supervisor = updates.supervisor;
      if (updates.hireDate !== undefined) progressUpdates.hire_date = updates.hireDate || null;
      if (updates.jobRole !== undefined) progressUpdates.job_role = updates.jobRole;
      if (updates.certifications !== undefined) progressUpdates.certifications = updates.certifications || [];
      if (updates.emergencyContact !== undefined) progressUpdates.emergency_contact = updates.emergencyContact;
      if (updates.notes !== undefined) progressUpdates.notes = updates.notes;

      const { error: progressError } = await supabase
        .from('progress')
        .update(progressUpdates)
        .eq('trainee_id', traineeId);

      if (progressError) {
        console.error('Failed to update progress profile:', progressError);
        throw new Error(`Failed to update profile: ${progressError.message}`);
      }

      // Also update users table (for fields that exist there)
      const userUpdates = {};
      if (updates.traineeName !== undefined) userUpdates.name = updates.traineeName;
      if (updates.email !== undefined) userUpdates.email = updates.email;
      if (updates.department !== undefined) userUpdates.department = updates.department;
      if (updates.hireDate !== undefined) userUpdates.hire_date = updates.hireDate || null;
      if (updates.jobRole !== undefined) userUpdates.job_role = updates.jobRole;
      if (updates.certifications !== undefined) userUpdates.certifications = updates.certifications || [];

      if (Object.keys(userUpdates).length > 0) {
        const { error: userError } = await supabase
          .from('users')
          .update(userUpdates)
          .eq('employee_id', traineeId);

        if (userError) {
          console.warn('Failed to update users table (may not exist for this trainee):', userError.message);
          // Don't throw - progress was updated successfully
        }
      }

      return await this.getProgress(traineeId);
    } else {
      const allowedFields = [
        'traineeName', 'cartType', 'email', 'department', 'supervisor',
        'hireDate', 'jobRole', 'certifications', 'phone', 'emergencyContact', 'notes'
      ];

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          progress[field] = updates[field];
        }
      }

      await this.saveProgress(traineeId, progress);
      return progress;
    }
  }

  // ============================================
  // SET MODULE PROGRESS (ADMIN)
  // ============================================
  async setModuleProgress(traineeId, moduleId, moduleProgress) {
    const progress = await this.getProgress(traineeId);
    if (!progress) {
      throw new Error(`Progress not found for trainee: ${traineeId}`);
    }

    if (this.useSupabase) {
      await supabase
        .from('module_progress')
        .upsert({
          trainee_id: traineeId,
          module_id: moduleId,
          status: moduleProgress.status || 'not-started',
          started_at: moduleProgress.startedAt,
          completed_at: moduleProgress.completedAt,
        }, { onConflict: 'trainee_id,module_id' });

      return await this.getProgress(traineeId);
    } else {
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
  }

  // ============================================
  // RESET MODULE PROGRESS
  // ============================================
  async resetModuleProgress(traineeId, moduleId) {
    const progress = await this.getProgress(traineeId);
    if (!progress) {
      throw new Error(`Progress not found for trainee: ${traineeId}`);
    }

    if (this.useSupabase) {
      await supabase
        .from('module_progress')
        .delete()
        .eq('trainee_id', traineeId)
        .eq('module_id', moduleId);

      await supabase
        .from('step_progress')
        .delete()
        .eq('trainee_id', traineeId)
        .eq('module_id', moduleId);

      return await this.getProgress(traineeId);
    } else {
      delete progress.moduleProgress[moduleId];
      progress.completedModules = progress.completedModules.filter(m => m !== moduleId);

      if (progress.currentModule === moduleId) {
        progress.currentModule = null;
        progress.currentStep = null;
      }

      await this.saveProgress(traineeId, progress);
      return progress;
    }
  }

  // ============================================
  // HELPERS
  // ============================================
  mapProgressFromDb(progressData, moduleData = [], stepData = []) {
    const moduleProgress = {};
    const completedModules = [];

    for (const mod of moduleData) {
      const steps = stepData.filter(
        s => s.trainee_id === mod.trainee_id && s.module_id === mod.module_id
      );

      moduleProgress[mod.module_id] = {
        status: mod.status,
        startedAt: mod.started_at,
        completedAt: mod.completed_at,
        completedSteps: steps.filter(s => s.status === 'completed').map(s => s.step_id),
        knowledgeCheckScore: null,
        supervisorSignoff: mod.supervisor_signoff || false,
        supervisorName: mod.supervisor_name,
        signoffAt: mod.signoff_at,
      };

      if (mod.status === 'completed') {
        completedModules.push(mod.module_id);
      }
    }

    return {
      traineeId: progressData.trainee_id,
      traineeName: progressData.trainee_name,
      cartType: progressData.cart_type,
      email: progressData.email || '',
      phone: progressData.phone || '',
      department: progressData.department || '',
      supervisor: progressData.supervisor || '',
      hireDate: progressData.hire_date || '',
      jobRole: progressData.job_role || '',
      certifications: progressData.certifications || [],
      emergencyContact: progressData.emergency_contact || '',
      notes: progressData.notes || '',
      startedAt: progressData.started_at || progressData.created_at,
      lastActivity: progressData.last_activity,
      completedAt: progressData.completed_at,
      completedModules,
      currentModule: null,
      currentStep: null,
      moduleProgress,
    };
  }
}

export default new ProgressTracker();
