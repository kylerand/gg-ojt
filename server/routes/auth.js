import express from 'express';
import AuthService from '../services/AuthService.js';
import ProgressTracker from '../services/ProgressTracker.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register - Register new user
router.post('/register', async (req, res, next) => {
  try {
    const { employeeId, password, name, email } = req.body;

    if (!employeeId || !password) {
      throw new AppError('Employee ID and password are required', 400);
    }

    if (password.length < 4) {
      throw new AppError('Password must be at least 4 characters', 400);
    }

    // Create user account
    const user = await AuthService.createUser(employeeId, password, { name, email });

    // Create trainee progress record
    await ProgressTracker.createProgress(employeeId, name, 'electric-standard');

    // Generate token and log them in
    const loginResult = await AuthService.login(employeeId, password);

    res.status(201).json({
      success: true,
      user: loginResult.user,
      token: loginResult.token,
    });
  } catch (error) {
    if (error.message === 'User already exists') {
      return next(new AppError('Employee ID already registered', 409));
    }
    next(new AppError(error.message, 500));
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res, next) => {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      throw new AppError('Employee ID and password are required', 400);
    }

    const { user, token } = await AuthService.login(employeeId, password);

    // Get trainee progress
    let progress = await ProgressTracker.getProgress(employeeId);
    
    // If no progress exists yet, create it
    if (!progress) {
      progress = await ProgressTracker.createProgress(employeeId, user.name, 'electric-standard');
    }

    res.json({
      success: true,
      user,
      token,
      progress,
    });
  } catch (error) {
    if (error.message === 'Invalid credentials') {
      return next(new AppError('Invalid employee ID or password', 401));
    }
    if (error.message === 'Account is disabled') {
      return next(new AppError('Account is disabled. Contact your administrator.', 403));
    }
    next(new AppError(error.message, 500));
  }
});

// POST /api/auth/logout - Logout user
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await AuthService.getUser(req.user.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { passwordHash: _, ...safeUser } = user;
    const progress = await ProgressTracker.getProgress(req.user.id);

    res.json({
      user: safeUser,
      progress,
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
});

// PUT /api/auth/password - Change password
router.put('/password', authenticateToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400);
    }

    if (newPassword.length < 4) {
      throw new AppError('New password must be at least 4 characters', 400);
    }

    const result = await AuthService.changePassword(req.user.id, currentPassword, newPassword);
    res.json(result);
  } catch (error) {
    if (error.message === 'Current password is incorrect') {
      return next(new AppError(error.message, 401));
    }
    next(new AppError(error.message, 500));
  }
});

// GET /api/auth/users - Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const users = await AuthService.getAllUsers();
    res.json(users);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
});

// PUT /api/auth/users/:userId - Update user (admin only)
router.put('/users/:userId', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const user = await AuthService.updateUser(userId, updates);
    res.json({ success: true, user });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
});

// POST /api/auth/users/:userId/reset-password - Reset password (admin only)
router.post('/users/:userId/reset-password', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 4) {
      throw new AppError('Password must be at least 4 characters', 400);
    }

    const result = await AuthService.resetPassword(userId, newPassword);
    res.json(result);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
});

// POST /api/auth/verify - Verify token is valid
router.post('/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// POST /api/auth/update-password - Update password using recovery token from email
router.post('/update-password', authenticateToken, async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    // Use the user from the recovery token to update password
    const result = await AuthService.updatePasswordWithToken(req.user.id, password);
    res.json(result);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
});

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    const tokens = await AuthService.refreshSession(refreshToken);
    res.json({
      success: true,
      token: tokens.token,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    next(new AppError('Session refresh failed', 401));
  }
});

export default router;
