import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { join } from 'path';
import { config } from '../utils/config.js';
import { readJSON, writeJSON, ensureDir } from '../storage/fileStorage.js';
import { existsSync } from 'fs';
import { supabase, isSupabaseConfigured } from './supabase.js';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

class AuthService {
  constructor() {
    this.usersPath = config.usersPath;
    this.useSupabase = isSupabaseConfigured();
    if (this.useSupabase) {
      console.log('🔗 AuthService using Supabase');
    } else {
      console.log('📁 AuthService using file storage');
    }
  }

  async init() {
    if (!this.useSupabase) {
      await ensureDir(this.usersPath);
    }
  }

  // ============================================
  // USER RETRIEVAL
  // ============================================
  async getUser(userId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('employee_id', userId)
        .single();
      
      if (error || !data) return null;
      return this.mapFromDb(data);
    } else {
      try {
        const filePath = join(this.usersPath, `${userId}.json`);
        if (!existsSync(filePath)) return null;
        return await readJSON(filePath);
      } catch (error) {
        return null;
      }
    }
  }

  async getUserByEmployeeId(employeeId) {
    return await this.getUser(employeeId);
  }

  // ============================================
  // USER CREATION
  // ============================================
  async createUser(employeeId, password, userData = {}) {
    await this.init();
    
    const existingUser = await this.getUser(employeeId);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('users')
        .insert({
          employee_id: employeeId,
          password_hash: passwordHash,
          name: userData.name || '',
          email: userData.email || '',
          role: userData.role || 'trainee',
          job_role: userData.jobRole || '',
          department: userData.department || '',
          hire_date: userData.hireDate || null,
          certifications: userData.certifications || [],
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return this.mapFromDb(data, true);
    } else {
      const user = {
        id: employeeId,
        employeeId,
        passwordHash,
        name: userData.name || '',
        email: userData.email || '',
        role: userData.role || 'trainee',
        jobRole: userData.jobRole || '',
        department: userData.department || '',
        hireDate: userData.hireDate || null,
        certifications: userData.certifications || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: null,
        isActive: true,
      };

      const filePath = join(this.usersPath, `${employeeId}.json`);
      await writeJSON(filePath, user);

      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    }
  }

  // ============================================
  // AUTHENTICATION
  // ============================================
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async login(employeeId, password) {
    const user = await this.getUser(employeeId);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.isActive === false) {
      throw new Error('Account is disabled');
    }

    const isValid = await this.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    if (this.useSupabase) {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('employee_id', employeeId);
    } else {
      user.lastLogin = new Date().toISOString();
      const filePath = join(this.usersPath, `${employeeId}.json`);
      await writeJSON(filePath, user);
    }

    const token = this.generateToken(user);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

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

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  // ============================================
  // PASSWORD MANAGEMENT
  // ============================================
  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const isValid = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) throw new Error('Current password is incorrect');

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    if (this.useSupabase) {
      await supabase
        .from('users')
        .update({ password_hash: newHash })
        .eq('employee_id', userId);
    } else {
      user.passwordHash = newHash;
      user.updatedAt = new Date().toISOString();
      const filePath = join(this.usersPath, `${userId}.json`);
      await writeJSON(filePath, user);
    }

    return { success: true, message: 'Password changed successfully' };
  }

  async resetPassword(userId, newPassword) {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    if (this.useSupabase) {
      await supabase
        .from('users')
        .update({ 
          password_hash: newHash,
          password_reset_at: new Date().toISOString(),
        })
        .eq('employee_id', userId);
    } else {
      user.passwordHash = newHash;
      user.updatedAt = new Date().toISOString();
      user.passwordResetAt = new Date().toISOString();
      user.passwordResetByAdmin = true;
      const filePath = join(this.usersPath, `${userId}.json`);
      await writeJSON(filePath, user);
    }

    return { success: true, message: 'Password reset successfully' };
  }

  // ============================================
  // USER UPDATES
  // ============================================
  async updateUser(userId, updates) {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    if (this.useSupabase) {
      const dbUpdates = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.jobRole !== undefined) dbUpdates.job_role = updates.jobRole;
      if (updates.department !== undefined) dbUpdates.department = updates.department;
      if (updates.hireDate !== undefined) dbUpdates.hire_date = updates.hireDate;
      if (updates.certifications !== undefined) dbUpdates.certifications = updates.certifications;

      const { data, error } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('employee_id', userId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return this.mapFromDb(data, true);
    } else {
      const allowedFields = ['name', 'email', 'role', 'isActive', 'jobRole', 'department', 'hireDate', 'certifications'];
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
  }

  // ============================================
  // ADMIN FUNCTIONS
  // ============================================
  async getAllUsers() {
    await this.init();

    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data.map(u => this.mapFromDb(u, true));
    } else {
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
  }

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

  // ============================================
  // HELPERS
  // ============================================
  mapFromDb(dbUser, excludePassword = false) {
    const user = {
      id: dbUser.employee_id,
      employeeId: dbUser.employee_id,
      passwordHash: dbUser.password_hash,
      name: dbUser.name || '',
      email: dbUser.email || '',
      role: dbUser.role || 'trainee',
      jobRole: dbUser.job_role || '',
      department: dbUser.department || '',
      hireDate: dbUser.hire_date,
      certifications: dbUser.certifications || [],
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
      lastLogin: dbUser.last_login,
      isActive: dbUser.is_active !== false,
    };

    if (excludePassword) {
      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    }
    return user;
  }
}

export default new AuthService();
