const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Array of profile image URLs to randomly select from
const profileImageOptions = [
  'https://robohash.org/',
  'https://avatars.dicebear.com/api/avataaars/',
  'https://avatars.dicebear.com/api/bottts/',
  'https://avatars.dicebear.com/api/human/',
  'https://avatars.dicebear.com/api/identicon/',
  'https://avatars.dicebear.com/api/jdenticon/',
  'https://avatars.dicebear.com/api/gridy/',
  'https://api.multiavatar.com/'
];

// Helper function to generate a random profile image URL
const generateRandomProfileImage = (username) => {
  // Select a random base URL from the options
  const baseUrl = profileImageOptions[Math.floor(Math.random() * profileImageOptions.length)];
  
  // Add username as seed and any required parameters
  // Different services have different parameter requirements
  if (baseUrl.includes('dicebear')) {
    return `${baseUrl}${username}.svg?mood=happy&background=%23ffffff`;
  } else if (baseUrl.includes('robohash')) {
    return `${baseUrl}${username}?set=set4&bgset=bg1&size=200x200`;
  } else if (baseUrl.includes('multiavatar')) {
    // For multiavatar, ensure we're returning a PNG
    return `${baseUrl}${username}.png`;
  }
  
  // Default fallback
  return `${baseUrl}${username}`;
};

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
    const { 
      username, 
      email, 
      password, 
      major, 
      graduationYear,
      hobbies,
      favoriteSubjects,
      sports,
      musicGenres,
      movieGenres
    } = req.body;

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

    // Create new user with preferences
    user = new User({
      username,
      email,
      password,
      profilePicture: generateRandomProfileImage(username) // Generate random profile image
    });
    
    // Add optional fields if provided
    if (major) user.major = major;
    if (graduationYear) user.year = graduationYear;
    
    // Add preference fields if provided
    if (hobbies && Array.isArray(hobbies)) user.hobbies = hobbies;
    if (favoriteSubjects && Array.isArray(favoriteSubjects)) user.favoriteSubjects = favoriteSubjects;
    if (sports && Array.isArray(sports)) user.sports = sports;
    if (musicGenres && Array.isArray(musicGenres)) user.musicGenres = musicGenres;
    if (movieGenres && Array.isArray(movieGenres)) user.movieGenres = movieGenres;
    
    // Add all hobbies, sports, etc. to interests for compatibility with existing code
    user.interests = [
      ...(hobbies || []),
      ...(sports || []),
      ...(favoriteSubjects || [])
    ];

    await user.save();

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
          return res.status(500).json({ message: 'Error generating authentication token', error: err.message });
        }
        
        // Set token in HTTP-only cookie
        res.cookie('token', token, cookieOptions);
        
        // Also send token in response body
        res.status(201).json({ 
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            hobbies: user.hobbies,
            favoriteSubjects: user.favoriteSubjects,
            sports: user.sports,
            musicGenres: user.musicGenres,
            movieGenres: user.movieGenres
          }
        });
      }
    );
  } catch (err) {
    console.error('Registration error:', err);
    
    // Send more specific error messages based on error type
    if (err.name === 'ValidationError') {
      // Mongoose validation error - extract field-specific errors
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors,
        details: err.message 
      });
    } else if (err.code === 11000) {
      // Duplicate key error (usually email or username)
      return res.status(400).json({ 
        message: 'Duplicate key error - email or username already exists',
        details: err.message
      });
    } else {
      // Generic server error with more details
      res.status(500).json({ 
        message: 'Server error during registration', 
        error: err.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
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