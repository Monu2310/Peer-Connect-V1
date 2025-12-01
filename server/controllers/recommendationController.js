const mongoose = require('mongoose');
const Activity = require('../models/Activity');
const User = require('../models/User');
const Friend = require('../models/Friend');
const { calculateSimilarityScore, calculateDetailedSimilarity } = require('../utils/similarityScoring');

const normalizeArrayForSimilarity = (values) => {
  if (!Array.isArray(values)) return [];
  return values
    .map(value => typeof value === 'string' ? value.trim().toLowerCase() : '')
    .filter(Boolean);
};

const countOverlapRatio = (arr1, arr2) => {
  if (!arr1.length || !arr2.length) return 0;
  const set2 = new Set(arr2);
  let overlap = 0;
  arr1.forEach(value => {
    if (set2.has(value)) {
      overlap += 1;
    }
  });
  const denominator = Math.max(arr1.length, arr2.length);
  return denominator > 0 ? overlap / denominator : 0;
};

const normalizeSingleValue = (value) => (
  typeof value === 'string' ? value.trim().toLowerCase() : ''
);

// Helper function to calculate preference similarity between users
const calculateUserSimilarity = (user1Preferences, user2Preferences) => {
  let weightedScore = 0;
  let totalWeight = 0;

  const dimensionWeights = {
    hobbies: 2,
    sports: 1.5,
    favoriteSubjects: 1.5,
    musicGenres: 1,
    movieGenres: 1,
    interests: 1,
    major: 0.75
  };

  const applyDimension = (key, valuesA, valuesB) => {
    const weight = dimensionWeights[key];
    if (!weight) return;
    const normalizedA = normalizeArrayForSimilarity(valuesA);
    const normalizedB = normalizeArrayForSimilarity(valuesB);
    if (!normalizedA.length || !normalizedB.length) return;
    totalWeight += weight;
    weightedScore += countOverlapRatio(normalizedA, normalizedB) * weight;
  };

  applyDimension('hobbies', user1Preferences.hobbies, user2Preferences.hobbies);
  applyDimension('sports', user1Preferences.sports, user2Preferences.sports);
  applyDimension('favoriteSubjects', user1Preferences.favoriteSubjects, user2Preferences.favoriteSubjects);
  applyDimension('musicGenres', user1Preferences.musicGenres, user2Preferences.musicGenres);
  applyDimension('movieGenres', user1Preferences.movieGenres, user2Preferences.movieGenres);
  applyDimension('interests', user1Preferences.interests, user2Preferences.interests);

  const major1 = normalizeSingleValue(user1Preferences.major);
  const major2 = normalizeSingleValue(user2Preferences.major);
  if (major1 && major2) {
    totalWeight += dimensionWeights.major;
    if (major1 === major2) {
      weightedScore += dimensionWeights.major;
    }
  }

  return totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;
};

// Helper function to calculate relevance of activity to user
const calculateActivityRelevance = (userPreferences, activity) => {
  let relevance = 0;
  let matchedTerms = 0;
  
  // All user preference fields as a flattened array for comparison
  const allUserPreferences = [
    ...(userPreferences.hobbies || []),
    ...(userPreferences.sports || []),
    ...(userPreferences.favoriteSubjects || []),
    ...(userPreferences.interests || [])
  ].map(term => term.toLowerCase());
  
  // Check if activity title or description contains any of the user's preferences
  if (activity.title) {
    const title = activity.title.toLowerCase();
    allUserPreferences.forEach(pref => {
      if (title.includes(pref)) {
        relevance += 3;
        matchedTerms++;
      }
    });
  }
  
  if (activity.description) {
    const description = activity.description.toLowerCase();
    allUserPreferences.forEach(pref => {
      if (description.includes(pref)) {
        relevance += 2;
        matchedTerms++;
      }
    });
  }
  
  // Check if activity category matches user's interests or hobbies
  if (activity.category) {
    const category = activity.category.toLowerCase();
    
    // Direct category match
    if (allUserPreferences.includes(category)) {
      relevance += 5;
      matchedTerms++;
    }
    
    // Match based on specific categories
    if (category === 'sports' && userPreferences.sports && userPreferences.sports.length > 0) {
      relevance += 4;
      matchedTerms++;
    }
    
    if (category === 'academic' && userPreferences.favoriteSubjects && userPreferences.favoriteSubjects.length > 0) {
      relevance += 4;
      matchedTerms++;
    }
  }
  
  // Add relevance for activities that already have participants
  if (activity.participants && activity.participants.length > 0) {
    relevance += Math.min(activity.participants.length, 5); // Max 5 points for popular activities
    matchedTerms += 1;
  }
  
  // Normalize relevance score (0-100)
  return matchedTerms > 0 ? (relevance / (matchedTerms * 5)) * 100 : 0;
};

