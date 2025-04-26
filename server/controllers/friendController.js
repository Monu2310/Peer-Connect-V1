const Friend = require('../models/Friend');
const User = require('../models/User');

// Send a friend request
exports.sendFriendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.user.id;
    
    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent sending friend request to self
    if (requesterId === recipientId) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }
    
    // Check if a friendship already exists
    const existingFriendship = await Friend.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });
    
    if (existingFriendship) {
      return res.status(400).json({ message: 'Friend request already exists or users are already friends' });
    }
    
    // Create new friend request
    const friendRequest = new Friend({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending'
    });
    
    await friendRequest.save();
    
    // Populate user info
    const populatedFriendRequest = await Friend.findById(friendRequest._id)
      .populate('requester', 'username profilePicture')
      .populate('recipient', 'username profilePicture');
    
    res.status(201).json(populatedFriendRequest);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Send a friend request by user ID
exports.sendFriendRequestById = async (req, res) => {
  try {
    const { userId } = req.body;
    const requesterId = req.user.id;
    
    // Check if recipient exists
    const recipient = await User.findById(userId);
    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent sending friend request to self
    if (requesterId === userId) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }
    
    // Check if a friendship already exists
    const existingFriendship = await Friend.findOne({
      $or: [
        { requester: requesterId, recipient: userId },
        { requester: userId, recipient: requesterId }
      ]
    });
    
    if (existingFriendship) {
      return res.status(400).json({ message: 'Friend request already exists or users are already friends' });
    }
    
    // Create new friend request
    const friendRequest = new Friend({
      requester: requesterId,
      recipient: userId,
      status: 'pending'
    });
    
    await friendRequest.save();
    
    // Populate user info
    const populatedFriendRequest = await Friend.findById(friendRequest._id)
      .populate('requester', 'username profilePicture')
      .populate('recipient', 'username profilePicture');
    
    res.status(201).json(populatedFriendRequest);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get all friend requests for current user
exports.getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all pending friend requests where current user is the recipient
    const friendRequests = await Friend.find({
      recipient: userId,
      status: 'pending'
    })
      .populate('requester', 'username profilePicture')
      .populate('recipient', 'username profilePicture')
      .sort({ createdAt: -1 });
    
    res.json(friendRequests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Accept a friend request
exports.acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;
    
    // Find the friend request
    const friendRequest = await Friend.findById(requestId);
    
    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }
    
    // Check if current user is the recipient
    if (friendRequest.recipient.toString() !== userId) {
      return res.status(401).json({ message: 'Not authorized to accept this friend request' });
    }
    
    // Update the status to accepted
    friendRequest.status = 'accepted';
    await friendRequest.save();
    
    // Populate user info
    const populatedFriendRequest = await Friend.findById(requestId)
      .populate('requester', 'username profilePicture')
      .populate('recipient', 'username profilePicture');
    
    res.json(populatedFriendRequest);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Friend request not found' });
    }
    res.status(500).send('Server error');
  }
};

// Decline a friend request
exports.declineFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;
    
    // Find the friend request
    const friendRequest = await Friend.findById(requestId);
    
    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }
    
    // Check if current user is the recipient
    if (friendRequest.recipient.toString() !== userId) {
      return res.status(401).json({ message: 'Not authorized to decline this friend request' });
    }
    
    // Update the status to declined
    friendRequest.status = 'declined';
    await friendRequest.save();
    
    res.json({ message: 'Friend request declined' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Friend request not found' });
    }
    res.status(500).send('Server error');
  }
};

// Get all friends of current user
exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all accepted friendships where current user is either requester or recipient
    const friendships = await Friend.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    })
      .populate('requester', 'username profilePicture')
      .populate('recipient', 'username profilePicture');
    
    // Map friendships to users
    const friends = friendships.map(friendship => {
      // Return the other user in the friendship
      return friendship.requester._id.toString() === userId 
        ? friendship.recipient 
        : friendship.requester;
    });
    
    res.json(friends);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Remove a friend
exports.removeFriend = async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.user.id;
    
    // Find the friendship
    const friendship = await Friend.findById(friendshipId);
    
    if (!friendship) {
      return res.status(404).json({ message: 'Friendship not found' });
    }
    
    // Check if current user is part of the friendship
    if (friendship.requester.toString() !== userId && friendship.recipient.toString() !== userId) {
      return res.status(401).json({ message: 'Not authorized to remove this friendship' });
    }
    
    // Delete the friendship
    await friendship.deleteOne();
    
    res.json({ message: 'Friend removed successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Friendship not found' });
    }
    res.status(500).send('Server error');
  }
};