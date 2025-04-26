const mongoose = require('mongoose');

const FriendSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound index to ensure unique friendships
FriendSchema.index({ requester: 1, recipient: 1 }, { unique: true });

module.exports = mongoose.model('Friend', FriendSchema);