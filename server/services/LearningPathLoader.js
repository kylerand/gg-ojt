import { join } from 'path';
import { config } from '../utils/config.js';
import { readJSON, listFiles } from '../storage/fileStorage.js';
import ModuleLoader from './ModuleLoader.js';

class LearningPathLoader {
  constructor() {
    this.pathsDir = join(config.dataPath, 'paths');
    this.cache = new Map();
  }

  // Load all learning paths (metadata + modules list)
  async getAllPaths() {
    const files = await listFiles(this.pathsDir);
    const pathFiles = files.filter(f => f.endsWith('.json')).sort();

    const paths = await Promise.all(
      pathFiles.map(file => this.getPath(file.replace('.json', '')))
    );

    return paths.filter(Boolean).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  // Load a single learning path with full module metadata
  async getPath(pathId) {
    if (this.cache.has(pathId)) {
      return this.cache.get(pathId);
    }

    try {
      const filePath = join(this.pathsDir, `${pathId}.json`);
      const pathData = await readJSON(filePath);

      // Enrich with module metadata (no steps/quizzes – just list info)
      const moduleList = await ModuleLoader.getModuleList();
      const moduleMap = new Map(moduleList.map(m => [m.id, m]));

      const modules = (pathData.moduleIds || [])
        .map(id => moduleMap.get(id))
        .filter(Boolean);

      const enriched = {
        ...pathData,
        modules,
      };

      this.cache.set(pathId, enriched);
      return enriched;
    } catch {
      return null;
    }
  }

  // Return all paths filtered by job role (reuse module filtering logic)
  async getPathsForJobRole(jobRole, userRole) {
    const allPaths = await this.getAllPaths();
    const allowedModules = await ModuleLoader.getModulesForJobRole(jobRole, userRole);
    const allowedIds = new Set(allowedModules.map(m => m.id));

    // A path is visible if at least one of its modules is accessible to the user
    return allPaths.filter(path =>
      path.modules.some(m => allowedIds.has(m.id))
    );
  }

  clearCache() {
    this.cache.clear();
  }
}

export default new LearningPathLoader();
