const mongoose = require('mongoose');

// Function to get default image based on category
const getDefaultImageForCategory = (category) => {
  const categoryImages = {
    'sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'social': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'educational': 'https://images.unsplash.com/photo-1491975474562-1f4e30bc9468?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'entertainment': 'https://images.unsplash.com/photo-1485846234645-a62644f84728?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'volunteer': 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'other': 'https://images.unsplash.com/photo-1493612276216-ee3925520721?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'
  };
  
  return categoryImages[category?.toLowerCase()] || categoryImages['other'];
};

const ActivitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    lowercase: true,
    enum: ['sports', 'social', 'educational', 'entertainment', 'volunteer', 'other']
  },
  location: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: false
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxParticipants: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  image: {
    type: String,
    default: function() {
      return getDefaultImageForCategory(this.category);
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Add indexes for faster queries
ActivitySchema.index({ creator: 1 });
ActivitySchema.index({ category: 1 });
ActivitySchema.index({ date: 1 });
ActivitySchema.index({ location: 1 });
ActivitySchema.index({ createdAt: -1 });
ActivitySchema.index({ participants: 1 });

module.exports = mongoose.model('Activity', ActivitySchema);