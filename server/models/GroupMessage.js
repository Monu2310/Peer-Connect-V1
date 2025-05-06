const mongoose = require('mongoose');

const GroupMessageSchema = new mongoose.Schema({
  activityId: {
    type: String,
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Add compound index for efficient queries
GroupMessageSchema.index({ activityId: 1, createdAt: 1 });

// Add pre-save middleware to convert string IDs to ObjectId if needed
GroupMessageSchema.pre('save', function(next) {
  // If sender is a string, convert it to ObjectId
  if (this.sender && typeof this.sender === 'string') {
    try {
      this.sender = mongoose.Types.ObjectId(this.sender);
    } catch (err) {
      console.error('Error converting sender to ObjectId:', err);
    }
  }
  next();
});

module.exports = mongoose.model('GroupMessage', GroupMessageSchema);