import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token from localStorage if it exists
    const authData = localStorage.getItem('l1xi-auth-storage');
    if (authData) {
      const { token } = JSON.parse(authData)?.state || {};
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage but don't auto-redirect
      // Let components handle auth failures contextually
      localStorage.removeItem('l1xi-auth-storage');
      console.warn('Authentication token expired or invalid');

      // Only auto-redirect if not on a study page or if explicitly requested
      const currentPath = window.location.pathname;
      const isStudyPage = currentPath === '/' || currentPath === '/study';

      if (!isStudyPage) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Default export for compatibility with existing code
export default api;
