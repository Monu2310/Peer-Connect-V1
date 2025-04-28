import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getMyJoinedActivities, getMyCreatedActivities, getActivities } from '../api/activityService';
import { getFriends } from '../api/friendService';
import { useTheme } from '../contexts/ThemeContext';
import BlobCursor from '../components/effects/BlobCursor';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [userActivities, setUserActivities] = useState([]);
  const [recommendedActivities, setRecommendedActivities] = useState([]);
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    activitiesJoined: 0,
    activitiesCreated: 0,
    pendingInvitations: 0,
    friendCount: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch user joined and created activities
        const joinedActivities = await getMyJoinedActivities();
        const createdActivities = await getMyCreatedActivities();
        const allUserActivities = [...joinedActivities, ...createdActivities];
        setUserActivities(allUserActivities);
        
        // Fetch recommended activities (using general getActivities for now)
        const recommended = await getActivities();
        setRecommendedActivities(recommended);
        
        // Fetch user friends
        const friendsData = await getFriends();
        setFriends(friendsData);
        
        // Calculate stats
        setStats({
          activitiesJoined: joinedActivities.length,
          activitiesCreated: createdActivities.length,
          pendingInvitations: 3, // Mock data for now
          friendCount: friendsData.length,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

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
            <motion.p 
              className="text-gray-600 dark:text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Welcome back, {currentUser?.name || currentUser?.username || 'User'}!
            </motion.p>
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
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Your Recent Activities</h2>
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
        
        {/* Recommended Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Recommended For You</h2>
            <Link to="/activities" className="text-primary dark:text-primary-light hover:underline">Explore more</Link>
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