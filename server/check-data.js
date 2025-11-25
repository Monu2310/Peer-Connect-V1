require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  const Activity = require('./models/Activity');
  const Friend = require('./models/Friend');
  
  const user = await User.findOne({ email: 'bhuveshx@gmail.com' });
  
  if (!user) {
    console.log('NO USER FOUND IN MONGODB');
    process.exit(0);
  }
  
  console.log('\n=== USER DATA ===');
  console.log('ID:', user._id);
  console.log('Username:', user.username);
  console.log('Firebase UID:', user.firebaseUid);
  console.log('Email:', user.email);
  
  const activities = await Activity.find({ creator: user._id });
  console.log('\n=== ACTIVITIES ===');
  console.log('Count:', activities.length);
  activities.forEach(a => console.log('- ' + a.title));
  
  const friends = await Friend.find({ $or: [{ user: user._id }, { friend: user._id }] });
  console.log('\n=== FRIENDS ===');
  console.log('Count:', friends.length);
  
  const allActivities = await Activity.find({});
  console.log('\n=== ALL ACTIVITIES IN DB ===');
  console.log('Total count:', allActivities.length);
  
  const allFriends = await Friend.find({});
  console.log('\n=== ALL FRIENDS IN DB ===');
  console.log('Total count:', allFriends.length);
  
  const allUsers = await User.find({});
  console.log('\n=== ALL USERS IN DB ===');
  console.log('Total count:', allUsers.length);
  allUsers.forEach(u => console.log('- ' + u.email + ' (Firebase: ' + u.firebaseUid + ')'));
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
