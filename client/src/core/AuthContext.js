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
import { onIdTokenChanged } from 'firebase/auth';
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

// Initial state for the reducer - DO NOT load user from localStorage on init
// Always fetch fresh from backend to prevent stale data issues
const initialState = {
  user: null, // Never trust localStorage on initial load
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

      if (token) {
        setAuthToken(token);
      }

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
    case 'TOKEN_REFRESH':
      return {
        ...state,
        token: action.payload
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

  // Listen for Firebase token changes (refresh)
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          setAuthToken(token);
          localStorage.setItem(TOKEN_KEY, token);
          dispatch({ type: 'TOKEN_REFRESH', payload: token });
        } catch (err) {
          // Token refresh failed
        }
      } else {
        // User signed out
        // We handle this in the logout function or onAuthStateChanged usually, 
        // but this ensures we clean up if Firebase thinks we are logged out.
      }
    });

    return () => unsubscribe();
  }, []);

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
            dispatch({
              type: 'USER_LOADED',
              payload: JSON.parse(userData)
            });
          } else {
            // Get user data from API
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
          // If we have cached data, use it as fallback even if it might be stale
          if (userData) {
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
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, 3000); // Reduced to 3 seconds for a better user experience
    
    // Add a second, shorter safety timer as backup
    const quickSafetyTimer = setTimeout(() => {
      if (state.loading && !authInitialized) {
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
      return `${window.location.origin}/auth/action`;
    }

    return undefined;
  };

  const register = async (userData) => {
    try {
      // NUCLEAR CLEAR: Wipe everything before registration to prevent data mixing
      try {
        localStorage.clear();
        sessionStorage.clear();
        if (window.indexedDB) {
          const dbs = await indexedDB.databases();
          dbs.forEach(db => indexedDB.deleteDatabase(db.name));
        }
      } catch (clearErr) {
        // Storage clear failed
      }
      intelligentCache.clear();
      dataPreloader.preloadCache.clear();
      dataPreloader.preloadPromises.clear();
      dataPreloader.lastPreloadTimestamps.clear();
      
      // Create Firebase user with retry logic for network issues
      let fbUser;
      let retryCount = 0;
      const maxRetries = 3;
      
      // Use Firebase REST API instead of SDK to bypass network issues
      const FIREBASE_API_KEY = process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyAWV8utdk-d9ssH7MvoeJgcZeUyyWl506s';
      
      while (retryCount < maxRetries) {
        try {
          const response = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: userData.email,
                password: userData.password,
                returnSecureToken: true
              })
            }
          );

          const data = await response.json();
          
          if (!response.ok) {
            const errorMessage = data.error?.message || 'Registration failed';
            if (errorMessage.includes('EMAIL_EXISTS')) {
              throw new Error('This email is already registered. Please log in instead.');
            }
            throw new Error(errorMessage);
          }
          
          // Create a minimal user object compatible with Firebase SDK
          fbUser = {
            uid: data.localId,
            email: data.email,
            emailVerified: false,
            getIdToken: async () => data.idToken,
            reload: async () => {} // No-op for REST API
          };
          
          break; // Success, exit retry loop
        } catch (fbError) {
          retryCount++;
          
          if ((fbError.message.includes('network') || fbError.message.includes('fetch')) && retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            // Final attempt failed or non-network error
            throw fbError;
          }
        }
      }

      const idToken = await fbUser.getIdToken();

      // Build redirect URL once to ensure consistent action handler in all verification emails
      const verificationRedirectUrl = getVerificationRedirectUrl();

      // Send verification email using REST API with retry logic
      retryCount = 0;
      while (retryCount < maxRetries) {
        try {
          const verifyResponse = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requestType: 'VERIFY_EMAIL',
                idToken: idToken,
                continueUrl: verificationRedirectUrl
              })
            }
          );

          const verifyData = await verifyResponse.json();
          
          if (!verifyResponse.ok) {
            throw new Error(verifyData.error?.message || 'Failed to send verification email');
          }
          
          break; // Success
        } catch (verificationError) {
          retryCount++;
          
          if ((verificationError.message.includes('network') || verificationError.message.includes('fetch')) && retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else if (retryCount >= maxRetries) {
            throw new Error('Could not send verification email after multiple attempts. Please try logging in and requesting a new verification email.');
          } else {
            throw verificationError;
          }
        }
      }

      // Use a minimal registration object for backend, including Firebase idToken
      const minimalRegistration = {
        username: userData.username,
        email: userData.email,
        idToken,
        // additional profile fields can be forwarded as-is
        ...userData,
      };

      // Kick off backend sync but never block the UI on Render cold starts
      (async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        try {
          await axios.post(`${API_URL}/api/auth/firebase-register`, minimalRegistration, {
            headers: {
              'Content-Type': 'application/json'
            },
            signal: controller.signal,
            timeout: 15000
          });
        } catch (syncErr) {
          console.warn('Deferred backend registration failed, will rely on auto-provision during login:', syncErr.message);
        } finally {
          clearTimeout(timeoutId);
        }
      })();

      // Fire-and-forget cleanup so we don't block the UI any longer
      (async () => {
        try {
          await signOut(auth);
        } catch (signOutErr) {
          console.warn('Deferred signOut after registration failed:', signOutErr.message);
        }

        setAuthToken(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
        localStorage.removeItem(AUTH_TIMESTAMP_KEY);
      })();

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
      const actionHandlerUrl = getVerificationRedirectUrl();
      const actionCodeSettings = actionHandlerUrl
        ? { url: actionHandlerUrl, handleCodeInApp: true }
        : undefined;

      await sendPasswordResetEmail(auth, email, actionCodeSettings);
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
      
      // NUCLEAR OPTION: Clear EVERYTHING to prevent any stale data bugs
      // This is critical to prevent cross-user data contamination
      console.log('🧹 CLEARING ALL CACHE AND STORAGE...');
      try {
        localStorage.clear();
        sessionStorage.clear();
        // Clear IndexedDB if it exists
        if (window.indexedDB) {
          const dbs = await indexedDB.databases();
          dbs.forEach(db => indexedDB.deleteDatabase(db.name));
        }
      } catch (clearErr) {
        console.warn('Error clearing storage:', clearErr);
      }
      
      // Clear intelligent cache
      intelligentCache.clear();
      
      // Clear dataPreloader cache
      dataPreloader.preloadCache.clear();
      dataPreloader.preloadPromises.clear();
      dataPreloader.lastPreloadTimestamps.clear();
      
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

      // First sign in with Firebase using REST API to bypass network issues
      let fbUser;
      let idToken;
      let retryCount = 0;
      const maxRetries = 3;
      const FIREBASE_API_KEY = process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyAWV8utdk-d9ssH7MvoeJgcZeUyyWl506s';
      
      while (retryCount < maxRetries) {
        try {
          console.log(`Firebase login attempt ${retryCount + 1}/${maxRetries} (using REST API)`);
          
          const response = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: email,
                password: password,
                returnSecureToken: true
              })
            }
          );

          const data = await response.json();
          
          if (!response.ok) {
            const errorMessage = data.error?.message || 'Login failed';
            if (errorMessage.includes('INVALID_PASSWORD') || errorMessage.includes('EMAIL_NOT_FOUND') || errorMessage.includes('INVALID_LOGIN_CREDENTIALS')) {
              throw new Error('Invalid email or password. Please try again.');
            }
            throw new Error(errorMessage);
          }
          
          idToken = data.idToken;
          
          // Fetch user info to get emailVerified status
          const userInfoResponse = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken: idToken })
            }
          );
          
          const userInfoData = await userInfoResponse.json();
          const userInfo = userInfoData.users?.[0];
          
          // Create a minimal user object
          fbUser = {
            uid: data.localId,
            email: data.email,
            emailVerified: userInfo?.emailVerified || false
          };
          
          console.log('✅ Firebase login successful via REST API, emailVerified:', fbUser.emailVerified);
          break; // Success, exit retry loop
        } catch (fbError) {
          retryCount++;
          console.error(`Firebase login attempt ${retryCount} failed:`, fbError.message);
          
          if ((fbError.message.includes('network') || fbError.message.includes('fetch')) && retryCount < maxRetries) {
            console.log(`🔄 Retrying in 2 seconds... (${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            // Final attempt failed or non-network error
            throw fbError;
          }
        }
      }

      if (!fbUser.emailVerified) {
        const verificationRedirectUrl = getVerificationRedirectUrl();
        // Send verification email using REST API
        try {
          const verifyResponse = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requestType: 'VERIFY_EMAIL',
                idToken: idToken,
                continueUrl: verificationRedirectUrl
              })
            }
          );
          
          if (verifyResponse.ok) {
            console.log('Verification email re-sent to user during login attempt');
          }
        } catch (verificationError) {
          console.warn('Failed to re-send verification email:', verificationError);
        }

        throw new Error('Please verify your email address. We just sent you a new verification link.');
      }

      // Then tell our backend to verify the Firebase token and sync user data
      // We use the idToken as our app token now
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

      // Store the token in localStorage and set in axios
      setAuthToken(idToken);

      // Set fresh auth timestamp
      localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());

      // Dispatch success action
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          token: idToken,
          user: res.data.user
        }
      });

      // Load user data after login - force fresh data
      try {
        const userData = await axios.get(`${API_URL}/api/auth/me`, {
          withCredentials: false,
          timeout: 10000,
          headers: {
            'Authorization': `Bearer ${idToken}`,
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
    
    // Clear ALL localStorage data including any stale cached activities/friends
    localStorage.clear();
    
    // Clear intelligent cache
    intelligentCache.clear();
    dataPreloader.preloadCache.clear();
    dataPreloader.preloadPromises.clear();
    dataPreloader.lastPreloadTimestamps.clear();
    
    // Stop background sync
    dataPreloader.reset();
    
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
      
      // NEVER use cached user data - always clear on error to prevent stale data bugs
      console.warn('Failed to load user from backend - clearing all cached auth data');
      localStorage.clear();
      
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
      // Merge the incoming partial update with the existing auth user state
      const mergedUser = normalizeUser({ ...(state.user || {}), ...(updatedUserData || {}) });

      // Dispatch merged user to reducer so everything depending on auth state updates
      dispatch({
        type: 'USER_LOADED',
        payload: mergedUser
      });

      // Also update preferences in localStorage if they exist
      const userPreferences = localStorage.getItem('user_preferences');
      if (userPreferences) {
        const parsedPreferences = JSON.parse(userPreferences);
        localStorage.setItem('user_preferences', JSON.stringify({
          ...parsedPreferences,
          hobbies: mergedUser.hobbies || parsedPreferences.hobbies || [],
          favoriteSubjects: mergedUser.favoriteSubjects || parsedPreferences.favoriteSubjects || [],
          sports: mergedUser.sports || parsedPreferences.sports || [],
          musicGenres: mergedUser.musicGenres || parsedPreferences.musicGenres || [],
          movieGenres: mergedUser.movieGenres || parsedPreferences.movieGenres || []
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
