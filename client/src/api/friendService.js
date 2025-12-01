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
    
    // Process profile pictures for friend requests (handle 'requester' and 'sender' shapes)
    if (response.data && Array.isArray(response.data)) {
      response.data.forEach(request => {
        const requester = request.requester || request.sender || request.requesterId;
        if (requester && requester.profilePicture && !requester.profilePicture.startsWith('http')) {
          requester.profilePicture = `${API_URL}${requester.profilePicture.startsWith('/') ? '' : '/'}${requester.profilePicture}`;
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
    const response = await api.post('/api/friends/request-by-id', { userId });
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
    console.log('📤 API: Accepting friend request:', requestId);
    const response = await api.put(`/api/friends/accept/${requestId}`);
    console.log('📥 API: Accept response:', response.data);
    
    if (response.data && response.data.friend && response.data.friend.profilePicture) {
      response.data.friend.profilePicture = `${API_URL}${response.data.friend.profilePicture.startsWith('/') ? '' : '/'}${response.data.friend.profilePicture}`;
    }
    
    // Invalidate caches to trigger UI refresh
    if (typeof window !== 'undefined') {
      try {
        const { default: intelligentCache } = await import('../lib/intelligentCache');
        intelligentCache.delete('user:friend-requests');
        intelligentCache.delete('user:friends');
        intelligentCache.invalidateByTags(['friends', 'social']);
      } catch (cacheErr) {
        console.debug('Cache invalidation skipped:', cacheErr.message);
      }
      
      // Dispatch event to refresh UI components
      window.dispatchEvent(new CustomEvent('friendshipChanged', { 
        detail: { requestId, action: 'accepted', friend: response.data.friend } 
      }));
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ API: Error accepting friend request:', error.response?.data || error.message);
    throw error;
  }
};

// Reject friend request
export const rejectFriendRequest = async (requestId) => {
  try {
    console.log('📤 API: Declining friend request:', requestId);
    const response = await api.put(`/api/friends/decline/${requestId}`);
    console.log('📥 API: Decline response:', response.data);
    
    // Invalidate friend request cache to trigger UI refresh
    if (typeof window !== 'undefined') {
      try {
        const { default: intelligentCache } = await import('../lib/intelligentCache');
        intelligentCache.delete('user:friend-requests');
        intelligentCache.invalidateByTags(['friend-requests']);
      } catch (cacheErr) {
        console.debug('Cache invalidation skipped:', cacheErr.message);
      }
      
      // Dispatch event to refresh friend request list
      window.dispatchEvent(new CustomEvent('friendRequestRejected', { 
        detail: { requestId } 
      }));
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ API: Error rejecting friend request:', error.response?.data || error.message);
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

// Remove friend by other user's ID (server will find the friendship between current user and the provided user)
export const removeFriendByUser = async (userId) => {
  try {
    const response = await api.delete(`/api/friends/by-user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing friend by user:', error.response?.data || error.message);
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
