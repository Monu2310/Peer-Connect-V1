const mongoose = require('mongoose');

// Database optimization configuration
const dbConfig = {
  // Connection options for optimal performance
  options: {
    maxPoolSize: 50, // Maximum number of connections
    minPoolSize: 5,  // Minimum number of connections
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    serverSelectionTimeoutMS: 5000, // How long to try selecting a server
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    bufferCommands: false, // Disable mongoose buffering for commands
    readPreference: 'secondaryPreferred', // Read from secondary when possible
    retryWrites: true,
    writeConcern: {
      w: 'majority',
      j: true,
      wtimeout: 1000
    }
  },

  // Connection pool monitoring
  setupConnectionPool: () => {
    const db = mongoose.connection;
    
    db.on('connected', () => {
      console.log('✅ MongoDB connected with optimized pool');
    });
    
    db.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });
    
    db.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    // Monitor connection pool
    db.on('fullsetup', () => {
      console.log('📊 MongoDB replica set fully connected');
    });
  },

  // Database indexes for performance
  createIndexes: async () => {
    try {
      console.log('🔧 Creating database indexes...');
      
      // User model indexes
      const User = require('../models/User');
      await User.collection.createIndex({ email: 1 }, { unique: true });
      await User.collection.createIndex({ lastActive: -1 });
      await User.collection.createIndex({ createdAt: -1 });
      await User.collection.createIndex({ 'location.coordinates': '2dsphere' });
      
      // Activity model indexes
      const Activity = require('../models/Activity');
      await Activity.collection.createIndex({ creator: 1, createdAt: -1 });
      await Activity.collection.createIndex({ participants: 1 });
      await Activity.collection.createIndex({ category: 1, createdAt: -1 });
      await Activity.collection.createIndex({ 'location.coordinates': '2dsphere' });
      await Activity.collection.createIndex({ date: 1 });
      await Activity.collection.createIndex({ status: 1, createdAt: -1 });
      await Activity.collection.createIndex({ 
        title: 'text', 
        description: 'text' 
      }, {
        weights: { title: 10, description: 5 }
      });
      
      // Friend model indexes
      const Friend = require('../models/Friend');
      await Friend.collection.createIndex({ requester: 1, status: 1 });
      await Friend.collection.createIndex({ recipient: 1, status: 1 });
      await Friend.collection.createIndex({ createdAt: -1 });
      
      // Message model indexes
      const Message = require('../models/Message');
      await Message.collection.createIndex({ sender: 1, receiver: 1, createdAt: -1 });
      await Message.collection.createIndex({ conversation: 1, createdAt: -1 });
      await Message.collection.createIndex({ createdAt: -1 });
      
      // Group message indexes
      const GroupMessage = require('../models/GroupMessage');
      await GroupMessage.collection.createIndex({ activity: 1, createdAt: -1 });
      await GroupMessage.collection.createIndex({ sender: 1, createdAt: -1 });
      
      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating indexes:', error);
    }
  }
};

// Query optimization helpers
const queryOptimizer = {
  // Optimize user queries
  optimizeUserQuery: (query) => {
    return query
      .lean() // Return plain objects instead of Mongoose documents
      .select('-password -__v') // Exclude sensitive fields
      .hint({ email: 1 }); // Use email index when applicable
  },

  // Optimize activity queries
  optimizeActivityQuery: (query) => {
    return query
      .lean()
      .populate({
        path: 'creator',
        select: 'name avatar email',
        options: { lean: true }
      })
      .populate({
        path: 'participants',
        select: 'name avatar',
        options: { lean: true, limit: 10 } // Limit populated participants
      });
  },

  // Optimize message queries
  optimizeMessageQuery: (query) => {
    return query
      .lean()
      .populate({
        path: 'sender',
        select: 'name avatar',
        options: { lean: true }
      })
      .sort({ createdAt: -1 })
      .limit(50); // Default message limit
  },

  // Pagination helper
  paginate: (query, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    return query.skip(skip).limit(limit);
  }
};

// Aggregation pipelines for complex queries
const aggregationPipelines = {
  // Get user activity statistics
  getUserActivityStats: (userId) => [
    { $match: { creator: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        averageParticipants: { $avg: { $size: '$participants' } }
      }
    },
    { $sort: { count: -1 } }
  ],

  // Get popular activities with location
  getPopularActivities: (location, radius = 10000) => [
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: location
        },
        distanceField: 'distance',
        maxDistance: radius,
        spherical: true
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'creator',
        foreignField: '_id',
        as: 'creator',
        pipeline: [{ $project: { name: 1, avatar: 1 } }]
      }
    },
    { $unwind: '$creator' },
    {
      $addFields: {
        participantCount: { $size: '$participants' },
        score: {
          $add: [
            { $multiply: [{ $size: '$participants' }, 2] },
            { $divide: [1000000, { $add: ['$distance', 1] }] }
          ]
        }
      }
    },
    { $sort: { score: -1 } },
    { $limit: 20 }
  ],

  // Get user recommendations
  getUserRecommendations: (userId, userInterests = []) => [
    {
      $match: {
        creator: { $ne: mongoose.Types.ObjectId(userId) },
        participants: { $ne: mongoose.Types.ObjectId(userId) },
        status: 'active',
        date: { $gte: new Date() }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'creator',
        foreignField: '_id',
        as: 'creator',
        pipeline: [{ $project: { name: 1, avatar: 1 } }]
      }
    },
    { $unwind: '$creator' },
    {
      $addFields: {
        participantCount: { $size: '$participants' },
        interestScore: {
          $size: {
            $setIntersection: ['$tags', userInterests]
          }
        }
      }
    },
    {
      $addFields: {
        recommendationScore: {
          $add: [
            '$interestScore',
            { $multiply: ['$participantCount', 0.1] }
          ]
        }
      }
    },
    { $sort: { recommendationScore: -1, createdAt: -1 } },
    { $limit: 10 }
  ]
};

// Connection monitoring and health checks
const connectionMonitor = {
  getConnectionStats: () => {
    const db = mongoose.connection;
    return {
      readyState: db.readyState,
      host: db.host,
      port: db.port,
      name: db.name,
      collections: Object.keys(db.collections),
      connectionCount: db.client?.topology?.connections?.length || 0
    };
  },

  healthCheck: async () => {
    try {
      await mongoose.connection.db.admin().ping();
      return { status: 'healthy', timestamp: new Date() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message, timestamp: new Date() };
    }
  }
};

module.exports = {
  dbConfig,
  queryOptimizer,
  aggregationPipelines,
  connectionMonitor
};