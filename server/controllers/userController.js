const User = require('../models/User');
const Friend = require('../models/Friend');
const admin = require('../config/firebase');
const crypto = require('crypto');
const { DEFAULT_DELETED_AVATAR, DEFAULT_DELETED_NAME } = require('../utils/deletedUser');

// Modern DiceBear avatar styles - funky and colorful options
const funkyAvatarStyles = [
  'fun-emoji',      // Fun emoji faces
  'bottts',         // Colorful robots
  'avataaars',      // Cartoon avatars
  'lorelei',        // Illustrated faces
  'notionists',     // Notion-style avatars
  'pixel-art',      // 8-bit pixel avatars
  'adventurer',     // Adventure characters
  'big-smile',      // Happy faces
  'personas',       // Personal avatars
  'thumbs'          // Thumbs up style
];

// Helper function to generate a funky random profile image URL using modern DiceBear API
const generateRandomProfileImage = (seed) => {
  // Add some randomness to the seed to ensure variation
  const randomSeed = seed + Math.random().toString(36).substring(7);
  
  // Select a random style from the funky options
  const randomStyle = funkyAvatarStyles[Math.floor(Math.random() * funkyAvatarStyles.length)];
  
  // Use the new DiceBear v7.x API format
  return `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}`;
};

// Sanitize preference arrays to ensure consistent matching downstream
const normalizePreferenceArray = (input) => {
  if (input === undefined || input === null) {
    return [];
  }

  let values = [];
  if (Array.isArray(input)) {
    values = input;
  } else if (typeof input === 'string') {
    values = input.split(',');
  } else {
    values = [input];
  }

  const seen = new Set();
  const normalized = [];

  values.forEach(item => {
    if (typeof item !== 'string') return;
    const trimmed = item.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    normalized.push(trimmed);
  });

  return normalized;
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
    console.log('User Controller: updateProfile - req.user.id:', req.user.id);
    console.log('User Controller: updateProfile - req.body:', req.body);
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
      profileFields.interests = normalizePreferenceArray(interests);
    }
    
    // Handle preference fields
    if (hobbies !== undefined) profileFields.hobbies = normalizePreferenceArray(hobbies);
    if (favoriteSubjects !== undefined) profileFields.favoriteSubjects = normalizePreferenceArray(favoriteSubjects);
    if (sports !== undefined) profileFields.sports = normalizePreferenceArray(sports);
    if (musicGenres !== undefined) profileFields.musicGenres = normalizePreferenceArray(musicGenres);
    if (movieGenres !== undefined) profileFields.movieGenres = normalizePreferenceArray(movieGenres);
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: profileFields },
      { new: true }
    ).select('-password');
    
    console.log('User Controller: updateProfile - User after update:', user);
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

// Get dashboard stats for current user (optimized with aggregation)
exports.getDashboardStats = async (req, res) => {
  try {
    // OPTIMIZATION: Use single aggregation pipeline instead of 2 separate queries
    const stats = await Friend.aggregate([
      {
        $match: {
          $or: [
            { requester: req.user.id },
            { recipient: req.user.id }
          ]
        }
      },
      {
        $group: {
          _id: null,
          pendingRequests: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$recipient', req.user.id] },
                  { $eq: ['$status', 'pending'] }
                ]},
                1,
                0
              ]
            }
          },
          friends: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'accepted'] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    
    const result = stats.length > 0 ? stats[0] : { pendingRequests: 0, friends: 0 };
    
    res.json({
      pendingRequests: result.pendingRequests,
      friends: result.friends
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

// Get notifications for current user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { since } = req.query;
    
    // For now, return empty notifications array
    // This endpoint is called by the frontend but notifications feature isn't fully implemented
    // TODO: Implement full notification system with database storage
    
    res.json({
      notifications: [],
      total: 0
    });
  } catch (err) {
    console.error('Error getting notifications:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete user account permanently
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { confirmEmail } = req.body;
    
    console.log('Delete account request for user:', userId);
    
    // Get user to verify email
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify email confirmation
    if (confirmEmail !== user.email) {
      return res.status(400).json({ message: 'Email confirmation does not match' });
    }
    
    const Activity = require('../models/Activity');
    const GroupMessage = require('../models/GroupMessage');

    // Remove Render/Firebase credential
    if (admin && admin.auth) {
      try {
        if (user.firebaseUid) {
          await admin.auth().deleteUser(user.firebaseUid);
        } else if (user.email) {
          const fbUser = await admin.auth().getUserByEmail(user.email).catch(() => null);
          if (fbUser) {
            await admin.auth().deleteUser(fbUser.uid);
          }
        }
      } catch (firebaseErr) {
        console.warn('Firebase user cleanup failed:', firebaseErr.message);
      }
    }

    // Sever friendships and participation ties
    await Friend.deleteMany({
      $or: [{ requester: userId }, { recipient: userId }]
    });

    await Activity.updateMany(
      { participants: userId },
      { $pull: { participants: userId } }
    );

    // Mark historical group messages with placeholder sender name
    await GroupMessage.updateMany(
      { sender: userId },
      { $set: { senderName: DEFAULT_DELETED_NAME } }
    );

    // Scrub user credentials instead of removing document to preserve history references
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const placeholderSuffix = user._id.toString().slice(-6);
    const scrubbedEmail = `deleted+${user._id}@peerconnect.invalid`;
    const scrubbedUsername = `deleted_user_${placeholderSuffix}`;

    user.username = scrubbedUsername;
    user.email = scrubbedEmail;
    user.password = randomPassword; // Will be hashed by schema pre-save
    user.firebaseUid = null;
    user.profilePicture = DEFAULT_DELETED_AVATAR;
    user.bio = 'Account deleted';
    user.location = '';
    user.major = '';
    user.year = '';
    user.interests = [];
    user.hobbies = [];
    user.favoriteSubjects = [];
    user.sports = [];
    user.musicGenres = [];
    user.movieGenres = [];
    user.isDeleted = true;
    user.deletedAt = new Date();

    await user.save();

    console.log('User account anonymized successfully:', userId);
    res.json({ 
      message: 'Account deleted successfully',
      anonymizedUserId: userId
    });
  } catch (err) {
    console.error('Error deleting account:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};