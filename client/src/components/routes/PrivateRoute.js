import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// PrivateRoute component to protect routes that require authentication
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, loadUser } = useAuth();
  const [localLoading, setLocalLoading] = useState(true);

  // Set a timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("Auth loading took too long in PrivateRoute, forcing continue");
        setLocalLoading(false);
      }
    }, 3000); // 3 seconds timeout

    // If auth context loading changes, update local loading state
    if (!loading) {
      setLocalLoading(false);
    }

    return () => clearTimeout(timer);
  }, [loading]);

  // If still genuinely in loading state, show spinner
  if (loading && localLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated, otherwise render the protected content
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;