const Message = require('../models/Message');
const User = require('../models/User');

// Helper function to generate conversation ID consistently
const generateConversationId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('-');
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
      .populate('sender', 'username profilePicture')
      .populate('receiver', 'username profilePicture');
    
    res.status(201).json(populatedMessage);
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
      .populate('sender', 'username profilePicture')
      .populate('receiver', 'username profilePicture');
    
    res.json(messages);
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
      .populate('sender', 'username profilePicture')
      .populate('receiver', 'username profilePicture');
    
    // Group messages by conversation and get the latest message of each conversation
    const conversations = {};
    
    messages.forEach(message => {
      const otherUser = message.sender._id.toString() === currentUserId 
        ? message.receiver._id.toString() 
        : message.sender._id.toString();
      
      if (!conversations[otherUser]) {
        conversations[otherUser] = {
          user: message.sender._id.toString() === currentUserId 
            ? message.receiver 
            : message.sender,
          lastMessage: message,
          unreadCount: message.receiver._id.toString() === currentUserId && !message.read ? 1 : 0
        };
      } else if (message.receiver._id.toString() === currentUserId && !message.read) {
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