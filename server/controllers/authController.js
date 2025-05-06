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
      password
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
    console.error(err.message);
    res.status(500).send('Server error');
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