import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../api/userService';
import { useAuth } from '../contexts/AuthContext';
import PageTransition from '../components/effects/PageTransition';
import MetallicCard from '../components/effects/MetallicCard';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activities');

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (currentUser) {
        try {
          setLoading(true);
          const data = await getDashboardStats();
          const processedData = {
            ...data,
            stats: data?.stats || {
              totalFriends: 0,
              totalActivities: 0,
              unreadMessages: 0,
              notifications: 0
            },
            userActivities: data?.userActivities || [],
            upcomingActivities: data?.upcomingActivities || [],
            friendActivity: data?.friendActivity || [],
            recentMessages: data?.recentMessages || []
          };
          setDashboardData(processedData);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          setDashboardData({
            stats: {
              totalFriends: 0,
              totalActivities: 0,
              unreadMessages: 0,
              notifications: 0
            },
            userActivities: [],
            upcomingActivities: [],
            friendActivity: [],
            recentMessages: []
          });
          setLoading(false);
        }
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <motion.div 
            className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <motion.p 
            className="mt-4 text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading your dashboard...
          </motion.p>
        </div>
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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

  const statsVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    show: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
        delay: 0.2
      }
    }
  };

  const tabVariants = {
    inactive: { 
      opacity: 0.6,
      y: 0
    },
    active: { 
      opacity: 1,
      y: -2,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  const glowVariants = {
    inactive: { opacity: 0, scale: 0.8 },
    active: { 
      opacity: [0.2, 0.8, 0.2], 
      scale: 1.05,
      transition: {
        opacity: {
          repeat: Infinity,
          duration: 2
        },
        scale: {
          type: "spring",
          stiffness: 400,
          damping: 15
        }
      }
    }
  };

  const cardHoverVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.03,
      boxShadow: "0 10px 25px rgba(79, 70, 229, 0.15)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  const shimmerVariants = {
    initial: { x: "-100%" },
    animate: { 
      x: "100%",
      transition: {
        repeat: Infinity,
        repeatDelay: 3,
        duration: 1.5,
        ease: "easeInOut"
      }
    }
  };

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        {/* Header and Stats Section */}
        <div className="mb-8">
          <motion.div 
            className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <motion.h1 
                className="text-3xl font-bold text-gray-800 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                Dashboard
              </motion.h1>
              <motion.p 
                className="text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Welcome back, {currentUser?.name || 'User'}!
              </motion.p>
            </div>
            
            <motion.div
              className="mt-4 md:mt-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Link 
                to="/profile" 
                className="px-5 py-2 flex items-center border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-300 interactive"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                View Profile
              </Link>
            </motion.div>
          </motion.div>

          {dashboardData && dashboardData.stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div variants={statsVariants} initial="hidden" animate="show">
                <motion.div 
                  variants={cardHoverVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <MetallicCard className="h-full">
                    <div className="p-5 flex items-center">
                      <motion.div 
                        className="bg-primary/10 p-3 rounded-full mr-4"
                        whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </motion.div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Friends</p>
                        <motion.div className="relative overflow-hidden">
                          <motion.p 
                            className="text-2xl font-bold text-gray-800"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            {dashboardData.stats.totalFriends}
                          </motion.p>
                          <motion.div
                            className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                            variants={shimmerVariants}
                            initial="initial"
                            animate="animate"
                          />
                        </motion.div>
                      </div>
                    </div>
                  </MetallicCard>
                </motion.div>
              </motion.div>
              
              <motion.div variants={statsVariants} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
                <motion.div 
                  variants={cardHoverVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <MetallicCard className="h-full">
                    <div className="p-5 flex items-center">
                      <motion.div 
                        className="bg-indigo-50 p-3 rounded-full mr-4"
                        whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </motion.div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Activities</p>
                        <motion.div className="relative overflow-hidden">
                          <motion.p 
                            className="text-2xl font-bold text-gray-800"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                          >
                            {dashboardData.stats.totalActivities}
                          </motion.p>
                          <motion.div
                            className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                            variants={shimmerVariants}
                            initial="initial"
                            animate="animate"
                          />
                        </motion.div>
                      </div>
                    </div>
                  </MetallicCard>
                </motion.div>
              </motion.div>
              
              <motion.div variants={statsVariants} initial="hidden" animate="show" transition={{ delay: 0.2 }}>
                <motion.div 
                  variants={cardHoverVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <MetallicCard className="h-full">
                    <div className="p-5 flex items-center">
                      <motion.div 
                        className="bg-green-50 p-3 rounded-full mr-4"
                        whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </motion.div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Messages</p>
                        <motion.div className="relative overflow-hidden">
                          <motion.p 
                            className="text-2xl font-bold text-gray-800"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            {dashboardData.stats.unreadMessages}
                          </motion.p>
                          <motion.div
                            className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                            variants={shimmerVariants}
                            initial="initial"
                            animate="animate"
                          />
                        </motion.div>
                      </div>
                    </div>
                  </MetallicCard>
                </motion.div>
              </motion.div>
              
              <motion.div variants={statsVariants} initial="hidden" animate="show" transition={{ delay: 0.3 }}>
                <motion.div 
                  variants={cardHoverVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <MetallicCard className="h-full">
                    <div className="p-5 flex items-center">
                      <motion.div 
                        className="bg-amber-50 p-3 rounded-full mr-4"
                        whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </motion.div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Notifications</p>
                        <motion.div className="relative overflow-hidden">
                          <motion.p 
                            className="text-2xl font-bold text-gray-800"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                          >
                            {dashboardData.stats.notifications}
                          </motion.p>
                          <motion.div
                            className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                            variants={shimmerVariants}
                            initial="initial"
                            animate="animate"
                          />
                        </motion.div>
                      </div>
                    </div>
                  </MetallicCard>
                </motion.div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        {dashboardData && (
          <div className="mb-8">
            <MetallicCard>
              <div className="flex border-b relative">
                <motion.button
                  className={`px-6 py-3 font-medium text-sm ${activeTab === 'activities' ? 'text-primary border-b-2 border-primary' : 'text-gray-600'} interactive relative`}
                  onClick={() => setActiveTab('activities')}
                  variants={tabVariants}
                  animate={activeTab === 'activities' ? 'active' : 'inactive'}
                  whileHover={{ opacity: 0.8 }}
                >
                  Your Activities
                  {activeTab === 'activities' && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      layoutId="tabUnderline"
                      variants={glowVariants}
                      animate="active"
                      initial="inactive"
                    />
                  )}
                </motion.button>
                <motion.button
                  className={`px-6 py-3 font-medium text-sm ${activeTab === 'friends' ? 'text-primary border-b-2 border-primary' : 'text-gray-600'} interactive relative`}
                  onClick={() => setActiveTab('friends')}
                  variants={tabVariants}
                  animate={activeTab === 'friends' ? 'active' : 'inactive'}
                  whileHover={{ opacity: 0.8 }}
                >
                  Friends Activity
                  {activeTab === 'friends' && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      layoutId="tabUnderline"
                      variants={glowVariants}
                      animate="active"
                      initial="inactive"
                    />
                  )}
                </motion.button>
                <motion.button
                  className={`px-6 py-3 font-medium text-sm ${activeTab === 'messages' ? 'text-primary border-b-2 border-primary' : 'text-gray-600'} interactive relative`}
                  onClick={() => setActiveTab('messages')}
                  variants={tabVariants}
                  animate={activeTab === 'messages' ? 'active' : 'inactive'}
                  whileHover={{ opacity: 0.8 }}
                >
                  Recent Messages
                  {activeTab === 'messages' && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      layoutId="tabUnderline"
                      variants={glowVariants}
                      animate="active"
                      initial="inactive"
                    />
                  )}
                </motion.button>
              </div>
            </MetallicCard>
          </div>
        )}

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {dashboardData && activeTab === 'activities' && (
            <motion.div 
              key="activities"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Your Activities */}
                <motion.div variants={itemVariants}>
                  <motion.div 
                    variants={cardHoverVariants}
                    initial="initial"
                    whileHover="hover"
                  >
                    <MetallicCard className="h-full">
                      <div className="p-5">
                        <div className="flex justify-between items-center mb-6">
                          <motion.h3 
                            className="text-lg font-semibold text-gray-800"
                            whileHover={{ scale: 1.03, color: '#4F46E5' }}
                          >
                            Your Activities
                          </motion.h3>
                          <motion.div 
                            whileHover={{ scale: 1.05 }} 
                            whileTap={{ scale: 0.95 }}
                            className="relative"
                          >
                            <Link to="/activities/new" className="text-sm text-primary hover:text-primary-dark interactive flex items-center">
                              <span>Create New</span>
                              <motion.span 
                                className="ml-1"
                                initial={{ x: 0 }}
                                animate={{ x: [0, 3, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                              >
                                +
                              </motion.span>
                            </Link>
                          </motion.div>
                        </div>
                        
                        {dashboardData.userActivities.length > 0 ? (
                          <div className="space-y-4">
                            {dashboardData.userActivities.map((activity) => (
                              <motion.div 
                                key={activity._id} 
                                className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow"
                                variants={itemVariants}
                                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                              >
                                <div className="flex items-start">
                                  <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center mr-4">
                                    {activity.image ? (
                                      <img src={activity.image} alt="" className="w-full h-full object-cover rounded-md" />
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <Link to={`/activities/${activity._id}`} className="text-base font-medium text-gray-900 hover:text-primary interactive">
                                      {activity.title}
                                    </Link>
                                    <div className="flex items-center mt-1 text-sm text-gray-500">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      {formatDate(activity.date)}
                                      <span className="mx-2">•</span>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                      {activity.participants ? activity.participants.length : 0} joined
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <h3 className="mt-2 text-gray-600 font-medium">No activities yet</h3>
                            <p className="mt-1 text-gray-500 text-sm">Create an activity to connect with peers</p>
                            <motion.div 
                              className="mt-4"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Link to="/activities/new" className="px-4 py-2 bg-primary text-white rounded-md shadow-md hover:bg-primary-dark transition-colors interactive">
                                Create Activity
                              </Link>
                            </motion.div>
                          </div>
                        )}
                      </div>
                    </MetallicCard>
                  </motion.div>
                </motion.div>

                {/* Upcoming Activities */}
                <motion.div variants={itemVariants}>
                  <motion.div 
                    variants={cardHoverVariants}
                    initial="initial"
                    whileHover="hover"
                  >
                    <MetallicCard className="h-full">
                      <div className="p-5">
                        <div className="flex justify-between items-center mb-6">
                          <motion.h3 
                            className="text-lg font-semibold text-gray-800"
                            whileHover={{ scale: 1.03, color: '#4F46E5' }}
                          >
                            Upcoming Activities
                          </motion.h3>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link to="/activities" className="text-sm text-primary hover:text-primary-dark interactive flex items-center">
                              <span>View All</span>
                              <motion.span 
                                className="ml-1"
                                initial={{ rotate: 0 }}
                                whileHover={{ rotate: 90 }}
                                transition={{ duration: 0.3 }}
                              >
                                →
                              </motion.span>
                            </Link>
                          </motion.div>
                        </div>
                        
                        {dashboardData.upcomingActivities.length > 0 ? (
                          <div className="space-y-4">
                            {dashboardData.upcomingActivities.map((activity) => (
                              <motion.div 
                                key={activity._id} 
                                className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow"
                                variants={itemVariants}
                                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                              >
                                <div className="flex items-start">
                                  <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center mr-4">
                                    {activity.image ? (
                                      <img src={activity.image} alt="" className="w-full h-full object-cover rounded-md" />
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <Link to={`/activities/${activity._id}`} className="text-base font-medium text-gray-900 hover:text-primary interactive">
                                      {activity.title}
                                    </Link>
                                    <div className="flex items-center mt-1 text-sm text-gray-500">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      {formatDate(activity.date)}
                                      
                                      <span className="mx-2">•</span>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      {activity.location}
                                    </div>
                                  </div>
                                  <motion.div 
                                    className="ml-4"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Link 
                                      to={`/activities/${activity._id}`}
                                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-primary hover:text-white transition-colors interactive"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </Link>
                                  </motion.div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h3 className="mt-2 text-gray-600 font-medium">No upcoming activities</h3>
                            <p className="mt-1 text-gray-500 text-sm">Join activities to see them here</p>
                            <motion.div 
                              className="mt-4"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Link to="/activities" className="px-4 py-2 bg-primary text-white rounded-md shadow-md hover:bg-primary-dark transition-colors interactive">
                                Browse Activities
                              </Link>
                            </motion.div>
                          </div>
                        )}
                      </div>
                    </MetallicCard>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {dashboardData && activeTab === 'friends' && (
            <motion.div 
              key="friends"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
            >
              <motion.div 
                variants={cardHoverVariants}
                initial="initial"
                whileHover="hover"
              >
                <MetallicCard>
                  <div className="p-5">
                    <div className="flex justify-between items-center mb-6">
                      <motion.h3 
                        className="text-lg font-semibold text-gray-800"
                        whileHover={{ scale: 1.03, color: '#4F46E5' }}
                      >
                        Friend Activity
                      </motion.h3>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link to="/friends" className="text-sm text-primary hover:text-primary-dark interactive flex items-center">
                          <span>View All Friends</span>
                          <motion.span 
                            className="ml-1"
                            initial={{ rotate: 0 }}
                            whileHover={{ rotate: 90 }}
                            transition={{ duration: 0.3 }}
                          >
                            →
                          </motion.span>
                        </Link>
                      </motion.div>
                    </div>
                    
                    {dashboardData.friendActivity.length > 0 ? (
                      <div className="space-y-4">
                        {dashboardData.friendActivity.map((activity, index) => (
                          <motion.div 
                            key={index} 
                            className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow"
                            variants={itemVariants}
                            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                          >
                            <div className="flex items-start">
                              <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 overflow-hidden">
                                {activity.friend.avatar ? (
                                  <img src={activity.friend.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-gray-400 p-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <p className="text-gray-800">
                                  <span className="font-medium hover:text-primary transition-colors interactive">{activity.friend.name}</span>
                                  <span className="text-gray-600"> {activity.action} </span>
                                  <Link to={activity.actionLink} className="font-medium text-primary hover:text-primary-dark transition-colors interactive">{activity.actionObject}</Link>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{activity.timeAgo}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3 className="mt-2 text-gray-600 font-medium">No friend activity</h3>
                        <p className="mt-1 text-gray-500 text-sm">Add friends to see their activity</p>
                        <motion.div 
                          className="mt-4"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Link to="/friends" className="px-4 py-2 bg-primary text-white rounded-md shadow-md hover:bg-primary-dark transition-colors interactive">
                            Find Friends
                          </Link>
                        </motion.div>
                      </div>
                    )}
                  </div>
                </MetallicCard>
              </motion.div>
            </motion.div>
          )}

          {dashboardData && activeTab === 'messages' && (
            <motion.div 
              key="messages"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
            >
              <motion.div 
                variants={cardHoverVariants}
                initial="initial"
                whileHover="hover"
              >
                <MetallicCard>
                  <div className="p-5">
                    <div className="flex justify-between items-center mb-6">
                      <motion.h3 
                        className="text-lg font-semibold text-gray-800"
                        whileHover={{ scale: 1.03, color: '#4F46E5' }}
                      >
                        Recent Messages
                      </motion.h3>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link to="/messages" className="text-sm text-primary hover:text-primary-dark interactive flex items-center">
                          <span>Go to Messages</span>
                          <motion.span 
                            className="ml-1"
                            initial={{ rotate: 0 }}
                            whileHover={{ rotate: 90 }}
                            transition={{ duration: 0.3 }}
                          >
                            →
                          </motion.span>
                        </Link>
                      </motion.div>
                    </div>
                    
                    {dashboardData.recentMessages.length > 0 ? (
                      <div className="space-y-4">
                        {dashboardData.recentMessages.map((message, index) => (
                          <motion.div 
                            key={index} 
                            className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow"
                            variants={itemVariants}
                            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                          >
                            <div className="flex items-start">
                              <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 overflow-hidden">
                                {message.sender.avatar ? (
                                  <img src={message.sender.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-gray-400 p-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <Link to={`/messages/${message.conversationId}`} className="font-medium text-gray-900 hover:text-primary transition-colors interactive">
                                    {message.sender.name}
                                  </Link>
                                  <p className="text-xs text-gray-500">{formatDate(message.timestamp)}</p>
                                </div>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{message.content}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <h3 className="mt-2 text-gray-600 font-medium">No messages yet</h3>
                        <p className="mt-1 text-gray-500 text-sm">Connect with friends to start chatting</p>
                        <motion.div 
                          className="mt-4"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Link to="/friends" className="px-4 py-2 bg-primary text-white rounded-md shadow-md hover:bg-primary-dark transition-colors interactive">
                            Find Friends
                          </Link>
                        </motion.div>
                      </div>
                    )}
                  </div>
                </MetallicCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default Dashboard;