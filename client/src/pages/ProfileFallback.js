import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Simple fallback profile page that renders immediately
const ProfileFallback = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Add a timer to force-reveal the profile after 3 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentUser, navigate]);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading your profile...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200">
                <img 
                  src={currentUser?.profilePicture || '/avatar.svg'} 
                  alt="Profile" 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/avatar.svg';
                  }}
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{currentUser?.username || 'User'}</h2>
                <p className="text-gray-500 dark:text-gray-400">{currentUser?.email || ''}</p>
              </div>
            </div>
            <div className="mt-6">
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Refresh Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileFallback;