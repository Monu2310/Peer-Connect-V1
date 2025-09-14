// Advanced data preloading and prefetching system
import api from '../api/config';

class DataPreloader {
  constructor() {
    this.preloadCache = new Map();
    this.preloadPromises = new Map();
    this.requestQueue = [];
    this.isProcessing = false;
    this.maxConcurrentRequests = 4;
    this.preloadDelays = {
      immediate: 0,      // Critical data
      fast: 100,         // Important data
      normal: 500,       // Regular data
      lazy: 2000         // Background data
    };
  }

  // Preload critical data immediately after auth
  async preloadCriticalData(userId) {
    console.log('🚀 Starting critical data preload for user:', userId);
    
    const criticalRequests = [
      { key: 'user-profile', fn: () => api.get(`/users/${userId}`), priority: 'immediate' },
      { key: 'user-friends', fn: () => api.get('/friends'), priority: 'immediate' },
      { key: 'recent-activities', fn: () => api.get('/activities?limit=20'), priority: 'fast' },
      { key: 'notifications', fn: () => api.get('/users/notifications'), priority: 'fast' },
      { key: 'recommendations', fn: () => api.get('/recommendations'), priority: 'normal' }
    ];

    // Execute immediate requests in parallel
    const immediateRequests = criticalRequests.filter(req => req.priority === 'immediate');
    await this.executeBatch(immediateRequests);

    // Queue other requests with delays
    const otherRequests = criticalRequests.filter(req => req.priority !== 'immediate');
    this.queueRequests(otherRequests);
  }

  // Execute a batch of requests in parallel
  async executeBatch(requests) {
    const promises = requests.map(async (request) => {
      try {
        const result = await request.fn();
        this.preloadCache.set(request.key, {
          data: result.data,
          timestamp: Date.now(),
          ttl: 5 * 60 * 1000 // 5 minutes
        });
        console.log(`✅ Preloaded: ${request.key}`);
        return { key: request.key, success: true, data: result.data };
      } catch (error) {
        console.warn(`❌ Failed to preload: ${request.key}`, error);
        return { key: request.key, success: false, error };
      }
    });

    return Promise.allSettled(promises);
  }

