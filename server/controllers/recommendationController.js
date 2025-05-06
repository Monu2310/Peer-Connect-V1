const Activity = require('../models/Activity');
const User = require('../models/User');
const Friend = require('../models/Friend');

// Helper function to calculate preference similarity between users
const calculateUserSimilarity = (user1Preferences, user2Preferences) => {
  let similarity = 0;
  let totalFields = 0;
  
  // Compare hobbies
  if (user1Preferences.hobbies && user2Preferences.hobbies) {
    const commonHobbies = user1Preferences.hobbies.filter(hobby => 
      user2Preferences.hobbies.includes(hobby)
    );
    similarity += commonHobbies.length * 2; // Weight hobbies higher
    totalFields += Math.max(user1Preferences.hobbies.length, user2Preferences.hobbies.length);
  }
  
  // Compare sports
  if (user1Preferences.sports && user2Preferences.sports) {
    const commonSports = user1Preferences.sports.filter(sport => 
      user2Preferences.sports.includes(sport)
    );
    similarity += commonSports.length * 1.5; // Weight sports
    totalFields += Math.max(user1Preferences.sports.length, user2Preferences.sports.length);
  }
  
  // Compare favorite subjects
  if (user1Preferences.favoriteSubjects && user2Preferences.favoriteSubjects) {
    const commonSubjects = user1Preferences.favoriteSubjects.filter(subject => 
      user2Preferences.favoriteSubjects.includes(subject)
    );
    similarity += commonSubjects.length * 1.5; // Weight subjects
    totalFields += Math.max(user1Preferences.favoriteSubjects.length, user2Preferences.favoriteSubjects.length);
  }
  
  // Compare music genres
  if (user1Preferences.musicGenres && user2Preferences.musicGenres) {
    const commonMusic = user1Preferences.musicGenres.filter(genre => 
      user2Preferences.musicGenres.includes(genre)
    );
    similarity += commonMusic.length;
    totalFields += Math.max(user1Preferences.musicGenres.length, user2Preferences.musicGenres.length);
  }
  
  // Compare movie genres
  if (user1Preferences.movieGenres && user2Preferences.movieGenres) {
    const commonMovies = user1Preferences.movieGenres.filter(genre => 
      user2Preferences.movieGenres.includes(genre)
    );
    similarity += commonMovies.length;
    totalFields += Math.max(user1Preferences.movieGenres.length, user2Preferences.movieGenres.length);
  }
  
  // Compare general interests
  if (user1Preferences.interests && user2Preferences.interests) {
    const commonInterests = user1Preferences.interests.filter(interest => 
      user2Preferences.interests.includes(interest)
    );
    similarity += commonInterests.length;
    totalFields += Math.max(user1Preferences.interests.length, user2Preferences.interests.length);
  }
  
  // If users have the same major, add bonus points
  if (user1Preferences.major && user2Preferences.major && 
      user1Preferences.major.toLowerCase() === user2Preferences.major.toLowerCase()) {
    similarity += 3;
    totalFields += 1;
  }
  
  // Normalize similarity score (0-100)
  return totalFields > 0 ? (similarity / totalFields) * 100 : 0;
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
    
    // Get user profile with all preference fields
    const user = await User.findById(userId).select(
      'interests major hobbies favoriteSubjects sports musicGenres movieGenres'
    );
    
    // Get a list of user's existing friends
    const existingFriendships = await Friend.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    });
    
    // Extract friend IDs from friendships
    const friendIds = existingFriendships.map(friendship => 
      friendship.requester.toString() === userId 
        ? friendship.recipient.toString() 
        : friendship.requester.toString()
    );
    
    // Add current user ID to the exclusion list
    const excludeIds = [...friendIds, userId];
    
    // Find users that are not already friends
    const potentialFriends = await User.find({
      _id: { $nin: excludeIds }
    }).select('username profilePicture interests major hobbies favoriteSubjects sports musicGenres movieGenres');
    
    // Calculate similarity scores
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

// Helper function to find shared interests between users for display
function findSharedInterests(user1, user2) {
  const sharedItems = [];
  
  // Check different preference categories
  if (user1.hobbies && user2.hobbies) {
    user1.hobbies.forEach(hobby => {
      if (user2.hobbies.includes(hobby)) {
        sharedItems.push({ type: 'hobby', value: hobby });
      }
    });
  }
  
  if (user1.sports && user2.sports) {
    user1.sports.forEach(sport => {
      if (user2.sports.includes(sport)) {
        sharedItems.push({ type: 'sport', value: sport });
      }
    });
  }
  
  if (user1.favoriteSubjects && user2.favoriteSubjects) {
    user1.favoriteSubjects.forEach(subject => {
      if (user2.favoriteSubjects.includes(subject)) {
        sharedItems.push({ type: 'subject', value: subject });
      }
    });
  }
  
  if (user1.interests && user2.interests) {
    user1.interests.forEach(interest => {
      if (user2.interests.includes(interest)) {
        sharedItems.push({ type: 'interest', value: interest });
      }
    });
  }
  
  // Return at most 3 shared items
  return sharedItems.slice(0, 3);
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