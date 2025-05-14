const User = require('../models/User');
const Friend = require('../models/Friend');

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
const generateRandomProfileImage = (seed) => {
  // Add some randomness to the seed to ensure variation
  const randomSeed = seed + Math.floor(Math.random() * 10000);
  
  // Select a random base URL from the options
  const baseUrl = profileImageOptions[Math.floor(Math.random() * profileImageOptions.length)];
  
  // Add seed and any required parameters
  if (baseUrl.includes('dicebear')) {
    return `${baseUrl}${randomSeed}.svg?mood=happy&background=%23ffffff`;
  } else if (baseUrl.includes('robohash')) {
    return `${baseUrl}${randomSeed}?set=set4&bgset=bg1&size=200x200`;
  } else if (baseUrl.includes('multiavatar')) {
    // For multiavatar, ensure we're returning a PNG
    return `${baseUrl}${randomSeed}.png`;
  }
  
  // Default fallback
  return `${baseUrl}${randomSeed}`;
};

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

// Generate a random profile avatar
exports.generateRandomAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Generate a random profile image using the helper function
    const newProfilePicture = generateRandomProfileImage(userId + Date.now());
    
    // Update the user's profile picture in the database
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: newProfilePicture },
      { new: true }
    ).select('-password');
    
    // Return the updated user data with new profile picture
    res.json({
      message: 'Profile picture updated successfully',
      profilePicture: newProfilePicture,
      user
    });
  } catch (err) {
    console.error('Error generating random avatar:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};