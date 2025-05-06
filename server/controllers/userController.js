const User = require('../models/User');
const Friend = require('../models/Friend');

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).send('Server error');
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { 
      username, 
      email, 
      bio, 
      location, 
      interests, 
      profilePicture, 
      major, 
      year,
      // New preference fields
      hobbies,
      favoriteSubjects,
      sports,
      musicGenres,
      movieGenres
    } = req.body;
    
    // Build profile object
    const profileFields = {};
    if (username !== undefined) profileFields.username = username;
    if (email !== undefined) profileFields.email = email;
    if (bio !== undefined) profileFields.bio = bio;
    if (location !== undefined) profileFields.location = location;
    if (major !== undefined) profileFields.major = major;
    if (year !== undefined) profileFields.year = year;
    if (profilePicture !== undefined) profileFields.profilePicture = profilePicture;
    
    // Handle interests specially - could be array or string
    if (interests !== undefined) {
      profileFields.interests = Array.isArray(interests) 
        ? interests
        : interests.split(',').map(i => i.trim()).filter(i => i);
    }
    
    // Handle new preference fields
    if (hobbies !== undefined) profileFields.hobbies = Array.isArray(hobbies) ? hobbies : [];
    if (favoriteSubjects !== undefined) profileFields.favoriteSubjects = Array.isArray(favoriteSubjects) ? favoriteSubjects : [];
    if (sports !== undefined) profileFields.sports = Array.isArray(sports) ? sports : [];
    if (musicGenres !== undefined) profileFields.musicGenres = Array.isArray(musicGenres) ? musicGenres : [];
    if (movieGenres !== undefined) profileFields.movieGenres = Array.isArray(movieGenres) ? movieGenres : [];
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: profileFields },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Search users
exports.searchUsers = async (req, res) => {
  try {
    const q = req.query.q;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Find users by username, email, interests, or major
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { interests: { $in: [new RegExp(q, 'i')] } },
        { major: { $regex: q, $options: 'i' } }
      ]
    })
    .select('-password')
    .limit(10);
    
    console.log(`Search for '${q}' found ${users.length} users`);
    res.json(users);
  } catch (err) {
    console.error('Error searching users:', err.message);
    res.status(500).send('Server error');
  }
};

// Get dashboard stats for current user
exports.getDashboardStats = async (req, res) => {
  try {
    // Get count of pending friend requests
    const pendingRequests = await Friend.countDocuments({
      recipient: req.user.id,
      status: 'pending'
    });
    
    // Get count of friends
    const friends = await Friend.countDocuments({
      $or: [
        { requester: req.user.id, status: 'accepted' },
        { recipient: req.user.id, status: 'accepted' }
      ]
    });
    
    res.json({
      pendingRequests,
      friends
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Find user by email
exports.findUserByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Find user by exact email match
    const user = await User.findOne({ email: email.trim() }).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }
    
    console.log(`User found by email: ${user.username} (${user._id})`);
    res.json(user);
  } catch (err) {
    console.error('Error finding user by email:', err.message);
    res.status(500).send('Server error');
  }
};