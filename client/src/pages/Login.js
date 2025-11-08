import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../core/AuthContext';
import { Loader2, Mail, Lock, ArrowRight, Github, Chrome, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../api/config';
import BeautifulBackground from '../components/effects/BeautifulBackground';

// Button component
const Button = ({ children, variant = 'default', type = 'button', className = '', disabled = false, onClick, ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClasses = {
    default: 'bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95',
    outline: 'border-2 border-primary text-primary hover:bg-primary/10 font-medium active:scale-95'
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
  const [showPassword, setShowPassword] = useState(false);
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
    <BeautifulBackground>
      {/* Centered Content Container - Fits in viewport */}
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Glass-morphism Card with beautiful styling */}
          <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 rounded-2xl shadow-2xl dark:shadow-2xl dark:shadow-black/40 p-6 sm:p-8 border border-white/20 dark:border-slate-700/30 overflow-hidden relative">
            
            {/* Decorative gradient accent top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-sage-400 to-primary/50"></div>
            
            <motion.div
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.12,
                    delayChildren: 0.1
                  }
                }
              }}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {/* Header with Icon */}
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  show: { opacity: 1, y: 0 }
                }}
                className="text-center space-y-1.5"
              >
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                    <Lock className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Welcome Back</h1>
                <p className="text-sm text-muted-foreground">
                  Sign in to connect with peers
                </p>
              </motion.div>
              
              {/* Server Status Message */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, scale: 0.95 },
                  show: { opacity: 1, scale: 1 }
                }}
              >
                {getServerStatusMessage()}
              </motion.div>
              
              {/* Error Message */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, scale: 0.95 },
                  show: { opacity: 1, scale: 1 }
                }}
              >
                {error && (
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg text-sm font-medium flex items-start">
                    <div className="flex-shrink-0 mr-3 mt-0.5">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></div>
                    </div>
                    {error}
                  </div>
                )}
              </motion.div>
              
              {/* Login Form */}
              <motion.form 
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
                onSubmit={handleSubmit} 
                className="space-y-4"
              >
                {/* Email Field */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                >
                  <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-1.5 ml-0.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60 pointer-events-none" strokeWidth={2} />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border-2 border-primary/30 bg-background/50 dark:bg-slate-800/50 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                      placeholder="you@example.com"
                    />
                  </div>
                </motion.div>
                
                {/* Password Field */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5 ml-0.5">
                    <label htmlFor="password" className="block text-sm font-semibold text-foreground">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-xs font-medium text-primary hover:text-primary/80 hover:underline transition-colors">
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60 pointer-events-none" strokeWidth={2} />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-12 py-2.5 text-sm rounded-lg border-2 border-primary/30 bg-background/50 dark:bg-slate-800/50 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:text-primary"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </motion.div>
                
                {/* Sign In Button */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                >
                  <Button 
                    type="submit" 
                    className="w-full py-2.5 text-base"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <motion.div className="flex items-center" animate={{ opacity: [1, 0.6, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {serverStatus === 'waking' ? 'Waking Server...' : 'Signing In...'}
                      </motion.div>
                    ) : (
                      <div className="flex items-center">
                        Sign In
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    )}
                  </Button>
                </motion.div>
              </motion.form>
              
              {/* Sign Up Link */}
              <motion.div
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1 }
                }}
                className="text-center pt-1"
              >
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-semibold text-primary hover:text-primary/80 hover:underline transition-colors">
                    Create one now
                  </Link>
                </p>
              </motion.div>
              
              {/* OAuth Buttons - Removed to save space */}
              <motion.div
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.08
                    }
                  }
                }}
                className="hidden"
              >
                <motion.button
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                  type="button"
                  className="flex items-center justify-center py-3 px-4 rounded-lg border-2 border-primary/30 bg-background/50 dark:bg-slate-800/50 hover:border-primary/60 hover:bg-primary/5 transition-all duration-200 font-medium text-sm group"
                >
                  <Github className="w-5 h-5 text-foreground mr-2 group-hover:text-primary transition-colors" strokeWidth={2} />
                  GitHub
                </motion.button>
                <motion.button
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                  type="button"
                  className="flex items-center justify-center py-3 px-4 rounded-lg border-2 border-primary/30 bg-background/50 dark:bg-slate-800/50 hover:border-primary/60 hover:bg-primary/5 transition-all duration-200 font-medium text-sm group"
                >
                  <Chrome className="w-5 h-5 text-foreground mr-2 group-hover:text-primary transition-colors" strokeWidth={2} />
                  Google
                </motion.button>
              </motion.div>
            </motion.div>
          </div>

          {/* Footer Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-center text-xs text-muted-foreground mt-3"
          >
            By signing in, you agree to our{' '}
            <a href="#" className="text-primary hover:underline font-medium">
              Terms
            </a>
            {' '}and{' '}
            <a href="#" className="text-primary hover:underline font-medium">
              Privacy
            </a>
          </motion.p>
        </motion.div>
      </div>
    </BeautifulBackground>
  );
};

export default Login;
