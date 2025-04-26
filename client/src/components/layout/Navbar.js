import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/'); // Navigate to home page after logout
  };
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // Function to get the display name from user object
  const getUserDisplayName = () => {
    if (!currentUser) return "User";
    return currentUser.username || 
           currentUser.name || 
           currentUser.displayName || 
           currentUser.email || 
           "User";
  };
  
  return (
    <nav className="bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <span className="text-white font-bold text-xl">PeerConnect</span>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  to="/dashboard"
                  className="text-white hover:bg-primary-dark px-3 py-2 rounded-md font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/activities"
                  className="text-white hover:bg-primary-dark px-3 py-2 rounded-md font-medium"
                >
                  Activities
                </Link>
                {isAuthenticated && (
                  <Link
                    to="/create-activity"
                    className="text-white hover:bg-primary-dark px-3 py-2 rounded-md font-medium"
                  >
                    Create Activity
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-white">{getUserDisplayName()}</span>
                  <button
                    onClick={handleLogout}
                    className="text-white bg-primary-dark hover:bg-primary-darker px-4 py-2 rounded-md font-medium"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-x-4">
                  <Link
                    to="/login"
                    className="text-white hover:bg-primary-dark px-3 py-2 rounded-md font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="text-white bg-primary-dark hover:bg-primary-darker px-4 py-2 rounded-md font-medium"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="bg-primary-dark inline-flex items-center justify-center p-2 rounded-md text-white hover:text-white hover:bg-primary-darker focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!mobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden`}
        id="mobile-menu"
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link
            to="/dashboard"
            className="text-white hover:bg-primary-dark block px-3 py-2 rounded-md font-medium"
            onClick={() => setMobileMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            to="/activities"
            className="text-white hover:bg-primary-dark block px-3 py-2 rounded-md font-medium"
            onClick={() => setMobileMenuOpen(false)}
          >
            Activities
          </Link>
          {isAuthenticated && (
            <Link
              to="/create-activity"
              className="text-white hover:bg-primary-dark block px-3 py-2 rounded-md font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Create Activity
            </Link>
          )}
        </div>
        <div className="pt-4 pb-3 border-t border-primary-dark">
          <div className="px-2 space-y-1">
            {isAuthenticated ? (
              <>
                <div className="text-white px-3 py-2">{getUserDisplayName()}</div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-white block w-full text-left px-3 py-2 rounded-md hover:bg-primary-dark"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:bg-primary-dark block px-3 py-2 rounded-md font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-white hover:bg-primary-dark block px-3 py-2 rounded-md font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;