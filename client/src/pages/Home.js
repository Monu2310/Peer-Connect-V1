import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import PageTransition from '../components/effects/PageTransition';
import gsap from 'gsap';

const Home = () => {
  const { isAuthenticated } = useAuth();

  // GSAP animations for background elements
  useEffect(() => {
    // Animate background shapes
    gsap.to('.floating-shape-1', {
      y: -30,
      x: 20,
      rotation: 10,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });
    
    gsap.to('.floating-shape-2', {
      y: 30,
      x: -15,
      rotation: -5,
      duration: 5,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
      delay: 0.5,
    });
    
    gsap.to('.floating-shape-3', {
      y: -20,
      x: -10,
      rotation: 15,
      duration: 7,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
      delay: 1,
    });
  }, []);

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 10
      }
    }
  };

  return (
    <PageTransition>
      <div className="bg-gray-50 min-h-screen">
        {/* Floating shapes in background */}
        <div className="floating-shape-1 absolute top-20 right-10 w-40 h-40 bg-gradient-to-br from-purple-300/20 to-indigo-400/20 rounded-full blur-2xl"></div>
        <div className="floating-shape-2 absolute bottom-40 left-10 w-64 h-64 bg-gradient-to-tr from-blue-300/20 to-cyan-400/20 rounded-full blur-3xl"></div>
        <div className="floating-shape-3 absolute top-1/2 left-1/3 w-72 h-72 bg-gradient-to-br from-indigo-300/10 to-purple-400/10 rounded-full blur-3xl"></div>

        {/* Hero Section */}
        <div className="relative bg-primary">
          <div className="absolute inset-0">
            <div className="bg-primary h-1/3 sm:h-2/3"></div>
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
                <div className="space-x-4">
                  {isAuthenticated ? (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        to="/dashboard"
                        className="inline-block px-4 py-2 bg-white text-primary rounded-md font-medium hover:bg-gray-100 transition-all shadow-lg shadow-indigo-500/20"
                      >
                        Go to Dashboard
                      </Link>
                    </motion.div>
                  ) : (
                    <div className="space-x-4">
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-block"
                      >
                        <Link
                          to="/login"
                          className="px-4 py-2 text-white font-medium hover:bg-primary-dark rounded-md transition-all"
                        >
                          Login
                        </Link>
                      </motion.span>
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-block"
                      >
                        <Link
                          to="/register"
                          className="px-4 py-2 bg-white text-primary rounded-md font-medium hover:bg-gray-100 transition-all shadow-lg shadow-indigo-500/20"
                        >
                          Sign Up
                        </Link>
                      </motion.span>
                    </div>
                  )}
                </div>
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
                  <span className="block bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">Connect with your</span>
                  <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-white">college peers</span>
                </motion.h1>
                <motion.p
                  className="mt-3 max-w-md mx-auto text-base text-gray-100 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl"
                  variants={itemVariants}
                >
                  Join study groups, sports activities, and social events.
                  Meet new friends who share your interests.
                </motion.p>
                <motion.div 
                  className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8"
                  variants={itemVariants}
                >
                  <motion.div 
                    className="rounded-md shadow"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to="/register"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-white hover:bg-gray-100 md:py-4 md:text-lg md:px-10 transition-all"
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
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 transition-all"
                    >
                      Log In
                    </Link>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="py-16 bg-gray-50 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Features</h2>
              <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
                Everything you need to connect
              </p>
              <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
                PeerConnect makes it easy to find and join activities with other students who share your interests.
              </p>
            </motion.div>

            <div className="mt-16">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {/* Feature 1 */}
                <motion.div
                  className="bg-white rounded-lg shadow-lg overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  whileHover={{ y: -5, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
                >
                  <div className="p-6">
                    <div className="text-primary text-2xl mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Find Study Groups</h3>
                    <p className="mt-2 text-gray-600">
                      Join study groups for your courses or create your own to collaborate with peers.
                    </p>
                  </div>
                </motion.div>

                {/* Feature 2 */}
                <motion.div
                  className="bg-white rounded-lg shadow-lg overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  whileHover={{ y: -5, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
                >
                  <div className="p-6">
                    <div className="text-primary text-2xl mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Join Activities</h3>
                    <p className="mt-2 text-gray-600">
                      Discover and join sports events, clubs, workshops and other campus activities.
                    </p>
                  </div>
                </motion.div>

                {/* Feature 3 */}
                <motion.div
                  className="bg-white rounded-lg shadow-lg overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ y: -5, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
                >
                  <div className="p-6">
                    <div className="text-primary text-2xl mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Real-time Messaging</h3>
                    <p className="mt-2 text-gray-600">
                      Communicate with your peers through real-time messaging and group chats.
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Call to Action Section */}
        <div className="bg-primary">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                <span className="block">Ready to dive in?</span>
                <span className="block text-indigo-100">Start connecting today.</span>
              </h2>
              <p className="mt-4 text-lg leading-6 text-indigo-200">
                Join thousands of students already making connections on campus.
              </p>
            </motion.div>
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
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-white hover:bg-gray-50 transition-all"
                >
                  Get started
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="bg-gray-900">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-400">
              &copy; 2025 PeerConnect. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
};

export default Home;