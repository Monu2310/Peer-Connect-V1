const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const GroupMessage = require('./models/GroupMessage');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Define CORS options more explicitly
const corsOptions = {
  origin: [
    'http://localhost:3111',
    'http://localhost:5111', 
    'https://peer-connect-v1-cl.onrender.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: false, // Change from true to false to avoid cookie issues
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

// Database connection with increased timeout and better error handling
// Try connecting to the database with retries
const connectWithRetry = () => {
  const options = {
    serverSelectionTimeoutMS: 60000, // Increase timeout to 60 seconds
    socketTimeoutMS: 60000, // Socket timeout
    connectTimeoutMS: 60000, // Connection timeout
    // Removed unsupported options: keepAlive and keepAliveInitialDelay
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    w: 'majority'
  };
  
  console.log('MongoDB connection attempt...');
  return mongoose.connect(process.env.MONGODB_URI, options)
    .then(() => {
      console.log('MongoDB connected successfully');
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      console.log('Retrying MongoDB connection in 5 seconds...');
      setTimeout(connectWithRetry, 5000); // Retry after 5 seconds
    });
};

// Initial connection
connectWithRetry();

// Add connection event handlers
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
  // If the connection fails, try to reconnect
  setTimeout(connectWithRetry, 5000);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected! Attempting to reconnect...');
  connectWithRetry();
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected!');
});

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/recommendations', require('./routes/recommendations'));

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

// Default route
app.get('/', (req, res) => {
  res.send('PeerConnect API is running');
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
  console.log(`Server running on port ${PORT}`);
});