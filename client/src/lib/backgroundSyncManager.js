// Background synchronization and predictive loading system
import intelligentCache from './intelligentCache';
import dataPreloader from './dataPreloader';
import realTimeManager from './realTimeManager';

class BackgroundSyncManager {
  constructor() {
    this.syncWorker = null;
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    this.syncState = {
      lastSync: localStorage.getItem('lastBackgroundSync') || Date.now(),
      failedSyncs: [],
      syncInProgress: false
    };
    
    this.predictiveModel = {
      userPatterns: new Map(),
      routeTransitions: new Map(),
      timeBasedPatterns: new Map(),
      featureUsage: new Map()
    };

    this.init();
  }

  init() {
    this.setupServiceWorker();
    this.setupNetworkMonitoring();
    this.setupUserBehaviorTracking();
    this.startBackgroundSync();
    this.loadPredictiveModel();
  }

  // Setup dedicated sync service worker
  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sync-worker.js', { scope: '/sync/' })
        .then(registration => {
          console.log('🔄 Sync Service Worker registered');
          this.syncWorker = registration;
          
          // Setup background sync
          if ('sync' in window.ServiceWorkerRegistration.prototype) {
            this.registerBackgroundSync();
          }
          
          // Handle messages from service worker
          navigator.serviceWorker.addEventListener('message', this.handleWorkerMessage.bind(this));
        })
        .catch(error => {
          console.warn('Sync Service Worker registration failed:', error);
          this.fallbackToMainThread();
        });
    } else {
      this.fallbackToMainThread();
    }
  }

  // Register background sync events
  registerBackgroundSync() {
    this.syncWorker.sync.register('background-data-sync');
    this.syncWorker.sync.register('predictive-prefetch');
    this.syncWorker.sync.register('user-behavior-sync');
    
    console.log('📡 Background sync events registered');
  }

  handleWorkerMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'sync-complete':
        this.handleSyncComplete(data);
        break;
      case 'sync-failed':
        this.handleSyncFailed(data);
        break;
      case 'prediction-ready':
        this.handlePredictionReady(data);
        break;
    }
  }

  // Network connectivity monitoring
  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      console.log('🌐 Network connection restored');
      this.isOnline = true;
      this.processPendingSyncs();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Network connection lost');
      this.isOnline = false;
    });

    // Monitor connection quality
    if ('connection' in navigator) {
      this.monitorConnectionQuality();
    }
  }

  monitorConnectionQuality() {
    const connection = navigator.connection;
    
    const updateStrategy = () => {
      const { effectiveType, downlink, rtt } = connection;
      
      // Adjust sync strategy based on connection
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        this.setSyncStrategy('minimal');
      } else if (effectiveType === '3g') {
        this.setSyncStrategy('conservative');
      } else {
        this.setSyncStrategy('aggressive');
      }
      
      console.log(`📶 Connection: ${effectiveType}, Downlink: ${downlink}Mbps, RTT: ${rtt}ms`);
    };

    connection.addEventListener('change', updateStrategy);
    updateStrategy(); // Initial check
  }

  setSyncStrategy(strategy) {
    const strategies = {
      minimal: {
        syncInterval: 10 * 60 * 1000, // 10 minutes
        batchSize: 5,
        prefetchDepth: 1
      },
      conservative: {
        syncInterval: 5 * 60 * 1000, // 5 minutes
        batchSize: 10,
        prefetchDepth: 2
      },
      aggressive: {
        syncInterval: 2 * 60 * 1000, // 2 minutes
        batchSize: 20,
        prefetchDepth: 3
      }
    };

    this.currentStrategy = strategies[strategy] || strategies.conservative;
    console.log(`🎯 Sync strategy updated: ${strategy}`);
  }

  // User behavior tracking for predictions
  setupUserBehaviorTracking() {
    // Track route changes
    this.trackRouteTransitions();
    
    // Track feature usage
    this.trackFeatureUsage();
    
    // Track time-based patterns
    this.trackTimeBasedPatterns();
    
    // Track scroll and interaction patterns
    this.trackInteractionPatterns();
  }

  trackRouteTransitions() {
    let currentRoute = window.location.pathname;
    let routeStartTime = Date.now();

    const trackTransition = () => {
      const newRoute = window.location.pathname;
      const timeSpent = Date.now() - routeStartTime;
      
      if (newRoute !== currentRoute) {
        this.recordRouteTransition(currentRoute, newRoute, timeSpent);
        currentRoute = newRoute;
        routeStartTime = Date.now();
      }
    };

    // Listen for route changes
    window.addEventListener('popstate', trackTransition);
    
    // For SPA route changes (assuming React Router)
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      trackTransition();
    };
  }

  recordRouteTransition(from, to, timeSpent) {
    const key = `${from}→${to}`;
    const transitions = this.predictiveModel.routeTransitions;
    
    if (!transitions.has(key)) {
      transitions.set(key, { count: 0, avgTime: 0, lastSeen: Date.now() });
    }
    
    const data = transitions.get(key);
    data.count++;
    data.avgTime = (data.avgTime + timeSpent) / 2;
    data.lastSeen = Date.now();
    
    console.log(`📊 Route transition: ${key} (${data.count} times)`);
  }

  trackFeatureUsage() {
    const features = [
      { selector: '[data-feature="create-activity"]', name: 'create-activity' },
      { selector: '[data-feature="send-message"]', name: 'send-message' },
      { selector: '[data-feature="search"]', name: 'search' },
      { selector: '[data-feature="filter"]', name: 'filter' }
    ];

    features.forEach(({ selector, name }) => {
      document.addEventListener('click', (e) => {
        if (e.target.matches(selector) || e.target.closest(selector)) {
          this.recordFeatureUsage(name);
        }
      });
    });
  }

  recordFeatureUsage(feature) {
    const usage = this.predictiveModel.featureUsage;
    const hour = new Date().getHours();
    const key = `${feature}:${hour}`;
    
    if (!usage.has(key)) {
      usage.set(key, { count: 0, lastUsed: Date.now() });
    }
    
    const data = usage.get(key);
    data.count++;
    data.lastUsed = Date.now();
    
    // Trigger predictive prefetch for related features
    this.triggerPredictivePrefetch(feature);
  }

  trackTimeBasedPatterns() {
    // Track user activity patterns by time of day
    setInterval(() => {
      const hour = new Date().getHours();
      const isActive = this.isUserActive();
      
      const patterns = this.predictiveModel.timeBasedPatterns;
      if (!patterns.has(hour)) {
        patterns.set(hour, { activeCount: 0, totalChecks: 0 });
      }
      
      const data = patterns.get(hour);
      data.totalChecks++;
      if (isActive) data.activeCount++;
      
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  trackInteractionPatterns() {
    let lastActivity = Date.now();
    let scrollDepth = 0;
    
    ['click', 'scroll', 'keypress', 'mousemove', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => {
        lastActivity = Date.now();
        
        if (event === 'scroll') {
          const newDepth = window.scrollY / (document.body.scrollHeight - window.innerHeight);
          scrollDepth = Math.max(scrollDepth, newDepth);
        }
      }, { passive: true });
    });

    // Record engagement data
    setInterval(() => {
      if (this.isUserActive()) {
        this.recordEngagementData({
          timestamp: Date.now(),
          scrollDepth,
          timeActive: Date.now() - lastActivity < 30000
        });
      }
    }, 30000); // Every 30 seconds
  }

  isUserActive() {
    // Check if user has been active in the last 30 seconds
    return Date.now() - this.lastActivity < 30000;
  }

  recordEngagementData(data) {
    const patterns = this.predictiveModel.userPatterns;
    const hour = new Date().getHours();
    
    if (!patterns.has(hour)) {
      patterns.set(hour, { engagement: [], avgScrollDepth: 0 });
    }
    
    const hourData = patterns.get(hour);
    hourData.engagement.push(data);
    
    // Keep only recent data (last 100 entries)
    if (hourData.engagement.length > 100) {
      hourData.engagement = hourData.engagement.slice(-100);
    }
    
    // Calculate average scroll depth
    hourData.avgScrollDepth = hourData.engagement.reduce((sum, entry) => 
      sum + entry.scrollDepth, 0) / hourData.engagement.length;
  }

  // Predictive prefetching based on learned patterns
  triggerPredictivePrefetch(trigger) {
    const predictions = this.generatePredictions(trigger);
    
    predictions.forEach(prediction => {
      if (prediction.confidence > 0.7) {
        this.prefetchPredictedData(prediction);
      }
    });
  }

  generatePredictions(trigger) {
    const predictions = [];
    const currentRoute = window.location.pathname;
    const currentHour = new Date().getHours();
    
    // Route-based predictions
    for (const [transition, data] of this.predictiveModel.routeTransitions) {
      const [from, to] = transition.split('→');
      if (from === currentRoute && data.count > 2) {
        predictions.push({
          type: 'route',
          target: to,
          confidence: Math.min(data.count / 10, 1.0),
          reason: 'route-pattern'
        });
      }
    }
    
    // Feature-based predictions
    const featureMap = {
      'search': ['activities', 'users'],
      'create-activity': ['friends', 'categories'],
      'send-message': ['conversations', 'friends']
    };
    
    if (featureMap[trigger]) {
      featureMap[trigger].forEach(dataType => {
        predictions.push({
          type: 'data',
          target: dataType,
          confidence: 0.8,
          reason: 'feature-correlation'
        });
      });
    }
    
    // Time-based predictions
    const timePatterns = this.predictiveModel.timeBasedPatterns.get(currentHour);
    if (timePatterns && timePatterns.activeCount / timePatterns.totalChecks > 0.7) {
      predictions.push({
        type: 'time-based',
        target: 'peak-hour-data',
        confidence: timePatterns.activeCount / timePatterns.totalChecks,
        reason: 'time-pattern'
      });
    }
    
    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  async prefetchPredictedData(prediction) {
    console.log(`🔮 Prefetching based on prediction:`, prediction);
    
    const prefetchMap = {
      '/dashboard': () => dataPreloader.preloadPageData('/dashboard'),
      '/activities': () => dataPreloader.preloadPageData('/activities'),
      '/friends': () => dataPreloader.preloadPageData('/friends'),
      '/messages': () => dataPreloader.preloadPageData('/messages'),
      'activities': () => this.prefetchActivities(),
      'users': () => this.prefetchUsers(),
      'conversations': () => this.prefetchConversations()
    };
    
    const prefetchFn = prefetchMap[prediction.target];
    if (prefetchFn) {
      try {
        await prefetchFn();
        console.log(`✅ Prefetch completed: ${prediction.target}`);
      } catch (error) {
        console.warn(`❌ Prefetch failed: ${prediction.target}`, error);
      }
    }
  }

  async prefetchActivities() {
    const activities = intelligentCache.get('predicted-activities');
    if (!activities) {
      // Fetch and cache predicted activities
      const response = await fetch('/api/activities?limit=20&featured=true');
      const data = await response.json();
      intelligentCache.set('predicted-activities', data, {
        ttl: 5 * 60 * 1000,
        priority: 'normal',
        tags: ['predicted', 'activities']
      });
    }
  }

  async prefetchUsers() {
    // Prefetch user suggestions or recent users
    const response = await fetch('/api/users/suggestions?limit=10');
    const data = await response.json();
    intelligentCache.set('predicted-users', data, {
      ttl: 10 * 60 * 1000,
      priority: 'low',
      tags: ['predicted', 'users']
    });
  }

  async prefetchConversations() {
    const conversations = intelligentCache.get('predicted-conversations');
    if (!conversations) {
      const response = await fetch('/api/messages/conversations?limit=10');
      const data = await response.json();
      intelligentCache.set('predicted-conversations', data, {
        ttl: 2 * 60 * 1000,
        priority: 'normal',
        tags: ['predicted', 'conversations']
      });
    }
  }

  // Background synchronization
  startBackgroundSync() {
    // Immediate sync for critical data
    this.scheduleSync('critical', 0);
    
    // Regular sync intervals
    setInterval(() => {
      this.scheduleSync('regular', 0);
    }, this.currentStrategy?.syncInterval || 5 * 60 * 1000);
    
    // Opportunistic sync when idle
    if ('requestIdleCallback' in window) {
      this.scheduleIdleSync();
    }
  }

  scheduleSync(type, delay = 0) {
    setTimeout(() => {
      if (this.isOnline && !this.syncState.syncInProgress) {
        this.performBackgroundSync(type);
      } else {
        this.queueSync(type);
      }
    }, delay);
  }

  scheduleIdleSync() {
    requestIdleCallback((deadline) => {
      if (deadline.timeRemaining() > 50 && this.isOnline) {
        this.performBackgroundSync('idle');
      }
      
      // Schedule next idle sync
      this.scheduleIdleSync();
    }, { timeout: 60000 }); // 1 minute timeout
  }

  async performBackgroundSync(type) {
    if (this.syncState.syncInProgress) return;
    
    this.syncState.syncInProgress = true;
    console.log(`🔄 Starting background sync: ${type}`);
    
    try {
      const syncData = await this.gatherSyncData(type);
      
      if (this.syncWorker && this.syncWorker.active) {
        // Use service worker for sync
        this.syncWorker.active.postMessage({
          type: 'perform-sync',
          data: syncData
        });
      } else {
        // Fallback to main thread
        await this.performMainThreadSync(syncData);
      }
      
      this.syncState.lastSync = Date.now();
      localStorage.setItem('lastBackgroundSync', this.syncState.lastSync.toString());
      
    } catch (error) {
      console.error('Background sync failed:', error);
      this.handleSyncFailed({ type, error: error.message });
    } finally {
      this.syncState.syncInProgress = false;
    }
  }

  async gatherSyncData(type) {
    const syncData = {
      type,
      timestamp: Date.now(),
      user: intelligentCache.get('user:current'),
      lastSync: this.syncState.lastSync
    };
    
    switch (type) {
      case 'critical':
        syncData.endpoints = [
          '/api/users/notifications',
          '/api/messages/unread-count',
          '/api/friends/requests'
        ];
        break;
        
      case 'regular':
        syncData.endpoints = [
          '/api/activities?updated_since=' + this.syncState.lastSync,
          '/api/friends?updated_since=' + this.syncState.lastSync,
          '/api/users/profile'
        ];
        break;
        
      case 'idle':
        syncData.endpoints = [
          '/api/activities/trending',
          '/api/users/suggestions',
          '/api/recommendations'
        ];
        break;
    }
    
    return syncData;
  }

  async performMainThreadSync(syncData) {
    const results = await Promise.allSettled(
      syncData.endpoints.map(endpoint => 
        fetch(endpoint).then(res => res.json())
      )
    );
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const endpoint = syncData.endpoints[index];
        const cacheKey = `sync:${endpoint.split('?')[0]}`;
        
        intelligentCache.set(cacheKey, result.value, {
          ttl: 10 * 60 * 1000,
          priority: syncData.type === 'critical' ? 'high' : 'normal',
          tags: ['background-sync', syncData.type]
        });
      }
    });
  }

  queueSync(type) {
    this.syncQueue.push({ type, timestamp: Date.now() });
  }

  processPendingSyncs() {
    while (this.syncQueue.length > 0) {
      const sync = this.syncQueue.shift();
      this.scheduleSync(sync.type, 0);
    }
  }

  handleSyncComplete(data) {
    console.log('✅ Background sync completed:', data);
    this.savePredictiveModel();
  }

  handleSyncFailed(data) {
    console.warn('❌ Background sync failed:', data);
    this.syncState.failedSyncs.push({
      ...data,
      timestamp: Date.now()
    });
    
    // Retry failed syncs with exponential backoff
    const retryDelay = Math.min(30000 * Math.pow(2, this.syncState.failedSyncs.length), 300000);
    setTimeout(() => {
      this.scheduleSync(data.type, 0);
    }, retryDelay);
  }

  // Model persistence
  savePredictiveModel() {
    const modelData = {
      routeTransitions: Array.from(this.predictiveModel.routeTransitions.entries()),
      timeBasedPatterns: Array.from(this.predictiveModel.timeBasedPatterns.entries()),
      featureUsage: Array.from(this.predictiveModel.featureUsage.entries()),
      lastUpdated: Date.now()
    };
    
    localStorage.setItem('predictiveModel', JSON.stringify(modelData));
  }

  loadPredictiveModel() {
    const saved = localStorage.getItem('predictiveModel');
    if (saved) {
      try {
        const modelData = JSON.parse(saved);
        this.predictiveModel.routeTransitions = new Map(modelData.routeTransitions || []);
        this.predictiveModel.timeBasedPatterns = new Map(modelData.timeBasedPatterns || []);
        this.predictiveModel.featureUsage = new Map(modelData.featureUsage || []);
        
        console.log('📊 Predictive model loaded');
      } catch (error) {
        console.warn('Failed to load predictive model:', error);
      }
    }
  }

  fallbackToMainThread() {
    console.log('🔄 Using main thread for background sync');
    this.startBackgroundSync();
  }

  // Performance monitoring
  getBackgroundSyncStats() {
    return {
      lastSync: new Date(this.syncState.lastSync).toISOString(),
      failedSyncs: this.syncState.failedSyncs.length,
      queuedSyncs: this.syncQueue.length,
      isOnline: this.isOnline,
      predictiveModel: {
        routeTransitions: this.predictiveModel.routeTransitions.size,
        timePatterns: this.predictiveModel.timeBasedPatterns.size,
        featureUsage: this.predictiveModel.featureUsage.size
      }
    };
  }
}

// Initialize background sync manager
const backgroundSyncManager = new BackgroundSyncManager();

export default backgroundSyncManager;