import axios from 'axios';
import { API_URL } from './config';

/**
 * Get user by id
 * @param {string} userId - ID of the user to fetch
 */
export const getUserById = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/api/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch user details');
  }
};

/**
 * Update current user profile
 * @param {object} userData - User profile data to update
 */
export const updateProfile = async (userData) => {
  try {
    // If userData.interests is an array, make sure it's properly formatted
    let profileData = { ...userData };
    
    // Handle array data properly
    if (Array.isArray(profileData.interests)) {
      // The server expects either a string or array, but we'll ensure it's consistent
      profileData.interests = [...profileData.interests]; // Make a copy to avoid mutation
    }

    const response = await axios.put(`${API_URL}/api/users/profile`, profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw new Error(error.response?.data?.message || 'Failed to update profile');
  }
};

/**
 * Upload profile image
 * @param {File} imageFile - The image file to upload
 */
export const uploadProfileImage = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('profileImage', imageFile);
    
    const response = await axios.post(`${API_URL}/api/users/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error(error.response?.data?.message || 'Failed to upload image');
  }
};

/**
 * Get activities created or joined by the current user
 */
export const getUserActivities = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/users/activities`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user activities:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch activities');
  }
};

/**
 * Search for users by username or email
 * @param {string} query - Search query string
 */
export const searchUsers = async (query) => {
  try {
    const response = await axios.get(`${API_URL}/api/users/search?q=${query}`);
    return response.data;
  } catch (error) {
    console.error('Error searching users:', error);
    throw new Error(error.response?.data?.message || 'Failed to search users');
  }
};

/**
 * Update user password
 * @param {object} passwordData - Object containing current and new password
 */
export const updatePassword = async (passwordData) => {
  try {
    const response = await axios.put(`${API_URL}/api/users/password`, passwordData);
    return response.data;
  } catch (error) {
    console.error('Error updating password:', error);
    throw new Error(error.response?.data?.message || 'Failed to update password');
  }
};

/**
 * Get dashboard statistics for the current user
 * Including friend count, pending requests, activities count, and recent messages
 */
export const getDashboardStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/users/dashboard/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch dashboard statistics');
  }
};