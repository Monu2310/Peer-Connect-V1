const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Cookie options
const cookieOptions = {
  httpOnly: true, // Cannot be accessed by client-side JS
  secure: process.env.NODE_ENV === 'production', // In production, only send over HTTPS
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Use 'none' in production for cross-site
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
};

// Register a new user
exports.register = async (req, res) => {
  try {
    console.log('Registration attempt received');
    
    // Get basic registration data
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Log database check attempt
    console.log(`Checking if email ${email} already exists...`);
    
    try {
      // Check if user exists with timeout options
      let existingUser = await User.findOne({ email }).maxTimeMS(20000).exec();
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Log username check attempt
      console.log(`Checking if username ${username} already exists...`);
      
      // Check if username is taken with timeout options
      existingUser = await User.findOne({ username }).maxTimeMS(20000).exec();
      if (existingUser) {
        return res.status(400).json({ message: 'Username is already taken' });
      }

      // Create new user with minimal data
      console.log(`Creating new user: ${username}`);
      const user = new User({
        username,
        email,
        password,
        profilePicture: 'https://avatars.dicebear.com/api/identicon/' + username + '.svg'
      });
      
      // Save the user with timeout
      console.log('Saving user to database...');
      await user.save({ maxTimeMS: 30000 });
      console.log(`User ${username} created successfully with id: ${user.id}`);
      
      // Create token directly instead of using callback
      console.log('Generating JWT token...');
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'default_jwt_secret',
        { expiresIn: '7d' }
      );
      
      console.log('Registration successful, returning response');
      // Return response with token and minimal user data
      return res.status(201).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture
        }
      });
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      if (dbError.name === 'MongooseError' && dbError.message.includes('buffering timed out')) {
        return res.status(503).json({ 
          message: 'Database operation timed out. Please try again in a moment.'
        });
      }
      throw dbError; // Re-throw to be caught by outer catch
    }
  } catch (err) {
    console.error('Registration error:', err);
    
    // Handle different types of errors
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: 'Username or email already in use'
      });
    } else {
      // Generic error
      return res.status(500).json({ 
        message: 'Server error during registration',
        details: err.message
      });
    }
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for email: ${email}`);

    // Validate inputs
    if (!email || !password) {
      console.log('Missing email or password in request');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      console.log(`User not found with email: ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log(`User found: ${user.username} (${user._id})`);

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`Password mismatch for user: ${user._id}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log(`Password verified for user: ${user._id}`);

    // Generate JWT token
    const payload = {
      id: user.id
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'default_secret_do_not_use_in_production',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) {
          console.error('JWT signing error:', err);
          return res.status(500).json({ message: 'Error generating authentication token' });
        }
        
        // Set token in HTTP-only cookie
        res.cookie('token', token, cookieOptions);
        
        console.log(`Token generated and cookie set for user: ${user._id}`);
        
        // Also send token in response body
        res.json({ 
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            // Include preference fields
            hobbies: user.hobbies || [],
            favoriteSubjects: user.favoriteSubjects || [],
            sports: user.sports || [],
            musicGenres: user.musicGenres || [],
            movieGenres: user.movieGenres || []
          }
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login', error: err.message });
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