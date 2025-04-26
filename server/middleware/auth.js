const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Get token from headers, cookies, or request body
    let token = req.header('x-auth-token');
    
    // If no token in x-auth-token, check Authorization header
    if (!token) {
      const authHeader = req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1]; // Extract token from "Bearer [token]"
      }
    }
    
    // If still no token, check cookies
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    // If still no token, check request body (for socket.io connections)
    if (!token && req.body && req.body.token) {
      token = req.body.token;
    }
    
    // Check if no token
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};