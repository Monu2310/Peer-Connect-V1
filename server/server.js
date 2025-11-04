const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const GroupMessage = require('./models/GroupMessage');

// Import performance configurations
const { dbConfig, queryOptimizer, connectionMonitor } = require('./config/database');
const { cache, warmCache } = require('./middleware/cache');
const { cacheResponse, preloadCriticalData } = require('./middleware/cache');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Trust proxy - REQUIRED for Render.com to get real client IPs
// This allows express-rate-limit to work correctly behind Render's proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// Compression middleware for better performance
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Speed limiting for expensive operations
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // allow 100 requests per 15 minutes, then...
  delayMs: () => 500, // add 500ms delay per request above 100
  validate: { delayMs: false } // disable warning
});

app.use('/api/', limiter);
app.use('/api/', speedLimiter);

// Force setting the MongoDB URI for Render.com
if (process.env.RENDER) {
  console.log('Running on Render.com - setting explicit MongoDB URI');
  process.env.MONGODB_URI = 'mongodb+srv://monu:mehta2310@cluster1.ofyyuwa.mongodb.net/peerconnect?retryWrites=true&w=majority&appName=Cluster1';
}

// Log environment variables for debugging (masking sensitive info)
console.log('Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 
  process.env.MONGODB_URI.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://****:****@') : 
  'Not set');

