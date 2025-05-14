const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Array of profile image URLs to randomly select from for default avatars
const profileImageOptions = [
  'https://robohash.org/',
  'https://avatars.dicebear.com/api/avataaars/',
  'https://avatars.dicebear.com/api/bottts/',
  'https://avatars.dicebear.com/api/human/',
  'https://avatars.dicebear.com/api/identicon/',
  'https://avatars.dicebear.com/api/jdenticon/',
  'https://avatars.dicebear.com/api/gridy/',
  'https://api.multiavatar.com/'
];

// Helper function to generate a random profile image URL
const generateRandomProfileImage = (seed) => {
  // Select a random base URL from the options
  const baseUrl = profileImageOptions[Math.floor(Math.random() * profileImageOptions.length)];
  
  // Add seed and any required parameters
  if (baseUrl.includes('dicebear')) {
    return `${baseUrl}${seed}.svg?mood=happy&background=%23ffffff`;
  } else if (baseUrl.includes('robohash')) {
    return `${baseUrl}${seed}?set=set4&bgset=bg1&size=200x200`;
  } else if (baseUrl.includes('multiavatar')) {
    // For multiavatar, ensure we're returning a PNG
    return `${baseUrl}${seed}.png`;
  }
  
  // Default fallback
  return `${baseUrl}${seed}`;
};

const UserSchema = new mongoose.Schema({
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
      // Generate a unique avatar based on username + timestamp
      return generateRandomProfileImage(this.username + Date.now());
    }
  },
  bio: {
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
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

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