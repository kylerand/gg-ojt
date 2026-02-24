import { join } from 'path';
import { config } from '../utils/config.js';
import { readJSON, listFiles, writeJSON, deleteFile } from '../storage/fileStorage.js';
import { supabase, isSupabaseConfigured } from './supabase.js';
import ModuleLoader from './ModuleLoader.js';

class LearningPathLoader {
  constructor() {
    this.pathsDir = join(config.dataPath, 'paths');
    this.cache = new Map();
    this.useSupabase = isSupabaseConfigured();

    if (this.useSupabase) {
      console.log('🔗 LearningPathLoader using Supabase database');
    } else {
      console.log('📁 LearningPathLoader using file storage');
    }
  }

  // ============================================
  // DATABASE MAPPING HELPERS
  // ============================================

  mapFromDb(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description || '',
      thumbnailUrl: row.thumbnail_url || '',
      moduleIds: row.module_ids || [],
      sortOrder: row.sort_order || 0,
      isActive: row.is_active !== false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  mapToDb(path) {
    return {
      id: path.id,
      title: path.title,
      description: path.description || '',
      thumbnail_url: path.thumbnailUrl || '',
      module_ids: path.moduleIds || [],
      sort_order: path.sortOrder || 0,
      is_active: path.isActive !== false,
    };
  }

  // ============================================
  // READ OPERATIONS
  // ============================================

  // Load all learning paths (raw data, no module enrichment)
  async getAllRawPaths() {
    try {
      if (this.useSupabase) {
        return await this.getAllPathsFromSupabase();
      }
      return await this.getAllPathsFromFiles();
    } catch (error) {
      throw new Error(`Failed to load learning paths: ${error.message}`);
    }
  }

  async getAllPathsFromFiles() {
    const files = await listFiles(this.pathsDir);
    const pathFiles = files.filter(f => f.endsWith('.json')).sort();
    const paths = await Promise.all(
      pathFiles.map(file => this.getPathFromFile(file.replace('.json', '')))
    );
    return paths.filter(Boolean).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  async getAllPathsFromSupabase() {
    const { data, error } = await supabase
      .from('learning_paths')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      console.error('Failed to load learning paths from Supabase:', error);
      console.log('⚠️ Falling back to file storage for learning paths');
      return await this.getAllPathsFromFiles();
    }

    return data.map(row => this.mapFromDb(row));
  }

  async getPathFromFile(pathId) {
    try {
      const filePath = join(this.pathsDir, `${pathId}.json`);
      return await readJSON(filePath);
    } catch {
      return null;
    }
  }

  async getPathFromSupabase(pathId) {
    const { data, error } = await supabase
      .from('learning_paths')
      .select('*')
      .eq('id', pathId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapFromDb(data);
  }

  // Load all paths enriched with module metadata
  async getAllPaths() {
    const rawPaths = await this.getAllRawPaths();
    const moduleList = await ModuleLoader.getModuleList();
    const moduleMap = new Map(moduleList.map(m => [m.id, m]));
    return rawPaths.map(p => this._enrich(p, moduleMap));
  }

  // Load a single learning path enriched with module metadata
  async getPath(pathId) {
    if (this.cache.has(pathId)) {
      return this.cache.get(pathId);
    }

    try {
      let raw;
      if (this.useSupabase) {
        raw = await this.getPathFromSupabase(pathId);
      }

      if (!raw) {
        raw = await this.getPathFromFile(pathId);
      }

      if (!raw) return null;

      const moduleList = await ModuleLoader.getModuleList();
      const moduleMap = new Map(moduleList.map(m => [m.id, m]));
      const enriched = this._enrich(raw, moduleMap);

      this.cache.set(pathId, enriched);
      return enriched;
    } catch {
      return null;
    }
  }

  _enrich(pathData, moduleMap) {
    const modules = (pathData.moduleIds || [])
      .map(id => moduleMap.get(id))
      .filter(Boolean);
    return { ...pathData, modules };
  }

  // Return all paths filtered by job role
  async getPathsForJobRole(jobRole, userRole) {
    const allPaths = await this.getAllPaths();
    const allowedModules = await ModuleLoader.getModulesForJobRole(jobRole, userRole);
    const allowedIds = new Set(allowedModules.map(m => m.id));

    // A path is visible if at least one of its modules is accessible to the user
    return allPaths.filter(path =>
      path.modules.some(m => allowedIds.has(m.id))
    );
  }

  // Check whether a path exists
  async pathExists(pathId) {
    try {
      if (this.useSupabase) {
        // When Supabase is configured, only consult Supabase
        const { data, error } = await supabase
          .from('learning_paths')
          .select('id')
          .eq('id', pathId)
          .eq('is_active', true)
          .single();

        return !error && !!data;
      }

      // File-only storage
      const raw = await this.getPathFromFile(pathId);
      return raw !== null;
    } catch {
      return false;
    }
  }

  // ============================================
  // WRITE OPERATIONS
  // ============================================

  async savePath(pathData) {
    if (this.useSupabase) {
      await this.savePathToSupabase(pathData);
    } else {
      await this.savePathToFile(pathData);
    }
    this.cache.delete(pathData.id);
    return pathData;
  }

  async savePathToFile(pathData) {
    const filePath = join(this.pathsDir, `${pathData.id}.json`);
    await writeJSON(filePath, pathData);
  }

  async savePathToSupabase(pathData) {
    const dbData = this.mapToDb(pathData);

    const { error } = await supabase
      .from('learning_paths')
      .upsert(dbData, { onConflict: 'id' });

    if (error) {
      console.error('Failed to save learning path to Supabase:', error);
      throw new Error(`Failed to save learning path: ${error.message}`);
    }
  }

  async deletePath(pathId) {
    if (this.useSupabase) {
      await this.deletePathFromSupabase(pathId);
    } else {
      const filePath = join(this.pathsDir, `${pathId}.json`);
      await deleteFile(filePath);
    }
    this.cache.delete(pathId);
  }

  async deletePathFromSupabase(pathId) {
    // Soft delete – set is_active to false
    const { error } = await supabase
      .from('learning_paths')
      .update({ is_active: false })
      .eq('id', pathId);

    if (error) {
      console.error('Failed to delete learning path from Supabase:', error);
      throw new Error(`Failed to delete learning path: ${error.message}`);
    }
  }

  // ============================================
  // SYNC & MIGRATION
  // ============================================

  // Sync learning paths from files to Supabase (skip existing)
  async syncPathsToSupabase() {
    if (!this.useSupabase) {
      console.log('Supabase not configured, skipping learning path sync');
      return { synced: 0, failed: 0 };
    }

    console.log('🔄 Syncing learning paths from files to Supabase...');
    const filePaths = await this.getAllPathsFromFiles();

    let synced = 0;
    let failed = 0;

    for (const path of filePaths) {
      try {
        const existing = await this.getPathFromSupabase(path.id);
        if (existing) {
          console.log(`  ⏭️ Skipped (already exists): ${path.id}`);
          continue;
        }

        await this.savePathToSupabase(path);
        console.log(`  ✅ Synced: ${path.id}`);
        synced++;
      } catch (error) {
        console.error(`  ❌ Failed to sync ${path.id}:`, error.message);
        failed++;
      }
    }

    console.log(`✅ Learning path sync complete. Synced: ${synced}, Failed: ${failed}`);
    return { synced, failed };
  }

  // Force sync (overwrites existing)
  async forceSyncPathsToSupabase() {
    if (!this.useSupabase) {
      console.log('Supabase not configured, skipping learning path sync');
      return { synced: 0, failed: 0 };
    }

    console.log('🔄 Force syncing learning paths from files to Supabase...');
    const filePaths = await this.getAllPathsFromFiles();

    let synced = 0;
    let failed = 0;

    for (const path of filePaths) {
      try {
        await this.savePathToSupabase(path);
        console.log(`  ✅ Synced: ${path.id}`);
        synced++;
      } catch (error) {
        console.error(`  ❌ Failed to sync ${path.id}:`, error.message);
        failed++;
      }
    }

    console.log(`✅ Force sync complete. Synced: ${synced}, Failed: ${failed}`);
    return { synced, failed };
  }

  clearCache() {
    this.cache.clear();
  }
}

export default new LearningPathLoader();
