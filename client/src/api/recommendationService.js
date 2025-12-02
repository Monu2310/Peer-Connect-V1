import api from './config';

// Get AI-powered suggested peers based on comprehensive similarity scoring
export const getSuggestedPeers = async (limit = 10) => {
  try {
    console.log('🤝 Fetching suggested peers...');
    const response = await api.get(`/api/recommendations/peers?limit=${limit}`);
    console.log(`✅ Received ${response.data.length} peer suggestions`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching suggested peers:', error.response?.data || error.message);
    return [];
  }
};

// Get detailed similarity score with a specific user
export const getSimilarityWithUser = async (targetUserId) => {
  try {
    console.log('🤖 Calculating similarity with user:', targetUserId);
    const response = await api.get(`/api/recommendations/similarity/${targetUserId}`);
    console.log('✅ Similarity data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error calculating similarity:', error.response?.data || error.message);
    throw error;
  }
};

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
