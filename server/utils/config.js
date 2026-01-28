import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  dataPath: process.env.DATA_PATH || join(__dirname, '../../data'),
  progressPath: process.env.PROGRESS_PATH || join(__dirname, '../../progress'),
  videoCdnUrl: process.env.VIDEO_CDN_URL || '',
};
