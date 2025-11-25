import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../core/AuthContext';
import { 
  updateUserProfile, 
  getUserProfile, 
  uploadProfilePicture,
} from '../api/userService';
import { getFriends, sendFriendRequestById } from '../api/friendService';
import { getMyCreatedActivities, getMyJoinedActivities } from '../api/activityService';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Calendar, 
  Users, 
  PlusCircle, 
  UserPlus, 
  MessageSquare, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  FileText, 
  Heart, 
  User, 
  Loader2, 
  Clock,
  Mail,
  Activity,
  Award,
  Briefcase,
  Film,
  Tv,
  Book,
  Music,
  Gamepad2,
  Sparkles
} from 'lucide-react';
import AvatarSelector from '../components/AvatarSelector';
import NetflixStyleSelector from '../components/NetflixStyleSelector';
import BeautifulBackground from '../components/effects/BeautifulBackground';
import GlowOrb from '../components/effects/GlowOrb';

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
    favoriteMovies: [],
    favoriteShows: [],
    favoriteBooks: [],
    favoriteMusic: [],
    favoriteGames: []
  });

  const [joinedActivities, setJoinedActivities] = useState([]);
  const [createdActivities, setCreatedActivities] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false); 
  const [statsLoading, setStatsLoading] = useState(false); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('joined');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [friendRequestStatus, setFriendRequestStatus] = useState('none');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showPreferencesSelector, setShowPreferencesSelector] = useState(false);
  const [preferencesCategory, setPreferencesCategory] = useState('movies');

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  };

  const itemVariants = {
    hidden: { y: 24, opacity: 0 },
    show: { 
      y: 0, 
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

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
        favoriteMovies: currentUser.favoriteMovies || [],
        favoriteShows: currentUser.favoriteShows || [],
        favoriteBooks: currentUser.favoriteBooks || [],
        favoriteMusic: currentUser.favoriteMusic || [],
        favoriteGames: currentUser.favoriteGames || []
      });
    }
  }, [currentUser]);

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
        favoriteMovies: profileData.favoriteMovies || [],
        favoriteShows: profileData.favoriteShows || [],
        favoriteBooks: profileData.favoriteBooks || [],
        favoriteMusic: profileData.favoriteMusic || [],
        favoriteGames: profileData.favoriteGames || []
      }));

      if (!isOwnProfile && currentUser) {
        const friends = await getFriends();
        const isFriend = friends.some(f => 
          (f.requester._id === userId && f.recipient._id === currentUser.id) ||
          (f.recipient._id === userId && f.requester._id === currentUser.id)
        );
        if (isFriend) {
          setFriendRequestStatus('friends');
        } else {
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
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser, isOwnProfile]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      const dataToSend = {
        ...formData,
        interests: Array.isArray(formData.interests) ? formData.interests : [],
        hobbies: Array.isArray(formData.hobbies) ? formData.hobbies : [],
        favoriteSubjects: Array.isArray(formData.favoriteSubjects) ? formData.favoriteSubjects : [],
        sports: Array.isArray(formData.sports) ? formData.sports : [],
        favoriteMovies: Array.isArray(formData.favoriteMovies) ? formData.favoriteMovies : [],
        favoriteShows: Array.isArray(formData.favoriteShows) ? formData.favoriteShows : [],
        favoriteBooks: Array.isArray(formData.favoriteBooks) ? formData.favoriteBooks : [],
        favoriteMusic: Array.isArray(formData.favoriteMusic) ? formData.favoriteMusic : [],
        favoriteGames: Array.isArray(formData.favoriteGames) ? formData.favoriteGames : []
      };

      const updatedUserData = await updateUserProfile(dataToSend);
      updateAuthUserProfile(updatedUserData);
      
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      fetchProfileData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleAvatarSelect = async (avatarUrl) => {
    try {
      setUploadingImage(true);
      setSuccess('');
      setError('');
      
      const updatedFormData = {
        ...formData,
        profilePicture: avatarUrl
      };
      
      const updatedUserData = await updateUserProfile(updatedFormData);
      
      setFormData(updatedFormData);
      updateAuthUserProfile(updatedUserData);
      setSuccess('Avatar updated successfully!');
      setShowAvatarSelector(false);
    } catch (err) {
      setError('Failed to update avatar');
    } finally {
      setUploadingImage(false);
      setTimeout(() => setSuccess(''), 3000);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handlePreferencesSave = async (category, selected) => {
    try {
      setLoading(true);
      
      const categoryKey = category === 'movies' ? 'favoriteMovies' :
                          category === 'shows' ? 'favoriteShows' :
                          category === 'books' ? 'favoriteBooks' :
                          category === 'music' ? 'favoriteMusic' :
                          'favoriteGames';
      
      const updatedFormData = {
        ...formData,
        [categoryKey]: selected
      };
      
      const updatedUserData = await updateUserProfile(updatedFormData);
      
      setFormData(updatedFormData);
      updateAuthUserProfile(updatedUserData);
      setSuccess(`${category.charAt(0).toUpperCase() + category.slice(1)} preferences saved!`);
    } catch (err) {
      setError('Failed to save preferences');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
      setTimeout(() => setError(''), 5000);
    }
  };

  const openPreferencesSelector = (category) => {
    setPreferencesCategory(category);
    setShowPreferencesSelector(true);
  };

  const handleAvatarUpload = async (file) => {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image must be less than 5MB');
    }

    const formDataObj = new FormData();
    formDataObj.append('profilePicture', file);
    const response = await uploadProfilePicture(formDataObj);
    
    const newProfilePicture = response.profilePicture || response.imageUrl;
    setFormData(prev => ({
      ...prev,
      profilePicture: newProfilePicture
    }));
    updateAuthUserProfile({...currentUser, profilePicture: newProfilePicture});
    setSuccess('Profile picture uploaded successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSendFriendRequest = async () => {
    if (!userId) return;
    
    try {
      setFriendRequestStatus('sending');
      await sendFriendRequestById(userId);
      setFriendRequestStatus('sent');
      setSuccess('Friend request sent successfully');
    } catch (err) {
      setError('Failed to send friend request.');
      setFriendRequestStatus('none');
    } finally {
      setTimeout(() => setSuccess(''), 3000);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail !== currentUser?.email) {
      setError('Email does not match. Account deletion cancelled.');
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://peer-connect-v1.onrender.com'}/api/users/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ confirmEmail: deleteConfirmEmail })
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    } catch (err) {
      setError('Failed to delete account. Please try again.');
      setDeleting(false);
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
      <BeautifulBackground>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Loading user data...</p>
          </div>
        </div>
      </BeautifulBackground>
    );
  }

  if (loading) {
    return (
      <BeautifulBackground>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </BeautifulBackground>
    );
  }

  return (
    <BeautifulBackground>
      <motion.div 
        className="relative z-10 w-full"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          
          {/* Header */}
          <motion.div variants={itemVariants} className="pt-6 md:pt-8 pb-6 md:pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text">
                  {isOwnProfile ? 'My Profile' : `${formData.username}'s Profile`}
                </h1>
                <p className="text-base md:text-lg text-muted-foreground">
                  {isOwnProfile ? 'Manage your profile and activities' : 'View profile and connect'}
                </p>
              </div>
              
              {isOwnProfile ? (
                <div className="flex gap-2">
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} className="btn-primary">
                      <Edit className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button onClick={() => {
                        setIsEditing(false);
                        fetchProfileData();
                      }} variant="outline">
                        Cancel
                      </Button>
                      <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                        Save
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link to={`/messages/${userId}`}>
                      <MessageSquare className="mr-2 h-4 w-4" /> Message
                    </Link>
                  </Button>
                  <Button
                    onClick={handleSendFriendRequest}
                    disabled={friendRequestStatus === 'sending' || friendRequestStatus === 'sent' || friendRequestStatus === 'friends'}
                  >
                    {friendRequestStatus === 'sending' ? (
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    ) : friendRequestStatus === 'sent' ? (
                      <><CheckCircle className="mr-2 h-4 w-4" /> Sent</>
                    ) : friendRequestStatus === 'friends' ? (
                      <><Users className="mr-2 h-4 w-4" /> Friends</>
                    ) : (
                      <><UserPlus className="mr-2 h-4 w-4" /> Add Friend</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 bg-destructive/10 border border-destructive/30 text-destructive-foreground p-4 rounded-xl"
              >
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 mr-2" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </motion.div>
            )}
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 bg-green-500/10 border border-green-500/30 text-green-600 p-4 rounded-xl"
              >
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <p className="text-sm font-medium">{success}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Info Card */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="relative">
                  <Avatar className="h-24 w-24 md:h-32 md:w-32 ring-4 ring-primary/20">
                    <AvatarImage src={formData.profilePicture || '/avatar.svg'} alt={formData.username} />
                    <AvatarFallback className="text-4xl bg-primary/20">{formData.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {isOwnProfile && isEditing && (
                    <Button
                      size="sm"
                      onClick={() => setShowAvatarSelector(true)}
                      className="absolute -bottom-2 -right-2"
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
                
                <div className="flex-1 space-y-3">
                  {isEditing ? (
                    <>
                      <Input
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Username"
                        className="text-2xl font-bold"
                      />
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
                      />
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl md:text-3xl font-bold">{formData.username}</h2>
                      <p className="text-muted-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {formData.email}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Activities</p>
                  <p className="text-2xl font-bold">{joinedActivities.length + createdActivities.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Friends</p>
                  <p className="text-2xl font-bold">{friendsList.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-lg font-semibold truncate">{formData.location || 'Not set'}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bio and Details */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Bio</h3>
              </div>
              {isEditing ? (
                <Textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself..."
                  rows="4"
                />
              ) : (
                <p className="text-muted-foreground">{formData.bio || 'No bio yet.'}</p>
              )}
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Interests</h3>
              </div>
              {isEditing ? (
                <div>
                  <Input
                    placeholder="Add interest (press Enter)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        e.preventDefault();
                        setFormData(prev => ({
                          ...prev,
                          interests: [...prev.interests, e.target.value.trim()]
                        }));
                        e.target.value = '';
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.interests.map((interest, idx) => (
                      <span key={idx} className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                        {interest}
                        <button onClick={() => handleRemoveInterest(interest)} className="ml-2">
                          <XCircle className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.interests.length > 0 ? (
                    formData.interests.map((interest, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-lg text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                        {interest}
                      </span>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No interests added.</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Entertainment Preferences - Netflix Style */}
          {isOwnProfile && isEditing && (
            <motion.div variants={itemVariants} className="mb-8">
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold">Entertainment Preferences</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  <button
                    onClick={() => openPreferencesSelector('movies')}
                    className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-border/50 hover:border-primary/50 bg-card hover:bg-muted/30 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <Film className="h-6 w-6 text-primary" />
                    </div>
                    <span className="font-semibold text-sm">Movies</span>
                    <span className="text-xs text-muted-foreground">{formData.favoriteMovies?.length || 0} selected</span>
                  </button>

                  <button
                    onClick={() => openPreferencesSelector('shows')}
                    className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-border/50 hover:border-primary/50 bg-card hover:bg-muted/30 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <Tv className="h-6 w-6 text-primary" />
                    </div>
                    <span className="font-semibold text-sm">TV Shows</span>
                    <span className="text-xs text-muted-foreground">{formData.favoriteShows?.length || 0} selected</span>
                  </button>

                  <button
                    onClick={() => openPreferencesSelector('books')}
                    className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-border/50 hover:border-primary/50 bg-card hover:bg-muted/30 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <Book className="h-6 w-6 text-primary" />
                    </div>
                    <span className="font-semibold text-sm">Books</span>
                    <span className="text-xs text-muted-foreground">{formData.favoriteBooks?.length || 0} selected</span>
                  </button>

                  <button
                    onClick={() => openPreferencesSelector('music')}
                    className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-border/50 hover:border-primary/50 bg-card hover:bg-muted/30 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <Music className="h-6 w-6 text-primary" />
                    </div>
                    <span className="font-semibold text-sm">Music</span>
                    <span className="text-xs text-muted-foreground">{formData.favoriteMusic?.length || 0} selected</span>
                  </button>

                  <button
                    onClick={() => openPreferencesSelector('games')}
                    className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-border/50 hover:border-primary/50 bg-card hover:bg-muted/30 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <Gamepad2 className="h-6 w-6 text-primary" />
                    </div>
                    <span className="font-semibold text-sm">Games</span>
                    <span className="text-xs text-muted-foreground">{formData.favoriteGames?.length || 0} selected</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Activities Section */}
          <motion.div variants={itemVariants} className="mb-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 border border-border/30 p-1 rounded-xl mb-6">
                <TabsTrigger value="joined" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm font-medium">
                  <Users className="h-4 w-4 mr-2" />
                  Joined Activities
                </TabsTrigger>
                <TabsTrigger value="created" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm font-medium">
                  <Award className="h-4 w-4 mr-2" />
                  Created Activities
                </TabsTrigger>
              </TabsList>

              <TabsContent value="joined" className="mt-0">
                {statsLoading ? (
                  <div className="flex justify-center items-center min-h-[200px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : joinedActivities.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {joinedActivities.map((activity) => (
                      <Link
                        key={activity._id}
                        to={`/activities/${activity._id}`}
                        className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5 hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">{activity.title}</h4>
                          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary">
                            {activity.category}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{activity.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(activity.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {activity.location}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-12 text-center">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-semibold mb-2">No activities joined yet</p>
                    <p className="text-muted-foreground mb-4">Start exploring activities in your area</p>
                    <Button asChild>
                      <Link to="/activities">Browse Activities</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="created" className="mt-0">
                {statsLoading ? (
                  <div className="flex justify-center items-center min-h-[200px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : createdActivities.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {createdActivities.map((activity) => (
                      <Link
                        key={activity._id}
                        to={`/activities/${activity._id}`}
                        className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5 hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">{activity.title}</h4>
                          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary">
                            {activity.category}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{activity.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(activity.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {activity.participants?.length || 0} joined
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-12 text-center">
                    <PlusCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-semibold mb-2">No activities created yet</p>
                    <p className="text-muted-foreground mb-4">Share your interests with the community</p>
                    <Button asChild>
                      <Link to="/activities/create">Create Activity</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Friends Section */}
          {isOwnProfile && (
            <motion.div variants={itemVariants} className="mb-8">
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-semibold">Friends</h3>
                    <span className="px-2 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary">
                      {friendsList.length}
                    </span>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/friends">View All</Link>
                  </Button>
                </div>
                
                {friendsList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {friendsList.slice(0, 6).map((friend) => (
                      <Link
                        key={friend._id}
                        to={`/profile/${friend._id}`}
                        className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-md"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={friend.profilePicture || '/avatar.svg'} />
                          <AvatarFallback>{friend.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{friend.username}</p>
                          <p className="text-xs text-muted-foreground truncate">{friend.major || 'No major'}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No friends yet</p>
                    <Button asChild variant="link" size="sm" className="mt-2">
                      <Link to="/friends">Find Friends</Link>
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Danger Zone */}
          {isOwnProfile && (
            <motion.div variants={itemVariants} className="mb-8">
              <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Trash2 className="h-5 w-5 text-destructive" />
                  <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data.
                </p>
                {!showDeleteConfirm ? (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                      <p className="font-bold text-destructive mb-2">⚠️ This action cannot be undone!</p>
                      <p className="text-sm mb-2">Type your email to confirm: <span className="font-mono">{currentUser?.email}</span></p>
                    </div>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={deleteConfirmEmail}
                      onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                      disabled={deleting}
                    />
                    <div className="flex gap-3">
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={deleting || deleteConfirmEmail !== currentUser?.email}
                        className="flex-1"
                      >
                        {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Delete Forever
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmEmail('');
                        }}
                        disabled={deleting}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </div>
      </motion.div>

      {/* Glow Orbs for visual effects */}
      <GlowOrb size="xl" color="primary" position="top-right" opacity={6} />
      <GlowOrb size="large" color="accent" position="bottom-left" opacity={5} />

      {/* Avatar Selector Modal */}
      <AvatarSelector
        isOpen={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
        onSelect={handleAvatarSelect}
        onUpload={handleAvatarUpload}
        username={formData.username}
      />

      {/* Netflix-Style Preferences Selector */}
      <NetflixStyleSelector
        isOpen={showPreferencesSelector}
        onClose={() => setShowPreferencesSelector(false)}
        onSave={handlePreferencesSave}
        category={preferencesCategory}
        initialSelected={
          preferencesCategory === 'movies' ? formData.favoriteMovies :
          preferencesCategory === 'shows' ? formData.favoriteShows :
          preferencesCategory === 'books' ? formData.favoriteBooks :
          preferencesCategory === 'music' ? formData.favoriteMusic :
          formData.favoriteGames
        }
      />
    </BeautifulBackground>
  );
};

export default Profile;
