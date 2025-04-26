import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    major: '',
    graduationYear: ''
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [apiResponse, setApiResponse] = useState(null);
  
  const { register, error, setError, currentUser } = useAuth();
  const navigate = useNavigate();
  
  const { username, email, password, passwordConfirm, major, graduationYear } = formData;
  
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
  
  const onSubmit = async e => {
    e.preventDefault();
    
    // Simple validation
    if (!username || !email || !password) {
      setFormError('Please enter all required fields');
      return;
    }
    
    if (password !== passwordConfirm) {
      setFormError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setApiResponse(null);
    
    try {
      const userData = { username, email, password };
      
      // Add optional fields if provided
      if (major) userData.major = major;
      if (graduationYear) userData.graduationYear = parseInt(graduationYear);
      
      console.log('Attempting to register with:', { ...userData, password: '***' });
      
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
        
        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
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
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
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
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or sign up with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div>
              <a
                href="#"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <span className="sr-only">Sign up with Google</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  />
                </svg>
              </a>
            </div>

            <div>
              <a
                href="#"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <span className="sr-only">Sign up with Facebook</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M22,12.1c0-5.5-4.5-10-10-10c-5.5,0-10,4.5-10,10c0,5,3.7,9.1,8.4,9.9v-7H7.9v-2.9h2.5V9.9c0-2.5,1.5-3.9,3.8-3.9c1.1,0,2.2,0.2,2.2,0.2v2.5h-1.3c-1.2,0-1.6,0.8-1.6,1.6v1.9h2.8L15.9,15h-2.3v7C18.3,21.2,22,17.1,22,12.1z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;