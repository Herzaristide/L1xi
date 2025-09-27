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
      // Token expired or invalid
      localStorage.removeItem('l1xi-auth-storage');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Default export for compatibility with existing code
export default api;
