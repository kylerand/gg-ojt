import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// In Docker/Railway, use /app paths; locally use relative paths
const isProduction = process.env.NODE_ENV === 'production';
const basePath = isProduction ? '/app' : join(__dirname, '../..');

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  dataPath: process.env.DATA_PATH || join(basePath, 'data'),
  progressPath: process.env.PROGRESS_PATH || join(basePath, 'progress'),
  usersPath: process.env.USERS_PATH || join(basePath, 'users'),
  videoCdnUrl: process.env.VIDEO_CDN_URL || '',
};
