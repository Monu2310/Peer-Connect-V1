import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, getUserById } from '../api/userService';
import MetallicCard from '../components/effects/MetallicCard';
import PageTransition from '../components/effects/PageTransition';
import { motion } from 'framer-motion';

const Profile = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    location: '',
    interests: [],
    profilePicture: '',
  });
  
  const [interestInput, setInterestInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
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
        stiffness: 70,
        damping: 10
      }
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        // Assuming the current user object has an id property, otherwise you'll need to adjust this
        const userId = currentUser?.id;
        const userData = await getUserById(userId);
        
        // Format interests to array if it comes as string
        let interests = userData.interests || [];
        if (typeof interests === 'string') {
          interests = interests.split(',').map(interest => interest.trim());
        }
        
        setFormData({
          username: userData.username || '',
          email: userData.email || '',
          bio: userData.bio || '',
          location: userData.location || '',
          interests: interests,
          profilePicture: userData.profilePicture || '',
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data');
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addInterest = () => {
    if (interestInput.trim() && !formData.interests.includes(interestInput.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interestInput.trim()]
      }));
      setInterestInput('');
    }
  };

  const removeInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      
      // In a real app, you would upload to a server/cloud storage here
      // For now, we'll just simulate with a timeout
      setUploadingImage(true);
      setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          profilePicture: reader.result
        }));
        setUploadingImage(false);
      }, 1500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Format interests to string if API expects it that way
      const updatedData = {
        ...formData,
        interests: Array.isArray(formData.interests) 
          ? formData.interests.join(',') 
          : formData.interests
      };
      
      await updateProfile(updatedData);
      setCurrentUser(prev => ({ ...prev, ...updatedData }));
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isEditing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <motion.div 
            className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          />
          <motion.p 
            className="mt-4 text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading your profile...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.h1 
          className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Your Profile
        </motion.h1>

        {error && (
          <motion.div 
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {error}
          </motion.div>
        )}
        
        {success && (
          <motion.div 
            className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            {success}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Profile Picture */}
          <div className="lg:col-span-1">
            <MetallicCard className="p-6" intensity={0.1}>
              <motion.div 
                className="flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="relative mb-4 group">
                  <motion.div
                    className="h-40 w-40 rounded-full overflow-hidden border-4 border-primary relative"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <img 
                      src={previewImage || formData.profilePicture || 'https://via.placeholder.com/150'} 
                      alt={formData.username || 'Profile'} 
                      className="h-full w-full object-cover"
                    />
                    
                    {isEditing && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-sm">Change Photo</span>
                      </div>
                    )}
                  </motion.div>
                  
                  {uploadingImage && (
                    <motion.div 
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="h-full w-full bg-black bg-opacity-30 rounded-full flex items-center justify-center">
                        <motion.div 
                          className="h-10 w-10 border-4 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ 
                            duration: 1, 
                            repeat: Infinity, 
                            ease: "linear" 
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                  
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={!isEditing || uploadingImage}
                      />
                    </label>
                  )}
                </div>
                
                <motion.h2 
                  className="text-2xl font-bold text-gray-800 mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {formData.username}
                </motion.h2>
                
                <motion.div 
                  className="text-gray-600 text-center mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-center mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{formData.email}</span>
                  </div>
                  {formData.location && (
                    <div className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{formData.location}</span>
                    </div>
                  )}
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {!isEditing ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsEditing(true)}
                      className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors"
                    >
                      Edit Profile
                    </motion.button>
                  ) : (
                    <div className="flex space-x-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setIsEditing(false);
                          setPreviewImage('');
                        }}
                        className="border border-gray-300 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors flex items-center"
                      >
                        {loading ? (
                          <>
                            <motion.div 
                              className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            Saving...
                          </>
                        ) : 'Save Changes'}
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </MetallicCard>
            
            {/* Interests Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6"
            >
              <MetallicCard className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Interests
                </h3>

                <div className="mb-4">
                  <motion.div 
                    className="flex flex-wrap gap-2"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                  >
                    {formData.interests.map((interest, index) => (
                      <motion.div
                        key={interest}
                        variants={itemVariants}
                        custom={index}
                        className="bg-gradient-to-r from-primary/10 to-indigo-400/10 rounded-full py-1 px-3 text-sm text-gray-700 flex items-center"
                      >
                        {interest}
                        {isEditing && (
                          <button 
                            onClick={() => removeInterest(interest)}
                            className="ml-1 text-gray-500 hover:text-red-500"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
                
                {isEditing && (
                  <div className="mt-4">
                    <div className="flex">
                      <input
                        type="text"
                        value={interestInput}
                        onChange={(e) => setInterestInput(e.target.value)}
                        placeholder="Add an interest"
                        className="block w-full rounded-l-md border-gray-300 focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                      />
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={addInterest}
                        className="bg-primary text-white rounded-r-md px-4 hover:bg-primary-dark"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </motion.button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Press the + button to add an interest</p>
                  </div>
                )}
              </MetallicCard>
            </motion.div>
          </div>
          
          {/* Right column: Profile Information */}
          <div className="lg:col-span-2">
            <MetallicCard className="p-6">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                <motion.h3 
                  className="text-xl font-semibold mb-6 border-b pb-2"
                  variants={itemVariants}
                >
                  Personal Information
                </motion.h3>
                
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div variants={itemVariants}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`block w-full rounded-md border-gray-300 ${
                          isEditing 
                            ? 'focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50' 
                            : 'bg-gray-50'
                        }`}
                      />
                    </motion.div>
                    
                    <motion.div variants={itemVariants}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`block w-full rounded-md border-gray-300 ${
                          isEditing 
                            ? 'focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50' 
                            : 'bg-gray-50'
                        }`}
                      />
                    </motion.div>
                    
                    <motion.div variants={itemVariants}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Where are you located?" : ""}
                        className={`block w-full rounded-md border-gray-300 ${
                          isEditing 
                            ? 'focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50' 
                            : 'bg-gray-50'
                        }`}
                      />
                    </motion.div>
                  </div>
                  
                  <motion.div className="mt-6" variants={itemVariants}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder={isEditing ? "Tell us about yourself..." : ""}
                      rows={4}
                      className={`block w-full rounded-md border-gray-300 ${
                        isEditing 
                          ? 'focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50' 
                          : 'bg-gray-50'
                      }`}
                    />
                  </motion.div>
                </form>
              </motion.div>
            </MetallicCard>
            
            {/* Activity Stats Card */}
            <motion.div 
              className="mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <MetallicCard className="p-6">
                <h3 className="text-xl font-semibold mb-6 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Activity Stats
                </h3>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <motion.div 
                    className="text-center p-4 bg-gradient-to-br from-primary/5 to-indigo-400/5 rounded-lg"
                    whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <p className="text-gray-600 text-sm mb-1">Activities Joined</p>
                    <p className="text-3xl font-bold text-primary">12</p>
                  </motion.div>
                  
                  <motion.div 
                    className="text-center p-4 bg-gradient-to-br from-primary/5 to-indigo-400/5 rounded-lg"
                    whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <p className="text-gray-600 text-sm mb-1">Friends</p>
                    <p className="text-3xl font-bold text-primary">24</p>
                  </motion.div>
                  
                  <motion.div 
                    className="text-center p-4 bg-gradient-to-br from-primary/5 to-indigo-400/5 rounded-lg"
                    whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <p className="text-gray-600 text-sm mb-1">Hosted</p>
                    <p className="text-3xl font-bold text-primary">5</p>
                  </motion.div>
                </div>
                
                <h4 className="text-lg font-medium mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                  Activity Breakdown
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Sports</span>
                      <span className="text-sm text-gray-600">40%</span>
                    </div>
                    <motion.div 
                      className="h-2 bg-gray-200 rounded-full overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                    >
                      <motion.div 
                        className="h-full bg-gradient-to-r from-primary to-indigo-500"
                        initial={{ width: 0 }}
                        animate={{ width: "40%" }}
                        transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
                      />
                    </motion.div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Study Groups</span>
                      <span className="text-sm text-gray-600">30%</span>
                    </div>
                    <motion.div 
                      className="h-2 bg-gray-200 rounded-full overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 0.9, duration: 0.5 }}
                    >
                      <motion.div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: "30%" }}
                        transition={{ delay: 1.1, duration: 0.8, ease: "easeOut" }}
                      />
                    </motion.div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Social Gatherings</span>
                      <span className="text-sm text-gray-600">20%</span>
                    </div>
                    <motion.div 
                      className="h-2 bg-gray-200 rounded-full overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 1, duration: 0.5 }}
                    >
                      <motion.div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        initial={{ width: 0 }}
                        animate={{ width: "20%" }}
                        transition={{ delay: 1.2, duration: 0.8, ease: "easeOut" }}
                      />
                    </motion.div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Other</span>
                      <span className="text-sm text-gray-600">10%</span>
                    </div>
                    <motion.div 
                      className="h-2 bg-gray-200 rounded-full overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 1.1, duration: 0.5 }}
                    >
                      <motion.div 
                        className="h-full bg-gradient-to-r from-pink-500 to-red-500"
                        initial={{ width: 0 }}
                        animate={{ width: "10%" }}
                        transition={{ delay: 1.3, duration: 0.8, ease: "easeOut" }}
                      />
                    </motion.div>
                  </div>
                </div>
              </MetallicCard>
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Profile;