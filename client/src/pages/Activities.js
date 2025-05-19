import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getActivities } from '../api/activityService';
import PageTransition from '../components/effects/PageTransition';
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const data = await getActivities();
        setActivities(data);
        setFilteredActivities(data);

        // Extract unique categories
        const uniqueCategories = [...new Set(data.map(activity => activity.category))];
        setCategories(uniqueCategories);

        setLoading(false);
        setError(''); // Clear any existing errors when successful
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Failed to load activities. Please try again later.');
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [searchTerm, categoryFilter, sortOption, activities]);

  const filterActivities = () => {
    let result = [...activities];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        activity =>
          activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter(activity => activity.category === categoryFilter);
    }

    // Apply sorting
    if (sortOption === 'newest') {
      result = result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortOption === 'oldest') {
      result = result.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortOption === 'alphabetical') {
      result = result.sort((a, b) => a.title.localeCompare(b.title));
    }

    setFilteredActivities(result);
  };

  const formatDate = (dateString) => {
    const options = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,  // Reduced from 0.1 for faster loading
        delayChildren: 0.1,     // Reduced from 0.2 for faster initial display
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
        stiffness: 200,  // Increased from 100 for faster animation
        damping: 10      // Adjusted for smoother animation
      }
    }
  };

  const filterVariants = {
    closed: { 
      height: 0,
      opacity: 0,
      transition: { 
        duration: 0.3,
        ease: "easeInOut" 
      }
    },
    open: { 
      height: "auto",
      opacity: 1,
      transition: { 
        duration: 0.5,
        ease: "easeInOut" 
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <motion.div 
            className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          />
          <motion.p 
            className="mt-4 text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Discovering activities...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Enhanced Header Section */}
        <motion.div 
          className="relative mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl overflow-hidden shadow-sm"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/5 rounded-full -ml-20 -mb-20"></div>
          
          <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-indigo-600">
                Discover Activities
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Connect with peers through exciting activities in your community
              </p>
            </div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="self-start md:self-center"
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <Link 
                to="/activities/new" 
                className="px-6 py-3 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-lg shadow-lg inline-flex items-center hover:shadow-xl transition-all font-medium"
                aria-label="Create a new activity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Activity
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {error && (
          <motion.div 
            className="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 mb-6 rounded-lg shadow-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            role="alert"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex items-center mb-3 md:mb-0">
                <svg className="h-6 w-6 text-red-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-lg">{error}</p>
                  <p className="text-sm text-red-600 mt-1">The server might be unavailable or the connection might be disrupted.</p>
                </div>
              </div>
              <motion.button 
                onClick={() => {
                  setLoading(true);
                  setError('');
                  // Force a fetch of activities after a short delay
                  setTimeout(async () => {
                    try {
                      const data = await getActivities();
                      setActivities(data);
                      setFilteredActivities(data);
                      const uniqueCategories = [...new Set(data.map(activity => activity.category))];
                      setCategories(uniqueCategories);
                      setLoading(false);
                    } catch (err) {
                      console.error('Error retrying fetch activities:', err);
                      setError('Failed to load activities. Please try again later.');
                      setLoading(false);
                    }
                  }, 1000);
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center justify-center transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Search and Filters */}
        <motion.div 
          className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              {/* Search Bar */}
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <motion.input
                  type="text"
                  placeholder="Search activities by title, description or location..."
                  className="block w-full pl-10 pr-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  initial={{ scale: 0.98 }}
                  whileFocus={{ scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                />
              </div>

              <div className="flex flex-row gap-3">
                {/* Category Filter Dropdown */}
                <div className="w-full md:w-48">
                  <select
                    className="block w-full px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Dropdown */}
                <div className="w-full md:w-48">
                  <select
                    className="block w-full px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="alphabetical">Alphabetical</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Activities Grid */}
        {filteredActivities.length === 0 ? (
          <motion.div 
            className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 14h.01M19 21L5 3" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No activities found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Try adjusting your search or filters</p>
            <motion.button 
              className="px-5 py-2 bg-primary text-white rounded-lg shadow-lg hover:bg-primary-dark transition-colors"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setSortOption('newest');
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear Filters
            </motion.button>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            onAnimationStart={() => document.querySelectorAll('.activity-card').forEach(el => el.style.opacity = 1)}
          >
            {filteredActivities.map((activity) => (
              <motion.div 
                key={activity._id} 
                variants={itemVariants} 
                whileHover={{ y: -5 }}
                className="activity-card"
                style={{ opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="h-full overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                  <div className="relative">
                    <div className="h-52 bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800 relative overflow-hidden">
                      {activity.image ? (
                        <motion.img 
                          src={activity.image} 
                          alt={activity.title} 
                          className="w-full h-full object-cover"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.5 }}
                          onError={(e) => {
                            console.error("Image failed to load:", activity.image);
                            e.target.onerror = null;
                            e.target.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiI+PC9yZWN0PjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ij48L2NpcmNsZT48cG9seWxpbmUgcG9pbnRzPSIyMSAxNSAxNiAxMCA1IDIxIj48L3BvbHlsaW5lPjwvc3ZnPg==";
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0"
                        whileHover={{ opacity: 1 }}
                      />
                      <motion.span 
                        className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        {activity.category}
                      </motion.span>
                    </div>
                    
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 hover:text-primary transition-colors line-clamp-1">
                          {activity.title}
                        </h3>
                        <motion.div 
                          className="flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-700 dark:text-gray-200 text-sm"
                          whileHover={{ scale: 1.1 }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {activity.participants ? activity.participants.length : 0}
                        </motion.div>
                      </div>
                      
                      <div className="flex flex-col space-y-3 mb-5">
                        <p className="text-gray-600 dark:text-gray-300 line-clamp-2">
                          {activity.description}
                        </p>
                        
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(activity.date)}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {activity.location}
                        </div>
                      </div>
                      
                      <motion.div 
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Link 
                          to={`/activities/${activity._id}`} 
                          className="block w-full text-center py-2.5 px-4 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium dark:shadow-gray-900/30"
                        >
                          View Details
                        </Link>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
};

export default Activities;