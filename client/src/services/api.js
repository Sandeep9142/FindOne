import axios from 'axios';
import { API_BASE_URL } from '@config/constants';
import { storage } from '@utils/storage';

/**
 * Configured Axios instance with:
 * - Base URL from env
 * - Auto-attach auth token
 * - Response/error interceptors
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ───
api.interceptors.request.use(
  (config) => {
    const token = storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ───
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;

    // Auto-logout on 401
    if (status === 401 && storage.getToken()) {
      storage.clearAuth();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Normalize error shape
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong';

    return Promise.reject({
      status,
      message,
      response: error.response,
      raw: error,
    });
  }
);

export default api;
