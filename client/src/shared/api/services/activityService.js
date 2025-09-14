import api from './config';
import { API_URL } from './config';

// Helper function to process image URLs consistently
const processImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  
  // Use the explicit API_URL from config
  return `${API_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

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
    
    console.log('Fetching activities from:', `${API_URL}/api/activities?${queryParams}`);
    const response = await api.get(`/api/activities?${queryParams}`);
    
    // Process image URLs if needed
    if (response.data && Array.isArray(response.data)) {
      response.data = response.data.map(activity => {
        if (activity.image) {
          activity.image = processImageUrl(activity.image);
        }
        return activity;
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching activities:', error);
    if (error.message.includes('Network Error')) {
      throw new Error('Server connection failed. Please check if the server is running.');
    }
    throw error;
  }
};

// Get activity by ID
export const getActivityById = async (activityId) => {
  try {
    const response = await api.get(`/api/activities/${activityId}`);
    
    // Process image URL if needed
    if (response.data && response.data.image) {
      response.data.image = processImageUrl(response.data.image);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching activity details:', error);
    throw error;
  }
};

// Create new activity
export const createActivity = async (activityData) => {
  try {
    console.log('Creating activity with data:', activityData);
    
    // Handle file uploads if present
    if (activityData.image && activityData.image instanceof File) {
      const formData = new FormData();
      Object.keys(activityData).forEach(key => {
        formData.append(key, activityData[key]);
      });
      
      console.log('Sending form data to API');
      const response = await api.post(`/api/activities`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Process image URL in response if needed
      if (response.data && response.data.image) {
        response.data.image = processImageUrl(response.data.image);
      }
      
      console.log('Activity created successfully:', response.data);
      return response.data;
    } else {
      console.log('Sending JSON data to API');
      const token = localStorage.getItem('token');
      console.log('Using token:', token ? 'Present' : 'Missing');
      
      const response = await api.post(`/api/activities`, activityData);
      
      // Process image URL in response if needed
      if (response.data && response.data.image) {
        response.data.image = processImageUrl(response.data.image);
      }
      
      console.log('Activity created successfully:', response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Error creating activity:', error);
    
    if (error.response) {
      console.error('Server response:', error.response.data);
      throw new Error(error.response.data.message || 'Failed to create activity');
    } else if (error.request) {
      console.error('No response received');
      throw new Error('No response received from server. Please check your connection.');
    } else {
      throw error;
    }
  }
};

// Join an activity
export const joinActivity = async (activityId) => {
  try {
    const response = await api.post(`/api/activities/${activityId}/join`);
    
    // Process image URL if needed
    if (response.data && response.data.image) {
      response.data.image = processImageUrl(response.data.image);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error joining activity:', error);
    throw error;
  }
};

// Leave an activity
export const leaveActivity = async (activityId) => {
  try {
    const response = await api.delete(`/api/activities/${activityId}/leave`);
    
    // Process image URL if needed
    if (response.data && response.data.image) {
      response.data.image = processImageUrl(response.data.image);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error leaving activity:', error);
    throw error;
  }
};

// Update an activity
export const updateActivity = async (activityId, activityData) => {
  try {
    // Handle file uploads if present
    if (activityData.image && activityData.image instanceof File) {
      const formData = new FormData();
      Object.keys(activityData).forEach(key => {
        formData.append(key, activityData[key]);
      });
      
      const response = await api.put(`/api/activities/${activityId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Process image URL in response if needed
      if (response.data && response.data.image) {
        response.data.image = processImageUrl(response.data.image);
      }
      
      return response.data;
    } else {
      const response = await api.put(`/api/activities/${activityId}`, activityData);
      
      // Process image URL in response if needed
      if (response.data && response.data.image) {
        response.data.image = processImageUrl(response.data.image);
      }
      
      return response.data;
    }
  } catch (error) {
    console.error('Error updating activity:', error);
    throw error;
  }
};

// Delete an activity
export const deleteActivity = async (activityId) => {
  try {
    const response = await api.delete(`/api/activities/${activityId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw error;
  }
};

// Get activities created by current user
export const getMyCreatedActivities = async () => {
  try {
    const response = await api.get(`/api/activities/user/created`);
    
    // Process image URLs if needed
    if (response.data && Array.isArray(response.data)) {
      response.data = response.data.map(activity => {
        if (activity.image) {
          activity.image = processImageUrl(activity.image);
        }
        return activity;
      });
      return response.data;
    }
    
    // Handle case where response exists but isn't an array
    console.warn('Created activities response is not an array:', response.data);
    return [];
  } catch (error) {
    console.error('Error fetching created activities:', error);
    return [];
  }
};

// Get activities joined by current user
export const getMyJoinedActivities = async () => {
  try {
    const response = await api.get(`/api/activities/user/joined`);
    
    // Process image URLs if needed
    if (response.data && Array.isArray(response.data)) {
      response.data = response.data.map(activity => {
        if (activity.image) {
          activity.image = processImageUrl(activity.image);
        }
        return activity;
      });
      return response.data;
    }
    
    // Handle case where response exists but isn't an array
    console.warn('Joined activities response is not an array:', response.data);
    return [];
  } catch (error) {
    console.error('Error fetching joined activities:', error);
    return [];
  }
};