const toObjectIdSafe = (value) => {
  if (!value) {
    return null;
  }
  try {
    return new mongoose.Types.ObjectId(value);
  } catch (err) {
    console.warn('Skipping invalid ObjectId during recommendation build:', value);
    return null;
  }
};

// Get personalized activity recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user profile with all preference fields
    const user = await User.findById(userId).select(
      'interests major hobbies favoriteSubjects sports musicGenres movieGenres'
    );
    
    // Get upcoming activities that the user hasn't joined
    let upcomingActivities = await Activity.find({
      date: { $gte: new Date() },
      participants: { $ne: userId },
      creator: { $ne: userId } // Exclude activities created by the user
    })
      .populate('creator', 'username profilePicture')
      .populate('participants', 'username profilePicture')
      .sort({ date: 1 }); // Sort by upcoming date
    
    // Calculate relevance scores for each activity
    const scoredActivities = upcomingActivities.map(activity => {
      const relevanceScore = calculateActivityRelevance(user, activity);
      return {
        activity,
        relevanceScore
      };
    });
    
    // Sort by relevance score and take top 10
    const recommendations = scoredActivities
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10)
      .map(item => item.activity);
    
    res.json(recommendations);
  } catch (err) {
    console.error('Error generating recommendations:', err.message);
    res.status(500).send('Server error');
  }
};

// Get friend recommendations based on preferences
exports.getFriendRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user profile with all preference fields (lean for performance)
    const user = await User.findById(userId)
      .select('interests major hobbies favoriteSubjects sports musicGenres movieGenres')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get ALL friend relationships (accepted AND pending) to exclude them
    const existingFriendships = await Friend.find({
      $or: [
        { requester: userId },
        { recipient: userId }
      ]
    }).select('requester recipient status').lean();
    
    // Extract ALL friend IDs (accepted friends + pending requests in both directions)
    const friendIds = existingFriendships
      .map(friendship => {
        const requesterId = friendship.requester?.toString();
        const recipientId = friendship.recipient?.toString();
        const friendId = requesterId === userId ? recipientId : requesterId;
        return toObjectIdSafe(friendId);
      })
      .filter(Boolean);
    
    const excludeIds = [...friendIds];
    const selfObjectId = toObjectIdSafe(userId);
    if (selfObjectId) {
      excludeIds.push(selfObjectId);
    }

    console.log(`Excluding ${excludeIds.length} users from recommendations (self + ${friendIds.length} friends/requests)`);
    
    // OPTIMIZATION: Pre-filter candidates at database level to reduce processing
    // Only fetch users who share at least ONE preference dimension with current user
    const prefilterQuery = excludeIds.length ? { _id: { $nin: excludeIds } } : {};
    
    // Build OR conditions for users with ANY shared preferences
    const orConditions = [];
    if (user.major) orConditions.push({ major: user.major });
    if (user.interests?.length) orConditions.push({ interests: { $in: user.interests } });
    if (user.hobbies?.length) orConditions.push({ hobbies: { $in: user.hobbies } });
    if (user.favoriteSubjects?.length) orConditions.push({ favoriteSubjects: { $in: user.favoriteSubjects } });
    if (user.sports?.length) orConditions.push({ sports: { $in: user.sports } });
    if (user.musicGenres?.length) orConditions.push({ musicGenres: { $in: user.musicGenres } });
    if (user.movieGenres?.length) orConditions.push({ movieGenres: { $in: user.movieGenres } });
    
    // Apply pre-filter only if we have conditions (otherwise fetch all)
    if (orConditions.length > 0) {
      prefilterQuery.$or = orConditions;
    }
    
    // Fetch only relevant users with ONLY needed fields (50-60% data reduction)
    const potentialFriends = await User.find(prefilterQuery)
      .select('username profilePicture major interests hobbies favoriteSubjects sports musicGenres movieGenres')
      .limit(50) // Limit to 50 candidates instead of all users
      .lean(); // Plain objects for faster processing
    
    // Calculate similarity scores (parallel processing if > 20 candidates)
    const scoredFriends = potentialFriends.map(potentialFriend => {
      const similarityScore = calculateUserSimilarity(user, potentialFriend);
      return {
        user: potentialFriend,
        similarityScore
      };
    });
    
    // Sort by similarity score and take top 5
    const recommendations = scoredFriends
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 5)
      .map(item => ({
        _id: item.user._id,
        username: item.user.username,
        profilePicture: item.user.profilePicture,
        similarityScore: Math.round(item.similarityScore), // Round for cleaner display
        // Include some matching interests/hobbies for display
        sharedInterests: findSharedInterests(user, item.user)
      }));
    
    res.json(recommendations);
  } catch (err) {
    console.error('Error generating friend recommendations:', err.message);
    res.status(500).send('Server error');
  }
};

