import axios from 'axios';
import { API_URL } from './config';

/**
 * Get all friends of the current user
 */
export const getFriends = async () => {
  try {
    console.log('Fetching friends from API...');
    const response = await axios.get(`${API_URL}/api/friends`);
    console.log('Friends API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching friends:', error);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to fetch friends');
  }
};

/**
 * Get friend requests received by the current user
 */
export const getFriendRequests = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/friends/requests`);
    return response.data;
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch friend requests');
  }
};

/**
 * Send a friend request to another user by email
 * @param {string} email - Email of the user to send request to
 */
export const sendFriendRequest = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/api/friends/request`, { email });
    return response.data;
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw new Error(error.response?.data?.message || 'Failed to send friend request');
  }
};

/**
 * Send a friend request to another user by userId
 * @param {string} userId - ID of the user to send request to
 */
export const sendFriendRequestById = async (userId) => {
  try {
    const response = await axios.post(`${API_URL}/api/friends/request-by-id`, { userId });
    return response.data;
  } catch (error) {
    console.error('Error sending friend request by ID:', error);
    throw new Error(error.response?.data?.message || 'Failed to send friend request');
  }
};

/**
 * Accept a friend request
 * @param {string} requestId - ID of the friend request
 */
export const acceptFriendRequest = async (requestId) => {
  try {
    const response = await axios.put(`${API_URL}/api/friends/accept/${requestId}`);
    return response.data;
  } catch (error) {
    console.error('Error accepting friend request:', error);
    throw new Error(error.response?.data?.message || 'Failed to accept friend request');
  }
};

/**
 * Reject a friend request
 * @param {string} requestId - ID of the friend request
 */
export const rejectFriendRequest = async (requestId) => {
  try {
    const response = await axios.put(`${API_URL}/api/friends/reject/${requestId}`);
    return response.data;
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    throw new Error(error.response?.data?.message || 'Failed to reject friend request');
  }
};

/**
 * Remove a user from friends list
 * @param {string} friendId - ID of the friend to remove
 */
export const removeFriend = async (friendId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/friends/${friendId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing friend:', error);
    throw new Error(error.response?.data?.message || 'Failed to remove friend');
  }
};