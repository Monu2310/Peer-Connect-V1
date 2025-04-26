import axios from 'axios';
import { API_URL } from './config';

/**
 * Get all conversations for the current user
 */
export const getConversations = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/messages/conversations`);
    return response.data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch conversations');
  }
};

/**
 * Get messages between current user and another user
 * @param {string} userId - ID of the other user in the conversation
 */
export const getMessages = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/api/messages/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch messages');
  }
};

/**
 * Send a message to another user
 * @param {string} recipientId - ID of the recipient user
 * @param {string} content - Message content
 */
export const sendMessage = async (recipientId, content) => {
  try {
    const response = await axios.post(`${API_URL}/api/messages`, { 
      recipient: recipientId, 
      content 
    });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error(error.response?.data?.message || 'Failed to send message');
  }
};

/**
 * Mark messages as read
 * @param {string} senderId - ID of the sender whose messages should be marked as read
 */
export const markMessagesAsRead = async (senderId) => {
  try {
    const response = await axios.put(`${API_URL}/api/messages/read/${senderId}`);
    return response.data;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw new Error(error.response?.data?.message || 'Failed to mark messages as read');
  }
};

/**
 * Delete a message
 * @param {string} messageId - ID of the message to delete
 */
export const deleteMessage = async (messageId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/messages/${messageId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete message');
  }
};