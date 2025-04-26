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

module.exports = mongoose.model('GroupMessage', GroupMessageSchema);