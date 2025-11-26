import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getActivities } from '../api/activityService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { PlusCircle, Search as SearchIcon, Filter, SortAsc, Calendar, MapPin, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BeautifulBackground from '../components/effects/BeautifulBackground';
import { useAuth } from '../core/AuthContext';
import { Badge } from '../components/ui/badge';
import TiltCard from '../components/effects/TiltCard';
import MagneticButton from '../components/effects/MagneticButton';

const Activities = () => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [categories, setCategories] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 24, opacity: 0 },
    show: { 
      y: 0, 
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  // Refresh when navigating back with refresh state
  useEffect(() => {
    if (location.state?.refresh) {
      setRefreshTrigger(prev => prev + 1);
    }
  }, [location]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('Fetching activities...');
        const data = await getActivities();
        console.log('Activities fetched:', data);
        
        // Ensure data is an array
        const activitiesArray = Array.isArray(data) ? data : [];
        
        setActivities(activitiesArray);
        setFilteredActivities(activitiesArray);
        const uniqueCategories = [...new Set(activitiesArray.map(activity => activity.category))];
        setCategories(uniqueCategories);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch activities. Please try again.');
        setLoading(false);
      }
    };

    fetchActivities();
  }, [refreshTrigger]);

  useEffect(() => {
    let result = activities
      .filter(activity =>
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(activity => categoryFilter === 'all' || activity.category === categoryFilter);

    if (sortOption === 'newest') {
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortOption === 'oldest') {
      result.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortOption === 'alphabetical') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    setFilteredActivities(result);
  }, [searchTerm, categoryFilter, sortOption, activities]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="w-full max-w-7xl mx-auto">
          
          {/* Loading header */}
          <div className="mb-8 md:mb-12">
            <div className="h-8 bg-muted/50 rounded-lg w-48 mb-2" />
            <div className="h-5 bg-muted/50 rounded-lg w-64" />
          </div>

          {/* Loading filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="h-12 bg-muted/50 rounded-xl flex-1" />
            <div className="h-12 bg-muted/50 rounded-xl w-full md:w-48" />
            <div className="h-12 bg-muted/50 rounded-xl w-full md:w-48" />
          </div>

          {/* Loading grid */}
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="show" 
            className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[...Array(6)].map((_, i) => (
              <motion.div variants={itemVariants} key={i}>
                <div className="bg-card/50 rounded-2xl p-6 border border-border/50 h-80">
                  <div className="h-6 bg-muted/50 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted/50 rounded w-1/2 mb-4" />
                  <div className="h-32 bg-muted/50 rounded-xl mb-4" />
                  <div className="h-4 bg-muted/50 rounded w-full mb-2" />
                  <div className="h-4 bg-muted/50 rounded w-2/3" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="w-full max-w-4xl mx-auto text-center">
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-destructive mb-4">Something went wrong</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-6 min-h-12"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BeautifulBackground>
      <motion.div
        className="relative z-0 w-full"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          
          {/* Header Section */}
          <motion.div variants={itemVariants} className="pt-6 md:pt-8 pb-6 md:pb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text">
              Activities
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Discover and join activities near you.
            </p>
          </div>
          
          <MagneticButton strength={0.3}>
            <Button 
              asChild 
              className="min-h-12 btn-gradient-primary text-white font-semibold px-6 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all duration-300 self-start"
            >
              <Link to="/activities/new" className="flex items-center gap-3">
                <PlusCircle className="w-5 h-5" /> 
                Create Activity
              </Link>
            </Button>
          </MagneticButton>
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-3 mb-8 md:mb-12">
          
          {/* Search input - CLEAN & READABLE */}
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-2.5 h-11 bg-background border border-border/50 rounded-lg font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
            />
          </div>
          
          {/* Category filter - CLEAN & CONSISTENT */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-40 h-11 bg-background border border-border/50 rounded-lg font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary hover:border-border transition-all duration-200">
              <div className="flex items-center gap-2 text-foreground">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Category" />
              </div>
            </SelectTrigger>
            <SelectContent side="bottom" align="start" className="bg-background border border-border rounded-lg overflow-y-auto max-h-60">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Sort options - CLEAN & CONSISTENT */}
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-full md:w-40 h-11 bg-background border border-border/50 rounded-lg font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary hover:border-border transition-all duration-200">
              <div className="flex items-center gap-2 text-foreground">
                <SortAsc className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent side="bottom" align="start" className="bg-background border border-border rounded-lg overflow-y-auto max-h-60">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Results counter */}
        <motion.div variants={itemVariants} className="mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'} found
          </p>
        </motion.div>

        {/* Activities Grid or Empty State */}
        <AnimatePresence mode="wait">
          {filteredActivities.length > 0 ? (
            <motion.div 
              key="activity-grid"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredActivities.map((activity) => {
                const participantsCount = activity.participants?.length || 0;
                const maxParticipants = activity.maxParticipants || null;
                const spotsLeft = maxParticipants ? Math.max(maxParticipants - participantsCount, 0) : null;
                const isFull = Boolean(maxParticipants) && spotsLeft === 0;
                const isCreator = currentUser && (activity.creator?._id === currentUser.id || activity.creator === currentUser.id);
                const hasJoined = currentUser && activity.participants?.some(participant => {
                  const participantId = participant?._id || participant;
                  return participantId === currentUser.id;
                });

                return (
                <motion.div 
                  key={activity._id}
                  variants={itemVariants}
                >
                  <TiltCard intensity={8} scale={1.03}>
                    <div className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden h-full hover:bg-card/80 hover:border-border transition-all duration-300 hover:shadow-xl">
                    
                    {/* Activity image */}
                    {activity.image && (
                      <div className="aspect-video overflow-hidden">
                        <img 
                          src={activity.image} 
                          alt={activity.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      </div>
                    )}
                    
                    {/* Card content */}
                    <div className="p-6 flex flex-col h-full">
                      
                      {/* Category and date */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-medium">
                          {activity.category}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {new Date(activity.date).toLocaleDateString()}
                        </div>
                        {(isCreator || hasJoined || isFull) && (
                          <Badge className={`${isCreator ? 'bg-primary/15 text-primary' : isFull ? 'bg-destructive/15 text-destructive' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'} text-[0.65rem] font-semibold px-2 py-0.5`}> 
                            {isCreator ? 'You host' : isFull ? 'Full' : 'Joined'}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Title */}
                      <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                        {activity.title}
                      </h3>
                      
                      {/* Location */}
                      {activity.location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-1">{activity.location}</span>
                        </div>
                      )}
                      
                      {/* Description */}
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4 flex-1">
                        {activity.description}
                      </p>
                      
                      {/* Participants and action */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{participantsCount}{maxParticipants ? ` / ${maxParticipants}` : ''}</span>
                          </span>
                          {spotsLeft !== null && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isFull ? 'bg-destructive/15 text-destructive' : 'bg-primary/10 text-primary'}`}>
                              {isFull ? 'No spots left' : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}
                            </span>
                          )}
                        </div>
                        
                        <Button 
                          asChild 
                          variant="ghost" 
                          size="sm"
                          className="text-primary hover:text-primary/80 hover:bg-primary/10 font-medium"
                        >
                          <Link to={`/activities/${activity._id}`}>
                            View Details →
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                  </TiltCard>
                </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div 
              key="no-activities"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="flex items-center justify-center py-8"
            >
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 max-w-md w-full">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SearchIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                
                <h2 className="text-lg font-semibold mb-2 text-center">No activities found</h2>
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  Try adjusting your search terms or filters, or create a new activity.
                </p>
                
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={() => {
                      setSearchTerm('');
                      setCategoryFilter('all');
                      setSortOption('newest');
                    }}
                    variant="outline"
                    className="h-10 w-full"
                  >
                    Clear Filters
                  </Button>
                  <Button 
                    asChild 
                    className="h-10 btn-gradient-primary w-full"
                  >
                    <Link to="/activities/new" className="flex items-center justify-center gap-2">
                      <PlusCircle className="w-4 h-4" /> 
                      Create Activity
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </motion.div>
    </BeautifulBackground>
  );
};

export default Activities;
