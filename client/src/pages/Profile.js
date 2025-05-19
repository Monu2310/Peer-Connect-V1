import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  updateUserProfile, 
  getUserProfile, 
  uploadProfilePicture,
  generateRandomAvatar 
} from '../api/userService';
import api from '../api/config'; // Add api import for health check
import { getFriends, sendFriendRequestById } from '../api/friendService';
import { getMyCreatedActivities, getMyJoinedActivities } from '../api/activityService';
import { motion } from 'framer-motion';

const Profile = () => {
  const { userId } = useParams();
  const { currentUser, updateUserProfile: updateAuthUserProfile } = useAuth();
  const isOwnProfile = !userId || userId === currentUser?.id;

  const [formData, setFormData] = useState({
    username: currentUser?.username || 'User',
    email: currentUser?.email || '',
    bio: '',
    location: '',
    interests: [],
    profilePicture: currentUser?.profilePicture || '',
    hobbies: [],
    favoriteSubjects: [],
    sports: [],
    musicGenres: [],
    movieGenres: []
  });

  const [profileCacheTimestamp, setProfileCacheTimestamp] = useState(null);
  const [joinedActivities, setJoinedActivities] = useState([]);
  const [createdActivities, setCreatedActivities] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [isEditing, setIsEditing] = useState(true); // Always editable for presentation
  const [loading, setLoading] = useState(false); // Start with false to avoid loading spinner
  const [statsLoading, setStatsLoading] = useState(false); // Start with false for the presentation
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('joined');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [friendRequestStatus, setFriendRequestStatus] = useState('none');
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false); // New state to track profile loading

  // Only load cached profile data once on mount
  useEffect(() => {
    if (!hasLoadedProfile && isOwnProfile && currentUser) {
      try {
        const cachedProfile = localStorage.getItem('profile_data');
        const timestamp = localStorage.getItem('profile_data_timestamp');
        if (cachedProfile && timestamp) {
          const cacheAge = Date.now() - parseInt(timestamp);
          // Use cached data if less than 1 hour old
          if (cacheAge < 60 * 60 * 1000) {
            const parsedProfile = JSON.parse(cachedProfile);
            setFormData({
              ...formData,
              username: parsedProfile.username || currentUser?.username || 'User',
              email: parsedProfile.email || currentUser?.email || '',
              bio: parsedProfile.bio || '',
              interests: parsedProfile.interests || [],
              profilePicture: parsedProfile.profilePicture || currentUser?.profilePicture || '',
              location: parsedProfile.location || '',
              hobbies: parsedProfile.hobbies || [],
              favoriteSubjects: parsedProfile.favoriteSubjects || [],
              sports: parsedProfile.sports || [],
              musicGenres: parsedProfile.musicGenres || [],
              movieGenres: parsedProfile.movieGenres || []
            });
          }
        }
      } catch (err) {
        console.error('Error loading cached profile:', err);
      }
      setHasLoadedProfile(true);
    }
  }, [hasLoadedProfile, isOwnProfile, currentUser, formData]);

  // Save to cache on form data change
  useEffect(() => {
    if (isOwnProfile && formData.username && hasLoadedProfile) {
      try {
        localStorage.setItem('profile_data', JSON.stringify(formData));
        localStorage.setItem('profile_data_timestamp', Date.now().toString());
      } catch (err) {
        console.error('Error saving profile to cache:', err);
      }
    }
  }, [formData, isOwnProfile, hasLoadedProfile]);

  const fetchActivitiesAndFriends = useCallback(async () => {
    const profileUserId = userId || currentUser?.id;
    
    console.log("Starting data fetch with userId:", profileUserId);
    
    // No loading state for presentation
    // setStatsLoading(true);

    try {
      // Fetch joined activities
      try {
        const response = await getMyJoinedActivities();
        console.log('Joined activities response:', response);
        
        if (Array.isArray(response)) {
          setJoinedActivities(response);
        } else {
          setJoinedActivities([]);
        }
      } catch (err) {
        console.error('Error fetching joined activities:', err);
        setJoinedActivities([]);
      }
      
      // Fetch created activities
      try {
        const response = await getMyCreatedActivities();
        console.log('Created activities response:', response);
        
        if (Array.isArray(response)) {
          setCreatedActivities(response);
        } else {
          setCreatedActivities([]);
        }
      } catch (err) {
        console.error('Error fetching created activities:', err);
        setCreatedActivities([]);
      }
      
      // Fetch friends
      try {
        const response = await getFriends();
        console.log('Friends response:', response);
        
        if (Array.isArray(response) && response.length > 0) {
          setFriendsList(response);
        } else if (response && typeof response === 'object') {
          if (Array.isArray(response.friends)) {
            setFriendsList(response.friends);
          } else if (Array.isArray(response.data)) {
            setFriendsList(response.data);
          } else if (response.accepted && Array.isArray(response.accepted)) {
            setFriendsList(response.accepted);
          } else {
            setFriendsList([]);
          }
        } else {
          setFriendsList([]);
        }
      } catch (err) {
        console.error('Error fetching friends:', err);
        setFriendsList([]);
      }
    } catch (err) {
      console.error('Critical error in fetchActivitiesAndFriends:', err);
      setJoinedActivities([]);
      setCreatedActivities([]);
      setFriendsList([]);
    } finally {
      // Keep this false for presentation
      setStatsLoading(false);
    }
  }, [currentUser, userId]);

  const handleSendFriendRequest = async () => {
    if (userId && userId !== currentUser?.id) {
      try {
        setFriendRequestStatus('sending');
        await sendFriendRequestById(userId);
        setFriendRequestStatus('sent');
        setSuccess('Friend request sent successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('Error sending friend request:', err);
        setFriendRequestStatus('error');
        setError('Failed to send friend request. Please try again.');
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  useEffect(() => {
    fetchActivitiesAndFriends();
  }, [fetchActivitiesAndFriends]);

  // Removed all loading timeout effects for presentation

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddInterest = (interest) => {
    if (interest.trim() && !formData.interests.includes(interest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interest.trim()]
      }));
    }
  };

  const handleInterestKeyPress = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      handleAddInterest(e.target.value.trim());
      e.target.value = '';
    }
  };

  const handleRemoveInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }

    try {
      console.log("Sending profile data to server:", formData);
      const updatedUserData = await updateUserProfile(formData);
      console.log("Profile updated successfully:", updatedUserData);
      updateAuthUserProfile(updatedUserData);
      localStorage.setItem('profile_data', JSON.stringify(updatedUserData));
      localStorage.setItem('profile_data_timestamp', Date.now().toString());
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('profilePicture', file);
      const response = await uploadProfilePicture(formData);
      setFormData(prev => ({
        ...prev,
        profilePicture: response.profilePicture || response.imageUrl
      }));
      setUploadingImage(false);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
      setUploadingImage(false);
    }
  };

  // Add handler for generating random avatar
  const handleGenerateRandomAvatar = async () => {
    try {
      setUploadingImage(true);
      const response = await generateRandomAvatar();
      
      if (response && response.profilePicture) {
        setFormData(prev => ({
          ...prev,
          profilePicture: response.profilePicture
        }));
        
        // Update auth context and local storage
        updateAuthUserProfile({...currentUser, profilePicture: response.profilePicture});
        
        // Update localStorage with new profile picture
        try {
          const cachedProfile = localStorage.getItem('profile_data');
          if (cachedProfile) {
            const profileData = JSON.parse(cachedProfile);
            profileData.profilePicture = response.profilePicture;
            localStorage.setItem('profile_data', JSON.stringify(profileData));
            localStorage.setItem('profile_data_timestamp', Date.now().toString());
          }
        } catch (err) {
          console.error('Error updating cached profile data:', err);
        }
        
        setSuccess('Profile picture updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error generating random avatar:', err);
      setError('Failed to generate random avatar');
      setTimeout(() => setError(''), 5000);
    } finally {
      setUploadingImage(false);
    }
  };

  // Add handler for unfriending a user
  const handleUnfriend = async (friendId) => {
    try {
      // First, find the friendship record
      const friendships = await getFriends();
      const friendship = friendships.find(f => 
        (f.requester._id === friendId || f.recipient._id === friendId) ||
        (f.requester === friendId || f.recipient === friendId) ||
        (f.requester.id === friendId || f.recipient.id === friendId)
      );
      
      if (!friendship) {
        setError('Friendship not found');
        return;
      }
      
      // Call the API to remove the friend
      const response = await fetch(`/api/friends/${friendship._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove friend');
      }
      
      // Update the friends list by removing the unfriended user
      setFriendsList(prev => prev.filter(friend => 
        friend._id !== friendId && friend.id !== friendId
      ));
      
      setSuccess('Friend removed successfully');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('Error unfriending user:', err);
      setError('Failed to remove friend. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  // Completely removed loading spinner for the presentation

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {isOwnProfile ? 'My Profile' : `${formData.username}'s Profile`}
            </h1>
            {isOwnProfile ? (
              !isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setPreviewImage('');
                    // Removed fetchProfileData call
                  }}
                  className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              )
            ) : (
              <div className="mt-4 md:mt-0 flex space-x-3">
                <Link
                  to={`/messages/${userId}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  Message
                </Link>
                <button
                  onClick={handleSendFriendRequest}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${friendRequestStatus === 'sent' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                  disabled={friendRequestStatus === 'sending' || friendRequestStatus === 'sent'}
                >
                  {friendRequestStatus === 'sending' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : friendRequestStatus === 'sent' ? (
                    <>
                      <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 001.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Request Sent
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
                    Add Friend
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Message Alert */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Success Message Alert */}
        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

                {/* Commented out motion animation for testing
        <motion.div 
          className="bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        > */}
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {isOwnProfile ? 'Edit Your Profile' : 'Profile Details'}
            </h2>
          </div>
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="px-4 py-5 sm:px-6">
                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Username
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="username"
                        id="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="Enter your username"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Bio
                    </label>
                    <div className="mt-1">
                      <textarea
                        name="bio"
                        id="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="Tell us about yourself"
                        rows="3"
                      ></textarea>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="interests" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Interests
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="interests"
                        id="interests"
                        value={formData.interests.join(', ')}
                        onChange={(e) => setFormData({ ...formData, interests: e.target.value.split(',').map(i => i.trim()) })}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="Enter your interests"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Profile Picture
                    </label>
                    <div className="mt-1 flex items-center">
                      <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                        <img
                          src={formData.profilePicture || '/avatar.svg'}
                          alt="Profile"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/avatar.svg';
                          }}
                        />
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <label htmlFor="profilePicture" className="sr-only">
                          Upload profile picture
                        </label>
                        <input
                          id="profilePicture"
                          name="profilePicture"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:border file:border-gray-300 dark:file:border-gray-600 file:rounded-md file:text-sm file:font-medium file:bg-white dark:file:bg-gray-700 dark:file:text-gray-200 hover:file:bg-gray-50 dark:hover:file:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={handleGenerateRandomAvatar}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {uploadingImage ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                          </>
                        ) : (
                          <>
                            <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 001.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                          </svg>
                          Generate Random Avatar
                        </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        'Save Profile'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="px-4 py-5 sm:px-6">
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Username</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{formData.username}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{formData.email}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Bio</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{formData.bio || 'No bio available'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Interests</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {formData.interests.length > 0 ? formData.interests.join(', ') : 'No interests added'}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Profile Picture</p>
                  <div className="mt-1 flex items-center">
                    <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                      <img
                        src={formData.profilePicture || '/avatar.svg'}
                        alt="Profile"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/avatar.svg';
                        }}
                      />
                    </div>
                    <div className="ml-4">
                      <Link
                        to="#"
                        onClick={() => {
                          setIsEditing(true);
                          setPreviewImage('');
                        }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Change Picture
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        {/* </motion.div> */}
        </div>

        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {isOwnProfile ? 'My Activities' : `${formData.username}'s Activities`}
            </h2>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('joined')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center ${activeTab === 'joined' ? 'bg-blue-600 text-white' : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                >
                  Joined Activities
                </button>
                <button
                  onClick={() => setActiveTab('created')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center ${activeTab === 'created' ? 'bg-blue-600 text-white' : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                >
                  Created Activities
                </button>
              </div>
            </div>

            {statsLoading ? (
              <div className="p-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="animate-pulse flex space-x-4 p-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activeTab === 'joined' ? (
              joinedActivities.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {joinedActivities.map((activity) => (
                    <Link
                      to={`/activities/${activity._id}`}
                      key={activity._id}
                      className="block hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">{activity.title}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {activity.description ? (
                                  activity.description.length > 100 
                                    ? `${activity.description.substring(0, 100)}...` 
                                    : activity.description
                                ) : 'No description'}
                              </p>
                              <div className="mt-2 flex">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                                  {activity.category || 'Uncategorized'}
                                </span>
                                <span className="ml-2 inline-flex items-center text-xs text-gray-500 dark:text-gray-400">
                                  {activity.date ? formatDate(activity.date) : 'No date'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 dark:text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mb-2">You haven't joined any activities yet.</p>
                  <Link to="/activities" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Browse activities
                  </Link>
                </div>
              )
            ) : (
              createdActivities.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {createdActivities.map((activity) => (
                    <Link
                      to={`/activities/${activity._id}`}
                      key={activity._id}
                      className="block hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <p className="text-sm font-medium text-green-600 dark:text-green-400 truncate">{activity.title}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {activity.description ? (
                                  activity.description.length > 100 
                                    ? `${activity.description.substring(0, 100)}...` 
                                    : activity.description
                                ) : 'No description'}
                              </p>
                              <div className="mt-2 flex">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">
                                  {activity.category || 'Uncategorized'}
                                </span>
                                <span className="ml-2 inline-flex items-center text-xs text-gray-500 dark:text-gray-400">
                                  {activity.date ? formatDate(activity.date) : 'No date'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 dark:text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="mb-2">You haven't created any activities yet.</p>
                  <Link to="/activities/create" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Create your first activity
                  </Link>
                </div>
              )
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Friends
            </h2>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="px-4 py-5 sm:px-6">
              <div className="grid grid-cols-1 gap-y-4">
                {statsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 animate-pulse"></div>
                        <div className="w-full">
                          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : friendsList.length > 0 ? (
                  <div className="space-y-3">
                    {friendsList.slice(0, 5).map((friend, index) => (
                      <Link to={`/profile/${friend._id || friend.id}`} key={friend._id || friend.id || index} className="flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                          <img
                            src={friend.profilePicture || '/avatar.svg'}
                            alt={friend.username}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/avatar.svg';
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{friend.username}</p>
                        </div>
                      </Link>
                    ))}
                    {friendsList.length > 5 && (
                      <Link to="/friends" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 block text-center pt-2">
                        View all {friendsList.length} friends
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 dark:text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p>No friends yet</p>
                    <Link to="/friends" className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-800">
                      Find friends
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
