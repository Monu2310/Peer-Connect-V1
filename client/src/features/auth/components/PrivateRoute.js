import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// PrivateRoute component to protect routes that require authentication
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, loadUser } = useAuth();
  const [localLoading, setLocalLoading] = useState(true);

  // Set a timeout to prevent infinite loading
  useEffect(() => {
    // Very short safety timeout to prevent infinite loading
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("Auth loading took too long in PrivateRoute, forcing continue");
        setLocalLoading(false);
      }
    }, 2000); // Reduced to 2 seconds timeout

    // If auth context loading changes, update local loading state
    if (!loading) {
      setLocalLoading(false);
    }

    return () => clearTimeout(timer);
  }, [loading]);
  
  // Additional safety timeout (second layer of protection)
  useEffect(() => {
    // Force exit loading state after max time regardless of other conditions
    const maxWaitTimer = setTimeout(() => {
      setLocalLoading(false);
    }, 3000);
    
    return () => clearTimeout(maxWaitTimer);
  }, []);

  // If still genuinely in loading state, show spinner
  if (loading && localLoading) {
    // Start a counter to track how long the spinner has been visible
    console.log("Showing auth loading spinner");
    
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600 text-sm">Loading your profile...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated, otherwise render the protected content
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;