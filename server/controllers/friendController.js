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

// Send a friend request by email
exports.sendFriendRequestByEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const requesterId = req.user.id;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if recipient exists
    const recipient = await User.findOne({ email: email.toLowerCase() });
    if (!recipient) {
      return res.status(404).json({ message: 'User with this email not found' });
    }
    
    const recipientId = recipient._id.toString();

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
      if (existingFriendship.status === 'accepted') {
        return res.status(400).json({ message: 'You are already friends with this user' });
      } else if (existingFriendship.status === 'pending') {
        return res.status(400).json({ message: 'A friend request is already pending' });
      }
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

// Get all friend requests for current user
exports.getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('🔍 Backend: Fetching friend requests for user:', userId);
    
    // Find all pending friend requests where current user is the recipient
    const friendRequests = await Friend.find({
      recipient: userId,
      status: 'pending'
    })
      .populate('requester', 'username profilePicture')
      .populate('recipient', 'username profilePicture')
      .sort({ createdAt: -1 });
    
    console.log('✅ Backend: Found', friendRequests.length, 'pending friend requests');
    res.json(friendRequests);
  } catch (err) {
    console.error('❌ Backend: Error fetching friend requests:', err.message);
    res.status(500).send('Server error');
  }
};

// Accept a friend request
exports.acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;
    
    console.log('🔵 Backend: Accepting friend request:', { requestId, userId });
    
    // Find the friend request
    const friendRequest = await Friend.findById(requestId);
    
    if (!friendRequest) {
      console.log('❌ Backend: Friend request not found');
      return res.status(404).json({ message: 'Friend request not found' });
    }
    
    console.log('📋 Backend: Found friend request:', {
      id: friendRequest._id,
      requester: friendRequest.requester,
      recipient: friendRequest.recipient,
      status: friendRequest.status
    });
    
    // Check if current user is the recipient
    if (friendRequest.recipient.toString() !== userId) {
      console.log('❌ Backend: User not authorized to accept');
      return res.status(401).json({ message: 'Not authorized to accept this friend request' });
    }
    
    // Update the status to accepted
    friendRequest.status = 'accepted';
    await friendRequest.save();
    console.log('✅ Backend: Friend request accepted, status updated to accepted');
    
    // Populate user info
    const populatedFriendRequest = await Friend.findById(requestId)
      .populate('requester', 'username profilePicture')
      .populate('recipient', 'username profilePicture');
    
    console.log('✅ Backend: Sending response');
    res.json(populatedFriendRequest);
  } catch (err) {
    console.error('❌ Backend: Error accepting friend request:', err.message);
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
    
    console.log('🔵 Backend: Declining friend request:', { requestId, userId });
    
    // Find the friend request
    const friendRequest = await Friend.findById(requestId);
    
    if (!friendRequest) {
      console.log('❌ Backend: Friend request not found');
      return res.status(404).json({ message: 'Friend request not found' });
    }
    
    console.log('📋 Backend: Found friend request to decline:', {
      id: friendRequest._id,
      status: friendRequest.status
    });
    
    // Check if current user is the recipient
    if (friendRequest.recipient.toString() !== userId) {
      console.log('❌ Backend: User not authorized to decline');
      return res.status(401).json({ message: 'Not authorized to decline this friend request' });
    }
    
    // Update the status to declined
    friendRequest.status = 'declined';
    await friendRequest.save();
    console.log('✅ Backend: Friend request declined, status updated to declined');
    
    res.json({ message: 'Friend request declined' });
  } catch (err) {
    console.error('❌ Backend: Error declining friend request:', err.message);
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
    
    console.log('🔍 Backend: Fetching friends for user:', userId);
    
    // Find all accepted friendships where current user is either requester or recipient
    const friendships = await Friend.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    })
      .populate('requester', 'username profilePicture')
      .populate('recipient', 'username profilePicture');
    
    console.log('📋 Backend: Found', friendships.length, 'accepted friendships');
    
    // Map friendships to users
    const friends = friendships.map(friendship => {
      // Return the other user in the friendship
      return friendship.requester._id.toString() === userId 
        ? friendship.recipient 
        : friendship.requester;
    });
    
    console.log('✅ Backend: Returning', friends.length, 'friends');
    res.json(friends);
  } catch (err) {
    console.error('❌ Backend: Error fetching friends:', err.message);
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

// Remove friendship by other user's id (find the friendship between current user and the provided userId)
exports.removeFriendByUser = async (req, res) => {
  try {
    const { userId: otherUserId } = req.params;
    const userId = req.user.id;

    // Find the friendship record between the two users
    const friendship = await Friend.findOne({
      $or: [
        { requester: userId, recipient: otherUserId },
        { requester: otherUserId, recipient: userId }
      ]
    });

    if (!friendship) {
      return res.status(404).json({ message: 'Friendship not found' });
    }

    // Ensure current user is part of the friendship
    if (friendship.requester.toString() !== userId && friendship.recipient.toString() !== userId) {
      return res.status(401).json({ message: 'Not authorized to remove this friendship' });
    }

    await friendship.deleteOne();

    res.json({ message: 'Friend removed successfully' });
  } catch (err) {
    console.error('❌ Backend: Error removing friendship by user:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Friendship not found' });
    }
    res.status(500).send('Server error');
  }
};