const collectSharedValues = (type, valuesA, valuesB) => {
  if (!Array.isArray(valuesA) || !Array.isArray(valuesB) || !valuesA.length || !valuesB.length) {
    return [];
  }

  const normalizedB = new Set(
    valuesB
      .map(value => (typeof value === 'string' ? value.trim().toLowerCase() : ''))
      .filter(Boolean)
  );

  const seen = new Set();
  const shared = [];

  valuesA.forEach(value => {
    if (typeof value !== 'string') return;
    const trimmed = value.trim();
    if (!trimmed) return;
    const normalized = trimmed.toLowerCase();
    if (seen.has(normalized) || !normalizedB.has(normalized)) return;
    seen.add(normalized);
    shared.push({ type, value: trimmed });
  });

  return shared;
};

// Helper function to find shared interests between users for display
function findSharedInterests(user1, user2) {
  const sharedItems = [
    ...collectSharedValues('interest', user1.interests, user2.interests),
    ...collectSharedValues('hobby', user1.hobbies, user2.hobbies),
    ...collectSharedValues('sport', user1.sports, user2.sports),
    ...collectSharedValues('subject', user1.favoriteSubjects, user2.favoriteSubjects),
    ...collectSharedValues('music', user1.musicGenres, user2.musicGenres),
    ...collectSharedValues('movie', user1.movieGenres, user2.movieGenres)
  ];
  
  return sharedItems.slice(0, 5);
}

