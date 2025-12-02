const Message = require('../models/Message');
const GroupMessage = require('../models/GroupMessage');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { scrubUserForPublic, asDeletedUser, DEFAULT_DELETED_NAME, DEFAULT_DELETED_AVATAR } = require('../utils/deletedUser');

// Helper function to generate conversation ID consistently
const generateConversationId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('-');
};

const decorateMessageUsers = (messageDoc) => {
  if (!messageDoc) return messageDoc;
  const plain = typeof messageDoc.toObject === 'function'
    ? messageDoc.toObject({ virtuals: true })
    : messageDoc;

  return {
    ...plain,
    sender: scrubUserForPublic(plain.sender) || asDeletedUser(null),
    receiver: scrubUserForPublic(plain.receiver) || asDeletedUser(null)
  };
};

// Send a message to another user
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;
    
    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }
    
    // Generate conversation ID
    const conversationId = generateConversationId(senderId, receiverId);
    
    // Create message
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      conversationId,
      content
    });
    
    await message.save();
    
    // Populate sender info in the response
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username profilePicture isDeleted')
      .populate('receiver', 'username profilePicture isDeleted');
    
    res.status(201).json(decorateMessageUsers(populatedMessage));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get conversation between current user and another user
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    
    // Generate conversation ID
    const conversationId = generateConversationId(currentUserId, userId);
    
    // Find all messages in the conversation
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate('sender', 'username profilePicture isDeleted')
      .populate('receiver', 'username profilePicture isDeleted');
    
    res.json(messages.map(decorateMessageUsers));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get all conversations for current user
exports.getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    // Get all messages where user is either sender or receiver
    const messages = await Message.find({
      $or: [
        { sender: currentUserId },
        { receiver: currentUserId }
      ]
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'username profilePicture isDeleted')
      .populate('receiver', 'username profilePicture isDeleted');
    
    // Group messages by conversation and get the latest message of each conversation
    const conversations = {};
    
    messages.forEach(message => {
      const decorated = decorateMessageUsers(message);
      const senderId = decorated.sender?._id ? decorated.sender._id.toString() : null;
      const receiverId = decorated.receiver?._id ? decorated.receiver._id.toString() : null;
      const otherUser = senderId === currentUserId 
        ? receiverId 
        : senderId;
      
      if (!conversations[otherUser]) {
        conversations[otherUser] = {
          user: senderId === currentUserId 
            ? decorated.receiver 
            : decorated.sender,
          lastMessage: decorated,
          unreadCount: receiverId === currentUserId && !decorated.read ? 1 : 0
        };
      } else if (receiverId === currentUserId && !decorated.read) {
        conversations[otherUser].unreadCount += 1;
      }
    });
    
    res.json(Object.values(conversations));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    
    // Generate conversation ID
    const conversationId = generateConversationId(currentUserId, userId);
    
    // Update all unread messages in the conversation where current user is receiver
    await Message.updateMany(
      { 
        conversationId,
        receiver: currentUserId,
        read: false
      },
      { read: true }
    );
    
    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Delete a message (only for sender)
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    // Find message
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this message' });
    }
    
    await message.deleteOne();
    
    res.json({ message: 'Message deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Message not found' });
    }
    res.status(500).send('Server error');
  }
};

// Send a message to an activity group chat
exports.sendActivityMessage = async (req, res) => {
  try {
    const { activityId, content, senderName } = req.body;
    const senderId = req.user.id;
    
    // Validate activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    // Create group message
    const groupMessage = new GroupMessage({
      activityId,
      sender: senderId,
      content,
      senderName: senderName || req.user.username
    });
    
    await groupMessage.save();
    
    // Populate sender info for the response
    const populatedMessage = await GroupMessage.findById(groupMessage._id)
      .populate('sender', 'username profilePicture isDeleted');
    
    // Format response to match socket.io format
    const normalizedSenderId = populatedMessage?.sender?._id?.toString() || senderId?.toString();
    const formattedMessage = {
      _id: populatedMessage._id,
      roomId: `activity-${activityId}`,
      activityId,
      content: populatedMessage.content,
      sender: {
        id: normalizedSenderId,
        _id: normalizedSenderId,
        username: populatedMessage.sender?.isDeleted ? DEFAULT_DELETED_NAME : (populatedMessage.senderName || populatedMessage?.sender?.username),
        profilePicture: populatedMessage?.sender?.isDeleted 
          ? DEFAULT_DELETED_AVATAR 
          : (populatedMessage?.sender?.profilePicture || null)
      },
      timestamp: populatedMessage.createdAt
    };
    
    res.status(201).json(formattedMessage);
  } catch (err) {
    console.error('Error sending activity message:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

// Get messages for an activity group chat
exports.getActivityMessages = async (req, res) => {
  try {
    const { activityId } = req.params;
    
    // Validate activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    // Find all messages for the activity
    const messages = await GroupMessage.find({ activityId })
      .sort({ createdAt: 1 })
      .populate('sender', 'username profilePicture isDeleted');
    
    // Format messages to match socket.io format
    const formattedMessages = messages.map(msg => {
      const senderId = msg?.sender?._id?.toString();
      return {
        _id: msg._id,
        roomId: `activity-${activityId}`,
        activityId,
        content: msg.content,
        sender: {
          id: senderId,
          _id: senderId,
          username: msg?.sender?.isDeleted ? DEFAULT_DELETED_NAME : (msg.senderName || msg?.sender?.username),
          profilePicture: msg?.sender?.isDeleted ? DEFAULT_DELETED_AVATAR : (msg?.sender?.profilePicture || null)
        },
        timestamp: msg.createdAt
      };
    });
    
    res.json(formattedMessages);
  } catch (err) {
    console.error('Error retrieving activity messages:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};