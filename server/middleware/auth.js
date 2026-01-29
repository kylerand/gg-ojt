import AuthService from '../services/AuthService.js';
import { AppError } from './errorHandler.js';

// Middleware to verify Supabase JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header or cookie
    let token = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    // Verify token with Supabase (async)
    const decoded = await AuthService.verifyToken(token);
    if (!decoded) {
      throw new AppError('Invalid or expired token', 401);
    }

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to check if user is admin
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
    return next(new AppError('Admin access required', 403));
  }
  
  next();
};

// Middleware to check if user is the owner or admin
export const requireOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }
  
  const requestedUserId = req.params.traineeId || req.params.userId;
  
  if (req.user.role === 'admin' || req.user.role === 'supervisor') {
    return next();
  }
  
  if (req.user.id === requestedUserId) {
    return next();
  }
  
  return next(new AppError('Access denied', 403));
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = await AuthService.verifyToken(token);
      if (decoded) {
        req.user = decoded;
      }
    }
    
    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};
