import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import DarkModeToggle from './DarkModeToggle';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, currentUser, logout } = useAuth();
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
  };

  const getUserDisplayName = () => {
    if (!currentUser) return '';
    return currentUser.name || currentUser.username || '';
  };
  
  // Different styling for home page
  const isHomePage = location.pathname === '/';
  
  // Navbar styling variations
  const navbarClasses = `fixed w-full z-10 transition-all duration-300 ease-in-out ${
    scrolled 
      ? 'bg-white dark:bg-dark-card shadow-md' 
      : isHomePage 
        ? 'bg-transparent' 
        : 'bg-primary dark:bg-dark-card'
  }`;

  // Link styling variations
  const linkClasses = `text-${scrolled || !isHomePage ? 'gray-700 dark:text-dark-text' : 'white'} hover:${scrolled || !isHomePage ? 'bg-gray-100 dark:bg-dark-light' : 'bg-primary/30'} nav-link`;

  return (
    <nav className={navbarClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <motion.span 
                  className={`font-bold text-xl text-black${
                    scrolled || !isHomePage 
                      ? 'gradient-text' 
                      : 'text-white'
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  PeerConnect
                </motion.span>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  to="/dashboard"
                  className={linkClasses}
                >
                  Dashboard
                </Link>
                <Link
                  to="/activities"
                  className={linkClasses}
                >
                  Activities
                </Link>
                {isAuthenticated && (
                  <>
                    <Link
                      to="/activities/new"
                      className={linkClasses}
                    >
                      Create Activity
                    </Link>
                    <Link
                      to="/friends"
                      className={linkClasses}
                    >
                      Friends
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {/* Dark Mode Toggle */}
              <DarkModeToggle />
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-4 ml-4">
                  <motion.span 
                    className={`${scrolled || !isHomePage ? 'text-gray-700 dark:text-dark-text' : 'text-white'}`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {getUserDisplayName()}
                  </motion.span>
                  <motion.button
                    onClick={handleLogout}
                    className={`${
                      scrolled || !isHomePage 
                        ? 'bg-primary text-white dark:bg-primary/80' 
                        : 'bg-white text-primary'
                    } px-4 py-2 rounded-md font-medium hover:opacity-90`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Logout
                  </motion.button>
                </div>
              ) : (
                <div className="space-x-4">
                  <motion.span whileHover={{ scale: 1.05 }} className="inline-block">
                    <Link
                      to="/login"
                      className={`${
                        scrolled || !isHomePage 
                          ? 'text-gray-700 dark:text-dark-text' 
                          : 'text-white'
                      } px-3 py-2 rounded-md font-medium hover:opacity-80`}
                    >
                      Login
                    </Link>
                  </motion.span>
                  <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                    <Link
                      to="/register"
                      className={`${
                        scrolled || !isHomePage
                          ? 'bg-primary text-white dark:bg-primary/80' 
                          : 'bg-white text-primary'
                      } px-4 py-2 rounded-md font-medium hover:opacity-90`}
                    >
                      Sign Up
                    </Link>
                  </motion.span>
                </div>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            {/* Dark Mode Toggle for Mobile */}
            <DarkModeToggle />
            
            <button
              type="button"
              onClick={toggleMobileMenu}
              className={`inline-flex items-center justify-center p-2 rounded-md ${
                scrolled || !isHomePage
                  ? 'text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-light' 
                  : 'text-white hover:bg-primary/30'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!mobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div
        className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden`}
        id="mobile-menu"
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-dark-card shadow-md">
          <Link
            to="/dashboard"
            className={`block px-3 py-2 rounded-md font-medium ${
              scrolled || !isHomePage
                ? 'text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-light'
                : 'text-white hover:bg-primary/30'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            to="/activities"
            className={`block px-3 py-2 rounded-md font-medium ${
              scrolled || !isHomePage
                ? 'text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-light'
                : 'text-white hover:bg-primary/30'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Activities
          </Link>
          {isAuthenticated && (
            <>
              <Link
                to="/activities/new"
                className={`block px-3 py-2 rounded-md font-medium ${
                  scrolled || !isHomePage
                    ? 'text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-light'
                    : 'text-white hover:bg-primary/30'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Create Activity
              </Link>
              <Link
                to="/friends"
                className={`block px-3 py-2 rounded-md font-medium ${
                  scrolled || !isHomePage
                    ? 'text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-light'
                    : 'text-white hover:bg-primary/30'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Friends
              </Link>
            </>
          )}
          {isAuthenticated ? (
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-md font-medium ${
                scrolled || !isHomePage
                  ? 'text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-light'
                  : 'text-white hover:bg-primary/30'
              }`}
            >
              Logout
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className={`block px-3 py-2 rounded-md font-medium ${
                  scrolled || !isHomePage
                    ? 'text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-light'
                    : 'text-white hover:bg-primary/30'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={`block px-3 py-2 rounded-md font-medium ${
                  scrolled || !isHomePage
                    ? 'text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-light'
                    : 'text-white hover:bg-primary/30'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;