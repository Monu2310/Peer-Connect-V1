import api from './config';
import { API_URL } from './config';

// Get all friends
export const getFriends = async () => {
  try {
    console.log("Getting friends list...");
    const response = await api.get('/api/friends');
    console.log("Friends API response:", response.data);
    
    // Process profile pictures for friends
    if (response.data && Array.isArray(response.data)) {
      response.data.forEach(friend => {
        if (friend.profilePicture && !friend.profilePicture.startsWith('http')) {
          friend.profilePicture = `${API_URL}${friend.profilePicture.startsWith('/') ? '' : '/'}${friend.profilePicture}`;
        }
      });
      return response.data;
    } 
    
    // Handle response format where friends array is nested
    if (response.data && response.data.friends && Array.isArray(response.data.friends)) {
      response.data.friends.forEach(friend => {
        if (friend.profilePicture && !friend.profilePicture.startsWith('http')) {
          friend.profilePicture = `${API_URL}${friend.profilePicture.startsWith('/') ? '' : '/'}${friend.profilePicture}`;
        }
      });
      return response.data.friends;
    }
    
    // Empty fallback
    return [];
  } catch (error) {
    console.error('Error getting friends:', error.response?.data || error.message);
    // Return empty array instead of throwing
    return [];
  }
};

// Get friend requests received
export const getFriendRequests = async () => {
  try {
    const response = await api.get('/api/friends/requests');
    console.log("Friend requests API response:", response.data);
    
    // Process profile pictures for friend requests
    if (response.data && Array.isArray(response.data)) {
      response.data.forEach(request => {
        if (request.sender && request.sender.profilePicture && !request.sender.profilePicture.startsWith('http')) {
          request.sender.profilePicture = `${API_URL}${request.sender.profilePicture.startsWith('/') ? '' : '/'}${request.sender.profilePicture}`;
        }
      });
    }
    
    return response.data || [];
  } catch (error) {
    console.error('Error getting friend requests:', error.response?.data || error.message);
    return [];
  }
};

// Send friend request by user ID
export const sendFriendRequestById = async (userId) => {
  try {
    console.log("Sending friend request to userId:", userId);
    
    // Try different endpoint formats until one works
    let response;
    
    try {
      // First try the expected endpoint
      response = await api.post('/api/friends/request', { userId });
    } catch (err) {
      console.log("First attempt failed, trying alternative endpoint");
      
      try {
        // Try alternative endpoint
        response = await api.post('/api/friends/request-by-id', { userId });
      } catch (err) {
        console.log("Second attempt failed, trying raw userId in URL");
        
        // Try sending in URL
        response = await api.post(`/api/friends/request/${userId}`);
      }
    }
    
    console.log("Friend request response:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending friend request:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

// Accept friend request
export const acceptFriendRequest = async (requestId) => {
  try {
    const response = await api.put(`/api/friends/accept/${requestId}`);
    
    if (response.data && response.data.friend && response.data.friend.profilePicture) {
      response.data.friend.profilePicture = `${API_URL}${response.data.friend.profilePicture.startsWith('/') ? '' : '/'}${response.data.friend.profilePicture}`;
    }
    
    return response.data;
  } catch (error) {
    console.error('Error accepting friend request:', error.response?.data || error.message);
    throw error;
  }
};

// Reject friend request
export const rejectFriendRequest = async (requestId) => {
  try {
    const response = await api.put(`/api/friends/reject/${requestId}`);
    return response.data;
  } catch (error) {
    console.error('Error rejecting friend request:', error.response?.data || error.message);
    throw error;
  }
};

// Remove friend
export const removeFriend = async (friendId) => {
  try {
    const response = await api.delete(`/api/friends/${friendId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing friend:', error.response?.data || error.message);
    throw error;
  }
};

// Send message in group chat
export const sendGroupMessage = async (groupId, message) => {
  try {
    const response = await api.post(`/api/groups/${groupId}/messages`, { content: message });
    return response.data;
  } catch (error) {
    console.error('Error sending group message:', error.response?.data || error.message);
    throw error;
  }
};

// Get group chat messages
export const getGroupMessages = async (groupId) => {
  try {
    const response = await api.get(`/api/groups/${groupId}/messages`);
    return response.data;
  } catch (error) {
    console.error('Error getting group messages:', error.response?.data || error.message);
    return [];
  }
};

// Process activity images
export const getActivities = async () => {
  try {
    const response = await api.get('/api/activities');
    
    // Process images in activities
    if (response.data && Array.isArray(response.data)) {
      response.data.forEach(activity => {
        if (activity.image && !activity.image.startsWith('http')) {
          activity.image = `${API_URL}${activity.image.startsWith('/') ? '' : '/'}${activity.image}`;
        }
        // Also process user profile pictures in activities
        if (activity.user && activity.user.profilePicture && !activity.user.profilePicture.startsWith('http')) {
          activity.user.profilePicture = `${API_URL}${activity.user.profilePicture.startsWith('/') ? '' : '/'}${activity.user.profilePicture}`;
        }
      });
    }
    
    return response.data || [];
  } catch (error) {
    console.error('Error getting activities:', error.response?.data || error.message);
    return [];
  }
};

// Process images for a single activity
export const getActivity = async (activityId) => {
  try {
    const response = await api.get(`/api/activities/${activityId}`);
    
    const activity = response.data;
    if (activity) {
      if (activity.image && !activity.image.startsWith('http')) {
        activity.image = `${API_URL}${activity.image.startsWith('/') ? '' : '/'}${activity.image}`;
      }
      if (activity.user && activity.user.profilePicture && !activity.user.profilePicture.startsWith('http')) {
        activity.user.profilePicture = `${API_URL}${activity.user.profilePicture.startsWith('/') ? '' : '/'}${activity.user.profilePicture}`;
      }
    }
    
    return activity;
  } catch (error) {
    console.error('Error getting activity:', error.response?.data || error.message);
    throw error;
  }
};