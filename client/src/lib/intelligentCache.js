// Intelligent client-side cache with advanced strategies
class IntelligentCacheManager {
  constructor() {
    this.cache = new Map();
    this.metadata = new Map();
    this.accessPatterns = new Map();
    this.maxCacheSize = 500; // Maximum cache entries
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    this.compressionThreshold = 1024; // Compress data larger than 1KB
    
    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      compressions: 0
    };

    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  // Set data in cache with intelligent metadata
  set(key, data, options = {}) {
    const {
      ttl = this.defaultTTL,
      priority = 'normal',
      tags = [],
      compress = true
    } = options;

    // Compress large data if enabled
    let processedData = data;
    let isCompressed = false;
    
    if (compress && this.shouldCompress(data)) {
      processedData = this.compressData(data);
      isCompressed = true;
      this.stats.compressions++;
    }

    // Evict entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastUseful();
    }

    const now = Date.now();
    const expiresAt = now + ttl;

    this.cache.set(key, processedData);
    this.metadata.set(key, {
      createdAt: now,
      expiresAt,
      lastAccessed: now,
      accessCount: 0,
      priority,
      tags,
      isCompressed,
      originalSize: this.getDataSize(data),
      compressedSize: isCompressed ? this.getDataSize(processedData) : null
    });

