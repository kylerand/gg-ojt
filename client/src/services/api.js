import axios from 'axios';

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

const API_BASE_URL = getApiUrl();

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (employeeId, password) => api.post('/auth/login', { employeeId, password });
export const register = (employeeId, password, name, email) => 
  api.post('/auth/register', { employeeId, password, name, email });
export const logout = () => api.post('/auth/logout');
export const getCurrentUser = () => api.get('/auth/me');
export const changePassword = (currentPassword, newPassword) => 
  api.put('/auth/password', { currentPassword, newPassword });

// Modules
export const getModules = () => api.get('/modules');
export const getModule = (moduleId) => api.get(`/modules/${moduleId}`);
export const getCartConfig = (cartType) => api.get(`/modules/cart/${cartType}`);

// Progress
export const getProgress = (traineeId) => api.get(`/progress/${traineeId}`);
export const createProgress = (data) => api.post('/progress', data);
export const updateStepProgress = (traineeId, data) => api.put(`/progress/${traineeId}/step`, data);
export const completeModule = (traineeId, data) => api.put(`/progress/${traineeId}/complete-module`, data);
export const addSupervisorSignoff = (traineeId, data) => api.put(`/progress/${traineeId}/supervisor-signoff`, data);

// Trainees
export const getAllTrainees = () => api.get('/trainees');
export const getTraineeDetails = (traineeId) => api.get(`/trainees/${traineeId}`);

// Admin
export const getAdminTrainees = () => api.get('/admin/trainees');
export const resetProgress = (traineeId) => api.delete(`/admin/progress/${traineeId}`);
export const clearCache = () => api.post('/admin/cache/clear');

// Admin - Modules
export const createModule = (moduleData) => api.post('/admin/modules', moduleData);
export const updateModule = (moduleId, moduleData) => api.put(`/admin/modules/${moduleId}`, moduleData);
export const deleteModule = (moduleId) => api.delete(`/admin/modules/${moduleId}`);

// Admin - Trainees
export const updateTrainee = (traineeId, data) => api.put(`/admin/trainees/${traineeId}`, data);
export const resetTraineePassword = (traineeId, newPassword) => 
  api.post(`/admin/trainees/${traineeId}/reset-password`, { newPassword });
export const setModuleProgress = (traineeId, moduleId, progressData) =>
  api.put(`/admin/trainees/${traineeId}/modules/${moduleId}`, progressData);
export const resetModuleProgress = (traineeId, moduleId) =>
  api.delete(`/admin/trainees/${traineeId}/modules/${moduleId}`);

// Admin - User Management
export const getUsers = () => api.get('/admin/users');
export const updateUserRole = (userId, role) => api.put(`/admin/users/${userId}/role`, { role });

export default api;
