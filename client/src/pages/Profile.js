import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, getUserById, uploadProfileImage } from '../api/userService';
import { getFriends } from '../api/friendService';
import { getMyCreatedActivities, getMyJoinedActivities } from '../api/activityService';
import { motion } from 'framer-motion';

const Profile = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    location: '',
    interests: [],
    profilePicture: '',
  });
  
  const [joinedActivities, setJoinedActivities] = useState([]);
  const [createdActivities, setCreatedActivities] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('joined');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // Fetch profile data
  const fetchProfileData = useCallback(async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const userData = await getUserById(currentUser.id);
      console.log("Fetched user data:", userData);
      setFormData({
        username: userData.username || '',
        email: userData.email || '',
        bio: userData.bio || '',
        location: userData.location || '',
        interests: Array.isArray(userData.interests) ? userData.interests : 
                  (userData.interests ? userData.interests.split(',').filter(i => i.trim()) : []),
        profilePicture: userData.profilePicture || '',
      });
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  // Fetch activities and friends data
  const fetchActivitiesAndFriends = useCallback(async () => {
    if (!currentUser?.id) {
      setStatsLoading(false);
      return;
    }
    
    setStatsLoading(true);
    try {
      // Fetch data in parallel for better performance
      const [joinedActivitiesData, createdActivitiesData, friendsData] = await Promise.all([
        getMyJoinedActivities().catch(err => {
          console.error('Error fetching joined activities:', err);
          return [];
        }),
        getMyCreatedActivities().catch(err => {
          console.error('Error fetching created activities:', err);
          return [];
        }),
        getFriends().catch(err => {
          console.error('Error fetching friends:', err);
          return [];
        })
      ]);
      
      console.log("Joined activities:", joinedActivitiesData);
      console.log("Created activities:", createdActivitiesData);
      console.log("Friends data:", friendsData);
      
      // Process results with proper error handling
      setJoinedActivities(Array.isArray(joinedActivitiesData) ? joinedActivitiesData : []);
      setCreatedActivities(Array.isArray(createdActivitiesData) ? createdActivitiesData : []);
      
      // Handle friends data carefully to avoid rendering issues
      if (Array.isArray(friendsData)) {
        setFriendsList(friendsData);
      } else if (friendsData && typeof friendsData === 'object') {
        if (Array.isArray(friendsData.data)) {
          setFriendsList(friendsData.data);
        } else if (Array.isArray(friendsData.friends)) {
          setFriendsList(friendsData.friends);
        } else {
          // This is a common pattern in APIs where the response contains an array of friends
          const extractedFriends = [];
          if (friendsData.accepted && Array.isArray(friendsData.accepted)) {
            extractedFriends.push(...friendsData.accepted);
          }
          setFriendsList(extractedFriends);
        }
      } else {
        setFriendsList([]);
      }
    } catch (err) {
      console.error('Error fetching activities/friends:', err);
      setError('Failed to load some data');
    } finally {
      setStatsLoading(false);
    }
  }, [currentUser?.id]);

  // Load data on component mount
  useEffect(() => {
    fetchProfileData();
    fetchActivitiesAndFriends();
  }, [fetchProfileData, fetchActivitiesAndFriends]);

  // Form handlers
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
      const updatedUserData = await updateProfile(formData);
      console.log("Profile updated successfully:", updatedUserData);
      
      // Update the auth context with the new user data to keep it in sync
      updateUserProfile(updatedUserData);
      
      // Refresh local state with the server response
      setFormData({
        username: updatedUserData.username || '',
        email: updatedUserData.email || '',
        bio: updatedUserData.bio || '',
        location: updatedUserData.location || '',
        interests: Array.isArray(updatedUserData.interests) ? updatedUserData.interests : 
                  (updatedUserData.interests ? updatedUserData.interests.split(',').filter(i => i.trim()) : []),
        profilePicture: updatedUserData.profilePicture || '',
      });
      
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    // Preview image before upload
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    try {
      setUploadingImage(true);
      const response = await uploadProfileImage(file);
      setFormData(prev => ({ ...prev, profilePicture: response.imageUrl }));
      setUploadingImage(false);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
      setUploadingImage(false);
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

  if (loading && !isEditing) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            {!isEditing ? (
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
                  fetchProfileData(); // Reset form data
                }}
                className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Notification messages */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Profile card */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {/* Profile header with image */}
              <div className="p-6 sm:p-8 text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow mx-auto bg-gray-100">
                    <img 
                      src={previewImage || formData.profilePicture || '/avatar.svg'} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/avatar.svg';
                      }}
                    />
                  </div>
                  {isEditing && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <label className="cursor-pointer p-2 rounded-full bg-gray-800 bg-opacity-75 text-white hover:bg-opacity-90 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleFileChange}
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                  )}
                </div>
                <h2 className="mt-4 text-xl font-bold text-gray-900">{formData.username}</h2>
                <p className="text-sm text-gray-500">{formData.email}</p>
              </div>

              {/* Stats section */}
              <div className="border-t border-gray-200">
                <dl>
                  <div className="grid grid-cols-3 divide-x divide-gray-200">
                    <div className="px-4 py-5 sm:px-6 text-center">
                      <dt className="text-sm font-normal text-gray-500">Joined</dt>
                      <dd className="mt-1 text-xl font-semibold text-blue-600">{joinedActivities.length}</dd>
                    </div>
                    <div className="px-4 py-5 sm:px-6 text-center">
                      <dt className="text-sm font-normal text-gray-500">Created</dt>
                      <dd className="mt-1 text-xl font-semibold text-green-600">{createdActivities.length}</dd>
                    </div>
                    <div className="px-4 py-5 sm:px-6 text-center">
                      <dt className="text-sm font-normal text-gray-500">Friends</dt>
                      <dd className="mt-1 text-xl font-semibold text-purple-600">{friendsList.length}</dd>
                    </div>
                  </div>
                </dl>
              </div>

              {/* Other profile information */}
              <div className="border-t border-gray-200 p-6">
                <div className="mb-6">
                  <h3 className="text-base font-medium text-gray-900 mb-2">Interests</h3>
                  {isEditing ? (
                    <div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.interests.map((interest, index) => (
                          <span 
                            key={index} 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {interest}
                            <button 
                              type="button" 
                              className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600"
                              onClick={() => handleRemoveInterest(interest)}
                            >
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Add interest (press Enter)"
                          className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          onKeyPress={handleInterestKeyPress}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.interests && formData.interests.length > 0 ? (
                        formData.interests.map((interest, index) => (
                          <span 
                            key={index} 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {interest}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">No interests added yet</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">Location</h3>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        name="location"
                        value={formData.location || ''}
                        onChange={handleChange}
                        placeholder="Add your location"
                        className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-gray-600">
                      {formData.location ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{formData.location}</span>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No location provided</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Friends preview section */}
            <div className="bg-white shadow rounded-lg overflow-hidden mt-6">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-medium text-gray-900">Friends</h3>
                  <Link to="/friends" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View All
                  </Link>
                </div>
                
                {statsLoading ? (
                  <div className="flex space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse h-10 w-10 rounded-full bg-gray-200"></div>
                    ))}
                  </div>
                ) : friendsList.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {friendsList.slice(0, 8).map((friend) => (
                      <Link 
                        key={friend._id} 
                        to={`/profile/${friend._id}`} 
                        className="relative group"
                      >
                        <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-200 bg-gray-100">
                          <img 
                            src={friend.profilePicture || '/avatar.svg'} 
                            alt={friend.username || 'Friend'} 
                            className="h-full w-full object-cover"
                            title={friend.username}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/avatar.svg';
                            }}
                          />
                        </div>
                        <span className="absolute -bottom-1 -right-1 bg-green-500 h-2.5 w-2.5 rounded-full border-2 border-white"></span>
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity">
                          {friend.username || 'Friend'}
                        </div>
                      </Link>
                    ))}
                    {friendsList.length > 8 && (
                      <Link to="/friends" className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600 font-medium hover:bg-gray-200">
                        +{friendsList.length - 8}
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-sm text-gray-500 mb-2">No friends yet</p>
                    <Link 
                      to="/friends" 
                      className="inline-flex items-center text-xs bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-full hover:bg-blue-100"
                    >
                      Connect with others
                      <svg className="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column - User info & activities */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
                
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    {/* Username field */}
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                      {isEditing ? (
                        <input
                          type="text"
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          required
                          className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <div className="mt-1 text-sm text-gray-900">{formData.username || '-'}</div>
                      )}
                    </div>

                    {/* Email field */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <div className="mt-1 text-sm text-gray-900">{formData.email || '-'}</div>
                      )}
                    </div>

                    {/* Bio field */}
                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
                      {isEditing ? (
                        <textarea
                          id="bio"
                          name="bio"
                          rows={3}
                          value={formData.bio || ''}
                          onChange={handleChange}
                          placeholder="Write a few sentences about yourself"
                          className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <div className="mt-1 text-sm text-gray-900">
                          {formData.bio ? (
                            <p>{formData.bio}</p>
                          ) : (
                            <p className="text-gray-500 italic">No bio provided</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Save button */}
                    {isEditing && (
                      <div className="flex justify-end">
                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          {uploadingImage ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Uploading...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </motion.button>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Activities Section */}
            <div className="bg-white shadow rounded-lg overflow-hidden mt-6">
              <div className="p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">My Activities</h2>
                
                {/* Activity tabs */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="flex -mb-px space-x-8">
                    <button
                      type="button"
                      onClick={() => setActiveTab('joined')}
                      className={`${
                        activeTab === 'joined'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      Joined
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('created')}
                      className={`${
                        activeTab === 'created'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      Created
                    </button>
                  </nav>
                </div>

                {/* Activities content */}
                <div>
                  {statsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="bg-gray-200 h-24 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {activeTab === 'joined' ? (
                        joinedActivities.length > 0 ? (
                          <div className="space-y-4">
                            {joinedActivities.slice(0, 5).map(activity => (
                              <Link 
                                to={`/activities/${activity._id}`}
                                key={activity._id}
                                className="block hover:bg-gray-50 transition rounded-lg border border-gray-200 p-4"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="text-sm font-medium text-gray-900">{activity.title}</h3>
                                    <div className="flex items-center mt-1">
                                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                                        {activity.category || 'Activity'}
                                      </span>
                                      <span className="ml-2 text-xs text-gray-500">{formatDate(activity.date)}</span>
                                    </div>
                                    {activity.location && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        <span className="inline-block">📍 {activity.location}</span>
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-gray-400 hover:text-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                              </Link>
                            ))}
                            {joinedActivities.length > 5 && (
                              <div className="text-center">
                                <Link 
                                  to="/activities" 
                                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                                >
                                  View all {joinedActivities.length} activities
                                  <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                  </svg>
                                </Link>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-10">
                            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="mt-2 text-sm text-gray-500">You haven't joined any activities yet.</p>
                            <div className="mt-5">
                              <Link
                                to="/activities"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                              >
                                Browse Activities
                              </Link>
                            </div>
                          </div>
                        )
                      ) : (
                        createdActivities.length > 0 ? (
                          <div className="space-y-4">
                            {createdActivities.slice(0, 5).map(activity => (
                              <Link 
                                to={`/activities/${activity._id}`}
                                key={activity._id}
                                className="block hover:bg-gray-50 transition rounded-lg border border-gray-200 p-4"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="text-sm font-medium text-gray-900">{activity.title}</h3>
                                    <div className="flex items-center mt-1">
                                      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                                        {activity.category || 'Activity'}
                                      </span>
                                      <span className="ml-2 text-xs text-gray-500">{formatDate(activity.date)}</span>
                                    </div>
                                    {activity.location && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        <span className="inline-block">📍 {activity.location}</span>
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-gray-400 hover:text-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                              </Link>
                            ))}
                            {createdActivities.length > 5 && (
                              <div className="text-center">
                                <Link 
                                  to="/activities" 
                                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                                >
                                  View all {createdActivities.length} activities
                                  <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                  </svg>
                                </Link>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-10">
                            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="mt-2 text-sm text-gray-500">You haven't created any activities yet.</p>
                            <div className="mt-5">
                              <Link
                                to="/activities/create"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                              >
                                Create Activity
                              </Link>
                            </div>
                          </div>
                        )
                      )}

                      {/* Quick action buttons */}
                      <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
                        <Link 
                          to="/activities"
                          className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Browse Activities
                        </Link>
                        <Link 
                          to="/activities/create"
                          className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Create Activity
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;