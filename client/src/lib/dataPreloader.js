// Advanced data preloading and prefetching system
import api from '../api/config';

class DataPreloader {
  constructor() {
    this.preloadCache = new Map();
    this.preloadPromises = new Map();
    this.requestQueue = [];
    this.isProcessing = false;
    this.maxConcurrentRequests = 4;
    this.lastPreloadTimestamps = new Map();
    this.cooldowns = new Map();
    this.maxRetries = 4;
    this.baseRetryDelay = 1000; // ms
    this.maxRetryDelay = 30000; // ms
    this.backgroundSyncHandles = new Map();
    this.preloadDelays = {
      immediate: 0,      // Critical data
      fast: 100,         // Important data
      normal: 500,       // Regular data
      lazy: 2000         // Background data
    };
  }

  // Preload critical data immediately after auth
  async preloadCriticalData(userId) {
    if (!userId) {
      console.warn('preloadCriticalData called without a userId. Skipping.');
      return;
    }

    const now = Date.now();
    const lastRun = this.lastPreloadTimestamps.get(userId) || 0;

    if (now - lastRun < 15000) {
      console.info('Preload already triggered recently for user:', userId);
      return;
    }

    this.lastPreloadTimestamps.set(userId, now);

    console.log('🚀 Starting critical data preload for user:', userId);
    
    const criticalRequests = [
      { key: 'user-profile', fn: () => api.get(`/api/users/${userId}`), priority: 'immediate' },
      { key: 'user-friends', fn: () => api.get('/api/friends'), priority: 'immediate' },
      // NOTE: Do NOT preload /api/activities here - it returns ALL system activities
      // Users should only see activities when they explicitly navigate to Activities page
      { key: 'notifications', fn: () => api.get('/api/users/notifications'), priority: 'fast' },
      { key: 'recommendations', fn: () => api.get('/api/recommendations'), priority: 'normal' }
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
    const promises = requests.map(request => this.executeRequestWithRetries(request));
    return Promise.allSettled(promises);
  }

  // Execute single request with retries, exponential backoff and jitter
  async executeRequestWithRetries(request) {
    const attempt = async (req, attempts) => {
      try {
        // If this key is in cooldown, wait until cooldown expires and return skipped
        const cooldownUntil = this.cooldowns.get(req.key);
        if (cooldownUntil && Date.now() < cooldownUntil) {
          const wait = cooldownUntil - Date.now();
          console.debug(`Cooldown active for ${req.key}, delaying ${wait}ms`);
          await new Promise(res => setTimeout(res, wait));
          return { key: req.key, success: false, skipped: true };
        }

        const result = await req.fn();
        // only set cache on success
        if (result && result.data !== undefined) {
          this.preloadCache.set(req.key, {
            data: result.data,
            timestamp: Date.now(),
            ttl: 5 * 60 * 1000 // 5 minutes
          });
        }
        console.log(`✅ Preloaded: ${req.key}`);
        return { key: req.key, success: true, data: result.data };
      } catch (error) {
        const status = error?.response?.status;
        // Do not evict existing cache on failures — keep last known good data
        if (status === 429) {
          // Rate limited: schedule a retry with exponential backoff + jitter
          const nextAttempt = attempts + 1;
          if (nextAttempt > this.maxRetries) {
            console.warn(`429 and max retries exceeded for ${req.key}`);
            // set a short cooldown to avoid immediate re-requests
            this.cooldowns.set(req.key, Date.now() + 60000);
            return { key: req.key, success: false, error };
          }

          const backoff = Math.min(this.baseRetryDelay * Math.pow(2, attempts), this.maxRetryDelay);
          const jitter = Math.floor(Math.random() * 300) - 150; // +/-150ms
          const delay = Math.max(200, backoff + jitter);
          // set a cooldown so other callers know to defer
          this.cooldowns.set(req.key, Date.now() + delay);
          console.warn(`429 received for ${req.key}. Retrying in ${delay}ms (attempt ${nextAttempt})`);

          await new Promise(res => setTimeout(res, delay));
          return attempt(req, nextAttempt);
        }

        // For other transient errors, retry a few times
        if (attempts < this.maxRetries && (!status || status >= 500)) {
          const nextAttempt = attempts + 1;
          const backoff = Math.min(this.baseRetryDelay * Math.pow(2, attempts), this.maxRetryDelay);
          const jitter = Math.floor(Math.random() * 200);
          const delay = backoff + jitter;
          console.warn(`Transient error for ${req.key}. Retrying in ${delay}ms (attempt ${nextAttempt})`, error?.message || error);
          await new Promise(res => setTimeout(res, delay));
          return attempt(req, nextAttempt);
        }

        console.warn(`❌ Failed to preload: ${req.key}`, error);
        return { key: req.key, success: false, error };
      }
    };

    // start with attempt 0
    return attempt(request, 0);
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
        { key: 'dashboard-activities', fn: () => api.get('/api/activities?featured=true'), priority: 'fast' },
        { key: 'dashboard-stats', fn: () => api.get('/api/users/stats'), priority: 'normal' }
      ],
      '/activities': [
        { key: 'all-activities', fn: () => api.get('/api/activities?limit=50'), priority: 'fast' },
        { key: 'activity-categories', fn: () => api.get('/api/activities/categories'), priority: 'normal' }
      ],
      '/friends': [
        { key: 'friend-requests', fn: () => api.get('/api/friends/requests'), priority: 'fast' },
        { key: 'friend-suggestions', fn: () => api.get('/api/friends/suggestions'), priority: 'normal' }
      ],
      '/messages': [
        { key: 'conversations', fn: () => api.get('/api/messages/conversations'), priority: 'fast' },
        { key: 'unread-count', fn: () => api.get('/api/messages/unread-count'), priority: 'immediate' }
      ],
      '/profile': [
        { key: 'user-activities', fn: () => api.get('/api/activities/user'), priority: 'fast' },
        { key: 'user-stats', fn: () => api.get('/api/users/profile/stats'), priority: 'normal' }
      ]
    };

