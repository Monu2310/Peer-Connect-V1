import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Styles
import './App.css';

// Components
import Navbar from './components/layout/Navbar';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Activities = lazy(() => import('./pages/Activities'));
const ActivityDetail = lazy(() => import('./pages/ActivityDetail'));
const CreateActivity = lazy(() => import('./pages/CreateActivity'));
const Messages = lazy(() => import('./pages/Messages'));
const Conversation = lazy(() => import('./pages/Conversation'));
const Friends = lazy(() => import('./pages/Friends'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Contexts
import { AuthProvider } from './core/AuthContext';
import { ThemeProvider } from './core/ThemeContext';

// Routes
import PrivateRoute from './components/routes/PrivateRoute';

// Loading component for Suspense
const PageLoader = () => (
  <div className="flex justify-center items-center h-screen bg-background text-primary">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
  </div>
);

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
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
          </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;