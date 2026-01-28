import { join } from 'path';
import { config } from '../utils/config.js';
import { readJSON, listFiles } from '../storage/fileStorage.js';

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
  async getModuleList() {
    const modules = await this.getAllModules();
    return modules.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      estimatedTime: m.estimatedTime,
      thumbnailUrl: m.thumbnailUrl,
      prerequisites: m.prerequisites || [],
      stepCount: m.steps?.length || 0,
      requiresSupervisorSignoff: m.requiresSupervisorSignoff || false,
    }));
  }

  // Clear cache (for development)
  clearCache() {
    this.cache.clear();
  }
}

export default new ModuleLoader();
