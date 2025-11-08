import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../core/AuthContext';
import DarkModeToggle from './DarkModeToggle';
import { Button } from '../ui/button';
import { Menu, X, User, LogOut, Home, Compass, Users, MessageSquare } from 'lucide-react';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, currentUser, logout } = useAuth();
  const location = useLocation();

  // High-performance scroll handler
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

  const navLinks = useMemo(() => [
    { path: '/dashboard', label: 'Dashboard', icon: Home, auth: true },
    { path: '/activities', label: 'Activities', icon: Compass, auth: true },
    { path: '/friends', label: 'Friends', icon: Users, auth: true },
    { path: '/messages', label: 'Messages', icon: MessageSquare, auth: true },
  ], []);

  // Memoize nav bar classes to prevent recalculation
  const navBarClasses = useMemo(() => {
    return scrolled || !isHomePage 
      ? 'bg-background/80 backdrop-blur-lg border-b border-border/50' 
      : 'bg-transparent border-b border-transparent';
  }, [scrolled, isHomePage]);

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBarClasses}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
    >
      {/* Main navbar container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo section */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 group"
          >
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg md:text-xl">P</span>
            </div>
            <span className="font-heading font-bold text-lg md:text-xl gradient-text">
              PeerConnect
            </span>
          </Link>

          {/* Desktop navigation - CLEAN & PERFORMANT */}
          <div className="hidden md:block">
            <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  (!link.auth || isAuthenticated) && (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`
                        flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm
                        transition-all duration-200 relative group
                        ${isActive
                          ? 'bg-primary text-white shadow-md'
                          : 'text-foreground hover:bg-muted/60'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{link.label}</span>
                    </Link>
                  )
                );
              })}
            </div>
          </div>

          {/* Desktop auth section - CLEAN & MINIMAL */}
          <div className="hidden md:flex items-center gap-4">
            <DarkModeToggle />
            
            {isAuthenticated ? (
              <>
                <Link 
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-primary/5 transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-bold text-foreground">{getUserDisplayName()}</span>
                </Link>
                
                <Button
                  onClick={handleLogout}
                  className="px-5 h-10 rounded-lg font-semibold text-sm bg-destructive/80 hover:bg-destructive text-white transition-all duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="h-10 px-5 rounded-lg font-semibold text-sm hover:bg-muted/60 transition-all duration-200"
                >
                  <Link to="/login">Login</Link>
                </Button>
                <Button
                  asChild
                  className="h-10 px-5 rounded-lg font-semibold text-sm btn-gradient-primary text-white transition-all duration-200"
                >
                  <Link to="/register">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <DarkModeToggle />
            {isAuthenticated && (
              <Button
                onClick={toggleMobileMenu}
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu - CLEAN & PERFORMANT */}
      <AnimatePresence>
        {mobileMenuOpen && isAuthenticated && (
          <>
            <motion.div
              className="fixed inset-0 bg-background/40 backdrop-blur-sm z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            
            <motion.div
              className="fixed top-16 left-0 right-0 bg-background border-b border-border/50 z-50 md:hidden"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="px-4 py-4 space-y-2 max-w-md">
                
                {/* User profile card - mobile */}
                <Link 
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 hover:bg-primary/5 transition-all duration-200 mb-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-semibold text-sm">{getUserDisplayName()}</p>
                </Link>

                {/* Mobile navigation links */}
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    (!link.auth || isAuthenticated) && (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm
                          transition-all duration-200
                          ${isActive
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-foreground hover:bg-muted/60'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{link.label}</span>
                      </Link>
                    )
                  );
                })}

                {/* Mobile logout button */}
                <Button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full mt-2 px-4 py-2.5 rounded-lg font-semibold text-sm bg-destructive/80 hover:bg-destructive text-white transition-all duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
