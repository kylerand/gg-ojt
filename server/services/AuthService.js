import { supabase, isSupabaseConfigured } from './supabase.js';

class AuthService {
  constructor() {
    this.useSupabase = isSupabaseConfigured();
    if (this.useSupabase) {
      console.log('🔗 AuthService using Supabase Auth');
    } else {
      throw new Error('Supabase must be configured for authentication');
    }
  }

  async init() {
    // No initialization needed for Supabase Auth
  }

  // ============================================
  // USER RETRIEVAL
  // ============================================
  async getUser(userId) {
    // Get user profile from our users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('employee_id', userId)
      .single();
    
    if (error || !data) return null;
    return this.mapFromDb(data);
  }

  async getUserByAuthId(authId) {
    // Get user by Supabase Auth ID
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authId)
      .single();
    
    if (error || !data) return null;
    return this.mapFromDb(data);
  }

  async getUserByEmployeeId(employeeId) {
    return await this.getUser(employeeId);
  }

  // ============================================
  // USER CREATION
  // ============================================
  async createUser(employeeId, password, userData = {}) {
    // Check if user already exists
    const existingUser = await this.getUser(employeeId);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create email for Supabase Auth (use provided email or generate one)
    const email = userData.email || `${employeeId}@gg-ojt.local`;

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        employee_id: employeeId,
        name: userData.name || '',
      },
    });

    if (authError) {
      throw new Error(authError.message);
    }

    // Create user profile in our users table
    const { data, error } = await supabase
      .from('users')
      .insert({
        employee_id: employeeId,
        auth_id: authData.user.id,
        name: userData.name || '',
        email: email,
        role: userData.role || 'trainee',
        job_role: userData.jobRole || '',
        department: userData.department || '',
        hire_date: userData.hireDate || null,
        certifications: userData.certifications || [],
      })
      .select()
      .single();

    if (error) {
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(error.message);
    }

    return this.mapFromDb(data, true);
  }

  // ============================================
  // AUTHENTICATION
  // ============================================
  async login(employeeId, password) {
    // Get user profile to find their email
    const userProfile = await this.getUser(employeeId);
    
    if (!userProfile) {
      throw new Error('Invalid credentials');
    }

    if (userProfile.isActive === false) {
      throw new Error('Account is disabled');
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userProfile.email,
      password,
    });

    if (authError) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('employee_id', employeeId);

    // Return user data and Supabase access token
    const safeUser = this.mapFromDb(userProfile, true);
    return { 
      user: safeUser, 
      token: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
    };
  }

  async verifyToken(token) {
    try {
      // Verify the token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return null;
      }

      // Get our user profile
      const userProfile = await this.getUserByAuthId(user.id);
      if (!userProfile) {
        return null;
      }

      return {
        id: userProfile.employeeId,
        employeeId: userProfile.employeeId,
        role: userProfile.role,
        authId: user.id,
      };
    } catch (error) {
      return null;
    }
  }

  async refreshSession(refreshToken) {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    
    if (error) {
      throw new Error('Session refresh failed');
    }

    return {
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  // ============================================
  // PASSWORD MANAGEMENT
  // ============================================
  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new Error('Current password is incorrect');
    }

    // Update password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.authId,
      { password: newPassword }
    );

    if (updateError) {
      throw new Error(updateError.message);
    }

    return { success: true, message: 'Password changed successfully' };
  }

  async resetPassword(userId, newPassword) {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    // Update password using admin API
    const { error } = await supabase.auth.admin.updateUserById(
      user.authId,
      { password: newPassword }
    );

    if (error) {
      throw new Error(error.message);
    }

    // Update our users table
    await supabase
      .from('users')
      .update({ password_reset_at: new Date().toISOString() })
      .eq('employee_id', userId);

    return { success: true, message: 'Password reset successfully' };
  }

  // ============================================
  // USER UPDATES
  // ============================================
  async updateUser(userId, updates) {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

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

    // If email was updated, update it in Supabase Auth too
    if (updates.email && user.authId) {
      await supabase.auth.admin.updateUserById(user.authId, {
        email: updates.email,
      });
    }

    return this.mapFromDb(data, true);
  }

  // ============================================
  // ADMIN FUNCTIONS
  // ============================================
  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data.map(u => this.mapFromDb(u, true));
  }

  async deleteUser(userId) {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    // Delete from Supabase Auth
    if (user.authId) {
      await supabase.auth.admin.deleteUser(user.authId);
    }

    // Delete from our users table
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('employee_id', userId);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  async ensureAdminExists() {
    const adminId = process.env.ADMIN_ID || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    const existingAdmin = await this.getUser(adminId);
    if (!existingAdmin) {
      try {
        await this.createUser(adminId, adminPassword, {
          name: 'Administrator',
          role: 'admin',
          email: process.env.ADMIN_EMAIL || `${adminId}@gg-ojt.local`,
        });
        console.log(`✅ Default admin user created (ID: ${adminId})`);
      } catch (error) {
        // Admin may already exist in Supabase Auth
        console.log(`ℹ️ Admin user may already exist: ${error.message}`);
      }
    }
  }

  // ============================================
  // HELPERS
  // ============================================
  mapFromDb(dbUser, excludePassword = false) {
    const user = {
      id: dbUser.employee_id,
      employeeId: dbUser.employee_id,
      authId: dbUser.auth_id,
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

    return user;
  }

  async signOut(token) {
    // Sign out from Supabase (invalidate the session)
    try {
      await supabase.auth.admin.signOut(token);
    } catch (error) {
      // Ignore sign out errors
    }
    return { success: true };
  }
}

export default new AuthService();
