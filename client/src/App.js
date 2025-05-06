import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Styles
import './App.css';

// Components
import Navbar from './components/layout/Navbar';
import BlobCursor from './components/effects/BlobCursor';

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
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Handle cursor style
  useEffect(() => {
    // Only hide the default cursor when the app is ready
    if (appReady) {
      document.body.style.cursor = 'none';
    } else {
      document.body.style.cursor = 'auto';
    }
    
    // Cleanup
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [appReady]);

  if (!appReady) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          {/* Custom animated cursor with dynamic color based on theme */}
          <BlobCursor fillColor="var(--cursor-color, #228be6)" />
          
          <Navbar />
          <div className="main-container min-h-screen bg-light-bg dark:bg-dark-bg transition-colors duration-300">
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
