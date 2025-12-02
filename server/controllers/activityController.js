const Activity = require('../models/Activity');
const User = require('../models/User');
const { scrubUserForPublic, asDeletedUser } = require('../utils/deletedUser');

// Function to get default image based on category
const getDefaultImageForCategory = (category) => {
  const categoryImages = {
    'Academic': 'https://images.unsplash.com/photo-1491975474562-1f4e30bc9468?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'Social': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'Sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'Career': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'Other': 'https://images.unsplash.com/photo-1493612276216-ee3925520721?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'
  };
  
  return categoryImages[category] || categoryImages['Other'];
};

const decorateActivityUsers = (activityDoc) => {
  if (!activityDoc) return activityDoc;
  const plain = typeof activityDoc.toObject === 'function'
    ? activityDoc.toObject({ virtuals: true })
    : activityDoc;

  const normalizeList = (list = []) => (
    Array.isArray(list)
      ? list.map(item => scrubUserForPublic(item) || asDeletedUser(null))
      : []
  );

  return {
    ...plain,
    creator: scrubUserForPublic(plain.creator) || asDeletedUser(null),
    participants: normalizeList(plain.participants)
  };
};

// Create a new activity
exports.createActivity = async (req, res) => {
  try {
    console.log('Activity Controller: createActivity - User ID:', req.user.id);
    console.log('Activity Controller: createActivity - Request Body:', req.body);
    
    const { 
      title, 
      description, 
      category, 
      location, 
      date,
      time,
      maxParticipants,
      image 
    } = req.body;

    const normalizedMaxParticipants = maxParticipants === undefined || maxParticipants === null || maxParticipants === ''
      ? null
      : parseInt(maxParticipants, 10);

    if (normalizedMaxParticipants !== null) {
      if (Number.isNaN(normalizedMaxParticipants) || normalizedMaxParticipants < 1) {
        console.error('Activity Controller: Invalid maxParticipants value provided');
        return res.status(400).json({ message: 'Max participants must be a positive number' });
      }
    }

    // Validate required fields
    if (!title || !description || !category || !location || !date) {
      console.error('Activity Controller: Missing required fields');
      return res.status(400).json({ 
        message: 'Missing required fields', 
        required: ['title', 'description', 'category', 'location', 'date'] 
      });
    }

    // Create new activity
    const activity = new Activity({
      title,
      description,
      category: category?.toLowerCase(), // Ensure lowercase
      location,
      date,
      time,
      maxParticipants: normalizedMaxParticipants,
      image: image || getDefaultImageForCategory(category), // Use default image if none provided
      creator: req.user.id,
      participants: [req.user.id] // Creator is automatically a participant
    });

    console.log('Activity Controller: Saving activity...');
    await activity.save();
    console.log('Activity Controller: Activity saved successfully');
    
    // Populate creator info
    const populatedActivity = await Activity.findById(activity._id)
      .populate('creator', 'username profilePicture')
      .populate('participants', 'username profilePicture');

    console.log('Activity Controller: Created Activity:', populatedActivity.title);
    res.status(201).json(decorateActivityUsers(populatedActivity));
  } catch (err) {
    console.error('Activity Controller: Error creating activity:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      message: 'Server error creating activity', 
      error: err.message 
    });
  }
};

