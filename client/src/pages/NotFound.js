import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../core/AuthContext';

const NotFound = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-4 py-8">
      <div className="text-center max-w-md">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold font-bold mb-4">404</h1>
        <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-foreground">Page Not Found</h2>
        <p className="text-sm sm:text-base text-muted-foreground mb-8 leading-relaxed">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link 
          to={isAuthenticated ? "/dashboard" : "/"}
          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
        >
          {isAuthenticated ? 'Go to Dashboard' : 'Return Home'}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
