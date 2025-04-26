import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5111';

// Get all activities with optional filtering
export const getActivities = async (category, search) => {
  try {
    const queryParams = new URLSearchParams();
    if (category && category !== 'All') {
      queryParams.append('category', category);
    }
    if (search) {
      queryParams.append('search', search);
    }
    
    const response = await axios.get(`${API_URL}/api/activities?${queryParams}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get activity by ID
export const getActivityById = async (activityId) => {
  try {
    const response = await axios.get(`${API_URL}/api/activities/${activityId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create new activity
export const createActivity = async (activityData) => {
  try {
    const response = await axios.post(`${API_URL}/api/activities`, activityData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Join an activity
export const joinActivity = async (activityId) => {
  try {
    const response = await axios.post(`${API_URL}/api/activities/${activityId}/join`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Leave an activity
export const leaveActivity = async (activityId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/activities/${activityId}/leave`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update an activity
export const updateActivity = async (activityId, activityData) => {
  try {
    const response = await axios.put(`${API_URL}/api/activities/${activityId}`, activityData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete an activity
export const deleteActivity = async (activityId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/activities/${activityId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get activities created by current user
export const getMyCreatedActivities = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/activities/user/created`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get activities joined by current user
export const getMyJoinedActivities = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/activities/user/joined`);
    return response.data;
  } catch (error) {
    throw error;
  }
};