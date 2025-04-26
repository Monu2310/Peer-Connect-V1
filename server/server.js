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
  origin: process.env.CLIENT_URL || 'http://localhost:3111',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true
};

// Initialize Socket.IO with CORS options
const io = socketIo(server, {
  cors: corsOptions
});

// Apply CORS middleware to all routes
app.use(cors(corsOptions));

// Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Add cookie-parser middleware

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/peerconnect')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/friends', require('./routes/friends'));

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
      
      // Create and save message to database
      const groupMessage = new GroupMessage({
        activityId,
        sender: messageData.sender.id,
        content: messageData.content,
        senderName: messageData.sender.username
      });
      
      await groupMessage.save();
      
      // Add the MongoDB _id to the message data
      messageData._id = groupMessage._id;
      
      // Broadcast to all clients in the activity room
      io.to(messageData.roomId).emit('activity-message', messageData);
    } catch (err) {
      console.error('Error saving activity message:', err);
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