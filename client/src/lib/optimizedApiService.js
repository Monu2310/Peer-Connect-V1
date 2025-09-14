// Optimized API service with caching and performance enhancements
import { usePerformanceMonitor } from '../hooks/performanceHooks';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5111';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000;
const RETRY_ATTEMPTS = parseInt(process.env.REACT_APP_RETRY_ATTEMPTS) || 3;

class OptimizedApiService {
  constructor() {
    this.requestQueue = new Map();
    this.abortControllers = new Map();
    this.cache = new Map();
    this.retryDelays = [1000, 2000, 4000]; // Progressive delays
  }

  // Request deduplication
  async deduplicateRequest(key, requestFn) {
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key);
    }

    const promise = requestFn();
    this.requestQueue.set(key, promise);

    try {
      const result = await promise;
      this.requestQueue.delete(key);
      return result;
    } catch (error) {
      this.requestQueue.delete(key);
      throw error;
    }
  }

  // Request with timeout and retry
  async requestWithRetry(url, options = {}, retries = RETRY_ATTEMPTS) {
    const controller = new AbortController();
    const requestId = `${options.method || 'GET'}_${url}`;
    
    this.abortControllers.set(requestId, controller);

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, API_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      if (retries > 0 && this.shouldRetry(error)) {
        const delay = this.retryDelays[RETRY_ATTEMPTS - retries] || 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.requestWithRetry(url, options, retries - 1);
      }

      throw error;
    }
  }

  shouldRetry(error) {
    // Retry on network errors and 5xx status codes
    return error.message.includes('fetch') || 
           error.message.includes('500') || 
           error.message.includes('502') || 
           error.message.includes('503') || 
           error.message.includes('504');
  }

  // Optimized GET request with caching
  async get(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const cacheKey = `GET_${endpoint}`;
    
    // Check cache first for GET requests
    if (!options.skipCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < (options.cacheTTL || 300000)) { // 5 min default
        return cached.data;
      }
    }

    return this.deduplicateRequest(cacheKey, async () => {
      const response = await this.requestWithRetry(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      const data = await response.json();
      
      // Cache successful responses
      if (!options.skipCache) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }

      return data;
    });
  }

  // Optimized POST request
  async post(endpoint, body, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await this.requestWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(body)
    });

    // Invalidate related cache entries
    this.invalidateCache(endpoint);

    return response.json();
  }

  // Optimized PUT request
  async put(endpoint, body, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await this.requestWithRetry(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(body)
    });

    // Invalidate related cache entries
    this.invalidateCache(endpoint);

    return response.json();
  }

  // Optimized DELETE request
  async delete(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await this.requestWithRetry(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    // Invalidate related cache entries
    this.invalidateCache(endpoint);

    return response.json();
  }

  // Batch requests for better performance
  async batchRequests(requests) {
    const promises = requests.map(({ method, endpoint, body, options = {} }) => {
      switch (method.toUpperCase()) {
        case 'GET':
          return this.get(endpoint, options);
        case 'POST':
          return this.post(endpoint, body, options);
        case 'PUT':
          return this.put(endpoint, body, options);
        case 'DELETE':
          return this.delete(endpoint, options);
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    });

    return Promise.allSettled(promises);
  }

  // Prefetch data for better UX
  async prefetch(endpoints) {
    const prefetchPromises = endpoints.map(endpoint => 
      this.get(endpoint, { skipCache: false, cacheTTL: 600000 }) // 10 min cache for prefetch
    );

    try {
      await Promise.all(prefetchPromises);
    } catch (error) {
      console.warn('Prefetch failed:', error);
    }
  }

  // Cache invalidation
  invalidateCache(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Cancel all pending requests
  cancelAllRequests() {
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }
    this.abortControllers.clear();
    this.requestQueue.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

// Create singleton instance
const optimizedApiService = new OptimizedApiService();

// React hook for API calls with performance monitoring
export const useOptimizedApi = () => {
  const performanceMonitor = usePerformanceMonitor('ApiService');

  const apiCall = async (method, endpoint, body, options) => {
    return performanceMonitor.monitorApiCall(async () => {
      switch (method.toLowerCase()) {
        case 'get':
          return optimizedApiService.get(endpoint, options);
        case 'post':
          return optimizedApiService.post(endpoint, body, options);
        case 'put':
          return optimizedApiService.put(endpoint, body, options);
        case 'delete':
          return optimizedApiService.delete(endpoint, options);
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    }, `${method.toUpperCase()} ${endpoint}`);
  };

  return {
    get: (endpoint, options) => apiCall('get', endpoint, null, options),
    post: (endpoint, body, options) => apiCall('post', endpoint, body, options),
    put: (endpoint, body, options) => apiCall('put', endpoint, body, options),
    delete: (endpoint, options) => apiCall('delete', endpoint, null, options),
    batch: optimizedApiService.batchRequests.bind(optimizedApiService),
    prefetch: optimizedApiService.prefetch.bind(optimizedApiService),
    cancelAll: optimizedApiService.cancelAllRequests.bind(optimizedApiService),
    clearCache: optimizedApiService.clearCache.bind(optimizedApiService)
  };
};

export default optimizedApiService;