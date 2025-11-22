import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';
import axios from 'axios';
import { API_URL, setAuthToken } from '../api/config';
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
} from './firebase';
import dataPreloader from '../lib/dataPreloader';
import intelligentCache from '../lib/intelligentCache';

// Create context
const AuthContext = createContext();

// Local storage keys
const TOKEN_KEY = 'token';
const USER_DATA_KEY = 'user_data';
const AUTH_TIMESTAMP_KEY = 'auth_timestamp';

// Ensure user objects always expose a stable id field for downstream consumers
const normalizeUser = (user) => {
  if (!user) {
    return null;
  }

  const normalizedId = user.id || user._id || user.userId || user.uid || null;

  return normalizedId ? { ...user, id: normalizedId } : { ...user };
};

// Initial state for the reducer - load from localStorage if available
const initialState = {
  user: normalizeUser(JSON.parse(localStorage.getItem(USER_DATA_KEY))),
  token: localStorage.getItem(TOKEN_KEY),
  isAuthenticated: !!localStorage.getItem(TOKEN_KEY),
  loading: true
};

// Reducer function to handle auth state
const authReducer = (state, action) => {
  switch (action.type) {
    case 'USER_LOADED': {
      const normalizedUser = normalizeUser(action.payload);

      if (normalizedUser) {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(normalizedUser));
        localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());

        intelligentCache.warmCache('user', normalizedUser);

        const shouldStartPreloading = normalizedUser.id && normalizedUser.id !== state.user?.id;

        if (shouldStartPreloading) {
          dataPreloader.preloadCriticalData(normalizedUser.id);
          dataPreloader.startBackgroundSync(normalizedUser.id);
        } else {
          console.info('Skipping preload: user already initialized or missing id');
        }
      }

      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: normalizedUser
      };
    }
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS': {
      const token = action.payload?.token || null;
      const normalizedUser = normalizeUser(action.payload?.user);

      setAuthToken(token);

      if (normalizedUser) {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(normalizedUser));
        intelligentCache.warmCache('user', normalizedUser);

        const shouldStartPreloading = normalizedUser.id && normalizedUser.id !== state.user?.id;

        if (shouldStartPreloading) {
          setTimeout(() => {
            dataPreloader.preloadCriticalData(normalizedUser.id);
            dataPreloader.startBackgroundSync(normalizedUser.id);
          }, 100);
        }
      }

      localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());

      return {
        ...state,
        token,
        user: normalizedUser,
        isAuthenticated: !!token,
        loading: false
      };
    }
    case 'AUTH_ERROR':
    case 'LOGIN_FAIL':
    case 'REGISTER_FAIL':
    case 'LOGOUT':
      setAuthToken(null);
      
      // Clear auth-related data from localStorage
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      localStorage.removeItem(AUTH_TIMESTAMP_KEY);
      
      // Clear intelligent cache
      intelligentCache.clear();

      // Reset preloaders/background sync when auth is cleared
      dataPreloader.reset();
      
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

  // Register user with Firebase email/password, then sync with backend
  const getVerificationRedirectUrl = () => {
    if (process.env.REACT_APP_FIREBASE_CONTINUE_URL) {
      return process.env.REACT_APP_FIREBASE_CONTINUE_URL;
    }

    if (typeof window !== 'undefined') {
      return `${window.location.origin}/login`;
    }

    return undefined;
  };

  const register = async (userData) => {
    try {
      console.log('Sending registration data:', {...userData, password: '[REDACTED]'});
      // Create Firebase user
      const { user: fbUser } = await createUserWithEmailAndPassword(auth, userData.email, userData.password);

      // Ensure we have the latest verification status before continuing
      await fbUser.reload();

      const actionCodeSettings = {
        url: getVerificationRedirectUrl(),
        handleCodeInApp: false
      };

      try {
        await sendEmailVerification(fbUser, actionCodeSettings);
      } catch (verificationError) {
        console.error('Failed to send verification email:', verificationError);
        throw new Error('Could not send verification email. Please try again later.');
      }

      const idToken = await fbUser.getIdToken();

      // Use a minimal registration object for backend, including Firebase idToken
      const minimalRegistration = {
        username: userData.username,
        email: userData.email,
        idToken,
        // additional profile fields can be forwarded as-is
        ...userData,
      };

      await axios.post(`${API_URL}/api/auth/firebase-register`, minimalRegistration, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      // Sign out the unverified user to prevent accessing the app before email confirmation
      await signOut(auth);

      // Clear any lingering auth artifacts for good measure
      setAuthToken(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      localStorage.removeItem(AUTH_TIMESTAMP_KEY);

      return {
        success: true,
        verificationEmailSent: true,
        message: 'Verification email sent. Please check your inbox to activate your account.'
      };
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

  // Password reset via Firebase email link
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err) {
      console.error('Password reset error:', err);
      throw err;
    }
  };

  // Login user using Firebase email/password, then sync with backend
  const login = async ({ email, password }) => {
    try {
      console.log('Attempting Firebase login and backend sync');
      
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
          .catch(() => console.log('Wake-up ping failed, proceeding anyway'));
      } catch (pingErr) {
        console.log('Wake-up ping error (expected for cold starts):', pingErr.message);
      }

      // Set loading state to true at the beginning of login attempt
      dispatch({ type: 'SET_LOADING', payload: true });

      // First sign in with Firebase
      const fbResult = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = fbResult.user;

      // Refresh user data to get the latest verification flag
      await fbUser.reload();

      if (!fbUser.emailVerified) {
        const actionCodeSettings = {
          url: getVerificationRedirectUrl(),
          handleCodeInApp: false
        };

        try {
          await sendEmailVerification(fbUser, actionCodeSettings);
          console.log('Verification email re-sent to user during login attempt');
        } catch (verificationError) {
          console.warn('Failed to re-send verification email:', verificationError);
        }

        await signOut(auth);
        throw new Error('Please verify your email address. We just sent you a new verification link.');
      }

      const idToken = await fbUser.getIdToken();

      // Then tell our backend to verify the Firebase token and mint app JWT
      const res = await axios.post(
        `${API_URL}/api/auth/firebase-login`,
        { idToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: false,
          timeout: 30000
        }
      );

      if (!res.data || !res.data.token) {
        throw new Error('Invalid response from server - no token received');
      }

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

  // Logout user from both Firebase and local app state
  const logout = () => {
    // Sign out from Firebase
    signOut(auth).catch(err => console.error('Firebase signout error:', err));
    
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
    resetPassword,
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
