import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getMyJoinedActivities, getMyCreatedActivities } from '../api/activityService';
import { getFriends } from '../api/friendService';
import { getFriendRecommendations, getActivityRecommendations, getUserInsights } from '../api/recommendationService';
import { sendFriendRequestById } from '../api/friendService';
import { useTheme } from '../contexts/ThemeContext';
import BlobCursor from '../components/effects/BlobCursor';

// LocalStorage keys for caching
const DASHBOARD_CACHE_KEY = 'dashboard_data';
const DASHBOARD_TIMESTAMP_KEY = 'dashboard_timestamp';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [userActivities, setUserActivities] = useState([]);
  const [recommendedActivities, setRecommendedActivities] = useState([]);
  const [recommendedFriends, setRecommendedFriends] = useState([]);
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectingToUser, setConnectingToUser] = useState(null);
  const [connectionSuccess, setConnectionSuccess] = useState(null);
  const [stats, setStats] = useState({
    activitiesJoined: 0,
    activitiesCreated: 0,
    pendingInvitations: 0,
    friendCount: 0,
  });
  const [friendView, setFriendView] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [friendCategory, setFriendCategory] = useState('all');
  
  // Try loading dashboard data from cache on initial render
  useEffect(() => {
    const loadCachedData = () => {
      try {
        const cachedData = localStorage.getItem(DASHBOARD_CACHE_KEY);
        const timestamp = localStorage.getItem(DASHBOARD_TIMESTAMP_KEY);
        
        if (cachedData && timestamp) {
          const cacheAge = Date.now() - parseInt(timestamp);
          // Only use cache if it's less than 10 minutes old
          if (cacheAge < CACHE_DURATION) {
            const parsedData = JSON.parse(cachedData);
            
            // Set state from cache for immediate display
            setUserActivities(parsedData.userActivities || []);
            setRecommendedActivities(parsedData.recommendedActivities || []);
            setRecommendedFriends(parsedData.recommendedFriends || []);
            setFriends(parsedData.friends || []);
            setStats(parsedData.stats || {
              activitiesJoined: 0,
              activitiesCreated: 0,
              pendingInvitations: 0,
              friendCount: 0,
            });
            
            // Still show content immediately but don't mark as fully loaded
            // This allows the UI to show something while fresh data is fetched
            console.log('Loaded dashboard data from cache');
          }
        }
      } catch (err) {
        console.error('Error loading cached dashboard data:', err);
        // Continue with normal loading if cache loading fails
      }
    };
    
    loadCachedData();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch user activity insights for accurate statistics
        let insights = { joinedActivities: 0, createdActivities: 0 };
        try {
          insights = await getUserInsights();
          console.log("User activity insights fetched successfully:", insights);
        } catch (insightsErr) {
          console.error("Error fetching activity insights:", insightsErr);
        }
        
        // Fetch user joined activities
        let joinedActivities = [];
        try {
          joinedActivities = await getMyJoinedActivities();
          console.log("Joined activities fetched successfully:", joinedActivities);
        } catch (joinedErr) {
          console.error("Error fetching joined activities:", joinedErr);
          joinedActivities = [];
        }
        
        // Fetch user created activities
        let createdActivities = [];
        try {
          createdActivities = await getMyCreatedActivities();
          console.log("Created activities fetched successfully:", createdActivities);
        } catch (createdErr) {
          console.error("Error fetching created activities:", createdErr);
          createdActivities = [];
        }
        
        // Ensure we have valid arrays before concatenation
        joinedActivities = Array.isArray(joinedActivities) ? joinedActivities : [];
        createdActivities = Array.isArray(createdActivities) ? createdActivities : [];
        
        const allUserActivities = [...joinedActivities, ...createdActivities];
        setUserActivities(allUserActivities);
        
        // Fetch activity recommendations
        let recommended = [];
        try {
          recommended = await getActivityRecommendations();
          console.log("Activity recommendations fetched successfully:", recommended);
        } catch (recErr) {
          console.error("Error fetching activity recommendations:", recErr);
          recommended = [];
        }
        setRecommendedActivities(Array.isArray(recommended) ? recommended : []);
        
        // Fetch friend recommendations based on preferences
        let recommendedFriendsData = [];
        try {
          recommendedFriendsData = await getFriendRecommendations();
          console.log("Friend recommendations fetched successfully:", recommendedFriendsData);
        } catch (recFriendsErr) {
          console.error("Error fetching friend recommendations:", recFriendsErr);
          recommendedFriendsData = [];
        }
        setRecommendedFriends(Array.isArray(recommendedFriendsData) ? recommendedFriendsData : []);
        
        // Fetch user friends
        let friendsData = [];
        try {
          friendsData = await getFriends();
          console.log("Friends fetched successfully:", friendsData);
        } catch (friendsErr) {
          console.error("Error fetching friends:", friendsErr);
          friendsData = [];
        }
        setFriends(Array.isArray(friendsData) ? friendsData : []);
        
        // Calculate stats with multiple data sources - prioritize insights if available
        const updatedStats = {
          // Use insights data if available, otherwise fall back to array lengths
          activitiesJoined: insights.joinedActivities || joinedActivities?.length || 0,
          activitiesCreated: insights.createdActivities || createdActivities?.length || 0,
          pendingInvitations: 3, // Mock data for now, can be replaced with actual pending invites
          friendCount: friendsData?.length || 0,
        };
        setStats(updatedStats);
        
        // Save dashboard data to localStorage for future visits
        const dashboardData = {
          userActivities: allUserActivities,
          recommendedActivities: Array.isArray(recommended) ? recommended : [],
          recommendedFriends: Array.isArray(recommendedFriendsData) ? recommendedFriendsData : [],
          friends: Array.isArray(friendsData) ? friendsData : [],
          stats: updatedStats,
        };
        
        localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(dashboardData));
        localStorage.setItem(DASHBOARD_TIMESTAMP_KEY, Date.now().toString());
        console.log('Dashboard data cached successfully');
        
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
        setError("Failed to load dashboard data. Please try refreshing the page.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Handle friend request
  const handleConnect = async (userId) => {
    setConnectingToUser(userId);
    setConnectionSuccess(null);
    
    try {
      await sendFriendRequestById(userId);
      setConnectionSuccess(userId);
      setTimeout(() => {
        setConnectionSuccess(null);
      }, 3000);
      
      // Remove this user from recommendations
      const updatedRecommendedFriends = recommendedFriends.filter(friend => friend._id !== userId);
      setRecommendedFriends(updatedRecommendedFriends);
      
      // Update cache with new recommendations list
      try {
        const cachedData = localStorage.getItem(DASHBOARD_CACHE_KEY);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          parsedData.recommendedFriends = updatedRecommendedFriends;
          localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(parsedData));
        }
      } catch (err) {
        console.error('Error updating cache after friend request:', err);
      }
      
    } catch (err) {
      console.error("Error sending friend request:", err);
      setError("Failed to send friend request. Please try again.");
    } finally {
      setConnectingToUser(null);
    }
  };

  // Hide default cursor when dashboard is mounted
  useEffect(() => {
    document.body.style.cursor = 'none';
    
    // Cleanup - restore cursor when unmounting
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const cardHoverVariants = {
    hover: { 
      y: -5,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: { type: "spring", stiffness: 300 }
    },
    tap: { 
      scale: 0.98,
      transition: { type: "spring", stiffness: 300 }
    }
  };

  // Mock data for empty states
  const emptyStateActivities = [
    {
      _id: "mock1",
      title: "Join a study group",
      category: "Academic",
      date: new Date(),
      description: "Start by joining a study group for your courses",
      participants: []
    },
    {
      _id: "mock2",
      title: "Start a sports activity",
      category: "Sports",
      date: new Date(),
      description: "Create a sports event and invite others to join",
      participants: []
    }
  ];

  // Filter friends based on search and category
  useEffect(() => {
    if (recommendedFriends.length > 0) {
      let filtered = [...recommendedFriends];
      
      // Apply search filter
      if (searchTerm.trim() !== '') {
        filtered = filtered.filter(friend => 
          friend.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          friend.sharedInterests?.some(interest => 
            interest.value.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      }
      
      // Apply category filter
      if (friendCategory !== 'all') {
        filtered = filtered.filter(friend => {
          if (friendCategory === 'high-match' && friend.similarityScore >= 75) return true;
          if (friendCategory === 'medium-match' && friend.similarityScore >= 50 && friend.similarityScore < 75) return true;
          if (friendCategory === 'new' && friend.isNew) return true;
          if (friendCategory === 'mutual-friends' && friend.mutualFriends && friend.mutualFriends.length > 0) return true;
          return false;
        });
      }
      
      setFilteredFriends(filtered);
    } else {
      setFilteredFriends([]);
    }
  }, [recommendedFriends, searchTerm, friendCategory]);

  return (
    <div className="pt-16 min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-colors duration-300">
      {/* Add BlobCursor component */}
      <BlobCursor fillColor="var(--cursor-color, #228be6)" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with user welcome */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
          <div>
            <motion.h1 
              className="text-3xl font-bold mb-2 gradient-text"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Dashboard
            </motion.h1>
            <motion.div 
              className="flex items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-gray-600 dark:text-gray-400">
                Welcome back, {currentUser?.name || currentUser?.username || 'User'}!
              </p>
              <Link to="/profile" className="ml-3 text-primary dark:text-primary-light hover:underline flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                My Profile
              </Link>
            </motion.div>
          </div>
          
          <motion.div
            className="mt-4 md:mt-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Link
              to="/activities/new"
              className="btn btn-primary inline-flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Create Activity
            </Link>
          </motion.div>
        </div>
        
        {isLoading ? (
          // Skeleton loading state
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div 
                key={`skeleton-${i}`} 
                className="bg-gray-100 dark:bg-dark-light animate-pulse rounded-lg h-40"
              />
            ))}
          </div>
        ) : (
          // Stats cards
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {/* Activities Joined */}
            <motion.div
              variants={itemVariants}
              whileHover="hover"
              whileTap="tap"
              className="glass-card rounded-lg hover:shadow-lg transition-shadow dark:border-dark-border/50"
            >
              <div className="p-5 flex items-center">
                <motion.div 
                  className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-full mr-4"
                  whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </motion.div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Activities Joined</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.activitiesJoined}</p>
                </div>
              </div>
            </motion.div>
            
            {/* Activities Created */}
            <motion.div
              variants={itemVariants}
              whileHover="hover"
              whileTap="tap"
              className="glass-card rounded-lg hover:shadow-lg transition-shadow dark:border-dark-border/50"
            >
              <div className="p-5 flex items-center">
                <motion.div 
                  className="bg-green-50 dark:bg-green-900/30 p-3 rounded-full mr-4"
                  whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </motion.div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Activities Created</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.activitiesCreated}</p>
                </div>
              </div>
            </motion.div>
            
            {/* Pending Invitations */}
            <motion.div
              variants={itemVariants}
              whileHover="hover"
              whileTap="tap"
              className="glass-card rounded-lg hover:shadow-lg transition-shadow dark:border-dark-border/50"
            >
              <div className="p-5 flex items-center">
                <motion.div 
                  className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-full mr-4"
                  whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-yellow-500 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </motion.div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Pending Invitations</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.pendingInvitations}</p>
                </div>
              </div>
            </motion.div>
            
            {/* Friends */}
            <motion.div
              variants={itemVariants}
              whileHover="hover"
              whileTap="tap"
              className="glass-card rounded-lg hover:shadow-lg transition-shadow dark:border-dark-border/50"
            >
              <div className="p-5 flex items-center">
                <motion.div 
                  className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-full mr-4"
                  whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-purple-500 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </motion.div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Friends</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.friendCount}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {/* Recent Activities */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-500 to-purple-600 mb-2">
                  Joined Activities
                </h2>
            <Link to="/activities" className="text-primary dark:text-primary-light hover:underline">View all</Link> 
          </div>

          {userActivities && userActivities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userActivities.slice(0, 3).map((activity) => (
                <motion.div
                  key={activity._id}
                  variants={cardHoverVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="glass-card rounded-lg overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-xl text-gray-800 dark:text-white truncate">{activity.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${activity.category === 'Academic' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' : activity.category === 'Sports' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' : 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300'}`}>
                        {activity.category}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{activity.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex -space-x-2">
                        {[...Array(Math.min(activity.participants?.length || 0, 3))].map((_, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-dark-card flex items-center justify-center text-xs">
                            {i + 1}
                          </div>
                        ))}
                        {(activity.participants?.length > 3) && (
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-dark-card flex items-center justify-center text-xs">
                            +{activity.participants.length - 3}
                          </div>
                        )}
                      </div>
                      <Link to={`/activities/${activity._id}`} className="text-primary dark:text-blue-400 hover:underline">Details</Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-card dark:bg-dark-card/60 rounded-lg p-6 text-center">
              <svg className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-2">No activities yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by creating an activity or joining one</p>
              <Link to="/activities" className="btn btn-primary inline-block">Find Activities</Link>
            </div>
          )}
        </motion.div>
        
        {/* Recommended Friends */}
        {recommendedFriends.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-500 to-purple-600 mb-2">
                  Discover New Connections
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Connect with peers who share your interests and goals</p>
              </div>
              <Link 
                to="/friends" 
                className="flex items-center px-4 py-2.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light rounded-lg hover:bg-primary/20 dark:hover:bg-primary/30 transition-all shadow-sm hover:shadow group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="group-hover:translate-x-0.5 transition-transform">Find more connections</span>
              </Link>
            </div>
            
            {/* Search and Filter */}
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                {/* Search input */}
                <div className="flex-1 mb-3 sm:mb-0">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or interest"
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 transition-all duration-300"
                  />
                </div>
                
                {/* Filter by category */}
                <div className="flex items-center space-x-2">
                  <select
                    value={friendCategory}
                    onChange={(e) => setFriendCategory(e.target.value)}
                    className="p-3 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 transition-all duration-300"
                  >
                    <option value="all">All</option>
                    <option value="high-match">High Match (75%+)</option>
                    <option value="medium-match">Medium Match (50%-74%)</option>
                    <option value="new">New Friends</option>
                    <option value="mutual-friends">Mutual Friends</option>
                  </select>
                  
                  <button
                    onClick={() => setFriendView(friendView === 'grid' ? 'list' : 'grid')}
                    className="p-3 rounded-lg bg-primary dark:bg-blue-400 text-white flex items-center space-x-2 hover:bg-primary-dark dark:hover:bg-blue-500 transition-all duration-300"
                  >
                    {friendView === 'grid' ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M3 14h18m-7 8h7M3 18h4" />
                        </svg>
                        <span>List View</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                        <span>Grid View</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <div className={`grid grid-cols-1 gap-6 ${friendView === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-1'}`}>
              {filteredFriends.slice(0, 3).map((friend) => (
                <motion.div
                  key={friend._id}
                  variants={cardHoverVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="glass-card rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700/50 hover:border-primary/30 dark:hover:border-primary/30 transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-indigo-500 p-0.5">
                            <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-gray-800">
                              <img 
                                src={friend.profilePicture || '/avatar.svg'} 
                                alt={friend.username} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/avatar.svg';
                                }}
                              />
                            </div>
                          </div>
                          {friend.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                          )}
                        </div>
                        <div className="ml-3">
                          <h3 className="font-bold text-lg text-gray-800 dark:text-white">{friend.username}</h3>
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              friend.similarityScore >= 75 ? 'bg-green-500' :
                              friend.similarityScore >= 50 ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`} />
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {friend.similarityScore}% match
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Shared interests */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-primary dark:text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Common Interests
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {friend.sharedInterests?.map((interest, idx) => (
                          <span 
                            key={idx} 
                            className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors
                              ${interest.type === 'hobby' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300' : 
                                interest.type === 'sport' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300' : 
                                interest.type === 'subject' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                                'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                              } hover:shadow-md hover:-translate-y-0.5 cursor-default`}
                          >
                            {interest.value}
                          </span>
                        ))}
                        {(!friend.sharedInterests || friend.sharedInterests.length === 0) && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                            Similar preferences to you
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleConnect(friend._id)}
                        disabled={connectingToUser === friend._id || connectionSuccess === friend._id}
                        className={`${
                          connectionSuccess === friend._id 
                            ? 'bg-green-500 hover:bg-green-600 text-white' 
                            : 'bg-primary hover:bg-primary-dark text-white dark:bg-primary-light dark:hover:bg-primary dark:text-gray-900'
                        } px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-md`}
                      >
                        {connectionSuccess === friend._id ? (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Friend Request Sent
                          </>
                        ) : connectingToUser === friend._id ? (
                          <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Connecting...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Connect
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Empty state for filtered connections */}
            {filteredFriends.length === 0 && recommendedFriends.length > 0 && (
              <div className="glass-card rounded-lg p-6 text-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-2">No matches found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchTerm ? `No connections match "${searchTerm}"` : "No connections match the selected filter"}
                </p>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setFriendCategory('all');
                  }} 
                  className="btn btn-primary inline-block"
                >
                  Clear Filters
                </button>
              </div>
            )}
            
            {/* Connection metrics */}
            {filteredFriends.length > 0 && (
              <div className="glass-card rounded-xl p-6 mt-4 mb-6 border border-gray-100 dark:border-gray-700/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary dark:text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Showing <span className="font-semibold text-gray-900 dark:text-white">{Math.min(filteredFriends.length, 3)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{filteredFriends.length}</span> suggestions
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">Based on your interests and preferences</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg text-xs flex items-center gap-1.5 font-medium">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Updated today</span>
                    </div>
                    
                    <div className="px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg text-xs flex items-center gap-1.5 font-medium">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span>AI-powered matches</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
        
        {/* Recommended Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-500 to-purple-600 mb-2">
                  Activities for you
                </h2>            <Link to="/activities" className="text-primary dark:text-primary-light hover:underline">Explore more</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(recommendedActivities.length > 0 ? recommendedActivities : emptyStateActivities).slice(0, 3).map((activity, index) => (
              <motion.div
                key={activity._id || `empty-${index}`}
                variants={cardHoverVariants}
                whileHover="hover"
                whileTap="tap"
                className="glass-card rounded-lg overflow-hidden border border-gray-100 dark:border-dark-border/30"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-xl text-gray-800 dark:text-white truncate">{activity.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${activity.category === 'Academic' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' : activity.category === 'Sports' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' : 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300'}`}>
                      {activity.category}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{activity.description}</p>
                  
                  {activity._id && activity._id.startsWith('mock') ? (
                    <Link 
                      to={activity.category === 'Academic' ? "/activities?category=Academic" : "/activities/new"} 
                      className="btn btn-primary w-full text-center"
                    >
                      {activity.category === 'Academic' ? 'Find Study Groups' : 'Create Activity'}
                    </Link>
                  ) : (
                    <Link to={`/activities/${activity._id}`} className="btn btn-primary w-full text-center">
                      View Details
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;