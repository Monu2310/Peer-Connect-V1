import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getActivityById, joinActivity, leaveActivity, deleteActivity } from '../api/activityService';
import { sendFriendRequestById } from '../api/friendService';
import { getFriends } from '../api/friendService';
import { useAuth } from '../contexts/AuthContext';
import ActivityGroupChat from '../components/ActivityGroupChat';

const ActivityDetail = () => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [friendRequestStatus, setFriendRequestStatus] = useState({});
  const [friendsList, setFriendsList] = useState([]);
  const [friendsParticipating, setFriendsParticipating] = useState([]);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const data = await getActivityById(activityId);
        setActivity(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching activity details:', err);
        setError('Failed to load activity details');
        setLoading(false);
      }
    };

    fetchActivity();
  }, [activityId]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const friends = await getFriends();
        setFriendsList(friends);

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

  const hasJoined = activity?.participants?.some(participant => participant._id === currentUser?.id);

  const isFull = activity?.maxParticipants && activity?.participants?.length >= activity?.maxParticipants;

  const handleJoinActivity = async () => {
    try {
      setActionLoading(true);
      const updatedActivity = await joinActivity(activityId);
      setActivity(updatedActivity);
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !activity) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
        <Link to="/activities" className="text-primary hover:text-primary-dark">
          Back to Activities
        </Link>
      </div>
    );
  }

  return (
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
              src={activity.creator.profilePicture || 'https://via.placeholder.com/150'}
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
                      src={friend.profilePicture || 'https://via.placeholder.com/150'}
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
                      src={participant.profilePicture || 'https://via.placeholder.com/150'}
                      alt={participant.username}
                      className="h-16 w-16 rounded-full mb-2 object-cover"
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
            <div className="mt-8">
              <ActivityGroupChat
                activityId={activityId}
                activityTitle={activity.title}
              />
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
  );
};

export default ActivityDetail;