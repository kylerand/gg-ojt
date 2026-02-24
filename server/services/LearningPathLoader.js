import { join } from 'path';
import { config } from '../utils/config.js';
import { readJSON, listFiles, writeJSON } from '../storage/fileStorage.js';
import { supabase, isSupabaseConfigured } from './supabase.js';

class LearningPathLoader {
  constructor() {
    this.learningPathsPath = join(config.dataPath, 'learning-paths');
    this.cache = new Map();
    this.useSupabase = isSupabaseConfigured();
    console.log('🔗 LearningPathLoader using Supabase (default)');
  }

  // ============================================
  // DATABASE MAPPING HELPERS
  // ============================================

  mapFromDb(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description || '',
      estimatedTime: row.estimated_time || '',
      thumbnailUrl: row.thumbnail_url || '',
      moduleIds: row.module_ids || [],
      knowledgeChecks: row.knowledge_checks || [],
      isActive: row.is_active !== false,
      sortOrder: row.sort_order || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  mapToDb(learningPath) {
    return {
      id: learningPath.id,
      title: learningPath.title,
      description: learningPath.description || '',
      estimated_time: learningPath.estimatedTime || '',
      thumbnail_url: learningPath.thumbnailUrl || '',
      module_ids: learningPath.moduleIds || [],
      knowledge_checks: learningPath.knowledgeChecks || [],
      is_active: learningPath.isActive !== false,
      sort_order: learningPath.sortOrder || 0,
    };
  }

  // ============================================
  // READ OPERATIONS
  // ============================================

  async getAllLearningPaths() {
    try {
      if (this.useSupabase) {
        const result = await this.getAllLearningPathsFromSupabase();
        if (result) return result;
      }
      return await this.getAllLearningPathsFromFiles();
    } catch (error) {
      throw new Error(`Failed to load learning paths (${this.useSupabase ? 'Supabase' : 'file storage'}): ${error.message}`);
    }
  }

  async getAllLearningPathsFromFiles() {
    try {
      const files = await listFiles(this.learningPathsPath);
      const lpFiles = files.filter(f => f.endsWith('.json')).sort();
      const paths = await Promise.all(
        lpFiles.map(file => this.getLearningPathFromFile(file.replace('.json', '')))
      );
      return paths.filter(Boolean);
    } catch (error) {
      // If directory doesn't exist, return empty array
      return [];
    }
  }

  async getAllLearningPathsFromSupabase() {
    try {
      const { data, error } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });

      if (error) {
        console.warn('⚠️ Falling back to file storage for learning paths:', error.message);
        return await this.getAllLearningPathsFromFiles();
      }

      return data.map(row => this.mapFromDb(row));
    } catch {
      return await this.getAllLearningPathsFromFiles();
    }
  }

  async getLearningPath(learningPathId) {
    if (this.cache.has(learningPathId)) {
      return this.cache.get(learningPathId);
    }

    try {
      let learningPath;
      if (this.useSupabase) {
        learningPath = await this.getLearningPathFromSupabase(learningPathId);
      }

      if (!learningPath) {
        learningPath = await this.getLearningPathFromFile(learningPathId);
      }

      if (learningPath) {
        this.cache.set(learningPathId, learningPath);
      }
      return learningPath;
    } catch (error) {
      throw new Error(`Learning path not found: ${learningPathId}`);
    }
  }

  async getLearningPathFromFile(learningPathId) {
    const filePath = join(this.learningPathsPath, `${learningPathId}.json`);
    return await readJSON(filePath);
  }

  async getLearningPathFromSupabase(learningPathId) {
    try {
      const { data, error } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('id', learningPathId)
        .single();

      if (error || !data) return null;
      return this.mapFromDb(data);
    } catch {
      return null;
    }
  }

  // ============================================
  // WRITE OPERATIONS
  // ============================================

  async saveLearningPath(learningPathData) {
    if (this.useSupabase) {
      await this.saveLearningPathToSupabase(learningPathData);
    } else {
      await this.saveLearningPathToFile(learningPathData);
    }
    this.cache.delete(learningPathData.id);
    return learningPathData;
  }

  async saveLearningPathToFile(learningPathData) {
    const filePath = join(this.learningPathsPath, `${learningPathData.id}.json`);
    await writeJSON(filePath, learningPathData);
  }

  async saveLearningPathToSupabase(learningPathData) {
    const dbData = this.mapToDb(learningPathData);
    const { error } = await supabase
      .from('learning_paths')
      .upsert(dbData, { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to save learning path: ${error.message}`);
    }
  }

  async deleteLearningPath(learningPathId) {
    if (this.useSupabase) {
      await this.deleteLearningPathFromSupabase(learningPathId);
    }
    this.cache.delete(learningPathId);
  }

  async deleteLearningPathFromSupabase(learningPathId) {
    const { error } = await supabase
      .from('learning_paths')
      .update({ is_active: false })
      .eq('id', learningPathId);

    if (error) {
      throw new Error(`Failed to delete learning path: ${error.message}`);
    }
  }

  async learningPathExists(learningPathId) {
    try {
      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('learning_paths')
          .select('id')
          .eq('id', learningPathId)
          .eq('is_active', true)
          .single();

        if (!error && data) return true;
      }

      try {
        const filePath = join(this.learningPathsPath, `${learningPathId}.json`);
        await readJSON(filePath);
        return true;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }

  // Get learning path list (metadata only, with module count)
  async getLearningPathList() {
    const paths = await this.getAllLearningPaths();
    return paths.map(lp => ({
      id: lp.id,
      title: lp.title,
      description: lp.description,
      estimatedTime: lp.estimatedTime,
      thumbnailUrl: lp.thumbnailUrl,
      moduleIds: lp.moduleIds || [],
      moduleCount: lp.moduleIds?.length || 0,
      knowledgeCheckCount: lp.knowledgeChecks?.length || 0,
      sortOrder: lp.sortOrder || 0,
    }));
  }

  clearCache() {
    this.cache.clear();
  }

  // ============================================
  // SYNC & SEEDING
  // ============================================

  // Sync learning paths from files to Supabase (skips existing)
  async syncLearningPathsToSupabase() {
    console.log('🔄 Syncing learning paths from files to Supabase...');
    const filePaths = await this.getAllLearningPathsFromFiles();

    let synced = 0;
    let failed = 0;

    for (const lp of filePaths) {
      try {
        const existing = await this.getLearningPathFromSupabase(lp.id);
        if (existing) {
          console.log(`  ⏭️ Skipped (already exists): ${lp.id}`);
          continue;
        }

        await this.saveLearningPathToSupabase(lp);
        console.log(`  ✅ Synced: ${lp.id}`);
        synced++;
      } catch (error) {
        console.error(`  ❌ Failed to sync ${lp.id}:`, error.message);
        failed++;
      }
    }

    console.log(`✅ Learning path sync complete. Synced: ${synced}, Failed: ${failed}`);
    return { synced, failed };
  }

  // Force sync (overwrites existing)
  async forceSyncLearningPathsToSupabase() {
    console.log('🔄 Force syncing learning paths from files to Supabase...');
    const filePaths = await this.getAllLearningPathsFromFiles();

    let synced = 0;
    let failed = 0;

    for (const lp of filePaths) {
      try {
        await this.saveLearningPathToSupabase(lp);
        console.log(`  ✅ Synced: ${lp.id}`);
        synced++;
      } catch (error) {
        console.error(`  ❌ Failed to sync ${lp.id}:`, error.message);
        failed++;
      }
    }

    console.log(`✅ Force sync complete. Synced: ${synced}, Failed: ${failed}`);
    return { synced, failed };
  }
}

export default new LearningPathLoader();
