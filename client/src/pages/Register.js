import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion'; // Import for animations

const Register = () => {
  // Track the current step of registration
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    major: '',
    graduationYear: '',
    // New preference fields
    hobbies: [],
    favoriteSubjects: [],
    sports: [],
    musicGenres: [],
    movieGenres: []
  });
  
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [apiResponse, setApiResponse] = useState(null);
  
  const { register, error, setError, currentUser } = useAuth();
  const navigate = useNavigate();
  
  const { 
    username, 
    email, 
    password, 
    passwordConfirm, 
    major, 
    graduationYear,
    hobbies,
    favoriteSubjects,
    sports,
    musicGenres,
    movieGenres
  } = formData;
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
    
    // Clear any previous auth errors
    return () => setError('');
  }, [currentUser, navigate, setError]);
  
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError('');
    setError('');
  };
  
  // Handler for adding items to arrays (for preferences)
  const handleAddPreference = (e, category) => {
    const value = e.target.value.trim();
    
    if (e.key === 'Enter' && value) {
      e.preventDefault();
      // Only add if not already in the array
      if (!formData[category].includes(value)) {
        setFormData({
          ...formData,
          [category]: [...formData[category], value]
        });
      }
      e.target.value = '';
    }
  };
  
  // Handler for removing items from arrays
  const handleRemovePreference = (item, category) => {
    setFormData({
      ...formData,
      [category]: formData[category].filter(i => i !== item)
    });
  };
  
  // Step progression
  const nextStep = () => {
    // Validation for step 1
    if (step === 1) {
      if (!username || !email || !password) {
        setFormError('Please enter all required fields');
        return;
      }
      
      if (password !== passwordConfirm) {
        setFormError('Passwords do not match');
        return;
      }
      
      if (password.length < 4) {
        setFormError('Password must be at least 4 characters');
        return;
      }
    }
    
    setStep(step + 1);
    setFormError('');
  };
  
  const prevStep = () => {
    setStep(step - 1);
    setFormError('');
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    
    setLoading(true);
    setApiResponse(null);
    
    try {
      const userData = { 
        username, 
        email, 
        password,
        hobbies,
        favoriteSubjects,
        sports,
        musicGenres,
        movieGenres
      };
      
      // Add optional fields if provided
      if (major) userData.major = major;
      if (graduationYear) userData.graduationYear = parseInt(graduationYear);
      
      console.log('Attempting to register with:', { 
        ...userData, 
        password: '***',
        hobbies,
        favoriteSubjects,
        sports,
        musicGenres,
        movieGenres
      });
      
      // Clear previous errors
      setFormError('');
      setError('');
      
      const response = await register(userData);
      setApiResponse({ success: true, data: response });
      
      console.log('Registration successful, navigating to dashboard...');
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      
      // Display specific error message based on error type
      if (err.message.includes('already exists with this email')) {
        setFormError('This email is already registered. Please use another email or try logging in.');
      } else if (err.message.includes('Username is already taken')) {
        setFormError('This username is already taken. Please choose another username.');
      } else {
        setApiResponse({ 
          success: false, 
          error: err.message || 'Registration failed. Please try again.' 
        });
      }
      setLoading(false);
    }
  };

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, x: 100 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -100 }
  };
  
  // Helper to render preference chips
  const renderPreferenceChips = (items, category) => (
    <div className="flex flex-wrap gap-2 mt-2">
      {items.map((item, index) => (
        <span 
          key={index} 
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
        >
          {item}
          <button
            type="button"
            className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600"
            onClick={() => handleRemovePreference(item, category)}
          >
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        </span>
      ))}
    </div>
  );

  // Helper to render the progress bar
  const renderProgressBar = () => (
    <div className="mb-6">
      <div className="flex justify-between mb-1">
        <div className="text-xs font-medium text-blue-700">Account Setup</div>
        <div className="text-xs font-medium text-blue-700">{step} of 3</div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
          style={{ width: `${Math.min((step / 3) * 100, 100)}%` }}
        ></div>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="block text-center mb-6">
            <span className="text-primary font-bold text-2xl">PeerConnect</span>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create your PeerConnect account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
              Sign in here
            </Link>
          </p>
        </div>
        
        {renderProgressBar()}
        
        {(formError || error) && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p>{formError || error}</p>
          </div>
        )}
        
        {apiResponse && !apiResponse.success && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p>Server Error: {apiResponse.error}</p>
          </div>
        )}
        
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={{ duration: 0.3 }}
            >
              <form className="mt-8 space-y-6">
                <div className="rounded-md shadow-sm -space-y-px">
                  <div>
                    <label htmlFor="username" className="sr-only">Username</label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={username}
                      onChange={onChange}
                      required
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                      placeholder="Username *"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="sr-only">Email address</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={onChange}
                      required
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                      placeholder="Email address *"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="sr-only">Password</label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={onChange}
                      required
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                      placeholder="Password *"
                    />
                  </div>
                  <div>
                    <label htmlFor="passwordConfirm" className="sr-only">Confirm Password</label>
                    <input
                      id="passwordConfirm"
                      name="passwordConfirm"
                      type="password"
                      autoComplete="new-password"
                      value={passwordConfirm}
                      onChange={onChange}
                      required
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                      placeholder="Confirm Password *"
                    />
                  </div>
                  <div>
                    <label htmlFor="major" className="sr-only">Major / Field of Study</label>
                    <input
                      id="major"
                      name="major"
                      type="text"
                      value={major}
                      onChange={onChange}
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                      placeholder="Major / Field of Study (optional)"
                    />
                  </div>
                  <div>
                    <label htmlFor="graduationYear" className="sr-only">Expected Graduation Year</label>
                    <input
                      id="graduationYear"
                      name="graduationYear"
                      type="number"
                      min="2020"
                      max="2030"
                      value={graduationYear}
                      onChange={onChange}
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                      placeholder="Expected Graduation Year (optional)"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </motion.div>
          )}
          
          {step === 2 && (
            <motion.div
              key="step2"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={{ duration: 0.3 }}
            >
              <form className="mt-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      What are your hobbies?
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      These help us match you with peers who share your interests
                    </p>
                    {renderPreferenceChips(hobbies, 'hobbies')}
                    <input
                      type="text"
                      placeholder="Type a hobby and press Enter"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      onKeyPress={(e) => handleAddPreference(e, 'hobbies')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      What subjects are you interested in?
                    </label>
                    {renderPreferenceChips(favoriteSubjects, 'favoriteSubjects')}
                    <input
                      type="text"
                      placeholder="Type a subject and press Enter"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      onKeyPress={(e) => handleAddPreference(e, 'favoriteSubjects')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      What sports do you enjoy?
                    </label>
                    {renderPreferenceChips(sports, 'sports')}
                    <input
                      type="text"
                      placeholder="Type a sport and press Enter"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      onKeyPress={(e) => handleAddPreference(e, 'sports')}
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="group relative w-1/2 flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="group relative w-1/2 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </motion.div>
          )}
          
          {step === 3 && (
            <motion.div
              key="step3"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={{ duration: 0.3 }}
            >
              <form className="mt-8 space-y-6" onSubmit={onSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      What music do you like?
                    </label>
                    {renderPreferenceChips(musicGenres, 'musicGenres')}
                    <input
                      type="text"
                      placeholder="Type a music genre and press Enter"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      onKeyPress={(e) => handleAddPreference(e, 'musicGenres')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      What movies or TV shows do you enjoy?
                    </label>
                    {renderPreferenceChips(movieGenres, 'movieGenres')}
                    <input
                      type="text"
                      placeholder="Type a movie/TV genre and press Enter"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      onKeyPress={(e) => handleAddPreference(e, 'movieGenres')}
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="group relative w-1/2 flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`group relative w-1/2 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                      loading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
                
                <div className="text-xs text-gray-500 text-center">
                  By signing up, you agree to our <a href="#" className="text-primary">Terms of Service</a> and <a href="#" className="text-primary">Privacy Policy</a>.
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Register;