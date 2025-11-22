const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const { performanceMiddleware, optimizeApiResponses } = require('./middleware/performance');
const GroupMessage = require('./models/GroupMessage');

// Import performance configurations
const { dbConfig, queryOptimizer, connectionMonitor } = require('./config/database');
const { cache, warmCache } = require('./middleware/cache');
const { cacheResponse, preloadCriticalData } = require('./middleware/cache');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Trust proxy and optimize API responses (ETag, JSON settings)
optimizeApiResponses(app);

// Log environment variables for debugging (masking sensitive info)
console.log('Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 
  process.env.MONGODB_URI.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://****:****@') : 
  'Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'NOT SET - Using default');

// Define CORS options more explicitly with dynamic CLIENT_URL
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3111',
  'http://localhost:5111',
  'https://peer-connect-v1-cl.onrender.com',
  'https://peerconnect-v1.onrender.com',
  'https://peer-connect-1-0.onrender.com'
];

// Add CLIENT_URL from env if it exists
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

const corsOptions = {
  origin: true, // Allow all origins for now
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'cache-control'],
  credentials: false,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Initialize Socket.IO with CORS options
const io = socketIo(server, {
  cors: corsOptions
});

// Apply CORS middleware to all routes
app.use(cors(corsOptions));

// Health check route - defined before other middleware to ensure it works even if others fail
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    cors: 'enabled'
  });
});

// Apply unified performance middleware (compression, helmet, rate limiting, slow down, cache headers, logging)
performanceMiddleware(app);

// Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Add cookie-parser middleware

// Database connection with performance optimizations
let retryCount = 0;
const maxRetries = 3;

const connectWithRetry = () => {
  // Get the MongoDB URI from environment variable (REQUIRED)
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.error(' FATAL: MONGODB_URI environment variable is not set!');
    console.error('Please set MONGODB_URI in your .env file or environment variables.');
    process.exit(1);
  }
  
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
      console.log(' MongoDB connected successfully with optimizations');
      retryCount = 0; // Reset retry count on successful connection
      
      // Setup connection pool monitoring
      dbConfig.setupConnectionPool();
      
      // Create database indexes for performance
      await dbConfig.createIndexes();
      
      // Check if we can ping the database
      try {
        const health = await connectionMonitor.healthCheck();
        console.log(' Database health check:', health);
        
        // Warm up the cache with popular data
        setTimeout(async () => {
          await warmCache();
        }, 2000);
        
      } catch (err) {
        console.error(' Database health check failed:', err);
      }
    })
    .catch(err => {
      console.error(' MongoDB connection error:', err);
      retryCount++;
      
      if (retryCount >= maxRetries) {
        console.log(' Maximum retries reached. Starting server in cache-only mode.');
        console.log(' Please check your MongoDB Atlas IP whitelist and connection string.');
        return Promise.resolve(); // Continue without MongoDB
      }
      
      console.log(` Retrying MongoDB connection in 5 seconds... (${retryCount}/${maxRetries})`);
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
		// In production, this should be protected; for now we keep it lightweight
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
      res.send('PeerConnect API is running with enterprise performance optimizations ');
    });
    
    // Better error handler
    app.use((err, req, res, next) => {
      console.error('🔥 GLOBAL ERROR HANDLER CAUGHT:', err);
      res.status(500).json({ 
        message: 'Server Error', 
        error: err.message, // Always show error for debugging
        stack: err.stack    // Always show stack for debugging
      });
    });
    
    // Start server
    const PORT = process.env.PORT || 5111;
    server.listen(PORT, () => {
      console.log(` Server running on port ${PORT} with enterprise optimizations`);
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1); // Exit with error code
  }
};

// Initialize the application
initializeApp();

// Helper to validate that a user can join a given private room
const canJoinPrivateRoom = (userId, roomId) => {
  if (!userId || !roomId) return false;
  const parts = roomId.split('-').filter(Boolean).sort();
  return parts.includes(String(userId));
};

// Socket.io for real-time communication
io.on('connection', (socket) => {
  console.log('New client connected');

  // Decode JWT if provided so we can tag the socket with a user id
  const token = socket.handshake.query?.token;
  if (token && process.env.JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Attach minimal user info to socket for authorization checks
      socket.user = { id: decoded.id || decoded._id };
    } catch (err) {
      console.warn('Socket JWT verification failed:', err.message);
    }
  }
  
  // Join a room for private messaging (only if user is part of room)
  socket.on('join-room', (roomId) => {
    // If we have a user on the socket, enforce membership in the room
    if (socket.user && !canJoinPrivateRoom(socket.user.id, roomId)) {
      console.warn(`Unauthorized room join attempt by user ${socket.user.id} for room ${roomId}`);
      return;
    }

    socket.join(roomId);
  });
  
  // Handle new messages
  socket.on('send-message', (messageData) => {
    // If user is known, ensure they’re allowed to send to this room
    if (socket.user && !canJoinPrivateRoom(socket.user.id, messageData.roomId)) {
      console.warn(`Unauthorized message send attempt by user ${socket.user.id} for room ${messageData.roomId}`);
      return;
    }

    io.to(messageData.roomId).emit('receive-message', messageData);
  });
  
  // Handle typing indicator
  socket.on('typing', (data) => {
    if (socket.user && !canJoinPrivateRoom(socket.user.id, data.roomId)) {
      return;
    }

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
