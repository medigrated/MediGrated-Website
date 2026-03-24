// client/src/lib/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5000',
  withCredentials: true,
});

// Auth API functions
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  checkAuth: () => api.get('/api/auth/check-auth'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
  changePassword: (data) => api.put('/api/auth/change-password', data),
  uploadAvatar: (data) => api.post('/api/auth/upload-avatar', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export default api;