// Get similar activities to a specific activity
exports.getSimilarActivities = async (req, res) => {
  try {
    const { activityId } = req.params;
    const userId = req.user.id;
    
    // Get the source activity
    const sourceActivity = await Activity.findById(activityId);
    if (!sourceActivity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    // Find activities in the same category
    const similarActivities = await Activity.find({
      _id: { $ne: activityId }, // Exclude the source activity
      category: sourceActivity.category,
      date: { $gte: new Date() },
      participants: { $ne: userId }, // Exclude activities the user has already joined
      creator: { $ne: userId } // Exclude activities created by the user
    })
      .populate('creator', 'username profilePicture')
      .populate('participants', 'username profilePicture')
      .sort({ date: 1 })
      .limit(5);
    
    res.json(similarActivities);
  } catch (err) {
    console.error('Error finding similar activities:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get user activity summary
exports.getUserInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all activities the user has joined
    const joinedActivities = await Activity.find({
      participants: userId,
    }).select('category date');
    
    // Get all activities the user has created
    const createdActivities = await Activity.find({
      creator: userId
    }).select('category date');
    
    // Basic activity summary
    const insights = {
      totalActivities: joinedActivities.length + createdActivities.length,
      joinedActivities: joinedActivities.length,
      createdActivities: createdActivities.length
    };
    
    res.json(insights);
  } catch (err) {
    console.error('Error generating user insights:', err.message);
    res.status(500).send('Server error');
  }
};

// Get ML-powered suggested peers based on comprehensive similarity scoring
exports.getSuggestedPeers = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    
    console.log('🔍 AI: Finding suggested peers for user:', userId);
    
    // Get current user with full profile
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get current user's activities
    const currentUserActivities = await Activity.find({
      $or: [
        { creator: userId },
        { participants: userId }
      ]
    });
    
    // Get existing friends and pending requests to exclude
    const existingConnections = await Friend.find({
      $or: [
        { requester: userId },
        { recipient: userId }
      ]
    });
    
    const connectedUserIds = new Set();
    connectedUserIds.add(userId.toString()); // Exclude self
    existingConnections.forEach(conn => {
      connectedUserIds.add(conn.requester.toString());
      connectedUserIds.add(conn.recipient.toString());
    });
    
    // Get all other users
    const allUsers = await User.find({
      _id: { $nin: Array.from(connectedUserIds) }
    }).select('username email profilePicture bio major location interests hobbies skills favoriteSubjects sports favoriteMovies favoriteShows favoriteBooks favoriteMusic favoriteGames');
    
    if (allUsers.length === 0) {
      return res.json([]);
    }
    
    // Calculate similarity scores for all users in parallel
    const scoredUsers = await Promise.all(
      allUsers.map(async (user) => {
        // Get user's activities
        const userActivities = await Activity.find({
          $or: [
            { creator: user._id },
            { participants: user._id }
          ]
        });
        
        // Calculate detailed similarity using ML algorithm
        const similarityData = calculateDetailedSimilarity(
          currentUser.toObject(),
          user.toObject(),
          currentUserActivities,
          userActivities
        );
        
        return {
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            major: user.major,
            location: user.location,
            interests: user.interests,
            hobbies: user.hobbies,
            skills: user.skills
          },
          similarityScore: similarityData.overall,
          breakdown: similarityData.breakdown,
          commonalities: similarityData.commonalities
        };
      })
    );
    
    // Sort by similarity score (descending) and filter out low scores
    const suggestions = scoredUsers
      .filter(item => item.similarityScore > 10) // Only show if >10% match
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
    
    console.log(`✅ AI: Found ${suggestions.length} suggested peers with scores:`, 
      suggestions.map(s => `${s.user.username}: ${s.similarityScore}%`));
    res.json(suggestions);
    
  } catch (err) {
    console.error('❌ AI: Error getting suggested peers:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get similarity score between current user and specific user
exports.getSimilarityWithUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetUserId } = req.params;
    
    if (userId === targetUserId) {
      return res.status(400).json({ message: 'Cannot compare user with themselves' });
    }
    
    // Get both users
    const [currentUser, targetUser] = await Promise.all([
      User.findById(userId),
      User.findById(targetUserId)
    ]);
    
    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get activities for both users
    const [currentUserActivities, targetUserActivities] = await Promise.all([
      Activity.find({
        $or: [
          { creator: userId },
          { participants: userId }
        ]
      }),
      Activity.find({
        $or: [
          { creator: targetUserId },
          { participants: targetUserId }
        ]
      })
    ]);
    
    // Calculate detailed similarity
    const similarityData = calculateDetailedSimilarity(
      currentUser.toObject(),
      targetUser.toObject(),
      currentUserActivities,
      targetUserActivities
    );
    
    res.json(similarityData);
    
  } catch (err) {
    console.error('❌ AI: Error calculating similarity:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};