import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFriends, getFriendRequests, sendFriendRequestById, acceptFriendRequest, rejectFriendRequest } from '../api/friendService';
import { searchUsers, findUserByEmail } from '../api/userService';
import { useAuth } from '../contexts/AuthContext';
import PageTransition from '../components/effects/PageTransition';
import { motion, AnimatePresence } from 'framer-motion';

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
    setError('');
    try {
      console.log('Fetching friends data...');
      
      // Fetch friends list first
      const friendsData = await getFriends();
      console.log('Friends data received:', friendsData);
      setFriends(friendsData || []);
      
      // Then fetch friend requests
      const requestsData = await getFriendRequests();
      console.log('Friend requests received:', requestsData);
      setFriendRequests(requestsData || []);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching friends data:', err);
      setFriends([]);
      setFriendRequests([]);
      setError(err.message || 'Failed to load friends data. Please check your connection and try again.');
      setLoading(false);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!newFriendEmail.trim()) return;
    
    try {
      setSuccess('');
      setError('');
      console.log('Looking up user by email:', newFriendEmail);
      
      // Use our specialized function to find user by exact email match
      const targetUser = await findUserByEmail(newFriendEmail);
      console.log('User found:', targetUser);
      
      // Don't allow sending request to self
      if (targetUser._id === currentUser.id) {
        setError('You cannot send a friend request to yourself');
        return;
      }
      
      // Send the friend request using the user's ID
      const result = await sendFriendRequestById(targetUser._id);
      console.log('Friend request result:', result);
      
      setNewFriendEmail('');
      setSuccess(`Friend request sent to ${targetUser.username}!`);
      
    } catch (err) {
      console.error('Friend request error:', err);
      // Provide a more user-friendly error message
      if (err.response?.status === 404) {
        setError('No user found with this email. Please check and try again.');
      } else if (err.response?.status === 400) {
        setError(err.response.data.message || 'Invalid request. You may already be friends with this user.');
      } else {
        setError('Failed to send friend request. Please try again later.');
      }
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
      setSuccess('Friend request accepted!');
      setTimeout(() => setSuccess(''), 3000);
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
      setSuccess('Friend request declined');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to reject friend request');
      console.error('Error rejecting friend request:', err);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-light-bg dark:bg-dark-bg flex justify-center items-center">
        <div className="flex flex-col items-center">
          <motion.div 
            className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          />
          <motion.p 
            className="mt-4 text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Finding your friends...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="pt-16 min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <motion.div 
            className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500">
                My Connections
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Connect with peers and expand your network</p>
            </div>
          </motion.div>

          {error && (
            <motion.div 
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 text-sm rounded-md shadow-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              role="alert"
            >
              <p>{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div 
              className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 mb-4 text-sm rounded-md shadow-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              role="alert"
            >
              <p>{success}</p>
            </motion.div>
          )}

          {/* Tabs */}
          <motion.div 
            className="bg-white dark:bg-dark-card rounded-lg shadow-md hover:shadow-lg transition-shadow mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex border-b dark:border-gray-700">
              <motion.button
                whileHover={{ backgroundColor: '#f9fafb' }}
                whileTap={{ scale: 0.98 }}
                className={`px-6 py-3 ${
                  activeTab === 'friends' 
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                }`}
                onClick={() => setActiveTab('friends')}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  My Friends <span className="ml-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full">{friends.length}</span>
                </div>
              </motion.button>
              
              <motion.button
                whileHover={{ backgroundColor: '#f9fafb' }}
                whileTap={{ scale: 0.98 }}
                className={`px-6 py-3 ${
                  activeTab === 'requests' 
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                }`}
                onClick={() => setActiveTab('requests')}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Friend Requests <span className="ml-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full">{friendRequests.length}</span>
                </div>
              </motion.button>
              
              <motion.button
                whileHover={{ backgroundColor: '#f9fafb' }}
                whileTap={{ scale: 0.98 }}
                className={`px-6 py-3 ${
                  activeTab === 'add' 
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                }`}
                onClick={() => setActiveTab('add')}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add New Friend
                </div>
              </motion.button>
            </div>
          </motion.div>

          {/* Friends List Tab */}
          <AnimatePresence mode="wait">
            {activeTab === 'friends' && (
              <motion.div
                key="friends-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {friends.length === 0 ? (
                  <motion.div 
                    className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
                    variants={itemVariants}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">You don't have any friends yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">Connect with peers and expand your network!</p>
                    <motion.button 
                      className="px-3 py-1.5 bg-blue-500 text-white rounded-md shadow-lg hover:bg-blue-600 text-sm"
                      onClick={() => setActiveTab('add')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Add Friends
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                  >
                    {friends.map(friend => (
                      <motion.div 
                        key={friend._id} 
                        variants={itemVariants}
                        whileHover={{ y: -5 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-100 dark:border-gray-700"
                      >
                        <div className="flex flex-col h-full">
                          <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                            <div className="absolute -bottom-10 left-4">
                              <div className="h-20 w-20 rounded-full border-4 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                {friend && friend.profilePicture ? (
                                  <img 
                                    src={friend.profilePicture} 
                                    alt={friend.username || 'User'} 
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = './avatar.svg';
                                    }}
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white text-2xl font-semibold">
                                    {friend && friend.username ? friend.username.charAt(0).toUpperCase() : 'U'}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-12 p-4 flex-grow">
                            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{friend && friend.username ? friend.username : 'User'}</h3>
                            
                            <div className="mt-2 space-y-1">
                              {friend && friend.major && (
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                                  </svg>
                                  <span>{friend.major}</span>
                                </div>
                              )}
                              
                              {friend && friend.year && (
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span>Year {friend.year}</span>
                                </div>
                              )}
                              
                              {friend && friend.location && (
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span>{friend.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="p-4 pt-0">
                            <motion.div 
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <Link 
                                to={`/messages/${friend._id}`}
                                className="block w-full text-center py-2 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md transition-all shadow-md hover:shadow-lg font-medium"
                              >
                                <div className="flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  Message
                                </div>
                              </Link>
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Friend Requests Tab */}
            {activeTab === 'requests' && (
              <motion.div
                key="requests-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {friendRequests.length === 0 ? (
                  <motion.div 
                    className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
                    variants={itemVariants}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">No pending friend requests</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">You don't have any friend requests at the moment</p>
                    <motion.button 
                      className="px-3 py-1.5 bg-blue-500 text-white rounded-md shadow-lg hover:bg-blue-600 text-sm"
                      onClick={() => setActiveTab('add')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Add Friends
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="space-y-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                  >
                    {friendRequests.map(request => (
                      <motion.div 
                        key={request._id} 
                        variants={itemVariants}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-100 dark:border-gray-700"
                      >
                        <div className="p-4 flex items-center">
                          <div className="h-14 w-14 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            {request && request.sender && request.sender.profilePicture ? (
                              <img 
                                src={request.sender.profilePicture} 
                                alt={request.sender.username || 'User'} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white text-xl font-semibold">
                                {request && request.sender && request.sender.username 
                                  ? request.sender.username.charAt(0).toUpperCase() 
                                  : 'U'
                                }
                              </div>
                            )}
                          </div>
                          
                          <div className="ml-4 flex-grow">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                              <div>
                                <h3 className="font-medium text-gray-800 dark:text-gray-100">
                                  {request && request.sender && request.sender.username 
                                    ? request.sender.username 
                                    : 'User'
                                  }
                                </h3>
                                
                                {request && request.sender && request.sender.major && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{request.sender.major}</p>
                                )}
                              </div>
                              
                              <div className="flex space-x-2 mt-3 md:mt-0">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleAcceptRequest(request._id)}
                                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded shadow hover:shadow-md transition-all flex items-center"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Accept
                                </motion.button>
                                
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleRejectRequest(request._id)}
                                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Decline
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Add Friend Tab */}
            {activeTab === 'add' && (
              <motion.div
                key="add-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                  <div className="flex items-center mb-6">
                    <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-medium text-gray-800 dark:text-gray-100">Connect with new friends</h2>
                  </div>
                  
                  <form onSubmit={handleSendRequest} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Enter email address:
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                        </div>
                        <motion.input
                          type="email"
                          value={newFriendEmail}
                          onChange={(e) => setNewFriendEmail(e.target.value)}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-md pl-10 pr-3 py-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="friend@example.com"
                          required
                          initial={{ scale: 0.98 }}
                          whileFocus={{ scale: 1.01 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                        />
                      </div>
                    </div>
                    
                    <motion.button
                      type="submit"
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md shadow-md hover:shadow-lg transition-all font-medium flex items-center justify-center"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send Friend Request
                    </motion.button>
                  </form>
                  
                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or find peers with similar interests</span>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link to="/activities" className="w-full flex items-center justify-center px-4 py-2.5 border border-blue-500 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Discover Activities & Meet People
                        </Link>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
};

export default Friends;