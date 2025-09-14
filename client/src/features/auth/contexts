import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';
import axios from 'axios';
import { API_URL, setAuthToken } from '../api/config';

// Create context
const AuthContext = createContext();

// Local storage keys
const TOKEN_KEY = 'token';
const USER_DATA_KEY = 'user_data';
const AUTH_TIMESTAMP_KEY = 'auth_timestamp';

// Initial state for the reducer - load from localStorage if available
const initialState = {
  user: JSON.parse(localStorage.getItem(USER_DATA_KEY)) || null,
  token: localStorage.getItem(TOKEN_KEY),
  isAuthenticated: !!localStorage.getItem(TOKEN_KEY),
  loading: true
};

// Reducer function to handle auth state
const authReducer = (state, action) => {
  switch (action.type) {
    case 'USER_LOADED':
      // Save user data to localStorage for persistence
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(action.payload));
      localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
      
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: action.payload
      };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      setAuthToken(action.payload.token);
      
      // Save user data to localStorage for persistence
      if (action.payload.user) {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(action.payload.user));
      }
      localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
      
      return {
        ...state,
        ...action.payload,
        isAuthenticated: true,
        loading: false
      };
    case 'AUTH_ERROR':
    case 'LOGIN_FAIL':
    case 'REGISTER_FAIL':
    case 'LOGOUT':
      setAuthToken(null);
      
      // Clear auth-related data from localStorage
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      localStorage.removeItem(AUTH_TIMESTAMP_KEY);
      
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
};

