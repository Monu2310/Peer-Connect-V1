// API Configuration
import axios from 'axios';

// Use localhost for development unless specified otherwise
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5111';

console.log('Using API URL:', API_URL); // Debug log

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 60000; // Increase timeout to 60 seconds for Render's cold start

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false // Important: changed to false to avoid CORS preflight issues
});

// Request deduplication cache for GET requests
const pendingRequests = new Map();

// Add request interceptor to include auth token and deduplicate GET requests
api.interceptors.request.use(
  config => {
    // Get the latest token from localStorage each time a request is made
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Deduplicate GET requests
    if (config.method === 'get') {
      const requestKey = `${config.url}?${JSON.stringify(config.params || {})}`;
      if (pendingRequests.has(requestKey)) {
        config.cancelToken = pendingRequests.get(requestKey).token;
      } else {
        const source = axios.CancelToken.source();
        pendingRequests.set(requestKey, source);
        config.cancelToken = source.token;
      }
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors and clear pending requests
api.interceptors.response.use(
  response => {
    // Clear pending request after successful response
    if (response.config.method === 'get') {
      const requestKey = `${response.config.url}?${JSON.stringify(response.config.params || {})}`;
      pendingRequests.delete(requestKey);
    }
    return response;
  },
  error => {
    // Clear pending request on error
    if (error.config && error.config.method === 'get') {
      const requestKey = `${error.config.url}?${JSON.stringify(error.config.params || {})}`;
      pendingRequests.delete(requestKey);
    }
    
    // Handle network errors gracefully
    if (!error.response) {
      console.error('Network Error: Please check your connection');
      return Promise.reject(new Error('Network Error: Unable to connect to server'));
    }
    
    // Log detailed error information for debugging
    console.error('API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url
    });
    
    // Handle authentication errors
    if (error.response.status === 401) {
      console.warn('Authentication error. Please log in again.');
      // Don't automatically redirect as it could cause navigation loops
    }
    
    // Handle server errors
    if (error.response.status >= 500) {
      return Promise.reject(new Error('Server error. Please try again later.'));
    }
    
    return Promise.reject(error);
  }
);

// Export a function to explicitly set auth token (used by AuthContext)
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common['x-auth-token'] = token;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['x-auth-token'];
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;