import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../core/AuthContext';
import DarkModeToggle from './DarkModeToggle';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription
} from '../ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Menu, X, User, LogOut, Home, Compass, Users, MessageSquare, Sparkles } from 'lucide-react';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { isAuthenticated, currentUser, logout } = useAuth();
  const location = useLocation();

  // Mouse tracking for glow effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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

  const openLogoutDialog = (closeMenu = false) => {
    if (closeMenu) {
      setMobileMenuOpen(false);
    }
    setLogoutDialogOpen(true);
  };

  const closeLogoutDialog = () => {
    setLogoutDialogOpen(false);
  };

  const confirmLogout = () => {
    logout();
    setLogoutDialogOpen(false);
    setMobileMenuOpen(false);
  };

  const getUserDisplayName = () => {
    if (!currentUser) return '';
    // Prefer explicit username, then name, then email local-part, finally a safe fallback
    if (currentUser.username) return currentUser.username;
    if (currentUser.name) return currentUser.name;
    if (currentUser.email) return currentUser.email.split('@')[0];
    return 'User';
  };

  const getUserInitials = () => {
    if (!currentUser) return '';
    const name = currentUser.name || currentUser.username || '';
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  };
  const userDisplayName = getUserDisplayName();
  const userInitials = getUserInitials();
  const userEmail = currentUser?.email;
  
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBarClasses} overflow-hidden`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
    >
      {/* Animated glow effect that follows mouse */}
      <motion.div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(circle 600px at ${mousePosition.x}px ${mousePosition.y - window.scrollY}px, hsl(var(--primary) / 0.15), transparent)`
        }}
      />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
          animate={{
            x: ['-100%', '200%']
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ width: '50%', height: '2px', top: 0 }}
        />
      </div>

      {/* Main navbar container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo section - Extraordinary Design */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 group"
            aria-label="Go to home"
          >
            <div className="relative w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-110 overflow-hidden">
              {/* Custom P Logo SVG */}
              <svg className="w-6 h-6 md:w-7 md:h-7 relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 4h8a6 6 0 0 1 6 6v0a6 6 0 0 1-6 6H8v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground"/>
                <circle cx="8" cy="10" r="1.5" fill="currentColor" className="text-primary-foreground opacity-80"/>
              </svg>
              {/* Pulse dot indicator */}
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-secondary rounded-full animate-pulse shadow-sm"></div>
            </div>
            <span className="font-heading font-bold text-lg md:text-xl text-foreground group-hover:text-primary transition-colors duration-300">
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
                  <Avatar className="h-9 w-9 ring-2 ring-primary transition-transform group-hover:scale-105">
                    <AvatarImage src={currentUser?.profilePicture} alt={userDisplayName} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-bold text-foreground group-hover:text-[#A3B087] transition-colors">{userDisplayName}</span>
                </Link>
                
                <Button
                  onClick={() => openLogoutDialog(false)}
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
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
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
                  <Avatar className="h-10 w-10 ring-2 ring-primary">
                    <AvatarImage src={currentUser?.profilePicture} alt={userDisplayName} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-semibold text-sm">{userDisplayName}</p>
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
                  onClick={() => openLogoutDialog(true)}
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

      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl p-0 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <LogOut className="h-5 w-5 text-primary" />
              Sign Out
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              Are you sure you want to sign out of your account? You'll need to sign in again to access your dashboard.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-center py-8 bg-muted/10">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <div className="h-20 w-20 rounded-full bg-card border border-border/50 flex items-center justify-center relative shadow-lg">
                <LogOut className="h-8 w-8 text-primary ml-1" />
              </div>
            </div>
          </div>
          
          <DialogFooter className="p-6 pt-2 bg-muted/5 flex gap-3 sm:justify-end">
            <Button 
              variant="outline" 
              onClick={closeLogoutDialog} 
              className="border-border/50 hover:bg-muted hover:text-foreground rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmLogout} 
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl shadow-lg shadow-destructive/20"
            >
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.nav>
  );
};

export default Navbar;
