import axios from 'axios';
import { sanitizeTextContent, sanitizeInput } from '../utils/sanitize';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to recursively sanitize response data
function sanitizeResponseData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeResponseData(item));
  }

  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        // Sanitize text fields that might contain user-generated content
        if (typeof data[key] === 'string') {
          if (key === 'title' || key === 'description' || key === 'content') {
            sanitized[key] = sanitizeTextContent(data[key]);
          } else if (key === 'username' || key === 'email') {
            sanitized[key] = sanitizeInput(data[key]);
          } else {
            sanitized[key] = data[key];
          }
        } else {
          sanitized[key] = sanitizeResponseData(data[key]);
        }
      }
    }
    return sanitized;
  }

  return data;
}

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and data sanitization
api.interceptors.response.use(
  (response) => {
    // Sanitize response data to prevent XSS
    if (response.data) {
      response.data = sanitizeResponseData(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error.message);
    }
    throw error;
  }
);

export default api;
