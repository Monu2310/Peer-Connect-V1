import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getActivityById, joinActivity, leaveActivity, deleteActivity } from '../api/activityService';
import { getSimilarActivities } from '../api/recommendationService';
import { sendFriendRequestById } from '../api/friendService';
import { getFriends } from '../api/friendService';
import { useAuth } from '../contexts/AuthContext';
import ActivityGroupChat from '../components/ActivityGroupChat';

const ActivityDetail = () => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, loadUser } = useAuth();
  const [activity, setActivity] = useState(null);
  const [similarActivities, setSimilarActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [similarLoading, setSimilarLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [friendRequestStatus, setFriendRequestStatus] = useState({});
  const [friendsList, setFriendsList] = useState([]);
  const [friendsParticipating, setFriendsParticipating] = useState([]);
  const [activityCacheTimestamp, setActivityCacheTimestamp] = useState(null);

  // Ensure user is authenticated before making requests
  useEffect(() => {
    if (!isAuthenticated) {
      loadUser(); // Try to load user if not authenticated
    }
  }, [isAuthenticated, loadUser]);

  // Try to load activity from cache first
  useEffect(() => {
    if (!activityId) return;
    
    try {
      const cachedActivity = localStorage.getItem(`activity_${activityId}`);
      const timestamp = localStorage.getItem(`activity_${activityId}_timestamp`);
      
      if (cachedActivity && timestamp) {
        const cacheAge = Date.now() - parseInt(timestamp);
        // Use cache if it's less than 15 minutes old
        if (cacheAge < 15 * 60 * 1000) {
          setActivity(JSON.parse(cachedActivity));
          setActivityCacheTimestamp(timestamp);
          setLoading(false);
          console.log('Loaded activity data from cache');
        }
      }
    } catch (err) {
      console.error('Error loading cached activity data:', err);
    }
  }, [activityId]);

  // Fetch activity data with improved refresh handling
  useEffect(() => {
    const fetchActivity = async () => {
      if (!activityId) return;
      
      // Skip API call if we have valid cache
      if (activityCacheTimestamp) {
        const cacheAge = Date.now() - parseInt(activityCacheTimestamp);
        if (cacheAge < 15 * 60 * 1000) { // Cache valid for 15 minutes
          return;
        }
      }
      
      try {
        setLoading(true);
        setError('');
        const data = await getActivityById(activityId);
        setActivity(data);
        
        // Cache the activity data
        localStorage.setItem(`activity_${activityId}`, JSON.stringify(data));
        const timestamp = Date.now().toString();
        localStorage.setItem(`activity_${activityId}_timestamp`, timestamp);
        setActivityCacheTimestamp(timestamp);
        
        // Persist that we've joined this activity in sessionStorage
        if (currentUser && data.participants) {
          const userHasJoined = data.participants.some(participant => {
            const participantId = participant._id || participant.id;
            return participantId === currentUser.id || participantId === currentUser._id;
          });
          
          if (userHasJoined) {
            sessionStorage.setItem(`joined_activity_${activityId}`, 'true');
          }
        }
      } catch (err) {
        console.error('Error fetching activity details:', err);
        setError('Failed to load activity details. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [activityId, currentUser, activityCacheTimestamp]);

  // Fetch similar activities with caching
  useEffect(() => {
    const fetchSimilarActivities = async () => {
      if (!activityId) return;
      
      // Try to load similar activities from cache first
      try {
        const cachedSimilarActivities = localStorage.getItem(`similar_activities_${activityId}`);
        const timestamp = localStorage.getItem(`similar_activities_${activityId}_timestamp`);
        
        if (cachedSimilarActivities && timestamp) {
          const cacheAge = Date.now() - parseInt(timestamp);
          // Use cache if it's less than 1 hour old
          if (cacheAge < 60 * 60 * 1000) {
            setSimilarActivities(JSON.parse(cachedSimilarActivities));
            setSimilarLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Error loading cached similar activities:', err);
      }
      
      // Fetch from API if cache is invalid or not available
      try {
        setSimilarLoading(true);
        const similar = await getSimilarActivities(activityId);
        setSimilarActivities(similar);
        
        // Cache the similar activities
        localStorage.setItem(`similar_activities_${activityId}`, JSON.stringify(similar));
        localStorage.setItem(`similar_activities_${activityId}_timestamp`, Date.now().toString());
      } catch (err) {
        console.error('Error fetching similar activities:', err);
      } finally {
        setSimilarLoading(false);
      }
    };

    fetchSimilarActivities();
  }, [activityId]);

  // Cache friends data and identify friends participating in the activity
  useEffect(() => {
    const fetchFriends = async () => {
      // Try to load friends from cache first
      try {
        const cachedFriends = localStorage.getItem('user_friends');
        const timestamp = localStorage.getItem('user_friends_timestamp');
        
        if (cachedFriends && timestamp) {
          const cacheAge = Date.now() - parseInt(timestamp);
          // Use cache if it's less than 30 minutes old
          if (cacheAge < 30 * 60 * 1000) {
            const friends = JSON.parse(cachedFriends);
            setFriendsList(friends);
            
            if (activity && activity.participants && friends.length > 0) {
              const participating = activity.participants.filter(participant =>
                friends.some(friend => friend._id === participant._id)
              );
              setFriendsParticipating(participating);
            }
            return;
          }
        }
      } catch (err) {
        console.error('Error loading cached friends:', err);
      }
      
      // Fetch from API if cache is invalid or not available
      try {
        const friends = await getFriends();
        setFriendsList(friends);
        
        // Cache the friends data
        localStorage.setItem('user_friends', JSON.stringify(friends));
        localStorage.setItem('user_friends_timestamp', Date.now().toString());

        if (activity && activity.participants && friends.length > 0) {
          const participating = activity.participants.filter(participant =>
            friends.some(friend => friend._id === participant._id)
          );
          setFriendsParticipating(participating);
        }
      } catch (err) {
        console.error('Error fetching friends:', err);
      }
    };

    if (currentUser && activity) {
      fetchFriends();
    }
  }, [activity, currentUser]);

  const formatDate = (dateString) => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const isCreator = activity?.creator?._id === currentUser?.id;

  // Enhanced check for hasJoined that handles different ID formats
  const hasJoined = useMemo(() => {
    // First, check sessionStorage for faster access and better persistence
    const sessionStorageKey = `joined_activity_${activityId}`;
    const hasJoinedFromSession = sessionStorage.getItem(sessionStorageKey) === 'true';
    
    if (hasJoinedFromSession) {
      return true;
    }
    
    // If not in session storage, check the actual participants list
    if (!activity?.participants || !currentUser?.id) return false;
    
    // Log for debugging
    console.log("Current User ID:", currentUser.id);
    console.log("Participant IDs:", activity.participants.map(p => p._id || p.id || p));
    
    const isParticipant = activity.participants.some(participant => {
      // Handle both object references and string IDs
      const participantId = participant._id || participant.id || participant;
      const currentUserId = currentUser.id || currentUser._id;
      
      // Compare as strings to ensure consistent comparison
      const isMatch = 
        participantId.toString() === currentUserId.toString() || 
        (typeof participant === 'object' && participant.email === currentUser.email);
      
      if (isMatch) {
        // Store in sessionStorage for future page refreshes
        sessionStorage.setItem(sessionStorageKey, 'true');
      }
      
      return isMatch;
    });
    
    return isParticipant;
  }, [activity, currentUser, activityId]);

  const isFull = activity?.maxParticipants && activity?.participants?.length >= activity?.maxParticipants;

  const handleJoinActivity = async () => {
    try {
      setActionLoading(true);
      const updatedActivity = await joinActivity(activityId);
      setActivity(updatedActivity);
      
      // Update the cache with the updated activity
      localStorage.setItem(`activity_${activityId}`, JSON.stringify(updatedActivity));
      localStorage.setItem(`activity_${activityId}_timestamp`, Date.now().toString());
      
      // Set session storage as soon as joining is successful
      sessionStorage.setItem(`joined_activity_${activityId}`, 'true');
      
      setActionLoading(false);
    } catch (err) {
      console.error('Error joining activity:', err);
      setError(err.response?.data?.message || 'Failed to join activity');
      setActionLoading(false);
    }
  };

  const handleLeaveActivity = async () => {
    try {
      setActionLoading(true);
      const updatedActivity = await leaveActivity(activityId);
      setActivity(updatedActivity);
      
      // Update the cache with the updated activity
      localStorage.setItem(`activity_${activityId}`, JSON.stringify(updatedActivity));
      localStorage.setItem(`activity_${activityId}_timestamp`, Date.now().toString());
      
      // Remove from session storage when leaving
      sessionStorage.removeItem(`joined_activity_${activityId}`);
      
      setActionLoading(false);
    } catch (err) {
      console.error('Error leaving activity:', err);
      setError(err.response?.data?.message || 'Failed to leave activity');
      setActionLoading(false);
    }
  };

  const handleDeleteActivity = async () => {
    try {
      setActionLoading(true);
      await deleteActivity(activityId);
      
      // Clear all cached data for this activity
      localStorage.removeItem(`activity_${activityId}`);
      localStorage.removeItem(`activity_${activityId}_timestamp`);
      localStorage.removeItem(`similar_activities_${activityId}`);
      localStorage.removeItem(`similar_activities_${activityId}_timestamp`);
      sessionStorage.removeItem(`joined_activity_${activityId}`);
      
      navigate('/activities');
    } catch (err) {
      console.error('Error deleting activity:', err);
      setError(err.response?.data?.message || 'Failed to delete activity');
      setActionLoading(false);
      setShowConfirmDelete(false);
    }
  };

  const handleFriendRequest = async (userId) => {
    try {
      setFriendRequestStatus(prev => ({
        ...prev,
        [userId]: 'loading'
      }));

      // Use the new sendFriendRequestById method directly with userId
      await sendFriendRequestById(userId);

      setFriendRequestStatus(prev => ({
        ...prev,
        [userId]: 'sent'
      }));

      setTimeout(() => {
        setFriendRequestStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[userId];
          return newStatus;
        });
      }, 3000);
    } catch (err) {
      console.error('Error sending friend request:', err);
      setFriendRequestStatus(prev => ({
        ...prev,
        [userId]: 'error'
      }));

      setTimeout(() => {
        setFriendRequestStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[userId];
          return newStatus;
        });
      }, 3000);
    }
  };

  const startConversation = (userId) => {
    navigate(`/messages/${userId}`);
  };

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-light-bg dark:bg-dark-bg flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !activity) {
    return (
      <div className="pt-16 min-h-screen bg-light-bg dark:bg-dark-bg">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 bg-red-500 text-white px-4 py-1.5 rounded text-sm hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
          <Link to="/activities" className="text-primary hover:text-primary-dark inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Activities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}

        <div className="mb-6">
          <Link to="/activities" className="text-primary hover:text-primary-dark flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Activities
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-64 bg-gray-200 relative">
            {activity.image ? (
              <img
                src={activity.image}
                alt={activity.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <span className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full">
              {activity.category}
            </span>
          </div>

          {/* Similar Activities Section */}
          {!similarLoading && similarActivities.length > 0 && (
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 px-6">Similar Activities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-6">
                {similarActivities.map(activity => (
                  <div 
                    key={activity._id}
                    className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 truncate">{activity.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          activity.category === 'Academic' ? 'bg-blue-100 text-blue-800' : 
                          activity.category === 'Sports' ? 'bg-green-100 text-green-800' : 
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {activity.category}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{activity.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs text-gray-500">
                            {new Date(activity.date).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex -space-x-1">
                          {[...Array(Math.min(activity.participants?.length || 0, 3))].map((_, i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">
                              {i + 1}
                            </div>
                          ))}
                          {activity.participants?.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs">
                              +{activity.participants.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <Link 
                          to={`/activities/${activity._id}`}
                          className="w-full flex justify-center items-center py-2 px-3 border border-transparent text-xs font-medium rounded-md text-white bg-primary hover:bg-primary-dark transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-6">
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{activity.title}</h1>

              {isCreator && (
                <div className="flex space-x-2">
                  <Link
                    to={`/activities/edit/${activityId}`}
                    className="text-gray-600 hover:text-primary p-2 rounded-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => setShowConfirmDelete(true)}
                    className="text-gray-600 hover:text-red-600 p-2 rounded-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center mt-2 mb-4">
              <img
                src={activity.creator.profilePicture || '../../../avatar.svg'}
                alt={activity.creator.username}
                className="h-10 w-10 rounded-full mr-3"
              />
              <div>
                <span className="block text-gray-800 font-medium">
                  {activity.creator.username}
                </span>
                <span className="text-sm text-gray-600">Organizer</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-center">
                <div className="rounded-full bg-blue-100 p-3 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium">{formatDate(activity.date)}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="rounded-full bg-green-100 p-3 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{activity.location}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="rounded-full bg-purple-100 p-3 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Participants</p>
                  <p className="font-medium">
                    {activity.participants.length}
                    {activity.maxParticipants && (
                      <span> / {activity.maxParticipants}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-3">About this activity</h2>
              <p className="text-gray-700 whitespace-pre-line">
                {activity.description}
              </p>
            </div>

            {friendsParticipating.length > 0 && (
              <div className="border-t border-gray-200 pt-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Friends Participating ({friendsParticipating.length})</h2>
                <div className="flex flex-wrap gap-4 mb-4">
                  {friendsParticipating.map(friend => (
                    <div key={friend._id} className="flex items-center bg-blue-50 px-3 py-2 rounded-lg">
                      <img
                        src={friend.profilePicture || '../../../avatar.svg'}
                        alt={friend.username}
                        className="h-8 w-8 rounded-full mr-2 object-cover"
                      />
                      <span className="font-medium text-sm">{friend.username}</span>
                      <button
                        onClick={() => startConversation(friend._id)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                        title="Message"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                          <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Participants ({activity.participants.length})</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {activity.participants.map(participant => (
                  <div key={participant._id} className="flex flex-col items-center bg-gray-50 p-3 rounded-lg shadow-sm">
                    <div className="relative">
                      <img
                        src={participant.profilePicture || './avatar.svg'}
                        alt={participant.username}
                        className="h-16 w-16 rounded-full mb-2 object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = './avatar.svg';
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-800 mb-1">{participant.username}</span>

                    {currentUser && currentUser.id !== participant._id && (
                      <div className="flex flex-col space-y-1 mt-1 w-full">
                        <button
                          onClick={() => handleFriendRequest(participant._id)}
                          disabled={friendRequestStatus[participant._id] === 'loading' || friendRequestStatus[participant._id] === 'sent'}
                          className={`text-xs px-2 py-1 rounded-md flex items-center justify-center ${
                            friendRequestStatus[participant._id] === 'sent'
                              ? 'bg-green-100 text-green-800'
                              : friendRequestStatus[participant._id] === 'error'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                        >
                          {friendRequestStatus[participant._id] === 'loading' && 'Sending...'}
                          {friendRequestStatus[participant._id] === 'sent' && 'Request Sent!'}
                          {friendRequestStatus[participant._id] === 'error' && 'Failed to send'}
                          {!friendRequestStatus[participant._id] && (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                              </svg>
                              Add Friend
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => startConversation(participant._id)}
                          className="text-xs px-2 py-1 rounded-md bg-purple-100 text-purple-800 hover:bg-purple-200 flex items-center justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                          Message
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {hasJoined && (
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Activity Group Chat</h2>
                <ActivityGroupChat
                  activityId={activityId}
                  activityTitle={activity.title}
                  hasJoined={hasJoined}
                  currentUser={currentUser}
                />
              </div>
            )}

            {!hasJoined && currentUser && (
              <div className="mt-8 border-t border-gray-200 pt-6">
                <div className="bg-yellow-50 p-4 rounded-md mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Join to access group chat</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>You need to join this activity to access the group chat with other participants.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8">
              {isCreator ? (
                <div className="bg-gray-100 text-gray-700 py-3 px-4 rounded-md text-center">
                  You are the organizer of this activity
                </div>
              ) : hasJoined ? (
                <button
                  onClick={handleLeaveActivity}
                  disabled={actionLoading}
                  className={`w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-md ${actionLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {actionLoading ? 'Processing...' : 'Leave Activity'}
                </button>
              ) : (
                <button
                  onClick={handleJoinActivity}
                  disabled={actionLoading || isFull}
                  className={`w-full bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-md ${(actionLoading || isFull) ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {actionLoading ? 'Processing...' : isFull ? 'Activity Full' : 'Join Activity'}
                </button>
              )}
            </div>
          </div>
        </div>

        {showConfirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Activity</h3>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this activity? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteActivity}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  {actionLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityDetail;