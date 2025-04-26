const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Cookie options
const cookieOptions = {
  httpOnly: true, // Cannot be accessed by client-side JS
  secure: process.env.NODE_ENV === 'production', // In production, only send over HTTPS
  sameSite: 'lax', // Controls when cookies are sent with cross-site requests
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Check if username is taken
    user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Create new user
    user = new User({
      username,
      email,
      password
    });

    await user.save();

    // Generate JWT token
    const payload = {
      id: user.id
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        
        // Set token in HTTP-only cookie
        res.cookie('token', token, cookieOptions);
        
        // Also send token in response body
        res.status(201).json({ 
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for email: ${email}`);

    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log(`User found: ${user.username} (${user._id})`);

    // Generate JWT token
    const payload = {
      id: user.id
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) {
          console.error('JWT signing error:', err);
          throw err;
        }
        
        // Set token in HTTP-only cookie
        res.cookie('token', token, cookieOptions);
        
        console.log(`Token generated and cookie set`);
        
        // Also send token in response body
        res.json({ 
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture
          }
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Server error');
  }
};

// Get current authenticated user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Logout user
exports.logout = (req, res) => {
  // Clear the token cookie
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};