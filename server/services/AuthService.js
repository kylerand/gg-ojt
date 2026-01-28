import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { join } from 'path';
import { config } from '../utils/config.js';
import { readJSON, writeJSON, ensureDir } from '../storage/fileStorage.js';
import { existsSync } from 'fs';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

class AuthService {
  constructor() {
    this.usersPath = config.usersPath;
  }

  async init() {
    await ensureDir(this.usersPath);
  }

  // Get user by ID
  async getUser(userId) {
    try {
      const filePath = join(this.usersPath, `${userId}.json`);
      if (!existsSync(filePath)) {
        return null;
      }
      return await readJSON(filePath);
    } catch (error) {
      return null;
    }
  }

  // Get user by employee ID (for login)
  async getUserByEmployeeId(employeeId) {
    return await this.getUser(employeeId);
  }

  // Create new user
  async createUser(employeeId, password, userData = {}) {
    await this.init();
    
    // Check if user already exists
    const existingUser = await this.getUser(employeeId);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = {
      id: employeeId,
      employeeId,
      passwordHash,
      name: userData.name || '',
      email: userData.email || '',
      role: userData.role || 'trainee', // 'trainee', 'supervisor', 'admin'
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true,
    };

    const filePath = join(this.usersPath, `${employeeId}.json`);
    await writeJSON(filePath, user);

    // Return user without password hash
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  // Verify password
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Login user
  async login(employeeId, password) {
    const user = await this.getUser(employeeId);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is disabled');
    }

    const isValid = await this.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    const filePath = join(this.usersPath, `${employeeId}.json`);
    await writeJSON(filePath, user);

    // Generate JWT token
    const token = this.generateToken(user);

    // Return user without password hash
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  // Generate JWT token
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        employeeId: user.employeeId,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.updatedAt = new Date().toISOString();

    const filePath = join(this.usersPath, `${userId}.json`);
    await writeJSON(filePath, user);

    return { success: true, message: 'Password changed successfully' };
  }

  // Admin reset password
  async resetPassword(userId, newPassword) {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.updatedAt = new Date().toISOString();
    user.passwordResetAt = new Date().toISOString();
    user.passwordResetByAdmin = true;

    const filePath = join(this.usersPath, `${userId}.json`);
    await writeJSON(filePath, user);

    return { success: true, message: 'Password reset successfully' };
  }

  // Update user profile
  async updateUser(userId, updates) {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Only allow updating specific fields
    const allowedFields = ['name', 'email', 'role', 'isActive'];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    }
    user.updatedAt = new Date().toISOString();

    const filePath = join(this.usersPath, `${userId}.json`);
    await writeJSON(filePath, user);

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  // Get all users (for admin)
  async getAllUsers() {
    await this.init();
    const fs = await import('fs/promises');
    const files = await fs.readdir(this.usersPath);
    const userFiles = files.filter(f => f.endsWith('.json'));

    const users = await Promise.all(
      userFiles.map(async (file) => {
        const user = await readJSON(join(this.usersPath, file));
        const { passwordHash: _, ...safeUser } = user;
        return safeUser;
      })
    );

    return users;
  }

  // Create default admin user if none exists
  async ensureAdminExists() {
    await this.init();
    
    const adminId = process.env.ADMIN_ID || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    const existingAdmin = await this.getUser(adminId);
    if (!existingAdmin) {
      await this.createUser(adminId, adminPassword, {
        name: 'Administrator',
        role: 'admin',
      });
      console.log(`✅ Default admin user created (ID: ${adminId})`);
    }
  }
}

export default new AuthService();
