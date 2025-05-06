import api from './config';

// Get activity recommendations
export const getActivityRecommendations = async () => {
  try {
    const response = await api.get('/api/recommendations');
    return response.data;
  } catch (error) {
    console.error('Error fetching activity recommendations:', error);
    return [];
  }
};

// Get similar activities
export const getSimilarActivities = async (activityId) => {
  const response = await api.get(`/api/recommendations/similar/${activityId}`);
  return response.data;
};

// Get preference-based friend recommendations 
export const getFriendRecommendations = async () => {
  try {
    // Use the new endpoint specifically for friend recommendations
    const response = await api.get('/api/recommendations/friends');
    return response.data;
  } catch (error) {
    console.error('Error fetching friend recommendations:', error);
    // Return empty array instead of throwing to avoid dashboard breaking
    return [];
  }
};

// Get user activity insights
export const getUserInsights = async () => {
  const response = await api.get('/api/recommendations/insights');
  return response.data;
};