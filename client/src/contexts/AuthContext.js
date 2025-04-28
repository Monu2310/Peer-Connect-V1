import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../api/config';

// Create context
const AuthContext = createContext();

// Initial state for the reducer
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true
};

// Reducer function to handle auth state
const authReducer = (state, action) => {
  switch (action.type) {
    case 'USER_LOADED':
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: action.payload
      };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      localStorage.setItem('token', action.payload.token);
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
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null
      };
    default:
      return state;
  }
};

// Create auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [error, setError] = useState('');

  // Load user data if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (localStorage.token) {
        try {
          // Set auth token in axios headers
          setAuthToken(localStorage.token);
          
          // Get user data
          const res = await axios.get(`${API_URL}/api/auth/me`, {
            withCredentials: true // Important for cookie-based auth
          });
          
          dispatch({
            type: 'USER_LOADED',
            payload: res.data
          });
        } catch (err) {
          console.error('Error loading user:', err);
          console.error('Response data:', err.response?.data);
          console.error('Status:', err.response?.status);
          dispatch({ type: 'AUTH_ERROR' });
        }
      } else {
        dispatch({ type: 'AUTH_ERROR' });
      }
    };

    loadUser();
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      console.log('Sending registration data:', {...userData, password: '[REDACTED]'});
      const res = await axios.post(`${API_URL}/api/auth/register`, userData, {
        withCredentials: true, // Important for cookie-based auth
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: res.data
      });
      
      // Load user after successful registration
      await loadUser();
      return res.data;
    } catch (err) {
      console.error('Registration error details:', err);
      // Get a more detailed error message
      const errorMessage = err.response?.data?.message || 
                          (err.response?.status === 500 ? 'Server error during registration' : 'Registration failed');
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
      
      // Add axios config to prevent redirect following and include credentials
      const config = {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true, // Important for cookie-based auth
        maxRedirects: 0 // Prevent axios from following redirects
      };
      
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password }, config);
      
      console.log('Login response received:', res.status);
      console.log('Token received:', res.data?.token ? 'Yes' : 'No');
      
      // Store token in localStorage and set it in axios headers
      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
        setAuthToken(res.data.token);
      }
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data
      });
      
      // Load user after successful login
      await loadUser();
      
      return res.data;
    } catch (err) {
      console.error('Login error:', err);
      console.error('Response status:', err.response?.status);
      console.error('Response data:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || 'Invalid credentials';
      setError(errorMessage);
      
      dispatch({
        type: 'LOGIN_FAIL'
      });
      
      throw new Error(errorMessage);
    }
  };

  // Logout user
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  // Load user data - helper function used by useEffect
  const loadUser = async () => {
    if (localStorage.token) {
      setAuthToken(localStorage.token);
    }

    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true // Important for cookie-based auth
      });
      
      dispatch({
        type: 'USER_LOADED',
        payload: res.data
      });
      
      return res.data;
    } catch (err) {
      console.error('Error loading user:', err);
      console.error('Status:', err.response?.status);
      dispatch({ type: 'AUTH_ERROR' });
      return null;
    }
  };

  // Set auth token in axios headers
  const setAuthToken = (token) => {
    if (token) {
      // Set token in multiple formats to ensure compatibility
      axios.defaults.headers.common['x-auth-token'] = token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
      delete axios.defaults.headers.common['Authorization'];
    }
  };

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
      dispatch({
        type: 'USER_LOADED',
        payload: updatedUserData
      });
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