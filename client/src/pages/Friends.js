import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFriends, getFriendRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest } from '../api/friendService';
import { useAuth } from '../contexts/AuthContext';

const Friends = () => {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [activeTab, setActiveTab] = useState('friends');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchFriendsData();
  }, []);

  const fetchFriendsData = async () => {
    setLoading(true);
    try {
      const [friendsData, requestsData] = await Promise.all([
        getFriends(),
        getFriendRequests()
      ]);
      setFriends(friendsData);
      setFriendRequests(requestsData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching friends data:', err);
      setError('Failed to load friends data');
      setLoading(false);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!newFriendEmail.trim()) return;
    
    try {
      setSuccess('');
      setError('');
      await sendFriendRequest(newFriendEmail);
      setNewFriendEmail('');
      setSuccess('Friend request sent successfully!');
    } catch (err) {
      setError(err.message || 'Failed to send friend request');
      console.error('Error sending friend request:', err);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      // Update the UI
      setFriendRequests(prevRequests => 
        prevRequests.filter(request => request._id !== requestId)
      );
      // Refresh friends list
      const friendsData = await getFriends();
      setFriends(friendsData);
    } catch (err) {
      setError('Failed to accept friend request');
      console.error('Error accepting friend request:', err);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await rejectFriendRequest(requestId);
      // Update the UI
      setFriendRequests(prevRequests => 
        prevRequests.filter(request => request._id !== requestId)
      );
    } catch (err) {
      setError('Failed to reject friend request');
      console.error('Error rejecting friend request:', err);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading friends...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">Friends</h1>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 ${
            activeTab === 'friends' 
              ? 'border-b-2 border-blue-500 text-blue-500 font-medium' 
              : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('friends')}
        >
          My Friends ({friends.length})
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === 'requests' 
              ? 'border-b-2 border-blue-500 text-blue-500 font-medium' 
              : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('requests')}
        >
          Friend Requests ({friendRequests.length})
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === 'add' 
              ? 'border-b-2 border-blue-500 text-blue-500 font-medium' 
              : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('add')}
        >
          Add New Friend
        </button>
      </div>

      {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      {success && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{success}</div>}

      {/* Friends List Tab */}
      {activeTab === 'friends' && (
        <div>
          {friends.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">You don't have any friends yet.</p>
              <p className="mt-2">Send friend requests to connect with peers!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map(friend => (
                <div key={friend._id} className="bg-white rounded-lg shadow p-4 flex items-start">
                  <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden">
                    {friend.profilePicture ? (
                      <img 
                        src={friend.profilePicture} 
                        alt={friend.username} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white">
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex-grow">
                    <h3 className="font-medium">{friend.username}</h3>
                    {friend.major && (
                      <p className="text-sm text-gray-500">{friend.major}</p>
                    )}
                    
                    <div className="mt-2 flex space-x-2">
                      <Link 
                        to={`/messages/${friend._id}`}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Message
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Friend Requests Tab */}
      {activeTab === 'requests' && (
        <div>
          {friendRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">You don't have any friend requests.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {friendRequests.map(request => (
                <div key={request._id} className="bg-white rounded-lg shadow p-4 flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden">
                    {request.sender.profilePicture ? (
                      <img 
                        src={request.sender.profilePicture} 
                        alt={request.sender.username} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white">
                        {request.sender.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex-grow">
                    <h3 className="font-medium">{request.sender.username}</h3>
                    {request.sender.major && (
                      <p className="text-sm text-gray-500">{request.sender.major}</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAcceptRequest(request._id)}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request._id)}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Friend Tab */}
      {activeTab === 'add' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">Add a New Friend</h2>
          <form onSubmit={handleSendRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Enter email address:
              </label>
              <input
                type="email"
                value={newFriendEmail}
                onChange={(e) => setNewFriendEmail(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="friend@example.com"
                required
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Send Friend Request
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Friends;