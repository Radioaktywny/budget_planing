import axios, { AxiosError, AxiosInstance } from 'axios';
import { ApiError } from '../types';

// API base URL - can be configured via environment variable
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add authentication token here when implemented
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiError>) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      const apiError: ApiError = error.response.data || {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      };
      
      // Handle specific status codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - redirect to login when auth is implemented
          console.error('Unauthorized access');
          break;
        case 403:
          // Forbidden
          console.error('Access forbidden');
          break;
        case 404:
          // Not found
          console.error('Resource not found');
          break;
        case 500:
          // Server error
          console.error('Server error');
          break;
      }
      
      return Promise.reject(apiError);
    } else if (error.request) {
      // Request made but no response received
      const networkError: ApiError = {
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to server. Please check your internet connection.',
      };
      return Promise.reject(networkError);
    } else {
      // Something else happened
      const unknownError: ApiError = {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred',
      };
      return Promise.reject(unknownError);
    }
  }
);

export default apiClient;
