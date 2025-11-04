import api from './config';

// Get conversations
export const getConversations = async () => {
  try {
    const response = await api.get('/api/messages/conversations');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

// Get messages for a conversation
export const getMessages = async (conversationId) => {
  const response = await api.get(`/api/messages/${conversationId}`);
  return response.data;
};

// Send a message
export const sendMessage = async (recipientId, content) => {
  const response = await api.post('/api/messages', { receiverId: recipientId, content });
  return response.data;
};

// Mark conversation as read
export const markAsRead = async (conversationId) => {
  const response = await api.put(`/api/messages/${conversationId}/read`);
  return response.data;
};

// Get unread message count (not implemented in backend - use getConversations instead)
export const getUnreadCount = async () => {
  try {
    const conversations = await getConversations();
    const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
    return { unreadCount: totalUnread };
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return { unreadCount: 0 };
  }
};

// Get messages for an activity group chat
export const getActivityMessages = async (activityId) => {
  try {
    const response = await api.get(`/api/messages/activity/${activityId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching activity messages:', error);
    throw error;
  }
};

// Send a message to an activity group chat
export const sendActivityMessage = async (activityId, content, senderName) => {
  try {
    const response = await api.post('/api/messages/activity', {
      activityId,
      content,
      senderName
    });
    return response.data;
  } catch (error) {
    console.error('Error sending activity message:', error);
    throw error;
  }
};