    const requests = pageDataMap[page] || [];
    this.queueRequests(requests);
  }

  // Background data sync for real-time updates
  startBackgroundSync(userId) {
    if (!userId) {
      console.warn('startBackgroundSync called without a userId. Skipping.');
      return;
    }

    // Ensure only one active background sync per user session
    this.stopAllBackgroundSync();

    if (this.backgroundSyncHandles.has(userId)) {
      return;
    }

    // Sync every 30 seconds for critical data
    const criticalInterval = setInterval(() => {
      this.syncCriticalData(userId);
    }, 30000);

    // Sync every 2 minutes for regular data
    const regularInterval = setInterval(() => {
      this.syncRegularData(userId);
    }, 120000);

    this.backgroundSyncHandles.set(userId, {
      criticalInterval,
      regularInterval
    });
  }

  async syncCriticalData(userId) {
    const criticalSyncRequests = [
      { key: 'notifications-sync', fn: () => api.get('/api/users/notifications?since=' + this.getLastSyncTime('notifications')), priority: 'immediate' },
      { key: 'messages-sync', fn: () => api.get('/api/messages/latest'), priority: 'immediate' }
    ];

    await this.executeBatch(criticalSyncRequests);
  }

  async syncRegularData(userId) {
    const regularSyncRequests = [
      { key: 'activities-sync', fn: () => api.get('/api/activities?updated_since=' + this.getLastSyncTime('activities')), priority: 'normal' },
      { key: 'friends-sync', fn: () => api.get('/api/friends?updated_since=' + this.getLastSyncTime('friends')), priority: 'normal' }
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

  stopAllBackgroundSync() {
    for (const { criticalInterval, regularInterval } of this.backgroundSyncHandles.values()) {
      clearInterval(criticalInterval);
      clearInterval(regularInterval);
    }
    this.backgroundSyncHandles.clear();
  }

  reset() {
    this.stopAllBackgroundSync();
    this.preloadCache.clear();
    this.preloadPromises.clear();
    this.requestQueue = [];
    this.isProcessing = false;
    this.lastPreloadTimestamps.clear();
  }
}

// Create global instance
const dataPreloader = new DataPreloader();

// Export for use in components
export default dataPreloader;