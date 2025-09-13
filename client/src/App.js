import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Styles
import './App.css';

// Components
import Navbar from './components/layout/Navbar';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Activities from './pages/Activities';
import ActivityDetail from './pages/ActivityDetail';
import CreateActivity from './pages/CreateActivity';
import Messages from './pages/Messages';
import Conversation from './pages/Conversation';
import Friends from './pages/Friends';
import NotFound from './pages/NotFound';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Routes
import PrivateRoute from './components/routes/PrivateRoute';

const pageVariants = {
  initial: {
    opacity: 0,
    x: "-100vw"
  },
  in: {
    opacity: 1,
    x: 0
  },
  out: {
    opacity: 0,
    x: "100vw"
  }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.5
};

function App() {
  const [appReady, setAppReady] = useState(false);
  const location = useLocation(); // Get current location

  // Initialize app with a slight delay to ensure everything loads properly
  useEffect(() => {
    // Set a timeout to make sure the app is considered ready after a short delay
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 300); // Reduced from 500ms to 300ms for faster initial load
    
    // Safety timeout - force app ready regardless after 2 seconds
    const safetyTimer = setTimeout(() => {
      if (!appReady) {
        console.log('App initialization safety timeout triggered');
        setAppReady(true);
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
    };
  }, [appReady]);

  if (!appReady) {
    return (
      <div className="flex justify-center items-center h-screen bg-background text-primary">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
        <div className="hidden">
          {/* This hidden div helps prevent the microsecond loading flash */}
          <ThemeProvider>
            <AuthProvider>
              <div></div>
            </AuthProvider>
          </ThemeProvider>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <Navbar />
          <div className="main-container min-h-screen bg-background text-foreground transition-colors duration-300 pt-16">
            <AnimatePresence mode="wait" initial={false}>
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <Home />
                  </motion.div>
                } />
                <Route path="/login" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <Login />
                  </motion.div>
                } />
                <Route path="/register" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <Register />
                  </motion.div>
                } />

                {/* Protected routes */}
                <Route path="/dashboard" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <PrivateRoute><Dashboard /></PrivateRoute>
                  </motion.div>
                } />
                <Route path="/profile" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <PrivateRoute><Profile /></PrivateRoute>
                  </motion.div>
                } />
                <Route path="/profile/:userId" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <PrivateRoute><Profile /></PrivateRoute>
                  </motion.div>
                } />
                <Route path="/activities" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <PrivateRoute><Activities /></PrivateRoute>
                  </motion.div>
                } />
                <Route path="/activities/:activityId" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <PrivateRoute><ActivityDetail /></PrivateRoute>
                  </motion.div>
                } />
                <Route path="/activities/new" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <PrivateRoute><CreateActivity /></PrivateRoute>
                  </motion.div>
                } />
                <Route path="/messages" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <PrivateRoute><Messages /></PrivateRoute>
                  </motion.div>
                } />
                <Route path="/messages/:userId" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <PrivateRoute><Conversation /></PrivateRoute>
                  </motion.div>
                } />
                <Route path="/friends" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <PrivateRoute><Friends /></PrivateRoute>
                  </motion.div>
                } />
                <Route path="*" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <NotFound />
                  </motion.div>
                } />
              </Routes>
            </AnimatePresence>
          </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;