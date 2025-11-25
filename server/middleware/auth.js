const admin = require('../config/firebase');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Get token from headers
    let token = req.header('x-auth-token');
    
    // If no token in x-auth-token, check Authorization header
    if (!token) {
      const authHeader = req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
      // Verify Firebase ID Token
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.firebaseUser = decodedToken;
      
      // Find user in MongoDB by firebaseUid
      let user = await User.findOne({ firebaseUid: decodedToken.uid });

      // If user not found by firebaseUid, try email (migration/legacy support)
      if (!user && decodedToken.email) {
        user = await User.findOne({ email: decodedToken.email });
        if (user) {
          // Link firebaseUid to existing user
          user.firebaseUid = decodedToken.uid;
          await user.save();
        }
      }

      if (!user) {
        // If this is a registration endpoint, we might not expect a user yet
        // But for protected routes, we need a user.
        // We'll allow the request to proceed if it's a specific route, otherwise 401
        // For now, let's assume the controller handles "user not found" if needed, 
        // or we return 401 here.
        // Better: Attach firebaseUser and let controller decide if they need mongo user.
        // But existing controllers expect req.user.
        
        // If we are in the process of creating a user (e.g. /api/auth/google-callback or similar), we might skip this.
        // However, for standard flow, we return 401 if user isn't in DB yet (unless it's the sync endpoint).
        
        // Let's check if the request is for creating a user
        if (req.path === '/register' || req.path === '/sync') {
           return next();
        }
        
        return res.status(401).json({ message: 'User not registered in database' });
      }

      req.user = user;
      next();
    } catch (firebaseError) {
      console.error('Firebase token verification failed:', firebaseError.code);
      return res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};