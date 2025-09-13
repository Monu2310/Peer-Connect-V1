import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import DarkModeToggle from './DarkModeToggle';
import { Button } from '../ui/button';
import { Menu, X, User, LogOut } from 'lucide-react';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, currentUser, logout } = useAuth();
  const location = useLocation();

  // Handle scroll effect with proper debouncing
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const getUserDisplayName = () => {
    if (!currentUser) return '';
    return currentUser.name || currentUser.username || '';
  };
  
  const isHomePage = location.pathname === '/';

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', auth: true },
    { path: '/activities', label: 'Activities', auth: true },
    { path: '/friends', label: 'Friends', auth: true },
    { path: '/messages', label: 'Messages', auth: true },
  ];

  return (
    <motion.nav 
      className={`
        fixed top-0 left-0 right-0 z-30 transition-all duration-300
        ${scrolled || !isHomePage 
          ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg' 
          : 'bg-transparent'
        }
      `}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main navbar container with 8pt grid spacing */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo section - Touch-friendly */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center space-x-2 group rounded-lg p-2 -m-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
            >
              <motion.div
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-btn-primary flex items-center justify-center shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-white font-bold text-lg md:text-xl drop-shadow-sm">P</span>
              </motion.div>
              <span className="font-heading font-bold text-lg md:text-xl gradient-text">
                PeerConnect
              </span>
            </Link>
          </div>

          {/* Desktop navigation links */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-2">
              {navLinks.map((link) => (
                (!link.auth || isAuthenticated) && (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`
                      relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                      h-10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50
                      ${location.pathname === link.path
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                      }
                    `}
                  >
                    {link.label}
                    {location.pathname === link.path && (
                      <motion.div
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full"
                        layoutId="activeLink"
                        initial={false}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                )
              ))}
            </div>
          </div>

          {/* Desktop auth section and theme toggle */}
          <div className="hidden md:flex items-center space-x-3">
            <DarkModeToggle />
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/profile"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors duration-200 group"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors duration-200">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                    {getUserDisplayName()}
                  </span>
                </Link>
                
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground h-10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-10"
                >
                  <Link to="/login">Login</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="btn-gradient-primary text-white font-semibold h-10 px-6 shadow-md"
                >
                  <Link to="/register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <DarkModeToggle />
            {isAuthenticated && (
              <Button
                onClick={toggleMobileMenu}
                variant="ghost"
                size="sm"
                className="h-10 w-10"
                aria-label="Toggle mobile menu"
              >
                <motion.div
                  animate={{ rotate: mobileMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </motion.div>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && isAuthenticated && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Mobile menu panel */}
            <motion.div
              className="fixed top-16 left-0 right-0 bg-card/95 backdrop-blur-xl border-b border-border/20 shadow-lg z-50 md:hidden"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-4 py-6 space-y-4">
                
                {/* User info for mobile */}
                {isAuthenticated && (
                  <Link 
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors duration-200 mb-4 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors duration-200">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors duration-200">{getUserDisplayName()}</p>
                      <p className="text-sm text-muted-foreground">Tap to view profile</p>
                    </div>
                  </Link>
                )}

                {/* Mobile navigation links */}
                <div className="space-y-2">
                  {navLinks.map((link) => (
                    (!link.auth || isAuthenticated) && (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`
                          block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200
                          h-12
                          ${location.pathname === link.path
                            ? 'text-primary bg-primary/10'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                          }
                        `}
                      >
                        {link.label}
                      </Link>
                    )
                  ))}
                </div>

                {/* Mobile auth buttons */}
                <div className="pt-4 border-t border-border/20">
                  {isAuthenticated ? (
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      className="w-full justify-start h-12"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        asChild
                        variant="ghost"
                        className="w-full h-12"
                      >
                        <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                          Login
                        </Link>
                      </Button>
                      <Button
                        asChild
                        className="w-full btn-gradient-primary text-white font-semibold h-12 shadow-md"
                      >
                        <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                          Sign Up
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
