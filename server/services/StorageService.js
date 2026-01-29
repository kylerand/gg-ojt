import { supabase, isSupabaseConfigured } from './supabase.js';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { config } from '../utils/config.js';

const BUCKET_NAME = 'training-media';

class StorageService {
  constructor() {
    this.useSupabase = isSupabaseConfigured();
    this.localUploadPath = join(config.dataPath, '../uploads');
    
    if (this.useSupabase) {
      console.log('🔗 StorageService using Supabase Storage');
    } else {
      console.log('📁 StorageService using local file storage');
    }
  }

  async init() {
    if (!this.useSupabase) {
      // Create local upload directories
      const dirs = ['videos', 'images', 'thumbnails'];
      for (const dir of dirs) {
        const dirPath = join(this.localUploadPath, dir);
        if (!existsSync(dirPath)) {
          await mkdir(dirPath, { recursive: true });
        }
      }
    }
  }

  /**
   * Upload a video file
   * @param {Buffer} fileBuffer - The file data
   * @param {string} filename - Original filename
   * @param {string} mimetype - MIME type
   * @returns {Promise<{url: string, path: string}>}
   */
  async uploadVideo(fileBuffer, filename, mimetype) {
    const sanitizedName = this.sanitizeFilename(filename);
    const path = `videos/${Date.now()}-${sanitizedName}`;

    if (this.useSupabase) {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, fileBuffer, {
          contentType: mimetype,
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Failed to upload video: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(path);

      return {
        url: urlData.publicUrl,
        path: data.path,
      };
    } else {
      // Local storage fallback
      await this.init();
      const localPath = join(this.localUploadPath, path);
      await mkdir(join(this.localUploadPath, 'videos'), { recursive: true });
      await writeFile(localPath, fileBuffer);

      return {
        url: `/uploads/${path}`,
        path: path,
      };
    }
  }

  /**
   * Upload an image (thumbnail, etc.)
   * @param {Buffer} fileBuffer - The file data
   * @param {string} filename - Original filename
   * @param {string} mimetype - MIME type
   * @param {string} type - Type of image (thumbnail, etc.)
   * @returns {Promise<{url: string, path: string}>}
   */
  async uploadImage(fileBuffer, filename, mimetype, type = 'images') {
    const sanitizedName = this.sanitizeFilename(filename);
    const folder = type === 'thumbnail' ? 'thumbnails' : 'images';
    const path = `${folder}/${Date.now()}-${sanitizedName}`;

    if (this.useSupabase) {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, fileBuffer, {
          contentType: mimetype,
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(path);

      return {
        url: urlData.publicUrl,
        path: data.path,
      };
    } else {
      await this.init();
      const localPath = join(this.localUploadPath, path);
      await mkdir(join(this.localUploadPath, folder), { recursive: true });
      await writeFile(localPath, fileBuffer);

      return {
        url: `/uploads/${path}`,
        path: path,
      };
    }
  }

  /**
   * Delete a file from storage
   * @param {string} path - File path in storage
   */
  async deleteFile(path) {
    if (this.useSupabase) {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([path]);

      if (error) {
        console.error(`Failed to delete file: ${error.message}`);
      }
    } else {
      // Local delete - implement if needed
      console.log(`Would delete local file: ${path}`);
    }
  }

  /**
   * Get a signed URL for private access (if needed)
   * @param {string} path - File path
   * @param {number} expiresIn - Seconds until expiry
   */
  async getSignedUrl(path, expiresIn = 3600) {
    if (this.useSupabase) {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(path, expiresIn);

      if (error) {
        throw new Error(`Failed to create signed URL: ${error.message}`);
      }

      return data.signedUrl;
    } else {
      return `/uploads/${path}`;
    }
  }

  /**
   * List files in a folder
   * @param {string} folder - Folder path
   */
  async listFiles(folder = '') {
    if (this.useSupabase) {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(folder, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        throw new Error(`Failed to list files: ${error.message}`);
      }

      return data;
    } else {
      // Local implementation
      return [];
    }
  }

  /**
   * Sanitize filename for safe storage
   */
  sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/__+/g, '_')
      .toLowerCase();
  }
}

export default new StorageService();