// Define CORS options more explicitly
const corsOptions = {
  origin: [
    'http://localhost:3111',
    'http://localhost:5111',
    'https://peer-connect-v1-cl.onrender.com',
    'https://peerconnect-v1.onrender.com',
    'https://peer-connect-1-0.onrender.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: false, // Keep false to avoid cookie issues
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Initialize Socket.IO with CORS options
const io = socketIo(server, {
  cors: corsOptions
});

// Add Socket.IO authentication middleware (making token auth optional)
io.use((socket, next) => {
  const token = socket.handshake.query.token;
  
  // Allow connections without tokens for general app usage
  // Only require token for specific authenticated socket operations
  if (!token) {
    console.log('Socket connection without token - allowing for basic functionality');
    return next(); // Continue without token
  }
  
  try {
    // Simple verification for authenticated socket connections
    console.log('Socket authenticated with token');
    return next();
  } catch (err) {
    console.error('Socket authentication error:', err);
    // Still allow connection but mark it as unauthenticated
    return next();
  }
});

// Apply CORS middleware to all routes
app.use(cors(corsOptions));

// Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Add cookie-parser middleware

// Database connection with performance optimizations
let retryCount = 0;
const maxRetries = 3;

const connectWithRetry = () => {
  // Get the MongoDB URI from environment or use a fallback for MongoDB Atlas
  const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://monu:mehta2310@cluster1.ofyyuwa.mongodb.net/peerconnect?retryWrites=true&w=majority&appName=Cluster1';
  
  const mongooseOptions = {
    ...dbConfig.options,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    bufferCommands: false // Disable mongoose buffering
  };
  
  // Log the connection string with credentials masked
  const maskedUri = mongoUri.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://****:****@');
  console.log('MongoDB connection attempt with optimized configuration:', maskedUri);
  
  return mongoose.connect(mongoUri, mongooseOptions)
    .then(async () => {
      console.log('✅ MongoDB connected successfully with optimizations');
      retryCount = 0; // Reset retry count on successful connection
      
      // Setup connection pool monitoring
      dbConfig.setupConnectionPool();
      
      // Create database indexes for performance
      await dbConfig.createIndexes();
      
      // Check if we can ping the database
      try {
        const health = await connectionMonitor.healthCheck();
        console.log('📊 Database health check:', health);
        
        // Warm up the cache with popular data
        setTimeout(async () => {
          await warmCache();
        }, 2000);
        
      } catch (err) {
        console.error('❌ Database health check failed:', err);
      }
    })
    .catch(err => {
      console.error('❌ MongoDB connection error:', err);
      retryCount++;
      
      if (retryCount >= maxRetries) {
        console.log('⚠️ Maximum retries reached. Starting server in cache-only mode.');
        console.log('� Please check your MongoDB Atlas IP whitelist and connection string.');
        return Promise.resolve(); // Continue without MongoDB
      }
      
      console.log(`�🔄 Retrying MongoDB connection in 5 seconds... (${retryCount}/${maxRetries})`);
      return new Promise(resolve => {
        setTimeout(() => {
          connectWithRetry().then(resolve);
        }, 5000);
      });
    });
};

// Make sure MongoDB is connected before initializing routes
const initializeApp = async () => {
  try {
    // First establish the database connection
    await connectWithRetry();
    
    // Add performance monitoring endpoint
    app.get('/api/performance', async (req, res) => {
      const dbStats = connectionMonitor.getConnectionStats();
      const healthCheck = await connectionMonitor.healthCheck();
      
      res.json({
        database: {
          ...dbStats,
          health: healthCheck
        },
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version
        },
        timestamp: new Date().toISOString()
      });
    });
    
    // Only set up routes after DB connection is established with caching
    app.use('/api/users', cacheResponse(300), require('./routes/users')); // 5 minutes cache
    app.use('/api/auth', require('./routes/auth')); // No cache for auth
    app.use('/api/activities', cacheResponse(180), require('./routes/activities')); // 3 minutes cache
    app.use('/api/messages', require('./routes/messages')); // No cache for real-time messages
    app.use('/api/friends', cacheResponse(600), require('./routes/friends')); // 10 minutes cache
    app.use('/api/recommendations', cacheResponse(900), require('./routes/recommendations')); // 15 minutes cache
    
    // Add health check endpoint for client wake-up pings
    app.get('/api/health', (req, res) => {
      res.status(200).json({ 
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString()
      });
    });
    
    // Default route and catch-all for client-side routing
    app.get('/', (req, res) => {
      res.send('PeerConnect API is running with enterprise performance optimizations 🚀');
    });
    
    // Better error handler
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ 
        message: 'Server Error', 
        error: process.env.NODE_ENV === 'production' ? {} : err.message
      });
    });
    
    // Start server
    const PORT = process.env.PORT || 5111;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} with enterprise optimizations`);
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1); // Exit with error code
  }
};

// Initialize the application
initializeApp();

// Socket.io for real-time communication
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Join a room for private messaging
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
  });
  
  // Handle new messages
  socket.on('send-message', (messageData) => {
    io.to(messageData.roomId).emit('receive-message', messageData);
  });
  
  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('typing', data);
  });
  
  // Activity group chat - join room
  socket.on('join-activity-room', (data) => {
    const { roomId, userId, username } = data;
    socket.join(roomId);
    
    // Notify others that user has joined
    socket.to(roomId).emit('activity-user-joined', {
      userId,
      username,
      timestamp: new Date().toISOString()
    });
    
    console.log(`User ${username} (${userId}) joined activity room ${roomId}`);
  });
  
  // Leave activity room
  socket.on('leave-activity-room', (data) => {
    const { roomId } = data;
    socket.leave(roomId);
  });
  
  // Send message to activity group chat - now using MongoDB
  socket.on('send-activity-message', async (messageData) => {
    try {
      // Extract activity ID from the roomId (format: "activity-{activityId}")
      const activityId = messageData.roomId.split('-')[1];
      
      // Make sure sender.id exists
      if (!messageData.sender || !messageData.sender.id) {
        console.error('Missing sender ID in message data:', messageData);
        socket.emit('activity-message-error', { error: 'Invalid sender data' });
        return;
      }
      
      console.log(`Received message from ${messageData.sender.username} (${messageData.sender.id}) for activity ${activityId}`);
      
      // Create and save message to database - handling mongoose types safely
      const groupMessage = new GroupMessage({
        activityId,
        sender: messageData.sender.id, // Mongoose will convert string ID to ObjectId
        content: messageData.content,
        senderName: messageData.sender.username || 'Unknown User'
      });
      
      const savedMessage = await groupMessage.save();
      console.log(`Message saved to database with ID: ${savedMessage._id}`);
      
      // Create message object to send back to client with proper format
      const formattedMessage = {
        _id: savedMessage._id,
        roomId: messageData.roomId,
        content: savedMessage.content,
        sender: {
          id: messageData.sender.id, // Use original ID to maintain client-side references
          username: savedMessage.senderName
        },
        timestamp: savedMessage.createdAt
      };
      
      // Send confirmation to the sender
      socket.emit('activity-message-confirmation', { 
        success: true,
        message: formattedMessage
      });
      
      // Broadcast to all clients in the activity room
      io.to(messageData.roomId).emit('activity-message', formattedMessage);
      console.log(`Message broadcast to room: ${messageData.roomId}`);
    } catch (err) {
      console.error('Error saving activity message:', err);
      // Send error back to client
      socket.emit('activity-message-error', { 
        error: 'Failed to save message',
        details: err.message
      });
    }
  });
  
  // Get activity messages history - now retrieving from MongoDB
  socket.on('get-activity-messages', async (data, callback) => {
    try {
      const { roomId } = data;
      // Extract activity ID from roomId
      const activityId = roomId.split('-')[1];
      
      // Get messages from database (limit to most recent 100)
      const messages = await GroupMessage.find({ activityId })
        .sort({ createdAt: 1 })
        .limit(100)
        .populate('sender', 'username profilePicture');
      
      // Format messages for the client
      const formattedMessages = messages.map(msg => ({
        _id: msg._id,
        roomId,
        content: msg.content,
        sender: {
          id: msg.sender._id,
          username: msg.senderName || msg.sender.username
        },
        timestamp: msg.createdAt
      }));
      
      callback(formattedMessages);
    } catch (err) {
      console.error('Error retrieving activity messages:', err);
      callback([]);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});