  // Queue requests with priority handling
  queueRequests(requests) {
    requests.forEach(request => {
      this.requestQueue.push(request);
    });
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  // Process the request queue with rate limiting
  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.requestQueue.length > 0) {
      const batch = this.requestQueue.splice(0, this.maxConcurrentRequests);
      
      // Add delays based on priority
      for (const request of batch) {
        const delay = this.preloadDelays[request.priority] || this.preloadDelays.normal;
        setTimeout(() => {
          this.executeBatch([request]);
        }, delay);
      }
      
      // Wait before processing next batch
      if (this.requestQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    this.isProcessing = false;
  }

  // Get preloaded data
  getPreloadedData(key) {
    const cached = this.preloadCache.get(key);
    
    if (!cached) return null;
    
    // Check if data is still valid
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.preloadCache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  // Preload data based on user navigation patterns
  preloadByNavigation(currentPage, userHistory = []) {
    const navigationPatterns = this.analyzeNavigationPatterns(userHistory);
    const likelyNextPages = this.predictNextPages(currentPage, navigationPatterns);
    
    likelyNextPages.forEach(page => {
      this.preloadPageData(page);
    });
  }

  // Analyze user navigation patterns
  analyzeNavigationPatterns(history) {
    const transitions = {};
    
    for (let i = 0; i < history.length - 1; i++) {
      const current = history[i];
      const next = history[i + 1];
      
      if (!transitions[current]) {
        transitions[current] = {};
      }
      
      transitions[current][next] = (transitions[current][next] || 0) + 1;
    }
    
    return transitions;
  }

  // Predict likely next pages
  predictNextPages(currentPage, patterns) {
    const transitions = patterns[currentPage] || {};
    
    return Object.entries(transitions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([page]) => page);
  }

  // Preload data for specific pages
  async preloadPageData(page) {
    const pageDataMap = {
      '/dashboard': [
        { key: 'dashboard-activities', fn: () => api.get('/activities?featured=true'), priority: 'fast' },
        { key: 'dashboard-stats', fn: () => api.get('/users/stats'), priority: 'normal' }
      ],
      '/activities': [
        { key: 'all-activities', fn: () => api.get('/activities?limit=50'), priority: 'fast' },
        { key: 'activity-categories', fn: () => api.get('/activities/categories'), priority: 'normal' }
      ],
      '/friends': [
        { key: 'friend-requests', fn: () => api.get('/friends/requests'), priority: 'fast' },
        { key: 'friend-suggestions', fn: () => api.get('/friends/suggestions'), priority: 'normal' }
      ],
      '/messages': [
        { key: 'conversations', fn: () => api.get('/messages/conversations'), priority: 'fast' },
        { key: 'unread-count', fn: () => api.get('/messages/unread-count'), priority: 'immediate' }
      ],
      '/profile': [
        { key: 'user-activities', fn: () => api.get('/activities/user'), priority: 'fast' },
        { key: 'user-stats', fn: () => api.get('/users/profile/stats'), priority: 'normal' }
      ]
    };

    const requests = pageDataMap[page] || [];
    this.queueRequests(requests);
  }

  // Background data sync for real-time updates
  startBackgroundSync(userId) {
    // Sync every 30 seconds for critical data
    setInterval(() => {
      this.syncCriticalData(userId);
    }, 30000);

    // Sync every 2 minutes for regular data
    setInterval(() => {
      this.syncRegularData(userId);
    }, 120000);
  }

  async syncCriticalData(userId) {
    const criticalSyncRequests = [
      { key: 'notifications-sync', fn: () => api.get('/users/notifications?since=' + this.getLastSyncTime('notifications')), priority: 'immediate' },
      { key: 'messages-sync', fn: () => api.get('/messages/latest'), priority: 'immediate' }
    ];

    await this.executeBatch(criticalSyncRequests);
  }

  async syncRegularData(userId) {
    const regularSyncRequests = [
      { key: 'activities-sync', fn: () => api.get('/activities?updated_since=' + this.getLastSyncTime('activities')), priority: 'normal' },
      { key: 'friends-sync', fn: () => api.get('/friends?updated_since=' + this.getLastSyncTime('friends')), priority: 'normal' }
    ];

    await this.executeBatch(regularSyncRequests);
  }

  getLastSyncTime(dataType) {
    return localStorage.getItem(`lastSync_${dataType}`) || Date.now() - 24 * 60 * 60 * 1000; // Default to 24 hours ago
  }

  // Intelligent cache warming based on user behavior
  warmCacheForUser(userId, userPreferences = {}) {
    const { interests = [], location = null, activityHistory = [] } = userPreferences;
    
    // Preload data based on user interests
    if (interests.length > 0) {
      this.queueRequests([
        { 
          key: 'interest-activities', 
          fn: () => api.get(`/activities?categories=${interests.join(',')}&limit=30`), 
          priority: 'normal' 
        }
      ]);
    }

    // Preload location-based activities
    if (location) {
      this.queueRequests([
        { 
          key: 'nearby-activities', 
          fn: () => api.get(`/activities/nearby?lat=${location.lat}&lng=${location.lng}&radius=10`), 
          priority: 'normal' 
        }
      ]);
    }

    // Preload based on activity history patterns
    if (activityHistory.length > 0) {
      const commonActivityTypes = this.analyzeActivityPatterns(activityHistory);
      commonActivityTypes.forEach(type => {
        this.queueRequests([
          { 
            key: `pattern-activities-${type}`, 
            fn: () => api.get(`/activities?type=${type}&limit=20`), 
            priority: 'lazy' 
          }
        ]);
      });
    }
  }

  analyzeActivityPatterns(history) {
    const typeCounts = {};
    history.forEach(activity => {
      typeCounts[activity.category] = (typeCounts[activity.category] || 0) + 1;
    });
    
    return Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type]) => type);
  }

  // Clear expired cache entries
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, cached] of this.preloadCache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.preloadCache.delete(key);
      }
    }
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.preloadCache.size,
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessing,
      keys: Array.from(this.preloadCache.keys())
    };
  }
}

// Create global instance
const dataPreloader = new DataPreloader();

// Export for use in components
export default dataPreloader;