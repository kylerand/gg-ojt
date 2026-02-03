import { join } from 'path';
import { config } from '../utils/config.js';
import { readJSON, listFiles } from '../storage/fileStorage.js';

// Job roles that should see ALL modules (not filtered)
const UNRESTRICTED_ROLES = ['admin', 'supervisor', 'Supervisor', 'Trainer'];

class ModuleLoader {
  constructor() {
    this.modulesPath = join(config.dataPath, 'modules');
    this.cartsPath = join(config.dataPath, 'carts');
    this.cache = new Map();
  }

  // Load all training modules
  async getAllModules() {
    try {
      const files = await listFiles(this.modulesPath);
      const moduleFiles = files.filter(f => f.endsWith('.json')).sort();
      
      const modules = await Promise.all(
        moduleFiles.map(file => this.getModule(file.replace('.json', '')))
      );
      
      return modules;
    } catch (error) {
      throw new Error(`Failed to load modules: ${error.message}`);
    }
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
      const filePath = join(this.modulesPath, `${moduleId}.json`);
      const module = await readJSON(filePath);
      this.cache.set(moduleId, module);
      return module;
    } catch (error) {
      throw new Error(`Module not found: ${moduleId}`);
    }
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
