import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getActivities } from '../api/activityService';
import PageTransition from '../components/effects/PageTransition';
import MetallicCard from '../components/effects/MetallicCard';
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
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">
              Discover Activities
            </h1>
            <p className="text-gray-600">Connect with peers through exciting activities</p>
          </div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <Link 
              to="/activities/new" 
              className="mt-4 md:mt-0 px-5 py-2 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-lg shadow-lg inline-flex items-center hover:shadow-xl transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Activity
            </Link>
          </motion.div>
        </motion.div>

        {error && (
          <motion.div 
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            role="alert"
          >
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Search and Filters Section */}
        <MetallicCard className="mb-8" intensity={0.05}>
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Search Bar */}
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <motion.input
                  type="text"
                  placeholder="Search activities..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  initial={{ scale: 0.98 }}
                  whileFocus={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                />
              </div>

              {/* Filter Toggle Button */}
              <motion.button
                className="flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 whitespace-nowrap"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters {isFilterOpen ? '▲' : '▼'}
              </motion.button>
            </div>

            <AnimatePresence>
              {isFilterOpen && (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 overflow-hidden"
                  variants={filterVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                    <select
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="alphabetical">Alphabetical</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </MetallicCard>

        {/* Activities Grid */}
        {filteredActivities.length === 0 ? (
          <motion.div 
            className="text-center py-16 bg-gray-50 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 14h.01M19 21L5 3" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No activities found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
            <motion.button 
              className="px-4 py-2 bg-primary text-white rounded-md shadow-lg hover:bg-primary-dark"
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
          >
            {filteredActivities.map((activity) => (
              <motion.div 
                key={activity._id} 
                variants={itemVariants} 
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <MetallicCard className="h-full overflow-hidden">
                  <div className="relative">
                    <div className="h-48 bg-gray-200 relative overflow-hidden">
                      {activity.image ? (
                        <motion.img 
                          src={activity.image} 
                          alt={activity.title} 
                          className="w-full h-full object-cover"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.5 }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0"
                        whileHover={{ opacity: 1 }}
                      />
                      <motion.span 
                        className="absolute top-3 right-3 bg-primary/80 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        {activity.category}
                      </motion.span>
                    </div>
                    
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-gray-800 hover:text-primary transition-colors line-clamp-1">
                          {activity.title}
                        </h3>
                        <motion.div 
                          className="flex items-center text-gray-500 text-sm"
                          whileHover={{ scale: 1.1 }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {activity.participants ? activity.participants.length : 0}
                        </motion.div>
                      </div>
                      
                      <div className="flex flex-col space-y-2 mb-4">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {activity.description}
                        </p>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(activity.date)}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                          className="block w-full text-center py-2.5 px-4 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-md transition-all shadow-md hover:shadow-lg font-medium"
                        >
                          View Details
                        </Link>
                      </motion.div>
                    </div>
                  </div>
                </MetallicCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
};

export default Activities;