require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  const Friend = require('./models/Friend');
  
  const sender = await User.findOne({ email: 'bgupta_mca24@thapar.edu' });
  const receiver = await User.findOne({ email: 'bhuveshx@gmail.com' });
  
  console.log('\n=== USERS ===');
  console.log('Sender (thapar):', sender ? `${sender.username} (${sender._id})` : 'NOT FOUND');
  console.log('Receiver (bhuveshx):', receiver ? `${receiver.username} (${receiver._id})` : 'NOT FOUND');
  
  if (!sender || !receiver) {
    console.log('\n❌ One or both users not found');
    process.exit(0);
  }
  
  console.log('\n=== FRIEND REQUESTS ===');
  
  // Find all friend documents involving these users
  const allFriendDocs = await Friend.find({
    $or: [
      { requester: sender._id },
      { recipient: sender._id },
      { requester: receiver._id },
      { recipient: receiver._id }
    ]
  }).populate('requester', 'username email').populate('recipient', 'username email');
  
  console.log(`\nTotal friend documents: ${allFriendDocs.length}`);
  
  allFriendDocs.forEach(doc => {
    console.log('\n---');
    console.log('ID:', doc._id);
    console.log('Requester:', doc.requester.username, '(' + doc.requester.email + ')');
    console.log('Recipient:', doc.recipient.username, '(' + doc.recipient.email + ')');
    console.log('Status:', doc.status);
    console.log('Created:', doc.createdAt);
  });
  
  // Check specific request from thapar to bhuveshx
  const request = await Friend.findOne({
    requester: sender._id,
    recipient: receiver._id
  });
  
  console.log('\n=== SPECIFIC REQUEST (thapar -> bhuveshx) ===');
  if (request) {
    console.log('✅ Request exists');
    console.log('Status:', request.status);
    console.log('Created:', request.createdAt);
  } else {
    console.log('❌ No request found from thapar to bhuveshx');
  }
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