// Create auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [error, setError] = useState('');
  const [authInitialized, setAuthInitialized] = useState(false);

  // Save token to localStorage when it changes
  useEffect(() => {
    if (state.token) {
      localStorage.setItem(TOKEN_KEY, state.token);
      setAuthToken(state.token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setAuthToken(null);
    }
  }, [state.token]);

  // Load user data if token exists
  useEffect(() => {
    const loadUserOnInit = async () => {
      // Make sure we only try to load user data once during initialization
      if (authInitialized) return;
      
      // Set initialized AFTER the function completes to prevent race conditions
      // We'll set this at the end of the function
      
      const token = localStorage.getItem(TOKEN_KEY);
      const userData = localStorage.getItem(USER_DATA_KEY);
      const timestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);
      
      // If we have cached user data and it's relatively fresh (< 24 hours), use it
      const useCachedData = userData && timestamp && 
                           (Date.now() - parseInt(timestamp) < 24 * 60 * 60 * 1000);
      
      if (token) {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          // Set auth token in axios headers
          setAuthToken(token);
          
          // Use cached data if available and fresh, otherwise fetch from API
          if (useCachedData) {
            console.log('Using cached user data');
            dispatch({
              type: 'USER_LOADED',
              payload: JSON.parse(userData)
            });
          } else {
            // Get user data from API
            console.log('Fetching fresh user data');
            const res = await axios.get(`${API_URL}/api/auth/me`, {
              withCredentials: true,
              timeout: 5000 // Add timeout to prevent hanging requests
            });
            
            dispatch({
              type: 'USER_LOADED',
              payload: res.data
            });
          }
        } catch (err) {
          console.error('Error loading user:', err);
          console.error('Response data:', err.response?.data);
          console.error('Status:', err.response?.status);
          
          // If we have cached data, use it as fallback even if it might be stale
          if (userData) {
            console.log('Using cached user data as fallback');
            dispatch({
              type: 'USER_LOADED',
              payload: JSON.parse(userData)
            });
          } else {
            dispatch({ type: 'AUTH_ERROR' });
          }
          
          // Ensure loading is set to false even if there's an error
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        dispatch({ type: 'AUTH_ERROR' });
        // Ensure loading is set to false if there's no token
        dispatch({ type: 'SET_LOADING', payload: false });
      }
      
      // Now that we've completed the initialization process, set initialized to true
      setAuthInitialized(true);
    };

    // Set a timeout to ensure loading state eventually ends
    // This is a safety measure to prevent infinite loading
    const timer = setTimeout(() => {
      if (state.loading) {
        console.warn("Auth loading took too long, forcing state to not loading");
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, 3000); // Reduced to 3 seconds for a better user experience
    
    // Add a second, shorter safety timer as backup
    const quickSafetyTimer = setTimeout(() => {
      if (state.loading && !authInitialized) {
        console.warn("Auth initialization taking too long, forcing loading state off");
        setAuthInitialized(true); // Force initialization
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, 1500); // Very short timeout for a fast initial experience

    loadUserOnInit();

    return () => {
      clearTimeout(timer);
      clearTimeout(quickSafetyTimer);
    };
  }, [authInitialized, state.loading]);

  // Register user
  const register = async (userData) => {
    try {
      console.log('Sending registration data:', {...userData, password: '[REDACTED]'});
      
      // Use a minimal registration object with only essential fields
      const minimalRegistration = {
        username: userData.username,
        email: userData.email,
        password: userData.password
      };
      
      // Make the request with a simplified payload
      const res = await axios.post(`${API_URL}/api/auth/register`, minimalRegistration, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // Extended timeout
      });
      
      // Handle the successful registration
      if (res.data && res.data.token) {
        localStorage.setItem(TOKEN_KEY, res.data.token);
        
        dispatch({
          type: 'REGISTER_SUCCESS',
          payload: res.data
        });
        
        // Skip loadUser and just use the data from response
        return res.data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Registration error details:', err);
      
      // Get a more detailed error message
      let errorMessage = 'Registration failed';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (!err.response) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      setError(errorMessage);
      
      dispatch({
        type: 'REGISTER_FAIL'
      });
      
      throw new Error(errorMessage);
    }
  };

  // Login user
  const login = async ({ email, password }) => {
    try {
      console.log('Attempting login at URL:', `${API_URL}/api/auth/login`);
      
      // First, clear ALL local storage related to previous user
      // This ensures we don't mix data between different users
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      localStorage.removeItem(AUTH_TIMESTAMP_KEY);
      localStorage.removeItem('profile_data');
      localStorage.removeItem('profile_data_timestamp');
      localStorage.removeItem('user_preferences');
      
      // Clear any cached data in sessionStorage
      sessionStorage.clear();
      
      // Reset auth token
      setAuthToken(null);
      
      // Try to ping the server first to wake it up if it's sleeping
      console.log('Pinging server to wake it up...');
      try {
        await axios.get(`${API_URL}/api/health`, { timeout: 5000 })
          .catch(e => console.log('Wake-up ping failed, proceeding anyway'));
      } catch (pingErr) {
        console.log('Wake-up ping error (expected for cold starts):', pingErr.message);
      }
      
      // Set loading state to true at the beginning of login attempt
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Define a function for login attempt with retries
      const attemptLogin = async (retryCount = 0) => {
        try {
          // Simplify the login request
          const res = await axios.post(
            `${API_URL}/api/auth/login`, 
            { email, password },
            {
              headers: {
                'Content-Type': 'application/json',
              },
              withCredentials: false,
              timeout: 30000 // 30 second timeout for login request
            }
          );
          
          console.log('Login response:', res.status);
          
          // Make sure we got a valid response with a token
          if (!res.data || !res.data.token) {
            throw new Error('Invalid response from server - no token received');
          }
          
          return res;
        } catch (err) {
          // If we have retries left and it's a network error (likely cold start), retry
          if (retryCount < 2 && (!err.response || err.message.includes('timeout') || err.message.includes('Network Error'))) {
            console.log(`Retry attempt ${retryCount + 1} for login...`);
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds before retry
            return attemptLogin(retryCount + 1);
          }
          throw err;
        }
      };
      
      // Attempt login with retry logic
      const res = await attemptLogin();
      
      // Store the token in localStorage and set in axios
      setAuthToken(res.data.token);
      
      // Set fresh auth timestamp
      localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
      
      // Dispatch success action
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data
      });
      
      // Load user data after login - force fresh data
      try {
        const userData = await axios.get(`${API_URL}/api/auth/me`, {
          withCredentials: false,
          timeout: 10000,
          headers: {
            'Authorization': `Bearer ${res.data.token}`,
            'Cache-Control': 'no-cache'
          }
        });
        
        // Update auth state with fresh user data
        dispatch({
          type: 'USER_LOADED',
          payload: userData.data
        });
      } catch (userErr) {
        console.error('Error loading user after login:', userErr);
        // Continue anyway since we have the token
      }
      
      return res.data;
    } catch (err) {
      console.error('Login error:', err);
      console.error('Response status:', err.response?.status);
      console.error('Response data:', err.response?.data);
      
      // Clear any partial auth state
      setAuthToken(null);
      
      // Get a better error message
      let errorMessage = 'Login failed. Please check your email and password.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message.includes('Network Error') || err.message.includes('timeout')) {
        errorMessage = 'Cannot connect to server. This may be due to Render spinning up the server. Please wait a moment and try again.';
      }
      
      setError(errorMessage);
      
      dispatch({
        type: 'LOGIN_FAIL'
      });
      
      throw new Error(errorMessage);
    } finally {
      // Ensure loading state is always set to false after login attempt, successful or failed
      setTimeout(() => {
        dispatch({ type: 'SET_LOADING', payload: false });
      }, 100);
    }
  };

  // Logout user
  const logout = () => {
    // Clear any data that should not persist after logout
    sessionStorage.clear(); // Clear all session storage data (joined activities, etc.)
    
    // Clear profile cache data to ensure fresh data for next login
    localStorage.removeItem('profile_data');
    localStorage.removeItem('profile_data_timestamp');
    localStorage.removeItem('user_preferences');
    
    dispatch({ type: 'LOGOUT' });
  };

  // Load user data - helper function used by useEffect
  const loadUser = async () => {
    if (!localStorage.token) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return null;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      setAuthToken(localStorage.token);
      
      // Set safety timeout for this operation
      let timeoutId = setTimeout(() => {
        console.warn('loadUser operation timed out, forcing loading state to false');
        dispatch({ type: 'SET_LOADING', payload: false });
      }, 4000);
      
      const res = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true,
        timeout: 5000 // Add timeout to prevent hanging requests
      });
      
      // Clear safety timeout since we got a response
      clearTimeout(timeoutId);
      
      dispatch({
        type: 'USER_LOADED',
        payload: res.data
      });
      
      return res.data;
    } catch (err) {
      console.error('Error loading user:', err);
      console.error('Status:', err.response?.status);
      
      // Try to use cached user data if available
      const userData = localStorage.getItem(USER_DATA_KEY);
      if (userData) {
        console.log('Using cached user data in loadUser');
        const parsedUserData = JSON.parse(userData);
        dispatch({
          type: 'USER_LOADED',
          payload: parsedUserData
        });
        return parsedUserData;
      }
      
      dispatch({ type: 'AUTH_ERROR' });
      return null;
    } finally {
      // Always ensure loading state is set to false
      setTimeout(() => {
        dispatch({ type: 'SET_LOADING', payload: false });
      }, 100);
    }
  };

  // Add a forced reset of loading state in case something goes wrong
  useEffect(() => {
    // This acts as a final safety mechanism to prevent infinite loading state
    const ultimateTimer = setTimeout(() => {
      if (state.loading) {
        console.warn("ULTIMATE SAFETY: Auth still loading after context mount, forcing reset");
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, 5000);
    
    return () => clearTimeout(ultimateTimer);
  }, []);
  
  // Create the context value object
  const value = {
    currentUser: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error,
    setError,
    register,
    login,
    logout,
    loadUser,
    // Add updateUserProfile function to keep auth state in sync with profile updates
    updateUserProfile: (updatedUserData) => {
      // Update auth state
      dispatch({
        type: 'USER_LOADED',
        payload: updatedUserData
      });
      
      // Also update preferences in localStorage if they exist
      const userPreferences = localStorage.getItem('user_preferences');
      if (userPreferences) {
        const parsedPreferences = JSON.parse(userPreferences);
        localStorage.setItem('user_preferences', JSON.stringify({
          ...parsedPreferences,
          hobbies: updatedUserData.hobbies || parsedPreferences.hobbies || [],
          favoriteSubjects: updatedUserData.favoriteSubjects || parsedPreferences.favoriteSubjects || [],
          sports: updatedUserData.sports || parsedPreferences.sports || [],
          musicGenres: updatedUserData.musicGenres || parsedPreferences.musicGenres || [],
          movieGenres: updatedUserData.movieGenres || parsedPreferences.movieGenres || []
        }));
      }
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};