    // Track access patterns
    this.updateAccessPattern(key, 'write');
  }

  // Get data from cache with access tracking
  get(key) {
    const data = this.cache.get(key);
    const meta = this.metadata.get(key);

    if (!data || !meta) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > meta.expiresAt) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access metadata
    meta.lastAccessed = Date.now();
    meta.accessCount++;
    this.stats.hits++;

    // Track access patterns
    this.updateAccessPattern(key, 'read');

    // Decompress if needed
    const processedData = meta.isCompressed ? this.decompressData(data) : data;
    
    return processedData;
  }

  // Delete entry from cache
  delete(key) {
    this.cache.delete(key);
    this.metadata.delete(key);
    this.accessPatterns.delete(key);
  }

  // Update with dependency invalidation
  update(key, data, options = {}) {
    const meta = this.metadata.get(key);
    if (meta) {
      // Preserve some metadata
      options.tags = options.tags || meta.tags;
      options.priority = options.priority || meta.priority;
    }
    
    this.set(key, data, options);
    
    // Invalidate dependent cache entries
    this.invalidateByTags(options.invalidateTags || []);
  }

  // Invalidate cache entries by tags
  invalidateByTags(tags) {
    if (tags.length === 0) return;

    const keysToDelete = [];
    
    for (const [key, meta] of this.metadata.entries()) {
      if (meta.tags.some(tag => tags.includes(tag))) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
    console.log(`🗑️ Invalidated ${keysToDelete.length} cache entries with tags:`, tags);
  }

  // Evict least useful entries based on LFU + LRU + Priority
  evictLeastUseful() {
    const entries = Array.from(this.metadata.entries());
    
    // Calculate usefulness score for each entry
    const scoredEntries = entries.map(([key, meta]) => {
      const ageScore = (Date.now() - meta.lastAccessed) / 1000; // Seconds since last access
      const frequencyScore = meta.accessCount > 0 ? 1000 / meta.accessCount : 1000;
      const priorityScore = this.getPriorityScore(meta.priority);
      
      // Lower score = less useful
      const usefulnessScore = priorityScore - (ageScore * 0.1) - (frequencyScore * 0.1);
      
      return { key, score: usefulnessScore, meta };
    });

    // Sort by usefulness (least useful first)
    scoredEntries.sort((a, b) => a.score - b.score);

    // Evict least useful entries (10% of cache size or minimum 5)
    const evictionCount = Math.max(5, Math.floor(this.maxCacheSize * 0.1));
    
    for (let i = 0; i < evictionCount && i < scoredEntries.length; i++) {
      this.delete(scoredEntries[i].key);
      this.stats.evictions++;
    }

    console.log(`🗑️ Evicted ${evictionCount} cache entries`);
  }

  getPriorityScore(priority) {
    const scores = {
      critical: 1000,
      high: 800,
      normal: 500,
      low: 200,
      background: 100
    };
    return scores[priority] || scores.normal;
  }

  // Batch operations for efficiency
  setBatch(entries) {
    entries.forEach(({ key, data, options }) => {
      this.set(key, data, options);
    });
  }

  getBatch(keys) {
    return keys.reduce((result, key) => {
      const data = this.get(key);
      if (data !== null) {
        result[key] = data;
      }
      return result;
    }, {});
  }

  // Smart prefetching based on access patterns
  predictAndPrefetch() {
    const predictions = this.generatePredictions();
    
    predictions.forEach(prediction => {
      if (prediction.confidence > 0.7) {
        console.log(`🔮 Predicted access to ${prediction.key} with confidence ${prediction.confidence}`);
        // Trigger prefetch if not already cached
        if (!this.cache.has(prediction.key)) {
          this.dispatchPrefetchEvent(prediction.key);
        }
      }
    });
  }

  generatePredictions() {
    const predictions = [];
    
    for (const [key, pattern] of this.accessPatterns.entries()) {
      // Simple prediction based on access frequency and recency
      const timeSinceLastAccess = Date.now() - pattern.lastAccess;
      const accessFrequency = pattern.accessCount / (pattern.timeSpan || 1);
      
      if (accessFrequency > 0.1 && timeSinceLastAccess > 60000) { // 1 minute
        const confidence = Math.min(accessFrequency, 1.0);
        predictions.push({ key, confidence });
      }
    }

    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  dispatchPrefetchEvent(key) {
    window.dispatchEvent(new CustomEvent('cache-prefetch-request', {
      detail: { key }
    }));
  }

  // Access pattern tracking
  updateAccessPattern(key, operation) {
    const now = Date.now();
    const pattern = this.accessPatterns.get(key) || {
      accessCount: 0,
      firstAccess: now,
      lastAccess: now,
      operations: []
    };

    pattern.accessCount++;
    pattern.lastAccess = now;
    pattern.timeSpan = now - pattern.firstAccess;
    pattern.operations.push({ operation, timestamp: now });

    // Keep only recent operations (last 100)
    if (pattern.operations.length > 100) {
      pattern.operations = pattern.operations.slice(-100);
    }

    this.accessPatterns.set(key, pattern);
  }

  // Data compression utilities
  shouldCompress(data) {
    return this.getDataSize(data) > this.compressionThreshold;
  }

  compressData(data) {
    try {
      // Simple JSON compression using LZ-string or similar
      const jsonString = JSON.stringify(data);
      return {
        __compressed: true,
        data: btoa(jsonString) // Base64 encoding as simple compression
      };
    } catch (error) {
      console.warn('Compression failed:', error);
      return data;
    }
  }

  decompressData(compressedData) {
    try {
      if (compressedData.__compressed) {
        const jsonString = atob(compressedData.data);
        return JSON.parse(jsonString);
      }
      return compressedData;
    } catch (error) {
      console.warn('Decompression failed:', error);
      return compressedData;
    }
  }

  getDataSize(data) {
    return new Blob([JSON.stringify(data)]).size;
  }

  // Periodic maintenance
  startPeriodicCleanup() {
    // Clean expired entries every 5 minutes
    setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000);

    // Predict and prefetch every 2 minutes
    setInterval(() => {
      this.predictAndPrefetch();
    }, 2 * 60 * 1000);

    // Log statistics every 10 minutes
    setInterval(() => {
      console.log('📊 Cache Statistics:', this.getStatistics());
    }, 10 * 60 * 1000);
  }

  cleanupExpired() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, meta] of this.metadata.entries()) {
      if (now > meta.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  // Cache warming for specific data types
  warmCache(dataType, data) {
    const warmingStrategies = {
      user: (userData) => {
        this.set(`user:${userData.id}`, userData, {
          ttl: 30 * 60 * 1000, // 30 minutes
          priority: 'high',
          tags: ['user', 'profile']
        });
      },
      activities: (activities) => {
        activities.forEach(activity => {
          this.set(`activity:${activity.id}`, activity, {
            ttl: 10 * 60 * 1000, // 10 minutes
            priority: 'normal',
            tags: ['activity', 'list']
          });
        });
      },
      friends: (friends) => {
        this.set('user:friends', friends, {
          ttl: 15 * 60 * 1000, // 15 minutes
          priority: 'high',
          tags: ['friends', 'social']
        });
      }
    };

    const strategy = warmingStrategies[dataType];
    if (strategy) {
      strategy(data);
      console.log(`🔥 Warmed cache for ${dataType}`);
    }
  }

  // Get comprehensive statistics
  getStatistics() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      cacheSize: this.cache.size,
      memoryUsage: this.estimateMemoryUsage(),
      topKeys: this.getTopAccessedKeys(5)
    };
  }

  estimateMemoryUsage() {
    let totalSize = 0;
    for (const [key, meta] of this.metadata.entries()) {
      totalSize += meta.originalSize || 0;
    }
    return `${(totalSize / 1024).toFixed(2)} KB`;
  }

  getTopAccessedKeys(limit = 10) {
    return Array.from(this.metadata.entries())
      .sort(([, a], [, b]) => b.accessCount - a.accessCount)
      .slice(0, limit)
      .map(([key, meta]) => ({ key, accessCount: meta.accessCount }));
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.metadata.clear();
    this.accessPatterns.clear();
    console.log('🗑️ Cache cleared completely');
  }
}

// Create global cache instance
const intelligentCache = new IntelligentCacheManager();

export default intelligentCache;