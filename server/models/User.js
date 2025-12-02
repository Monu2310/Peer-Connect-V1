const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Helper function to generate a funky random profile image URL
const generateRandomProfileImage = (username) => {
  // Use DiceBear fun-emoji style for funky, colorful avatars
  const styles = ['fun-emoji', 'bottts', 'avataaars', 'lorelei', 'notionists', 'pixel-art'];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  const seed = username + Math.random().toString(36).substring(7);
  return `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${seed}`;
};

const UserSchema = new mongoose.Schema({
  // Link to Firebase auth user
  firebaseUid: {
    type: String,
    index: true,
    unique: true,
    sparse: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profilePicture: {
    type: String,
    default: function() {
      return generateRandomProfileImage(this.username);
    }
  },
  bio: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  major: {
    type: String,
    default: ''
  },
  year: {
    type: String,
    default: ''
  },
  interests: {
    type: [String],
    default: []
  },
  // New preference fields
  hobbies: {
    type: [String],
    default: []
  },
  favoriteSubjects: {
    type: [String],
    default: []
  },
  sports: {
    type: [String],
    default: []
  },
  musicGenres: {
    type: [String],
    default: []
  },
  movieGenres: {
    type: [String],
    default: []
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Add indexes for faster queries (username and email are already indexed by unique: true)
UserSchema.index({ createdAt: -1 });
UserSchema.index({ interests: 1 });
UserSchema.index({ firebaseUid: 1 });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);