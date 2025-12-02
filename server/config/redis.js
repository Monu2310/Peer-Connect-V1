const Redis = require('ioredis');
const NodeCache = require('node-cache');

// Redis configuration - production-ready for Render.com
const redisConfig = process.env.REDIS_URL 
  ? process.env.REDIS_URL // Use Redis URL from Render (e.g., redis://...)
  : {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || null,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 5000,
      commandTimeout: 3000,
      family: 4,
      keepAlive: 30000,
      db: 0
    };

const rawPrefix = process.env.REDIS_KEY_PREFIX || `pc:v1:${process.env.NODE_ENV || 'development'}`;
const KEY_PREFIX = rawPrefix.endsWith(':') ? rawPrefix : `${rawPrefix}:`;

// Primary Redis instance with error handling
let redis;
try {
  redis = new Redis(redisConfig);
  redis.on('error', (err) => {
    console.log('⚠️ Redis not available, using fallback cache:', err.message);
  });
} catch (err) {
  console.log('⚠️ Redis initialization failed, using fallback cache only');
  redis = null;
}

// Fallback in-memory cache for when Redis is unavailable
const fallbackCache = new NodeCache({ 
  stdTTL: 600, // 10 minutes default
  checkperiod: 120,
  useClones: false,
  maxKeys: 10000
});

// Redis connection handling
let isRedisConnected = false;

redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
  isRedisConnected = true;
});

redis.on('error', (err) => {
  console.warn('⚠️ Redis connection error, falling back to memory cache:', err.message);
  isRedisConnected = false;
});

redis.on('close', () => {
  console.warn('⚠️ Redis connection closed, using memory cache');
  isRedisConnected = false;
});

// Cache wrapper with fallback
class CacheManager {
  constructor() {
    this.redis = redis;
    this.fallback = fallbackCache;
    this.prefixKey = (key = '') => `${KEY_PREFIX}${key}`;
  }

  async get(key) {
    const namespacedKey = this.prefixKey(key);
    try {
      if (isRedisConnected) {
        const result = await this.redis.get(namespacedKey);
        return result ? JSON.parse(result) : null;
      }
    } catch (error) {
      console.warn('Redis get error:', error.message);
    }
    
    // Fallback to memory cache
    return this.fallback.get(namespacedKey) || null;
  }

  async set(key, value, ttl = 600) {
    const namespacedKey = this.prefixKey(key);
    const stringValue = JSON.stringify(value);
    
    try {
      if (isRedisConnected) {
        await this.redis.setex(namespacedKey, ttl, stringValue);
      }
    } catch (error) {
      console.warn('Redis set error:', error.message);
    }
    
    // Always set in fallback cache
    this.fallback.set(namespacedKey, value, ttl);
  }

  async del(key) {
    const namespacedKey = this.prefixKey(key);
    try {
      if (isRedisConnected) {
        await this.redis.del(namespacedKey);
      }
    } catch (error) {
      console.warn('Redis del error:', error.message);
    }
    
    this.fallback.del(namespacedKey);
  }

  async exists(key) {
    const namespacedKey = this.prefixKey(key);
    try {
      if (isRedisConnected) {
        return await this.redis.exists(namespacedKey);
      }
    } catch (error) {
      console.warn('Redis exists error:', error.message);
    }
    
    return this.fallback.has(namespacedKey);
  }

  async flush() {
    try {
      if (isRedisConnected) {
        await this.redis.flushdb();
      }
    } catch (error) {
      console.warn('Redis flush error:', error.message);
    }
    
    this.fallback.flushAll();
  }

  // Multi-get for batch operations
  async mget(keys) {
    const results = {};
    const namespacedKeys = keys.map(key => this.prefixKey(key));
    
    try {
      if (isRedisConnected) {
        const values = await this.redis.mget(namespacedKeys);
        keys.forEach((key, index) => {
          results[key] = values[index] ? JSON.parse(values[index]) : null;
        });
        return results;
      }
    } catch (error) {
      console.warn('Redis mget error:', error.message);
    }
    
    // Fallback to memory cache
    keys.forEach((key, index) => {
      results[key] = this.fallback.get(namespacedKeys[index]) || null;
    });
    
    return results;
  }

  // Multi-set for batch operations
  async mset(keyValuePairs, ttl = 600) {
    try {
      if (isRedisConnected) {
        const pipeline = this.redis.pipeline();
        Object.entries(keyValuePairs).forEach(([key, value]) => {
          pipeline.setex(this.prefixKey(key), ttl, JSON.stringify(value));
        });
        await pipeline.exec();
      }
    } catch (error) {
      console.warn('Redis mset error:', error.message);
    }
    
    // Always set in fallback cache
    Object.entries(keyValuePairs).forEach(([key, value]) => {
      this.fallback.set(this.prefixKey(key), value, ttl);
    });
  }
}

const cache = new CacheManager();

// Cache key generators
const generateKey = {
  user: (userId) => `user:${userId}`,
  userProfile: (userId) => `user:profile:${userId}`,
  userFriends: (userId) => `user:friends:${userId}`,
  userActivities: (userId) => `user:activities:${userId}`,
  activity: (activityId) => `activity:${activityId}`,
  activityParticipants: (activityId) => `activity:participants:${activityId}`,
  messages: (conversationId) => `messages:${conversationId}`,
  conversation: (conversationId) => `conversation:${conversationId}`,
  recommendations: (userId) => `recommendations:${userId}`,
  search: (query, filters) => `search:${Buffer.from(JSON.stringify({query, filters})).toString('base64')}`,
  feed: (userId, page) => `feed:${userId}:${page}`,
  notifications: (userId) => `notifications:${userId}`
};

// Cache TTL constants (in seconds)
const TTL = {
  USER_PROFILE: 1800, // 30 minutes
  USER_FRIENDS: 900,  // 15 minutes
  ACTIVITIES: 600,    // 10 minutes
  MESSAGES: 300,      // 5 minutes
  SEARCH: 1800,       // 30 minutes
  FEED: 300,          // 5 minutes
  RECOMMENDATIONS: 3600, // 1 hour
  NOTIFICATIONS: 60   // 1 minute
};

module.exports = {
  redis,
  cache,
  generateKey,
  TTL,
  isRedisConnected: () => isRedisConnected,
  KEY_PREFIX
};