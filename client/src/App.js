import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

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

function App() {
  const [appReady, setAppReady] = useState(false);

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
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
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
        <Router>
          <Navbar />
          <div className="main-container min-h-screen bg-light-bg dark:bg-dark-bg transition-colors duration-300 pt-16">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes */}
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/profile/:userId" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/activities" element={<PrivateRoute><Activities /></PrivateRoute>} />
                <Route path="/activities/:activityId" element={<PrivateRoute><ActivityDetail /></PrivateRoute>} />
                <Route path="/activities/new" element={<PrivateRoute><CreateActivity /></PrivateRoute>} />
                <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
                <Route path="/messages/:userId" element={<PrivateRoute><Conversation /></PrivateRoute>} />
                <Route path="/friends" element={<PrivateRoute><Friends /></PrivateRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
