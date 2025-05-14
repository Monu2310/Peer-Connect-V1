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
  try {
    const response = await api.get(`/api/users/${userId}`);
    
    // Process profile picture URL if needed
    if (response.data && response.data.profilePicture) {
      response.data.profilePicture = processImageUrl(response.data.profilePicture);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Return a minimal valid profile to prevent UI crashes
    return {
      username: 'User',
      email: '',
      bio: '',
      interests: [],
      hobbies: [],
      favoriteSubjects: [],
      sports: [],
      musicGenres: [],
      movieGenres: []
    };
  }
};

// Update user profile
export const updateUserProfile = async (profileData) => {
  try {
    const response = await api.put('/api/users/profile', profileData);
    
    // Process profile picture URL if needed
    if (response.data && response.data.profilePicture) {
      response.data.profilePicture = processImageUrl(response.data.profilePicture);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Upload profile picture
export const uploadProfilePicture = async (formData) => {
  try {
    const response = await api.post('/api/users/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // Process profile picture URL if needed
    if (response.data && response.data.profilePicture) {
      response.data.profilePicture = processImageUrl(response.data.profilePicture);
    } else if (response.data && response.data.imageUrl) {
      response.data.imageUrl = processImageUrl(response.data.imageUrl);
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