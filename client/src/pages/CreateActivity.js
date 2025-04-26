import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createActivity } from '../api/activityService';

const CreateActivity = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    category: '',
    maxParticipants: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { title, description, date, location, category, maxParticipants } = formData;

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    
    // Set minimum date to today
    const today = new Date();
    const selectedDate = new Date(date);
    if (selectedDate < today) {
      setError('Activity date cannot be in the past');
      return;
    }
    
    try {
      setLoading(true);
      
      // Convert maxParticipants to number if provided
      const activityData = {
        ...formData,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null
      };
      
      const newActivity = await createActivity(activityData);
      navigate(`/activities/${newActivity._id}`);
    } catch (err) {
      console.error('Error creating activity:', err);
      setError(err.response?.data?.message || 'Failed to create activity');
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/activities" className="text-primary hover:text-primary-dark flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Activities
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Activity</h1>
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
              <p>{error}</p>
            </div>
          )}
          
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Activity Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={title}
                onChange={onChange}
                required
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                placeholder="Give your activity a clear title"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={onChange}
                required
                rows="5"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                placeholder="Describe your activity, what participants should expect, what to bring, etc."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date and Time *
                </label>
                <input
                  type="datetime-local"
                  id="date"
                  name="date"
                  value={date}
                  onChange={onChange}
                  required
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={location}
                  onChange={onChange}
                  required
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  placeholder="Where will this activity take place?"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={category}
                  onChange={onChange}
                  required
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                >
                  <option value="" disabled>Select a category</option>
                  <option value="Academic">Academic</option>
                  <option value="Social">Social</option>
                  <option value="Sports">Sports</option>
                  <option value="Career">Career</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-1">
                  Max Participants (optional)
                </label>
                <input
                  type="number"
                  id="maxParticipants"
                  name="maxParticipants"
                  value={maxParticipants}
                  onChange={onChange}
                  min="1"
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  placeholder="Leave empty for unlimited"
                />
                <p className="mt-1 text-xs text-gray-500">Leave empty for unlimited participants</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image Upload
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                <p className="text-gray-500 text-sm">
                  Image upload is coming in a future update. 
                  <br />
                  For now, activities will use default images based on category.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Link
                to="/activities"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Creating...' : 'Create Activity'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateActivity;