import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../core/AuthContext';
import { getMyJoinedActivities, getMyCreatedActivities } from '../api/activityService';
import { getFriends, sendFriendRequestById, getFriendRequests } from '../api/friendService';
import { getFriendRecommendations, getActivityRecommendations, getUserInsights } from '../api/recommendationService';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Calendar, Users, PlusCircle, UserPlus, Mail, User, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import BeautifulBackground from '../components/effects/BeautifulBackground';
import TiltCard from '../components/effects/TiltCard';
import MagneticButton from '../components/effects/MagneticButton';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    activitiesJoined: 0,
    activitiesCreated: 0,
    friendCount: 0,
    pendingInvitations: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [recommendedFriends, setRecommendedFriends] = useState([]);
  const [recommendedActivities, setRecommendedActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [insights, joined, created, friends, friendRequests, friendRecs, activityRecs] = await Promise.all([
          getUserInsights(),
          getMyJoinedActivities(),
          getMyCreatedActivities(),
          getFriends(),
          getFriendRequests(),
          getFriendRecommendations(),
          getActivityRecommendations(),
        ]);

        // Ensure arrays
        const joinedArray = Array.isArray(joined) ? joined : [];
        const createdArray = Array.isArray(created) ? created : [];

        setStats({
          activitiesJoined: insights.joinedActivities || joinedArray.length,
          activitiesCreated: insights.createdActivities || createdArray.length,
          friendCount: friends.length,
          pendingInvitations: friendRequests.length,
        });

        // Combine and remove duplicates by ID
        const allActivitiesMap = new Map();
        [...joinedArray, ...createdArray].forEach(activity => {
          if (activity && activity._id) {
            allActivitiesMap.set(activity._id, activity);
          }
        });
        
        const uniqueActivities = Array.from(allActivitiesMap.values());
        const sortedActivities = uniqueActivities
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 3);
        
        console.log('Recent activities to display:', sortedActivities);
        setRecentActivities(sortedActivities);
        setRecommendedFriends(friendRecs.slice(0, 4));
        setRecommendedActivities(activityRecs.slice(0, 3));

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="show" 
          className="w-full max-w-7xl mx-auto space-y-6"
        >
          {/* Loading header */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="h-6 bg-muted/50 rounded-lg w-48 mb-2" />
            <div className="h-8 bg-muted/50 rounded-lg w-64" />
          </motion.div>

          {/* Loading stats */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card/50 rounded-2xl p-6 border border-border/50">
                <div className="h-4 bg-muted/50 rounded w-24 mb-2" />
                <div className="h-8 bg-muted/50 rounded w-16" />
              </div>
            ))}
          </motion.div>

          {/* Loading content */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-6 bg-muted/50 rounded w-32 mb-4" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-card/50 rounded-2xl p-6 border border-border/50 h-32" />
              ))}
            </div>
            <div className="space-y-4">
              <div className="h-6 bg-muted/50 rounded w-40 mb-4" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-card/50 rounded-2xl p-6 border border-border/50 h-20" />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <BeautifulBackground>
      {/* Dashboard Main Content */}
      <motion.div 
        className="relative z-10 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        
        {/* Header Section with improved spacing */}
        <motion.div variants={itemVariants} className="mb-8 md:mb-12">
          <div className="flex flex-col gap-6">
            
            {/* Welcome text with action buttons on the same line */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">
                  Welcome back, {currentUser?.username || 'Friend'}!
                </h1>
                <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl">
                  Ready to create some amazing memories today?
                </p>
              </div>
              
              {/* Action buttons with proper touch targets - same size */}
              <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
                <MagneticButton strength={0.3}>
                  <Button 
                    asChild 
                    className="h-11 px-6"
                  >
                    <Link to="/profile" className="flex items-center justify-center gap-2">
                      <User className="w-4 h-4" /> 
                      My Profile
                    </Link>
                  </Button>
                </MagneticButton>
                <MagneticButton strength={0.3}>
                  <Button 
                    asChild 
                    variant="outline"
                    className="h-11 px-6"
                  >
                    <Link to="/activities/new" className="flex items-center justify-center gap-2">
                      <PlusCircle className="w-4 h-4" /> 
                      Create Activity
                    </Link>
                  </Button>
                </MagneticButton>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats cards with responsive grid and consistent spacing */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          
          {/* Activities Joined */}
          <TiltCard intensity={10} scale={1.05}>
            <div className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:bg-card/80 hover:border-border transition-all duration-300 hover:shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#A3B087]/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#A3B087]" />
                </div>
                <div className="text-right">
                  <p className="text-2xl md:text-3xl font-bold">{stats.activitiesJoined}</p>
                  <p className="text-sm text-muted-foreground">Joined</p>
                </div>
              </div>
              <p className="text-sm font-medium">Activities Joined</p>
            </div>
          </TiltCard>

          {/* Activities Created */}
          <TiltCard intensity={10} scale={1.05}>
            <div className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:bg-card/80 hover:border-border transition-all duration-300 hover:shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#A3B087]/20 flex items-center justify-center">
                  <PlusCircle className="w-5 h-5 text-[#A3B087]" />
                </div>
                <div className="text-right">
                  <p className="text-2xl md:text-3xl font-bold">{stats.activitiesCreated}</p>
                  <p className="text-sm text-muted-foreground">Created</p>
                </div>
              </div>
              <p className="text-sm font-medium">Activities Created</p>
            </div>
          </TiltCard>

          {/* Friends */}
          <TiltCard intensity={10} scale={1.05}>
            <div className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:bg-card/80 hover:border-border transition-all duration-300 hover:shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#A3B087]/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#A3B087]" />
                </div>
                <div className="text-right">
                  <p className="text-2xl md:text-3xl font-bold">{stats.friendCount}</p>
                  <p className="text-sm text-muted-foreground">Connected</p>
                </div>
              </div>
              <p className="text-sm font-medium">Friends</p>
            </div>
          </TiltCard>

          {/* Friend Requests */}
          <Link to="/friends">
            <TiltCard intensity={10} scale={1.05}>
              <div className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:bg-card/80 hover:border-border transition-all duration-300 hover:shadow-xl cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#A3B087]/20 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-[#A3B087]" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl md:text-3xl font-bold">{stats.pendingInvitations}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </div>
                <p className="text-sm font-medium">Friend Requests</p>
              </div>
            </TiltCard>
          </Link>
        </motion.div>

        {/* Main content grid with proper responsive layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Recent Activities - Left column */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            <h2 className="text-xl md:text-2xl font-bold font-bold">
              Recent Activity
            </h2>
            
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const isCreator = activity.creator?._id === currentUser?.id || activity.creator === currentUser?.id;
                
                return (
                  <div 
                    key={activity._id} 
                    className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:bg-card/80 hover:border-border transition-all duration-300 hover:shadow-xl"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{activity.title}</h3>
                          {isCreator && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                              Creator
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                        {new Date(activity.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed line-clamp-2 mb-4">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button 
                        asChild 
                        variant="ghost" 
                        size="sm"
                        className="text-primary hover:text-primary/80 hover:bg-primary/10 p-0 h-auto font-medium"
                      >
                        <Link to={`/activities/${activity._id}`}>
                          {isCreator ? 'Manage Activity' : 'View Details'} →
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              {recentActivities.length === 0 && (
                <div className="bg-card/30 rounded-2xl p-8 text-center border border-border/30">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No recent activity. Time to join something exciting!</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Friend Recommendations - Right column */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold font-bold">
              Friend Recommendations
            </h2>
            
            <div className="space-y-4">
              {recommendedFriends.map((friend) => (
                <div 
                  key={friend._id} 
                  className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 hover:bg-card/80 hover:border-border transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={friend.profilePicture} />
                      <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                        {friend.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/profile/${friend._id}`} 
                        className="font-semibold text-sm hover:text-primary transition-colors"
                      >
                        {friend.username}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {friend.similarityScore}% match
                      </p>
                    </div>
                  </div>
                  
                  {friend.sharedInterests && friend.sharedInterests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {friend.sharedInterests.slice(0, 2).map((interest, idx) => (
                        <span 
                          key={idx} 
                          className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                        >
                          {interest.value}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <Button 
                    size="sm" 
                    onClick={() => sendFriendRequestById(friend._id)} 
                    className="w-full min-h-8  text-white font-medium rounded-lg"
                  >
                    <UserPlus className="w-4 h-4 mr-2" /> 
                    Add Friend
                  </Button>
                </div>
              ))}
              
              {recommendedFriends.length === 0 && (
                <div className="bg-card/30 rounded-2xl p-6 text-center border border-border/30">
                  <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No friend recommendations available.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Recommended Activities section */}
        <motion.div variants={itemVariants} className="mt-8 md:mt-12">
          <h2 className="text-xl md:text-2xl font-bold font-bold mb-6">
            Recommended Activities
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {recommendedActivities.map((activity) => (
              <div 
                key={activity._id} 
                className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden hover:bg-card/80 hover:border-border transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                {activity.image && (
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={activity.image} 
                      alt={activity.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-full">
                      {activity.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold mb-2">{activity.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                    {activity.description}
                  </p>
                  
                  <Button 
                    asChild 
                    variant="ghost" 
                    size="sm"
                    className="text-primary hover:text-primary/80 hover:bg-primary/10 p-0 h-auto font-medium"
                  >
                    <Link to={`/activities/${activity._id}`}>
                      View Details →
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {recommendedActivities.length === 0 && (
            <div className="bg-card/30 rounded-2xl p-8 text-center border border-border/30">
              <PlusCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No recommended activities at the moment.</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </BeautifulBackground>
  );
};

export default Dashboard;
