const { cache, generateKey, TTL } = require('../config/redis');
const crypto = require('crypto');

// Response caching middleware
const cacheResponse = (ttl = 600, keyGenerator = null) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Never cache personalized/authed responses – they must stay fresh and per-user
    const hasAuthHeader = Boolean(
      req.headers['x-auth-token'] ||
      (req.headers['authorization'] && req.headers['authorization'].toLowerCase().startsWith('bearer ')) ||
      req.cookies?.token
    );

    if (hasAuthHeader) {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator 
      ? keyGenerator(req) 
      : `response:${req.originalUrl}:${crypto.createHash('md5').update(JSON.stringify(req.query)).digest('hex')}`;

    try {
      // Try to get cached response
      const cachedResponse = await cache.get(cacheKey);
      
      if (cachedResponse) {
        // Set cache headers
        res.set('X-Cache', 'HIT');
        res.set('Cache-Control', `public, max-age=${ttl}`);
        
        return res.status(cachedResponse.status).json(cachedResponse.data);
      }

      // Cache miss - intercept response
      const originalJson = res.json;
      
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const responseData = {
            status: res.statusCode,
            data: data,
            timestamp: Date.now()
          };
          
          // Cache the response asynchronously
          cache.set(cacheKey, responseData, ttl).catch(err => {
            console.warn('Cache set error:', err.message);
          });
        }
        
        res.set('X-Cache', 'MISS');
        res.set('Cache-Control', `public, max-age=${ttl}`);
        
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.warn('Cache middleware error:', error.message);
      next();
    }
  };
};

// Smart cache invalidation
const invalidateCache = async (patterns) => {
  try {
    if (Array.isArray(patterns)) {
      await Promise.all(patterns.map(pattern => cache.del(pattern)));
    } else {
      await cache.del(patterns);
    }
  } catch (error) {
    console.warn('Cache invalidation error:', error.message);
  }
};

// Batch data loader with caching
const batchLoader = {
  async loadUsers(userIds) {
    const keys = userIds.map(id => generateKey.user(id));
    const cached = await cache.mget(keys);
    
    const uncachedIds = [];
    const results = {};
    
    userIds.forEach((id, index) => {
      if (cached[keys[index]]) {
        results[id] = cached[keys[index]];
      } else {
        uncachedIds.push(id);
      }
    });
    
    // Load uncached users from database
    if (uncachedIds.length > 0) {
      const User = require('../models/User');
      const uncachedUsers = await User.find({ _id: { $in: uncachedIds } }).lean();
      
      const cacheData = {};
      uncachedUsers.forEach(user => {
        results[user._id] = user;
        cacheData[generateKey.user(user._id)] = user;
      });
      
      // Cache the loaded users
      if (Object.keys(cacheData).length > 0) {
        await cache.mset(cacheData, TTL.USER_PROFILE);
      }
    }
    
    return results;
  },

  async loadActivities(activityIds) {
    const keys = activityIds.map(id => generateKey.activity(id));
    const cached = await cache.mget(keys);
    
    const uncachedIds = [];
    const results = {};
    
    activityIds.forEach((id, index) => {
      if (cached[keys[index]]) {
        results[id] = cached[keys[index]];
      } else {
        uncachedIds.push(id);
      }
    });
    
    // Load uncached activities from database
    if (uncachedIds.length > 0) {
      const Activity = require('../models/Activity');
      const uncachedActivities = await Activity.find({ _id: { $in: uncachedIds } })
        .populate('creator', 'name avatar')
        .lean();
      
      const cacheData = {};
      uncachedActivities.forEach(activity => {
        results[activity._id] = activity;
        cacheData[generateKey.activity(activity._id)] = activity;
      });
      
      // Cache the loaded activities
      if (Object.keys(cacheData).length > 0) {
        await cache.mset(cacheData, TTL.ACTIVITIES);
      }
    }
    
    return results;
  }
};

// Preloader for critical data
const preloadCriticalData = async (userId) => {
  try {
    const User = require('../models/User');
    const Activity = require('../models/Activity');
    const Friend = require('../models/Friend');
    
    // Preload user profile
    const userProfileKey = generateKey.userProfile(userId);
    if (!(await cache.exists(userProfileKey))) {
      const user = await User.findById(userId).lean();
      if (user) {
        await cache.set(userProfileKey, user, TTL.USER_PROFILE);
      }
    }
    
    // Preload user friends
    const userFriendsKey = generateKey.userFriends(userId);
    if (!(await cache.exists(userFriendsKey))) {
      const friends = await Friend.find({
        $or: [{ requester: userId }, { recipient: userId }],
        status: 'accepted'
      }).populate('requester recipient', 'name avatar email').lean();
      
      if (friends) {
        await cache.set(userFriendsKey, friends, TTL.USER_FRIENDS);
      }
    }
    
    // Preload recent activities
    const userActivitiesKey = generateKey.userActivities(userId);
    if (!(await cache.exists(userActivitiesKey))) {
      const activities = await Activity.find({
        $or: [
          { creator: userId },
          { participants: userId }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('creator', 'name avatar')
      .lean();
      
      if (activities) {
        await cache.set(userActivitiesKey, activities, TTL.ACTIVITIES);
      }
    }
    
    console.log(`✅ Preloaded critical data for user ${userId}`);
  } catch (error) {
    console.warn('Preload error:', error.message);
  }
};

// Smart cache warming
const warmCache = async () => {
  try {
    console.log('🔥 Starting cache warming...');
    
    const User = require('../models/User');
    const Activity = require('../models/Activity');
    
    // Warm popular activities
    const popularActivities = await Activity.find({})
      .sort({ participantCount: -1, createdAt: -1 })
      .limit(50)
      .populate('creator', 'name avatar')
      .lean();
    
    const activityCacheData = {};
    popularActivities.forEach(activity => {
      activityCacheData[generateKey.activity(activity._id)] = activity;
    });
    
    await cache.mset(activityCacheData, TTL.ACTIVITIES);
    
    // Warm recent users
    const recentUsers = await User.find({})
      .sort({ lastActive: -1 })
      .limit(100)
      .lean();
    
    const userCacheData = {};
    recentUsers.forEach(user => {
      userCacheData[generateKey.user(user._id)] = user;
    });
    
    await cache.mset(userCacheData, TTL.USER_PROFILE);
    
    console.log(`✅ Cache warmed with ${popularActivities.length} activities and ${recentUsers.length} users`);
  } catch (error) {
    console.warn('Cache warming error:', error.message);
  }
};

module.exports = {
  cacheResponse,
  invalidateCache,
  batchLoader,
  preloadCriticalData,
  warmCache
};