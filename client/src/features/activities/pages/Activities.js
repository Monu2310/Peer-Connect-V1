import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getActivities } from '../api/activityService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { PlusCircle, Search as SearchIcon, Filter, SortAsc, Calendar, MapPin, Users } from 'lucide-react';
import SkeletonCard from '../components/ui/SkeletonCard';
import { motion, AnimatePresence } from 'framer-motion';

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [categories, setCategories] = useState([]);

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

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const data = await getActivities();
        setActivities(data);
        setFilteredActivities(data);
        const uniqueCategories = [...new Set(data.map(activity => activity.category))];
        setCategories(uniqueCategories);
        setLoading(false);
      } catch (err) {
        setError('Failed to load activities.');
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-6 lg:p-8">
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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-6 lg:p-8">
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
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-background to-muted/20 relative"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[15%] right-[5%] w-64 h-64 md:w-80 md:h-80 bg-gradient-to-r from-primary/15 to-accent/15 rounded-full blur-3xl" />
        <div className="absolute bottom-[25%] left-[10%] w-48 h-48 md:w-64 md:h-64 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8 md:mb-12">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text">
              Activities
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Discover and join activities near you.
            </p>
          </div>
          
          <Button 
            asChild 
            className="min-h-12 btn-gradient-primary text-white font-semibold px-6 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all duration-300 self-start"
          >
            <Link to="/activities/new" className="flex items-center gap-3">
              <PlusCircle className="w-5 h-5" /> 
              Create Activity
            </Link>
          </Button>
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4 mb-8 md:mb-12">
          
          {/* Search input */}
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search activities by title, description, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 h-12 bg-card/50 border-border/50 rounded-xl focus:bg-card focus:border-border transition-all duration-200"
            />
          </div>
          
          {/* Category filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-48 h-12 bg-card/50 border-border/50 rounded-xl focus:bg-card focus:border-border">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Category" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Sort options */}
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-full md:w-48 h-12 bg-card/50 border-border/50 rounded-xl focus:bg-card focus:border-border">
              <div className="flex items-center gap-2">
                <SortAsc className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent>
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
              {filteredActivities.map((activity) => (
                <motion.div 
                  key={activity._id}
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
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
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{activity.participants?.length || 0} joined</span>
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
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="no-activities"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="text-center py-16"
            >
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 max-w-md mx-auto">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <SearchIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                
                <h2 className="text-xl font-semibold mb-2">No activities found</h2>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search terms or filters, or create a new activity.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => {
                      setSearchTerm('');
                      setCategoryFilter('all');
                      setSortOption('newest');
                    }}
                    variant="outline"
                    className="min-h-10"
                  >
                    Clear Filters
                  </Button>
                  <Button 
                    asChild 
                    className="min-h-10 btn-gradient-primary"
                  >
                    <Link to="/activities/new" className="flex items-center gap-2">
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
  );
};

export default Activities;
