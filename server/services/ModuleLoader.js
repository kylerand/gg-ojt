import { join } from 'path';
import { config } from '../utils/config.js';
import { readJSON, listFiles, writeJSON } from '../storage/fileStorage.js';
import { supabase, isSupabaseConfigured } from './supabase.js';

// Job roles that should see ALL modules (not filtered)
const UNRESTRICTED_ROLES = ['admin', 'supervisor', 'Supervisor', 'Trainer'];

class ModuleLoader {
  constructor() {
    this.modulesPath = join(config.dataPath, 'modules');
    this.cartsPath = join(config.dataPath, 'carts');
    this.cache = new Map();
    this.useSupabase = isSupabaseConfigured();
    
    if (this.useSupabase) {
      console.log('🔗 ModuleLoader using Supabase database');
    } else {
      console.log('📁 ModuleLoader using file storage');
    }
  }

  // ============================================
  // DATABASE MAPPING HELPERS
  // ============================================
  
  // Convert database row to module object (camelCase)
  mapFromDb(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description || '',
      estimatedTime: row.estimated_time || '',
      thumbnailUrl: row.thumbnail_url || '',
      prerequisites: row.prerequisites || [],
      requiresSupervisorSignoff: row.requires_supervisor_signoff || false,
      jobRoles: row.job_roles || [],
      steps: row.steps || [],
      knowledgeChecks: row.knowledge_checks || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isActive: row.is_active !== false,
      sortOrder: row.sort_order || 0,
    };
  }

  // Convert module object to database row (snake_case)
  mapToDb(module) {
    return {
      id: module.id,
      title: module.title,
      description: module.description || '',
      estimated_time: module.estimatedTime || '',
      thumbnail_url: module.thumbnailUrl || '',
      prerequisites: module.prerequisites || [],
      requires_supervisor_signoff: module.requiresSupervisorSignoff || false,
      job_roles: module.jobRoles || [],
      steps: module.steps || [],
      knowledge_checks: module.knowledgeChecks || [],
      is_active: module.isActive !== false,
      sort_order: module.sortOrder || 0,
    };
  }

  // ============================================
  // READ OPERATIONS
  // ============================================

  // Load all training modules
  async getAllModules() {
    try {
      if (this.useSupabase) {
        return await this.getAllModulesFromSupabase();
      }
      return await this.getAllModulesFromFiles();
    } catch (error) {
      throw new Error(`Failed to load modules: ${error.message}`);
    }
  }

  async getAllModulesFromFiles() {
    const files = await listFiles(this.modulesPath);
    const moduleFiles = files.filter(f => f.endsWith('.json')).sort();
    
    const modules = await Promise.all(
      moduleFiles.map(file => this.getModuleFromFile(file.replace('.json', '')))
    );
    
    return modules;
  }

  async getAllModulesFromSupabase() {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      console.error('Failed to load modules from Supabase:', error);
      // Fall back to file storage
      console.log('⚠️ Falling back to file storage for modules');
      return await this.getAllModulesFromFiles();
    }

    return data.map(row => this.mapFromDb(row));
  }

  // Load all modules filtered by job role
  async getModulesForJobRole(jobRole, userRole) {
    const allModules = await this.getAllModules();
    
    // Admins and supervisors see all modules
    if (UNRESTRICTED_ROLES.includes(userRole) || UNRESTRICTED_ROLES.includes(jobRole)) {
      return allModules;
    }

    // Filter modules based on job role
    return allModules.filter(module => {
      // If module has no jobRoles specified, it's available to everyone
      if (!module.jobRoles || module.jobRoles.length === 0) {
        return true;
      }
      // Check if user's job role is in the module's allowed roles
      return module.jobRoles.includes(jobRole);
    });
  }

  // Load a specific module
  async getModule(moduleId) {
    if (this.cache.has(moduleId)) {
      return this.cache.get(moduleId);
    }

    try {
      let module;
      if (this.useSupabase) {
        module = await this.getModuleFromSupabase(moduleId);
      }
      
      // If not found in Supabase or Supabase not configured, try file
      if (!module) {
        module = await this.getModuleFromFile(moduleId);
      }
      
      if (module) {
        this.cache.set(moduleId, module);
      }
      return module;
    } catch (error) {
      throw new Error(`Module not found: ${moduleId}`);
    }
  }

  async getModuleFromFile(moduleId) {
    const filePath = join(this.modulesPath, `${moduleId}.json`);
    return await readJSON(filePath);
  }

  async getModuleFromSupabase(moduleId) {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('id', moduleId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapFromDb(data);
  }

  // ============================================
  // WRITE OPERATIONS
  // ============================================

  // Save a module (create or update)
  async saveModule(moduleData) {
    if (this.useSupabase) {
      await this.saveModuleToSupabase(moduleData);
    } else {
      // File-only storage for local development
      await this.saveModuleToFile(moduleData);
    }
    
    // Clear cache
    this.cache.delete(moduleData.id);
    
    return moduleData;
  }

  async saveModuleToFile(moduleData) {
    const filePath = join(this.modulesPath, `${moduleData.id}.json`);
    await writeJSON(filePath, moduleData);
  }

  async saveModuleToSupabase(moduleData) {
    const dbData = this.mapToDb(moduleData);
    
    const { error } = await supabase
      .from('modules')
      .upsert(dbData, {
        onConflict: 'id',
      });

    if (error) {
      console.error('Failed to save module to Supabase:', error);
      throw new Error(`Failed to save module: ${error.message}`);
    }
  }

  // Delete a module
  async deleteModule(moduleId) {
    if (this.useSupabase) {
      await this.deleteModuleFromSupabase(moduleId);
    }
    
    // Clear cache
    this.cache.delete(moduleId);
  }

  async deleteModuleFromSupabase(moduleId) {
    // Soft delete - set is_active to false
    const { error } = await supabase
      .from('modules')
      .update({ is_active: false })
      .eq('id', moduleId);

    if (error) {
      console.error('Failed to delete module from Supabase:', error);
      throw new Error(`Failed to delete module: ${error.message}`);
    }
  }

  // Check if a module exists
  async moduleExists(moduleId) {
    try {
      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('modules')
          .select('id')
          .eq('id', moduleId)
          .eq('is_active', true)
          .single();
        
        if (!error && data) return true;
      }
      
      // Check file as fallback
      try {
        const filePath = join(this.modulesPath, `${moduleId}.json`);
        await readJSON(filePath);
        return true;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }

  // ============================================
  // SYNC & MIGRATION
  // ============================================

  // Sync modules from files to Supabase (for initial migration)
  async syncModulesToSupabase() {
    if (!this.useSupabase) {
      console.log('Supabase not configured, skipping sync');
      return { synced: 0, failed: 0 };
    }

    console.log('🔄 Syncing modules from files to Supabase...');
    const fileModules = await this.getAllModulesFromFiles();
    
    let synced = 0;
    let failed = 0;

    for (const module of fileModules) {
      try {
        // Check if module already exists in Supabase
        const existing = await this.getModuleFromSupabase(module.id);
        if (existing) {
          console.log(`  ⏭️ Skipped (already exists): ${module.id}`);
          continue;
        }
        
        await this.saveModuleToSupabase(module);
        console.log(`  ✅ Synced: ${module.id}`);
        synced++;
      } catch (error) {
        console.error(`  ❌ Failed to sync ${module.id}:`, error.message);
        failed++;
      }
    }
    
    console.log(`✅ Module sync complete. Synced: ${synced}, Failed: ${failed}`);
    return { synced, failed };
  }

  // Force sync (overwrites existing)
  async forceSyncModulesToSupabase() {
    if (!this.useSupabase) {
      console.log('Supabase not configured, skipping sync');
      return { synced: 0, failed: 0 };
    }

    console.log('🔄 Force syncing modules from files to Supabase...');
    const fileModules = await this.getAllModulesFromFiles();
    
    let synced = 0;
    let failed = 0;

    for (const module of fileModules) {
      try {
        await this.saveModuleToSupabase(module);
        console.log(`  ✅ Synced: ${module.id}`);
        synced++;
      } catch (error) {
        console.error(`  ❌ Failed to sync ${module.id}:`, error.message);
        failed++;
      }
    }
    
    console.log(`✅ Force sync complete. Synced: ${synced}, Failed: ${failed}`);
    return { synced, failed };
  }

  // Load cart configuration
  async getCartConfig(cartType) {
    try {
      const filePath = join(this.cartsPath, `${cartType}.json`);
      return await readJSON(filePath);
    } catch (error) {
      throw new Error(`Cart configuration not found: ${cartType}`);
    }
  }

  // Get module list (metadata only)
  async getModuleList(jobRole = null, userRole = null) {
    let modules;
    
    if (jobRole || userRole) {
      modules = await this.getModulesForJobRole(jobRole, userRole);
    } else {
      modules = await this.getAllModules();
    }
    
    return modules.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      estimatedTime: m.estimatedTime,
      thumbnailUrl: m.thumbnailUrl,
      prerequisites: m.prerequisites || [],
      stepCount: m.steps?.length || 0,
      requiresSupervisorSignoff: m.requiresSupervisorSignoff || false,
      jobRoles: m.jobRoles || [],
    }));
  }

  // Clear cache (for development)
  clearCache() {
    this.cache.clear();
  }
}

export default new ModuleLoader();
