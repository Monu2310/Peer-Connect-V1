import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const { isDarkMode } = useTheme();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.3,
        when: "beforeChildren" 
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className={`floating-shape-1 absolute top-20 right-10 w-40 h-40 ${isDarkMode ? 'bg-gradient-to-br from-purple-600/10 to-indigo-700/10' : 'bg-gradient-to-br from-purple-300/20 to-indigo-400/20'} rounded-full blur-2xl animate-float`}></div>
        <div className={`floating-shape-2 absolute bottom-40 left-10 w-64 h-64 ${isDarkMode ? 'bg-gradient-to-tr from-blue-600/10 to-cyan-700/10' : 'bg-gradient-to-tr from-blue-300/20 to-cyan-400/20'} rounded-full blur-3xl animate-pulse-slow`}></div>
        <div className={`floating-shape-3 absolute top-1/2 left-1/3 w-72 h-72 ${isDarkMode ? 'bg-gradient-to-br from-indigo-600/5 to-purple-700/5' : 'bg-gradient-to-br from-indigo-300/10 to-purple-400/10'} rounded-full blur-3xl`}></div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-primary dark:bg-gradient-to-br dark:from-dark-bg dark:to-dark-light transition-colors duration-300">
        <div className="absolute inset-0">
          <div className="bg-primary dark:bg-transparent h-1/3 sm:h-2/3"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-12 pb-20 sm:pt-16 sm:pb-24">
            {/* Navigation */}
            <nav className="flex justify-between items-center mb-16">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="text-white font-bold text-2xl"
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                  PeerConnect
                </span>
              </motion.div>
            </nav>

            {/* Hero Content */}
            <motion.div 
              className="text-center"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.h1 
                className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl"
                variants={itemVariants}
              >
                <span className="block xl:inline">Connect with peers who</span>{' '}
                <span className="block text-indigo-200 xl:inline">share your interests</span>
              </motion.h1>
              <motion.p 
                className="mt-3 max-w-md mx-auto text-base text-gray-100 dark:text-gray-200 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl"
                variants={itemVariants}
              >
                Find, join, or create activities with like-minded individuals. Whether it's studying, sports,
                gaming, or just hanging out – PeerConnect makes it easy to find your community.
              </motion.p>
              <motion.div 
                className="mt-8 sm:flex sm:justify-center"
                variants={itemVariants}
              >
                <motion.div 
                  className="rounded-md shadow"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/register"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary dark:text-white bg-white dark:bg-primary/90 hover:bg-gray-100 dark:hover:bg-primary md:py-4 md:text-lg md:px-10 transition-all"
                  >
                    Get Started
                  </Link>
                </motion.div>
                <motion.div 
                  className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 md:py-4 md:text-lg md:px-10 transition-all"
                  >
                    Log In
                  </Link>
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="mt-12"
                variants={itemVariants}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
              >
                <div className="relative max-w-lg mx-auto">
                  <motion.div 
                    className="relative"
                    whileHover={{ y: -5, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
                  >
                    <div className="w-full rounded-lg shadow-xl overflow-hidden transform transition-all glassmorphism">
                      <img
                        className="w-full object-cover"
                        src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80"
                        alt="People collaborating"
                      />
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-light-bg dark:bg-dark-bg transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h2 
              className="text-3xl font-extrabold tracking-tight gradient-text sm:text-4xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              How PeerConnect Works
            </motion.h2>
            <motion.p 
              className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Discover the easiest way to find and connect with peers
            </motion.p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <motion.div
                className="card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ y: -5, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
              >
                <div className="p-6">
                  <div className="text-primary dark:text-blue-400 text-2xl mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Discover Activities</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Browse activities in your area that match your interests, whether academic, recreational, or professional.
                  </p>
                </div>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                className="card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ y: -5, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
              >
                <div className="p-6">
                  <div className="text-primary dark:text-blue-400 text-2xl mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Connect with Peers</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Join activities and instantly connect with like-minded peers who share your passions and goals.
                  </p>
                </div>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                className="card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
                whileHover={{ y: -5, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
              >
                <div className="p-6">
                  <div className="text-primary dark:text-blue-400 text-2xl mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Create Your Own</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Start your own activities and invite others to join. Set your preferences and find the perfect match.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary dark:bg-gradient-to-br dark:from-dark-bg dark:to-dark-light">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            <span className="block">Ready to dive in?</span>
            <span className="block text-indigo-200">Start your journey today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <motion.div 
              className="inline-flex rounded-md shadow"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary dark:text-white bg-white dark:bg-primary/90 hover:bg-gray-50 dark:hover:bg-primary transition-all"
              >
                Get started
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-dark-bg border-t border-transparent dark:border-dark-border">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-400">
            &copy; 2025 PeerConnect. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;