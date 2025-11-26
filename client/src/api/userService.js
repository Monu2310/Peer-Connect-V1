import api from './config';
import { API_URL } from './config';

// Helper function to process image URLs consistently
const processImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  
  // Use the explicit API_URL from config
  return `${API_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

// Get user profile
export const getUserProfile = async (userId) => {
  let retries = 2; // Number of retries
  
  while (retries >= 0) {
    try {
      console.log(`Fetching profile for user ${userId}${retries < 2 ? ` (retry ${2-retries}/2)` : ''}`);
      
      const response = await api.get(`/api/users/${userId}`, { 
        timeout: 10000 // 10 second timeout
      });
      
      // Process profile picture URL if needed
      if (response.data && response.data.profilePicture) {
        response.data.profilePicture = processImageUrl(response.data.profilePicture);
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching user profile (${retries} retries left):`, error);
      
      // Only retry for network errors or timeouts, not for 4xx responses
      if (retries > 0 && (!error.response || error.code === 'ECONNABORTED')) {
        retries--;
        // Wait before retrying (exponential backoff: 1s, then 2s)
        await new Promise(resolve => setTimeout(resolve, 1000 * (3-retries)));
        continue;
      }
      
      // Return null to indicate failure so UI can handle gracefully
      return null;
    }
  }
};

// Update user profile
export const updateUserProfile = async (profileData) => {
  try {
    const response = await api.put('/api/users/profile', profileData);

    // Backend may return either the updated user object directly or wrap it
    // in a `{ user, profilePicture }` envelope (used by some endpoints).
    let user = null;
    if (response.data) {
      if (response.data.user) {
        user = response.data.user;
      } else if (response.data._id || response.data.id) {
        user = response.data;
      }
    }

    // If we still don't have a user object, fall back to response.data
    if (!user) user = response.data || null;

    // Ensure profilePicture URLs are absolute when returned
    if (user && user.profilePicture) {
      user.profilePicture = processImageUrl(user.profilePicture);
    }

    return user;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Upload profile picture
export const uploadProfilePicture = async (formData) => {
  try {
    // Since backend doesn't have file upload, generate a random avatar instead
    const response = await api.post('/api/users/random-avatar', {});
    
    // Process profile picture URL if needed
    if (response.data && response.data.profilePicture) {
      response.data.profilePicture = processImageUrl(response.data.profilePicture);
    } else if (response.data && response.data.user && response.data.user.profilePicture) {
      response.data.profilePicture = processImageUrl(response.data.user.profilePicture);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

// Search users
export const searchUsers = async (query) => {
  try {
    const response = await api.get(`/api/users/search?q=${encodeURIComponent(query)}`);
    
    // Process profile pictures for all users in the results
    if (response.data && Array.isArray(response.data)) {
      response.data = response.data.map(user => {
        if (user.profilePicture) {
          user.profilePicture = processImageUrl(user.profilePicture);
        }
        return user;
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

// Find user by email
export const findUserByEmail = async (email) => {
  try {
    const response = await api.get(`/api/users/find-by-email?email=${encodeURIComponent(email)}`);
    
    // Process profile picture URL if needed
    if (response.data && response.data.profilePicture) {
      response.data.profilePicture = processImageUrl(response.data.profilePicture);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
};

// Generate random avatar
export const generateRandomAvatar = async () => {
  try {
    const response = await api.post('/api/users/random-avatar');
    
    // Process profile picture URL if needed
    if (response.data && response.data.profilePicture) {
      response.data.profilePicture = processImageUrl(response.data.profilePicture);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error generating random avatar:', error);
    throw error;
  }
};
