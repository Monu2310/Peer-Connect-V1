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
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar, Users, PlusCircle, UserPlus, Mail, MessageSquare, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

const Profile = () => {
  const { userId } = useParams();
  const { currentUser, updateUserProfile: updateAuthUserProfile, loading: authLoading } = useAuth();
  const isOwnProfile = !userId || userId === currentUser?.id;

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    location: '',
    interests: [],
    profilePicture: '',
    hobbies: [],
    favoriteSubjects: [],
    sports: [],
    musicGenres: [],
    movieGenres: []
  });

  // New useEffect to update formData when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username || '',
        email: currentUser.email || '',
        bio: currentUser.bio || '',
        location: currentUser.location || '',
        interests: currentUser.interests || [],
        profilePicture: currentUser.profilePicture || '/avatar.svg',
        hobbies: currentUser.hobbies || [],
        favoriteSubjects: currentUser.favoriteSubjects || [],
        sports: currentUser.sports || [],
        musicGenres: currentUser.musicGenres || [],
        movieGenres: currentUser.movieGenres || []
      });
    }
  }, [currentUser]);

  const [joinedActivities, setJoinedActivities] = useState([]);
  const [createdActivities, setCreatedActivities] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [isEditing, setIsEditing] = useState(false); // Start in display mode
  const [loading, setLoading] = useState(false); 
  const [statsLoading, setStatsLoading] = useState(false); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('joined');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [friendRequestStatus, setFriendRequestStatus] = useState('none'); // none, sending, sent, error
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false); 

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  // Fetch profile data
  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const profileData = await getUserProfile(userId || currentUser?.id);
      setFormData(prev => ({
        ...prev,
        username: profileData.username || prev.username,
        email: profileData.email || prev.email,
        bio: profileData.bio || '',
        location: profileData.location || '',
        interests: profileData.interests || [],
        profilePicture: profileData.profilePicture || '/avatar.svg',
        hobbies: profileData.hobbies || [],
        favoriteSubjects: profileData.favoriteSubjects || [],
        sports: profileData.sports || [],
        musicGenres: profileData.musicGenres || [],
        movieGenres: profileData.movieGenres || []
      }));

      // Check friend request status if viewing another user's profile
      if (!isOwnProfile && currentUser) {
        const friends = await getFriends();
        const isFriend = friends.some(f => 
          (f.requester._id === userId && f.recipient._id === currentUser.id) ||
          (f.recipient._id === userId && f.requester._id === currentUser.id)
        );
        if (isFriend) {
          setFriendRequestStatus('friends');
        } else {
          // Check if a request has already been sent
          const sentRequests = friends.filter(f => f.requester._id === currentUser.id && f.status === 'pending');
          const hasSentRequest = sentRequests.some(f => f.recipient._id === userId);
          if (hasSentRequest) {
            setFriendRequestStatus('sent');
          } else {
            setFriendRequestStatus('none');
          }
        }
      }

    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser, isOwnProfile]);

  // Fetch activities and friends
  const fetchActivitiesAndFriends = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [joined, created, friends] = await Promise.all([
        getMyJoinedActivities(),
        getMyCreatedActivities(),
        getFriends(),
      ]);

      setJoinedActivities(Array.isArray(joined) ? joined : []);
      setCreatedActivities(Array.isArray(created) ? created : []);
      setFriendsList(Array.isArray(friends) ? friends : friends.accepted || friends.data || []);

    } catch (err) {
      console.error('Error fetching activities/friends:', err);
      setError('Failed to load activities or friends.');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchProfileData();
      fetchActivitiesAndFriends();
    }
  }, [fetchProfileData, fetchActivitiesAndFriends, authLoading, currentUser]);

  // Cache profile data on form data change (only for own profile)
  useEffect(() => {
    if (isOwnProfile && formData.username) {
      try {
        localStorage.setItem('profile_data', JSON.stringify(formData));
        localStorage.setItem('profile_data_timestamp', Date.now().toString());
      } catch (err) {
        console.error('Error saving profile to cache:', err);
      }
    }
  }, [formData, isOwnProfile]);

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
    setLoading(true);
    setError('');
    setSuccess('');
    if (!formData.username.trim()) {
      setError('Username is required');
      setLoading(false);
      return;
    }

    try {
      console.log('Profile: Sending formData for update:', formData);
      const updatedUserData = await updateUserProfile(formData);
      console.log('Profile: Received updatedUserData:', updatedUserData);
      updateAuthUserProfile(updatedUserData);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
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
      updateAuthUserProfile({...currentUser, profilePicture: response.profilePicture || response.imageUrl});
      setSuccess('Profile picture uploaded successfully');
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
    } finally {
      setUploadingImage(false);
      setTimeout(() => setSuccess(''), 3000);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleGenerateRandomAvatar = async () => {
    try {
      setUploadingImage(true);
      setSuccess('');
      setError('');
      const response = await generateRandomAvatar();
      
      if (response && response.profilePicture) {
        setFormData(prev => ({
          ...prev,
          profilePicture: response.profilePicture
        }));
        updateAuthUserProfile({...currentUser, profilePicture: response.profilePicture});
        setSuccess('Profile picture updated successfully');
      }
    } catch (err) {
      console.error('Error generating random avatar:', err);
      setError('Failed to generate random avatar');
    } finally {
      setUploadingImage(false);
      setTimeout(() => setSuccess(''), 3000);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleUnfriend = async (friendId) => {
    try {
      // This part needs to be implemented on the backend to remove a friend
      // For now, we'll just filter it out from the local state
      setFriendsList(prev => prev.filter(friend => friend._id !== friendId));
      setSuccess('Friend removed successfully');
    } catch (err) {
      console.error('Error unfriending user:', err);
      setError('Failed to remove friend.');
    } finally {
      setTimeout(() => setSuccess(''), 3000);
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

  if (authLoading || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-20">
        <div className="text-primary text-lg">
          Loading user data...
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-20">
        <div className="text-primary text-lg">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-background text-foreground"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <h1 className="text-3xl font-bold gradient-text">
              {isOwnProfile ? 'My Profile' : `${formData.username}'s Profile`}
            </h1>
            {isOwnProfile ? (
              <div className="mt-4 md:mt-0 flex space-x-2">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} className="btn-primary">
                    <Edit className="mr-2 h-4 w-4" /> Edit Profile
                  </Button>
                ) : (
                  <Button onClick={() => {
                    setIsEditing(false);
                    setPreviewImage('');
                    fetchProfileData(); // Re-fetch to revert changes
                  }} className="btn-outline">
                    Cancel
                  </Button>
                )}
                {isEditing && (
                  <Button onClick={handleSubmit} className="btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Profile'}
                  </Button>
                )}
              </div>
            ) : (
              <div className="mt-4 md:mt-0 flex space-x-3">
                <Button asChild className="btn-primary">
                  <Link to={`/messages/${userId}`}>
                    <MessageSquare className="mr-2 h-4 w-4" /> Message
                  </Link>
                </Button>
                <Button
                  onClick={handleSendFriendRequest}
                  className={`btn-primary ${friendRequestStatus === 'sent' || friendRequestStatus === 'friends' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={friendRequestStatus === 'sending' || friendRequestStatus === 'sent' || friendRequestStatus === 'friends'}
                >
                  {friendRequestStatus === 'sending' ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Sending...
                    </>
                  ) : friendRequestStatus === 'sent' ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" /> Request Sent
                    </>
                  ) : friendRequestStatus === 'friends' ? (
                    <>
                      <Users className="mr-2 h-4 w-4" /> Friends
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" /> Add Friend
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 bg-destructive/10 border-l-4 border-destructive text-destructive-foreground p-4 rounded-md"
            >
              <div className="flex items-center">
                <XCircle className="h-5 w-5 mr-2" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </motion.div>
          )}
          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 bg-success/10 border-l-4 border-success text-success p-4 rounded-md"
            >
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <p className="text-sm font-medium">{success}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={itemVariants} className="card shadow-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium gradient-text">
              {isOwnProfile ? 'Edit Your Profile' : 'Profile Details'}
            </h2>
          </div>
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.form 
                key="editForm"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
              >
                <div className="px-4 py-5 sm:px-6">
                  <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                    <div className="space-y-2">
                      <label htmlFor="username" className="block text-sm font-medium text-foreground">
                        Username
                      </label>
                      <Input
                        type="text"
                        name="username"
                        id="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Enter your username"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-foreground">
                        Email
                      </label>
                      <Input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <label htmlFor="bio" className="block text-sm font-medium text-foreground">
                        Bio
                      </label>
                      <Textarea
                        name="bio"
                        id="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Tell us about yourself"
                        rows="3"
                      ></Textarea>
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <label htmlFor="location" className="block text-sm font-medium text-foreground">
                        Location
                      </label>
                      <Input
                        type="text"
                        name="location"
                        id="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g., New York, NY"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <label htmlFor="interests" className="block text-sm font-medium text-foreground">
                        Interests (comma-separated)
                      </label>
                      <Input
                        type="text"
                        name="interests"
                        id="interests"
                        value={formData.interests.join(', ')}
                        onChange={(e) => setFormData({ ...formData, interests: e.target.value.split(',').map(i => i.trim()) })}
                        onKeyPress={handleInterestKeyPress}
                        placeholder="e.g., coding, hiking, reading"
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.interests.map((interest, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                            {interest}
                            <button type="button" onClick={() => handleRemoveInterest(interest)} className="ml-2 -mr-0.5 h-4 w-4 text-primary hover:text-primary-dark">
                              <XCircle className="h-4 w-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <label className="block text-sm font-medium text-foreground">
                        Profile Picture
                      </label>
                      <div className="mt-1 flex items-center space-x-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={previewImage || formData.profilePicture || '/avatar.svg'} alt="Profile" />
                          <AvatarFallback>{formData.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-2">
                          <Input
                            id="profilePicture"
                            name="profilePicture"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                          />
                          <Button
                            type="button"
                            onClick={handleGenerateRandomAvatar}
                            className="btn-outline w-fit"
                            disabled={uploadingImage}
                          >
                            {uploadingImage ? (
                              <>
                                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <PlusCircle className="mr-2 h-4 w-4" /> Generate Random Avatar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.form>
            ) : (
              <motion.div 
                key="displayView"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="px-4 py-5 sm:px-6"
              >
                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Username</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{formData.username}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{formData.email}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{formData.location || 'Not specified'}</p>
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Bio</p>
                    <p className="mt-1 text-lg text-foreground">{formData.bio || 'No bio available'}</p>
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Interests</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {formData.interests.length > 0 ? (
                        formData.interests.map((interest, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground">
                            {interest}
                          </span>
                        ))
                      ) : (
                        <p className="text-lg text-muted-foreground">No interests added</p>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Profile Picture</p>
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={formData.profilePicture || '/avatar.svg'} alt="Profile" />
                      <AvatarFallback>{formData.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={itemVariants} className="card shadow-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium gradient-text">
              {isOwnProfile ? 'My Activities' : `${formData.username}'s Activities`}
            </h2>
          </div>
          <div className="border-t border-border">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="joined">Joined Activities</TabsTrigger>
                <TabsTrigger value="created">Created Activities</TabsTrigger>
              </TabsList>
              <TabsContent value="joined" className="p-4">
                {statsLoading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Loading activities...
                  </div>
                ) : joinedActivities.length > 0 ? (
                  <div className="divide-y divide-border">
                    {joinedActivities.map((activity) => (
                      <Link
                        to={`/activities/${activity._id}`}
                        key={activity._id}
                        className="block hover:bg-muted/50 transition p-4 rounded-md"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <p className="text-base font-semibold text-foreground truncate">{activity.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-2">{activity.description || 'No description'}</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                  {activity.category || 'Uncategorized'}
                                </span>
                                <span className="inline-flex items-center text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3 mr-1" /> {activity.date ? formatDate(activity.date) : 'No date'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="mb-2">You haven't joined any activities yet.</p>
                    <Link to="/activities" className="text-primary hover:underline">
                      Browse activities
                    </Link>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="created" className="p-4">
                {statsLoading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Loading activities...
                  </div>
                ) : createdActivities.length > 0 ? (
                  <div className="divide-y divide-border">
                    {createdActivities.map((activity) => (
                      <Link
                        to={`/activities/${activity._id}`}
                        key={activity._id}
                        className="block hover:bg-muted/50 transition p-4 rounded-md"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <p className="text-base font-semibold text-foreground truncate">{activity.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-2">{activity.description || 'No description'}</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                                  {activity.category || 'Uncategorized'}
                                </span>
                                <span className="inline-flex items-center text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3 mr-1" /> {activity.date ? formatDate(activity.date) : 'No date'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    <PlusCircle className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="mb-2">You haven't created any activities yet.</p>
                    <Link to="/activities/create" className="text-primary hover:underline">
                      Create your first activity
                    </Link>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card shadow-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium gradient-text">
              Friends
            </h2>
          </div>
          <div className="border-t border-border">
            <div className="px-4 py-5 sm:px-6">
              <div className="grid grid-cols-1 gap-y-4">
                {statsLoading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Loading friends...
                  </div>
                ) : friendsList.length > 0 ? (
                  <div className="space-y-3">
                    {friendsList.slice(0, 5).map((friend, index) => (
                      <Link to={`/profile/${friend._id || friend.id}`} key={friend._id || friend.id || index} className="flex items-center space-x-3 hover:bg-muted/50 p-2 rounded-md transition">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={friend.profilePicture || '/avatar.svg'} alt={friend.username} />
                          <AvatarFallback>{friend.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-base font-semibold text-foreground">{friend.username}</p>
                          {friend.similarityScore && (
                            <p className="text-sm text-muted-foreground">{friend.similarityScore}% match</p>
                          )}
                          {friend.sharedInterests?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {friend.sharedInterests.map((interest, idx) => (
                                <span key={idx} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{interest.value || interest}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        {isOwnProfile && friendRequestStatus !== 'friends' && (
                          <Button size="sm" variant="destructive" onClick={(e) => { e.preventDefault(); handleUnfriend(friend._id || friend.id); }} className="ml-auto">
                            <Trash2 className="mr-2 h-4 w-4" /> Unfriend
                          </Button>
                        )}
                      </Link>
                    ))}
                    {friendsList.length > 5 && (
                      <Link to="/friends" className="text-sm text-primary hover:underline block text-center pt-2">
                        View all {friendsList.length} friends
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="mb-2">No friends yet.</p>
                    <Link to="/friends" className="text-primary hover:underline">
                      Find friends
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Profile;