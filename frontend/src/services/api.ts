import axios, { AxiosError, AxiosInstance } from 'axios';
import { ApiError } from '../types';

// API base URL - can be configured via environment variable
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Retry helper function
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetry = (error: AxiosError): boolean => {
  if (!error.response) {
    // Network errors should be retried
    return true;
  }
  // Retry on specific status codes
  return RETRY_STATUS_CODES.includes(error.response.status);
};

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add authentication token here when implemented
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    // Add retry metadata
    if (!config.headers) {
      config.headers = {} as any;
    }
    (config as any).retryCount = (config as any).retryCount || 0;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const config = error.config as any;
    
    // Retry logic
    if (config && shouldRetry(error)) {
      const retryCount = config.retryCount || 0;
      
      if (retryCount < MAX_RETRIES) {
        config.retryCount = retryCount + 1;
        const delay = RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
        
        console.log(`Retrying request (${retryCount + 1}/${MAX_RETRIES}) after ${delay}ms...`);
        await sleep(delay);
        
        return apiClient.request(config);
      }
    }
    
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      const apiError: ApiError = error.response.data || {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      };
      
      // Handle specific status codes with user-friendly messages
      switch (error.response.status) {
        case 400:
          apiError.message = apiError.message || 'Invalid request. Please check your input.';
          break;
        case 401:
          apiError.message = 'You are not authorized to perform this action.';
          console.error('Unauthorized access');
          break;
        case 403:
          apiError.message = 'Access forbidden. You do not have permission.';
          console.error('Access forbidden');
          break;
        case 404:
          apiError.message = apiError.message || 'The requested resource was not found.';
          console.error('Resource not found');
          break;
        case 409:
          apiError.message = apiError.message || 'A conflict occurred. This resource may already exist.';
          break;
        case 500:
          apiError.message = 'A server error occurred. Please try again later.';
          console.error('Server error');
          break;
        case 503:
          apiError.message = 'The service is temporarily unavailable. Please try again later.';
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

// Helper function to format API errors for display
export const formatApiError = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    // If there are field-specific errors, include them
    if (error.details && Array.isArray(error.details) && error.details.length > 0) {
      const fieldErrors = error.details.map((d: any) => `${d.field}: ${d.message}`).join(', ');
      return `${error.message} (${fieldErrors})`;
    }
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

export default apiClient;
