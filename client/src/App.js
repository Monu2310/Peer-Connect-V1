import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import './App.css';

// Components
import BlobCursor from './components/effects/BlobCursor';
import Navbar from './components/layout/Navbar';
import PrivateRoute from './components/routes/PrivateRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Activities from './pages/Activities';
import CreateActivity from './pages/CreateActivity';
import ActivityDetail from './pages/ActivityDetail';
import Friends from './pages/Friends';
import Messages from './pages/Messages';
import Conversation from './pages/Conversation';
import NotFound from './pages/NotFound';

// Context
import { AuthProvider } from './contexts/AuthContext';

function App() {
  // Hide default cursor
  useEffect(() => {
    document.body.style.cursor = 'none';
    
    // Cleanup
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        {/* Custom animated cursor with a different color */}
        <BlobCursor fillColor="#FF5733" />
        
        <Navbar />
        <div className="main-container min-h-screen bg-gray-50">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes */}
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/activities" element={<PrivateRoute><Activities /></PrivateRoute>} />
              <Route path="/activities/new" element={<PrivateRoute><CreateActivity /></PrivateRoute>} />
              <Route path="/activities/:activityId" element={<PrivateRoute><ActivityDetail /></PrivateRoute>} />
              <Route path="/friends" element={<PrivateRoute><Friends /></PrivateRoute>} />
              <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
              <Route path="/messages/:userId" element={<PrivateRoute><Conversation /></PrivateRoute>} />

              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
