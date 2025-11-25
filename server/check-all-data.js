require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  const Friend = require('./models/Friend');
  const Activity = require('./models/Activity');
  
  console.log('\n=== ALL USERS ===');
  const users = await User.find({});
  console.log('Count:', users.length);
  users.forEach(u => {
    console.log(JSON.stringify({
      _id: u._id,
      email: u.email,
      username: u.username,
      firebaseUid: u.firebaseUid
    }));
  });
  
  console.log('\n=== ALL FRIENDS ===');
  const friends = await Friend.find({}).populate('user friend');
  console.log('Count:', friends.length);
  friends.forEach(f => {
    console.log(`User: ${f.user?.username || f.user} <-> Friend: ${f.friend?.username || f.friend} (Status: ${f.status})`);
  });
  
  console.log('\n=== ALL ACTIVITIES ===');
  const activities = await Activity.find({}).populate('creator');
  console.log('Count:', activities.length);
  activities.forEach(a => {
    console.log(`"${a.title}" by ${a.creator?.username || a.creator}`);
  });
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
