import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../api/config';

// Button component (assuming you have a UI library, otherwise define it)
const Button = ({ children, variant = 'default', type = 'button', className = '', disabled = false, onClick, ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClasses = {
    default: 'bg-primary text-white hover:bg-primary/90',
    outline: 'border border-border bg-transparent hover:bg-muted'
  };
  
  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('unknown'); // 'unknown', 'waking', 'ready'
  const { login } = useAuth();
  const navigate = useNavigate();

  // Check if server is awake when component mounts
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        await axios.get(`${API_URL}/api/health`, { timeout: 3000 });
        setServerStatus('ready');
      } catch (err) {
        console.log('Server may be in sleep mode');
        setServerStatus('unknown');
      }
    };
    
    checkServerStatus();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Validate form inputs
    if (!formData.email.trim()) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }
    
    if (!formData.password) {
      setError('Password is required');
      setIsLoading(false);
      return;
    }

    // If server status isn't 'ready', try to wake it first
    if (serverStatus !== 'ready') {
      setServerStatus('waking');
      try {
        // Try to ping the server to wake it up
        await axios.get(`${API_URL}/api/health`, { timeout: 5000 })
          .then(() => setServerStatus('ready'))
          .catch(() => console.log('Server wake-up ping failed, proceeding anyway'));
      } catch (err) {
        console.log('Server wake-up attempt error:', err.message);
      }
    }
    
    try {
      console.log('Attempting login with email:', formData.email);
      
      // Clear any existing authentication data
      localStorage.removeItem('token');
      
      // Try login with a catch for network errors
      const response = await login(formData);
      console.log('Login successful, token received:', response?.token ? 'Yes' : 'No');
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle different types of errors
      if (!navigator.onLine) {
        setError('Network error. Please check your internet connection.');
      } else if (err.message.includes('401') || err.message.includes('400')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Failed to log in. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  // Get appropriate message based on server status
  const getServerStatusMessage = () => {
    if (serverStatus === 'waking') {
      return (
        <div className="bg-yellow-100 text-yellow-700 p-3 rounded-md text-sm mb-4">
          <div className="flex items-center">
            <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-500" />
            Server is waking up... This may take up to 30 seconds.
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="pt-16 min-h-screen bg-background text-foreground transition-colors duration-300 flex items-center justify-center">
      <div className="relative w-full max-w-md px-4">
        {/* Decorative elements */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/10 dark:bg-primary/5 rounded-full blur-2xl z-0"></div>
        <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-secondary/10 dark:bg-secondary/5 rounded-full blur-3xl z-0"></div>
        
        <motion.div 
          className="relative z-10 bg-card shadow-xl dark:shadow-2xl dark:shadow-black/20 rounded-lg p-8 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary"></div>
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="text-center">
              <h2 className="text-3xl font-bold gradient-text">Welcome Back</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Sign in to your account to continue</p>
            </motion.div>
            
            {/* Server status message */}
            {getServerStatusMessage()}
            
            {error && (
              <motion.div 
                className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-md text-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {error}
              </motion.div>
            )}
            
            <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  placeholder="you@example.com"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-sm text-primary dark:text-primary-light hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  placeholder="••••••••"
                />
              </div>
              
              <div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {serverStatus === 'waking' ? 'Waking Server...' : 'Signing In...'}
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </div>
            </motion.form>
            
            <motion.div variants={itemVariants} className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary font-medium hover:underline">
                  Create one now
                </Link>
              </p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="relative flex items-center justify-center">
              <div className="absolute border-t border-border w-full"></div>
              <div className="relative bg-card px-4 text-sm text-muted-foreground">
                or continue with
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
              <Button variant="outline" type="button">
                <img src="https://www.svgrepo.com/show/506499/github.svg" alt="GitHub" className="h-5 w-5 mr-2" />
                GitHub
              </Button>
              <Button variant="outline" type="button">
                <img src="https://www.svgrepo.com/show/506498/google.svg" alt="Google" className="h-5 w-5 mr-2" />
                Google
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;