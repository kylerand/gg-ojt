import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Use environment variable, or production URL if in production, or localhost for dev
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // If running on Vercel (production), use Railway backend
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://gg-ojt-production.up.railway.app';
  }
  // Local development
  return 'http://localhost:3001';
};

const API_URL = getApiUrl();

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    const verifyAuth = async () => {
      const savedToken = localStorage.getItem('authToken');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${savedToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setToken(savedToken);
        } else {
          // Token is invalid, clear it
          localStorage.removeItem('authToken');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  // Login function
  const login = useCallback(async (employeeId, password) => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('authToken', data.token);
      setToken(data.token);
      setUser(data.user);

      return { success: true, user: data.user, progress: data.progress };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Register function
  const register = useCallback(async (employeeId, password, name, email) => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId, password, name, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      localStorage.setItem('authToken', data.token);
      setToken(data.token);
      setUser(data.user);

      return { success: true, user: data.user };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error('Logout API call failed:', err);
    }

    localStorage.removeItem('authToken');
    localStorage.removeItem('trainee-session');
    localStorage.removeItem('training-position');
    setToken(null);
    setUser(null);
  }, [token]);

  // Change password function
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password change failed');
      }

      return { success: true };
    } catch (err) {
      throw err;
    }
  }, [token]);

  // Get auth headers for API calls
  const getAuthHeaders = useCallback(() => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }, [token]);

  // Check if user has a specific role
  const hasRole = useCallback((role) => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }, [user]);

  const isAdmin = hasRole(['admin', 'supervisor']);
  const isAuthenticated = !!user && !!token;

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    changePassword,
    getAuthHeaders,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
