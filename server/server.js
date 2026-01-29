import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables FIRST before any other imports that need them
dotenv.config({ path: join(dirname(dirname(fileURLToPath(import.meta.url))), '.env') });

// Import routes (these may depend on env vars)
const { default: modulesRouter } = await import('./routes/modules.js');
const { default: progressRouter } = await import('./routes/progress.js');
const { default: traineesRouter } = await import('./routes/trainees.js');
const { default: adminRouter } = await import('./routes/admin.js');
const { default: authRouter } = await import('./routes/auth.js');

// Import middleware
const { errorHandler } = await import('./middleware/errorHandler.js');
const { logger } = await import('./middleware/logger.js');

// Import services
const { default: AuthService } = await import('./services/AuthService.js');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration for production
const corsOptions = {
  origin: process.env.CLIENT_URL || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(logger);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/modules', modulesRouter);
app.use('/api/progress', progressRouter);
app.use('/api/trainees', traineesRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Initialize and start server
const startServer = async () => {
  try {
    // Ensure admin user exists
    await AuthService.ensureAdminExists();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 Training API available at http://localhost:${PORT}/api`);
      console.log(`🔐 Auth API available at http://localhost:${PORT}/api/auth`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
