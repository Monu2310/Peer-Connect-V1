import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../core/AuthContext';
import { Loader2, Mail, Lock, ArrowRight, Github, Chrome, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../api/config';
import BeautifulBackground from '../components/effects/BeautifulBackground';

// Elite Button component with perfect color theory
const Button = ({ children, variant = 'default', type = 'button', className = '', disabled = false, onClick, ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center px-5 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] focus:ring-primary/50',
    outline: 'border-2 border-secondary text-secondary hover:bg-secondary/10 font-semibold active:scale-[0.98] focus:ring-secondary/50'
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
          .catch(() => {});
      } catch (err) {
        // Server wake-up failed, continue anyway
      }
    }
    
    try {
      // Clear any existing authentication data
      localStorage.removeItem('token');
      
      // Try login with a catch for network errors
      const response = await login(formData);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      
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
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Premium Glass Card */}
          <div className="relative backdrop-blur-2xl bg-card/90 dark:bg-card/95 rounded-3xl shadow-2xl border border-border/60 overflow-hidden">
            
            {/* Premium accent top */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary"></div>
            
            {/* Main Content */}
            <div className="p-8 sm:p-10">
              <motion.div
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 0.15
                    }
                  }
                }}
                initial="hidden"
                animate="show"
                className="space-y-7"
              >
                {/* Header with Icon */}
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                  }}
                  className="text-center space-y-3"
                >
                  <div className="flex justify-center mb-3">
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl">
                      <Lock className="w-8 h-8 text-primary-foreground" strokeWidth={2.5} />
                    </div>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">Welcome Back</h1>
                  <p className="text-base text-muted-foreground font-medium">
                    Sign in to connect with your peers
                  </p>
                </motion.div>
              
                {/* Server Status Message */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, scale: 0.96 },
                    show: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
                  }}
                >
                  {getServerStatusMessage()}
                </motion.div>
                
                {/* Error Message - Premium Design */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, scale: 0.96 },
                    show: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
                  }}
                >
                  {error && (
                    <div className="bg-destructive/10 backdrop-blur-sm border-2 border-destructive/30 text-destructive p-4 rounded-xl text-sm font-semibold flex items-start gap-3 shadow-lg">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
                      </div>
                      <span>{error}</span>
                    </div>
                  )}
                </motion.div>
                
                {/* Login Form - Premium Design */}
                <motion.form 
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.08,
                        delayChildren: 0.1
                      }
                    }
                  }}
                  onSubmit={handleSubmit} 
                  className="space-y-5"
                >
                  {/* Email Field - Enhanced */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
                    }}
                  >
                    <label htmlFor="email" className="block text-sm font-bold text-foreground mb-2 ml-1">
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none z-10" strokeWidth={2.5} />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3.5 text-base rounded-xl border-2 border-border bg-input/60 backdrop-blur-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 font-medium shadow-sm"
                        placeholder="you@example.com"
                      />
                    </div>
                  </motion.div>
                  
                  {/* Password Field - Enhanced */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2 ml-1">
                      <label htmlFor="password" className="block text-sm font-bold text-foreground">
                        Password
                      </label>
                      <Link to="/forgot-password" className="text-xs font-bold text-primary hover:text-primary/80 hover:underline transition-colors">
                        Forgot Password?
                      </Link>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none z-10" strokeWidth={2.5} />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-12 pr-14 py-3.5 text-base rounded-xl border-2 border-border bg-input/60 backdrop-blur-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 font-medium shadow-sm"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none z-10"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" strokeWidth={2.5} />
                        ) : (
                          <Eye className="w-5 h-5" strokeWidth={2.5} />
                        )}
                      </button>
                    </div>
                  </motion.div>
                  
                  {/* Sign In Button - Premium */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
                    }}
                    className="pt-2"
                  >
                    <Button 
                      type="submit" 
                      className="w-full py-4 text-lg font-bold group relative overflow-hidden bg-primary hover:bg-primary/90"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <motion.div 
                          className="flex items-center justify-center" 
                          animate={{ opacity: [1, 0.7, 1] }} 
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Loader2 className="mr-2.5 h-5 w-5 animate-spin" strokeWidth={2.5} />
                          <span>{serverStatus === 'waking' ? 'Waking Server...' : 'Signing In...'}</span>
                        </motion.div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span>Sign In</span>
                          <ArrowRight className="ml-2.5 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.5} />
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </motion.form>
                
                {/* Divider */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { duration: 0.5 } }
                  }}
                  className="relative"
                >
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-card text-muted-foreground font-semibold">OR</span>
                  </div>
                </motion.div>
                
                {/* Sign Up Link - Enhanced */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { duration: 0.5 } }
                  }}
                  className="text-center"
                >
                  <p className="text-base text-muted-foreground font-medium">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-bold text-primary hover:text-primary/80 hover:underline decoration-2 underline-offset-2 transition-all">
                      Create Account
                    </Link>
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Footer Text - Premium */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-center mt-6"
          >
            <p className="text-sm text-muted-foreground font-medium">
              By signing in, you agree to our{' '}
              <a href="#" className="text-primary hover:text-primary/80 font-bold hover:underline decoration-2 underline-offset-2 transition-all">
                Terms of Service
              </a>
              {' '}and{' '}
              <a href="#" className="text-primary hover:text-primary/80 font-bold hover:underline decoration-2 underline-offset-2 transition-all">
                Privacy Policy
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </BeautifulBackground>
  );
};

export default Login;