// Get all activities with optional filtering
exports.getActivities = async (req, res) => {
  try {
    console.log('Activity Controller: getActivities - req.user.id:', req.user.id);
    const { category, search, limit = 20, skip = 0 } = req.query;
    
    let query = {};
    
    // Filter by category if provided
    if (category && category !== 'All') {
      query.category = category.toLowerCase();
    }
    
    // Search by title or description if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Show all activities (including past ones) - users can see activity history
    // Only filter if specifically requested
    const { includePast } = req.query;
    if (includePast !== 'true') {
      // By default, show upcoming activities
      query.date = { $gte: new Date() };
    }
    
    // Use lean() for better performance - returns plain objects instead of Mongoose documents
    const activities = await Activity.find(query)
      .select('title description category location date creator participants maxParticipants image')
      .sort({ date: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('creator', 'username profilePicture isDeleted')
      .populate('participants', 'username profilePicture isDeleted')
      .lean();
    
    // Get total count for pagination
    const total = await Activity.countDocuments(query);
    
    console.log('Activity Controller: getActivities - Activities found:', activities.length);
    res.json({
      activities: activities.map(decorateActivityUsers),
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get activity by ID
exports.getActivityById = async (req, res) => {
  try {
    console.log('Activity Controller: getActivityById - req.user.id:', req.user.id);
    console.log('Activity Controller: getActivityById - activityId:', req.params.activityId);
    const activity = await Activity.findById(req.params.activityId)
      .populate('creator', 'username profilePicture bio isDeleted')
      .populate('participants', 'username profilePicture isDeleted');
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    console.log('Activity Controller: getActivityById - Activity Creator:', activity.creator._id);
    console.log('Activity Controller: getActivityById - Activity Participants:', activity.participants.map(p => p._id));
    res.json(decorateActivityUsers(activity));
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Activity not found' });
    }
    res.status(500).send('Server error');
  }
};

// Join an activity
exports.joinActivity = async (req, res) => {
  try {
    console.log('Activity Controller: joinActivity - req.user.id:', req.user.id);
    console.log('Activity Controller: joinActivity - activityId:', req.params.activityId);
    const activity = await Activity.findById(req.params.activityId);
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    // Check if user has already joined
    if (activity.participants.includes(req.user.id)) {
      console.log('Activity Controller: joinActivity - User already joined.');
      return res.status(400).json({ message: 'You have already joined this activity' });
    }
    
    // Check if activity is full
    const currentCount = activity.participants.length;
    const maxCount = activity.maxParticipants;
    console.log(`Activity capacity check: ${currentCount}/${maxCount || 'unlimited'} participants`);
    
    if (maxCount && currentCount >= maxCount) {
      console.log('Activity Controller: joinActivity - Activity is full.');
      return res.status(400).json({ 
        message: 'This activity is full',
        current: currentCount,
        max: maxCount
      });
    }
    
    // Add user to participants
    activity.participants.push(req.user.id);
    await activity.save();
    
    // Return updated activity with populated fields
    const updatedActivity = await Activity.findById(req.params.activityId)
      .populate('creator', 'username profilePicture isDeleted')
      .populate('participants', 'username profilePicture isDeleted');
    
    console.log('Activity Controller: joinActivity - User joined activity. New participants:', updatedActivity.participants.map(p => p._id));
    res.json(decorateActivityUsers(updatedActivity));
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Activity not found' });
    }
    res.status(500).send('Server error');
  }
};

// Leave an activity
exports.leaveActivity = async (req, res) => {
  try {
    console.log('Activity Controller: leaveActivity - req.user.id:', req.user.id);
    console.log('Activity Controller: leaveActivity - activityId:', req.params.activityId);
    const activity = await Activity.findById(req.params.activityId);
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    // Check if user is the creator
    if (activity.creator.toString() === req.user.id) {
      console.log('Activity Controller: leaveActivity - Creator cannot leave.');
      return res.status(400).json({ message: 'Creator cannot leave the activity' });
    }
    
    // Check if user has joined the activity
    if (!activity.participants.includes(req.user.id)) {
      console.log('Activity Controller: leaveActivity - User not joined.');
      return res.status(400).json({ message: 'You have not joined this activity' });
    }
    
    // Remove user from participants
    activity.participants = activity.participants.filter(
      participant => participant.toString() !== req.user.id
    );
    
    await activity.save();
    
    // Return updated activity with populated fields
    const updatedActivity = await Activity.findById(req.params.activityId)
      .populate('creator', 'username profilePicture isDeleted')
      .populate('participants', 'username profilePicture isDeleted');
    
    console.log('Activity Controller: leaveActivity - User left activity. New participants:', updatedActivity.participants.map(p => p._id));
    res.json(decorateActivityUsers(updatedActivity));
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Activity not found' });
    }
    res.status(500).send('Server error');
  }
};

// Update activity
exports.updateActivity = async (req, res) => {
  try {
    console.log('Activity Controller: updateActivity - req.user.id:', req.user.id);
    console.log('Activity Controller: updateActivity - activityId:', req.params.activityId);
    const activity = await Activity.findById(req.params.activityId);
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    // Check if user is the creator
    if (activity.creator.toString() !== req.user.id) {
      console.log('Activity Controller: updateActivity - Not authorized. Creator:', activity.creator.toString(), 'User:', req.user.id);
      return res.status(401).json({ message: 'Not authorized to update this activity' });
    }
    
    const { 
      title, 
      description, 
      category, 
      location, 
      date, 
      maxParticipants,
      image 
    } = req.body;

    const normalizedMaxParticipants = maxParticipants === undefined || maxParticipants === null || maxParticipants === ''
      ? undefined
      : parseInt(maxParticipants, 10);

    if (normalizedMaxParticipants !== undefined) {
      if (Number.isNaN(normalizedMaxParticipants) || normalizedMaxParticipants < 1) {
        console.error('Activity Controller: updateActivity - Invalid maxParticipants value');
        return res.status(400).json({ message: 'Max participants must be a positive number' });
      }
      if (normalizedMaxParticipants !== null && normalizedMaxParticipants < activity.participants.length) {
        console.error('Activity Controller: updateActivity - maxParticipants less than current participants');
        return res.status(400).json({ message: 'Max participants cannot be less than the current participant count' });
      }
    }
    
    // Update fields
    if (title) activity.title = title;
    if (description) activity.description = description;
    if (category) {
      activity.category = category;
      // If category changes and no custom image is provided, update the image based on the new category
      if (!image && (!activity.image || activity.image.includes('unsplash.com'))) {
        activity.image = getDefaultImageForCategory(category);
      }
    }
    if (location) activity.location = location;
    if (date) activity.date = date;
    if (normalizedMaxParticipants !== undefined) {
      activity.maxParticipants = normalizedMaxParticipants === null ? null : normalizedMaxParticipants;
    }
    if (image) activity.image = image;
    
    await activity.save();
    
    // Return updated activity with populated fields
    const updatedActivity = await Activity.findById(req.params.activityId)
      .populate('creator', 'username profilePicture isDeleted')
      .populate('participants', 'username profilePicture isDeleted');
    
    console.log('Activity Controller: updateActivity - Updated Activity:', updatedActivity);
    res.json(decorateActivityUsers(updatedActivity));
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Activity not found' });
    }
    res.status(500).send('Server error');
  }
};

// Delete activity
exports.deleteActivity = async (req, res) => {
  try {
    console.log('Activity Controller: deleteActivity - req.user.id:', req.user.id);
    console.log('Activity Controller: deleteActivity - activityId:', req.params.activityId);
    const activity = await Activity.findById(req.params.activityId);
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    // Check if user is the creator
    if (activity.creator.toString() !== req.user.id) {
      console.log('Activity Controller: deleteActivity - Not authorized. Creator:', activity.creator.toString(), 'User:', req.user.id);
      return res.status(401).json({ message: 'Not authorized to delete this activity' });
    }
    
    await activity.deleteOne();
    
    console.log('Activity Controller: deleteActivity - Activity removed.');
    res.json({ message: 'Activity removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Activity not found' });
    }
    res.status(500).send('Server error');
  }
};

// Get activities created by the current user
exports.getMyCreatedActivities = async (req, res) => {
  try {
    console.log('Activity Controller: getMyCreatedActivities - req.user.id:', req.user.id);
    const activities = await Activity.find({ creator: req.user.id })
      .sort({ date: -1 })
      .populate('creator', 'username profilePicture isDeleted')
      .populate('participants', 'username profilePicture isDeleted');
    
    console.log('Activity Controller: getMyCreatedActivities - Found activities:', activities.length);
    res.json(activities.map(decorateActivityUsers));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get activities joined by the current user (active only - upcoming/ongoing)
exports.getMyJoinedActivities = async (req, res) => {
  try {
    console.log('Activity Controller: getMyJoinedActivities - req.user.id:', req.user.id);
    const activities = await Activity.find({ 
      participants: req.user.id,
      status: { $in: ['upcoming', 'ongoing'] }, // Only active activities
      date: { $gte: new Date() } // Only future/ongoing activities
    })
      .sort({ date: -1 })
      .populate('creator', 'username profilePicture isDeleted')
      .populate('participants', 'username profilePicture isDeleted');
    
    console.log('Activity Controller: getMyJoinedActivities - Found active joined activities:', activities.length);
    res.json(activities.map(decorateActivityUsers));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Remove a participant (Creator only)
exports.removeParticipant = async (req, res) => {
  try {
    console.log('Activity Controller: removeParticipant - req.user.id:', req.user.id);
    const { activityId, userId } = req.params;
    
    const activity = await Activity.findById(activityId);
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    // Check if user is the creator
    if (activity.creator.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Only the creator can remove participants' });
    }
    
    // Cannot remove creator
    if (userId === activity.creator.toString()) {
      return res.status(400).json({ message: 'Cannot remove the creator from the activity' });
    }

    // Check if user is in participants
    if (!activity.participants.includes(userId)) {
      return res.status(400).json({ message: 'User is not a participant' });
    }
    
    // Remove user
    activity.participants = activity.participants.filter(
      p => p.toString() !== userId
    );
    
    await activity.save();
    
    const updatedActivity = await Activity.findById(activityId)
      .populate('creator', 'username profilePicture')
      .populate('participants', 'username profilePicture');
      
    res.json(updatedActivity);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};