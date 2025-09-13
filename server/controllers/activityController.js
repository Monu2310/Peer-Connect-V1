const Activity = require('../models/Activity');
const User = require('../models/User');

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

// Create a new activity
exports.createActivity = async (req, res) => {
  try {
    console.log('Activity Controller: createActivity - req.user.id:', req.user.id);
    const { 
      title, 
      description, 
      category, 
      location, 
      date, 
      maxParticipants,
      image 
    } = req.body;

    // Create new activity
    const activity = new Activity({
      title,
      description,
      category,
      location,
      date,
      maxParticipants,
      image: image || getDefaultImageForCategory(category), // Use default image if none provided
      creator: req.user.id,
      participants: [req.user.id] // Creator is automatically a participant
    });

    await activity.save();
    
    // Populate creator info
    const populatedActivity = await Activity.findById(activity._id)
      .populate('creator', 'username profilePicture')
      .populate('participants', 'username profilePicture');

    console.log('Activity Controller: createActivity - Created Activity:', populatedActivity);
    res.status(201).json(populatedActivity);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get all activities with optional filtering
exports.getActivities = async (req, res) => {
  try {
    console.log('Activity Controller: getActivities - req.user.id:', req.user.id);
    const { category, search } = req.query;
    
    let query = {};
    
    // Filter by category if provided
    if (category && category !== 'All') {
      query.category = category;
    }
    
    // Search by title or description if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter out past activities
    query.date = { $gte: new Date() };
    
    const activities = await Activity.find(query)
      .sort({ date: 1 }) // Sort by upcoming date
      .populate('creator', 'username profilePicture')
      .populate('participants', 'username profilePicture');
    
    console.log('Activity Controller: getActivities - Activities found:', activities.length);
    res.json(activities);
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
      .populate('creator', 'username profilePicture bio')
      .populate('participants', 'username profilePicture');
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    console.log('Activity Controller: getActivityById - Activity Creator:', activity.creator._id);
    console.log('Activity Controller: getActivityById - Activity Participants:', activity.participants.map(p => p._id));
    res.json(activity);
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
    if (activity.maxParticipants && activity.participants.length >= activity.maxParticipants) {
      console.log('Activity Controller: joinActivity - Activity is full.');
      return res.status(400).json({ message: 'This activity is full' });
    }
    
    // Add user to participants
    activity.participants.push(req.user.id);
    await activity.save();
    
    // Return updated activity with populated fields
    const updatedActivity = await Activity.findById(req.params.activityId)
      .populate('creator', 'username profilePicture')
      .populate('participants', 'username profilePicture');
    
    console.log('Activity Controller: joinActivity - User joined activity. New participants:', updatedActivity.participants.map(p => p._id));
    res.json(updatedActivity);
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
      .populate('creator', 'username profilePicture')
      .populate('participants', 'username profilePicture');
    
    console.log('Activity Controller: leaveActivity - User left activity. New participants:', updatedActivity.participants.map(p => p._id));
    res.json(updatedActivity);
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
    if (maxParticipants) activity.maxParticipants = maxParticipants;
    if (image) activity.image = image;
    
    await activity.save();
    
    // Return updated activity with populated fields
    const updatedActivity = await Activity.findById(req.params.activityId)
      .populate('creator', 'username profilePicture')
      .populate('participants', 'username profilePicture');
    
    console.log('Activity Controller: updateActivity - Updated Activity:', updatedActivity);
    res.json(updatedActivity);
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
      .populate('creator', 'username profilePicture')
      .populate('participants', 'username profilePicture');
    
    console.log('Activity Controller: getMyCreatedActivities - Found activities:', activities.length);
    res.json(activities);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get activities joined by the current user
exports.getMyJoinedActivities = async (req, res) => {
  try {
    console.log('Activity Controller: getMyJoinedActivities - req.user.id:', req.user.id);
    const activities = await Activity.find({ 
      participants: req.user.id,
    })
      .sort({ date: -1 })
      .populate('creator', 'username profilePicture')
      .populate('participants', 'username profilePicture');
    
    console.log('Activity Controller: getMyJoinedActivities - Found activities:', activities.length);
    res.json(activities);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};