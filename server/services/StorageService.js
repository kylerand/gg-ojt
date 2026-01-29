import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { supabase, isSupabaseConfigured } from './supabase.js';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { config } from '../utils/config.js';

// Storage provider detection
const getStorageProvider = () => {
  if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
    return 'r2';
  }
  if (isSupabaseConfigured()) {
    return 'supabase';
  }
  return 'local';
};

// Cloudflare R2 client
const createR2Client = () => {
  if (!process.env.R2_ACCOUNT_ID) return null;
  
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
};

const R2_BUCKET = process.env.R2_BUCKET_NAME || 'training-media';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g., https://media.yourdomain.com

class StorageService {
  constructor() {
    this.provider = getStorageProvider();
    this.r2Client = createR2Client();
    this.localUploadPath = join(config.dataPath, '../uploads');
    
    console.log(`🔗 StorageService using ${this.provider.toUpperCase()}`);
  }

  async init() {
    if (this.provider === 'local') {
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
   * Upload a video file with progress callback
   * @param {Buffer} fileBuffer - The file data
   * @param {string} filename - Original filename
   * @param {string} mimetype - MIME type
   * @param {Function} onProgress - Progress callback (0-100)
   * @returns {Promise<{url: string, path: string}>}
   */
  async uploadVideo(fileBuffer, filename, mimetype, onProgress = null) {
    const sanitizedName = this.sanitizeFilename(filename);
    const path = `videos/${Date.now()}-${sanitizedName}`;

    if (this.provider === 'r2') {
      return await this.uploadToR2(fileBuffer, path, mimetype, onProgress);
    } else if (this.provider === 'supabase') {
      return await this.uploadToSupabase(fileBuffer, path, mimetype, 'training-media');
    } else {
      return await this.uploadToLocal(fileBuffer, path);
    }
  }

  /**
   * Upload an image
   */
  async uploadImage(fileBuffer, filename, mimetype, type = 'images') {
    const sanitizedName = this.sanitizeFilename(filename);
    const folder = type === 'thumbnail' ? 'thumbnails' : 'images';
    const path = `${folder}/${Date.now()}-${sanitizedName}`;

    if (this.provider === 'r2') {
      return await this.uploadToR2(fileBuffer, path, mimetype);
    } else if (this.provider === 'supabase') {
      return await this.uploadToSupabase(fileBuffer, path, mimetype, 'training-media');
    } else {
      return await this.uploadToLocal(fileBuffer, path);
    }
  }

  /**
   * Upload to Cloudflare R2 with progress tracking
   */
  async uploadToR2(fileBuffer, path, mimetype, onProgress = null) {
    const upload = new Upload({
      client: this.r2Client,
      params: {
        Bucket: R2_BUCKET,
        Key: path,
        Body: fileBuffer,
        ContentType: mimetype,
      },
      queueSize: 4, // Concurrent upload parts
      partSize: 5 * 1024 * 1024, // 5MB parts
    });

    if (onProgress) {
      upload.on('httpUploadProgress', (progress) => {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        onProgress(percent);
      });
    }

    await upload.done();

    // Return public URL
    const url = R2_PUBLIC_URL 
      ? `${R2_PUBLIC_URL}/${path}`
      : `https://${R2_BUCKET}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${path}`;

    return { url, path };
  }

  /**
   * Upload to Supabase Storage
   */
  async uploadToSupabase(fileBuffer, path, mimetype, bucket) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, fileBuffer, {
        contentType: mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  }

  /**
   * Upload to local filesystem
   */
  async uploadToLocal(fileBuffer, path) {
    await this.init();
    const localPath = join(this.localUploadPath, path);
    const dir = join(this.localUploadPath, path.split('/')[0]);
    
    await mkdir(dir, { recursive: true });
    await writeFile(localPath, fileBuffer);

    return {
      url: `/uploads/${path}`,
      path: path,
    };
  }

  /**
   * Delete a file
   */
  async deleteFile(path) {
    try {
      if (this.provider === 'r2') {
        await this.r2Client.send(new DeleteObjectCommand({
          Bucket: R2_BUCKET,
          Key: path,
        }));
      } else if (this.provider === 'supabase') {
        await supabase.storage.from('training-media').remove([path]);
      }
    } catch (error) {
      console.error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get a signed URL for private access
   */
  async getSignedUrl(path, expiresIn = 3600) {
    if (this.provider === 'r2') {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: path,
      });
      return await getSignedUrl(this.r2Client, command, { expiresIn });
    } else if (this.provider === 'supabase') {
      const { data } = await supabase.storage
        .from('training-media')
        .createSignedUrl(path, expiresIn);
      return data?.signedUrl;
    }
    return `/uploads/${path}`;
  }

  /**
   * Sanitize filename
   */
  sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/__+/g, '_')
      .toLowerCase();
  }

  /**
   * Get storage info
   */
  getStorageInfo() {
    return {
      provider: this.provider,
      bucket: this.provider === 'r2' ? R2_BUCKET : 'training-media',
      publicUrl: R2_PUBLIC_URL || null,
    };
  }
}

export default new StorageService();
