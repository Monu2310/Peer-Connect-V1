const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
const User = require('../models/User');
const Activity = require('../models/Activity');

// Test users data
const testUsers = [
  {
    username: 'alice_wonder',
    email: 'alice@test.com',
    password: 'password123',
    bio: '🎨 Creative designer and art enthusiast. Love exploring new cafes!',
    major: 'Computer Science',
    year: '2025',
    location: 'San Francisco, CA',
    interests: ['Design', 'Art', 'Coffee'],
    hobbies: ['Painting', 'Photography', 'Reading'],
    favoriteSubjects: ['UI/UX Design', 'Digital Art', 'Typography'],
    sports: ['Yoga', 'Swimming'],
    musicGenres: ['Indie Pop', 'Electronic', 'Jazz'],
    movieGenres: ['Drama', 'Sci-Fi', 'Documentary']
  },
  {
    username: 'bob_builder',
    email: 'bob@test.com',
    password: 'password123',
    bio: '👨‍💻 Full-stack developer building cool stuff. Always up for a coding challenge!',
    major: 'Software Engineering',
    year: '2024',
    location: 'New York, NY',
    interests: ['Coding', 'Gaming', 'Tech'],
    hobbies: ['Gaming', 'Coding', 'Cycling'],
    favoriteSubjects: ['Algorithms', 'System Design', 'Web Development'],
    sports: ['Basketball', 'Cycling', 'Running'],
    musicGenres: ['Rock', 'EDM', 'Hip Hop'],
    movieGenres: ['Action', 'Thriller', 'Comedy']
  },
  {
    username: 'charlie_tech',
    email: 'charlie@test.com',
    password: 'password123',
    bio: '🚀 Startup enthusiast and tech lover. Let\'s build something amazing!',
    major: 'Business Administration',
    year: '2026',
    location: 'Austin, TX',
    interests: ['Startups', 'Innovation', 'Networking'],
    hobbies: ['Networking', 'Reading', 'Traveling'],
    favoriteSubjects: ['Entrepreneurship', 'Marketing', 'Finance'],
    sports: ['Tennis', 'Golf'],
    musicGenres: ['Pop', 'Country', 'Classical'],
    movieGenres: ['Biography', 'Documentary', 'Drama']
  },
  {
    username: 'diana_artist',
    email: 'diana@test.com',
    password: 'password123',
    bio: '🎭 Theater major with a passion for storytelling. Always looking for creative collaborators!',
    major: 'Theater Arts',
    year: '2025',
    location: 'Los Angeles, CA',
    interests: ['Acting', 'Writing', 'Music'],
    hobbies: ['Acting', 'Singing', 'Writing'],
    favoriteSubjects: ['Drama', 'Creative Writing', 'Film Studies'],
    sports: ['Dance', 'Hiking'],
    musicGenres: ['Musical Theater', 'Soul', 'R&B'],
    movieGenres: ['Drama', 'Romance', 'Musical']
  },
  {
    username: 'eric_fitness',
    email: 'eric@test.com',
    password: 'password123',
    bio: '💪 Fitness trainer and nutrition coach. Let\'s crush those fitness goals together!',
    major: 'Kinesiology',
    year: '2024',
    location: 'Miami, FL',
    interests: ['Fitness', 'Health', 'Nutrition'],
    hobbies: ['Weightlifting', 'Meal Prep', 'Running'],
    favoriteSubjects: ['Exercise Science', 'Nutrition', 'Physiology'],
    sports: ['Weightlifting', 'CrossFit', 'Marathon Running'],
    musicGenres: ['Hip Hop', 'EDM', 'Rock'],
    movieGenres: ['Action', 'Sports', 'Motivational']
  },
  {
    username: 'fiona_bookworm',
    email: 'fiona@test.com',
    password: 'password123',
    bio: '📚 Literature major and bookworm. Always have a book recommendation!',
    major: 'English Literature',
    year: '2026',
    location: 'Boston, MA',
    interests: ['Reading', 'Writing', 'Poetry'],
    hobbies: ['Reading', 'Writing', 'Book Clubs'],
    favoriteSubjects: ['British Literature', 'Creative Writing', 'Poetry'],
    sports: ['Walking', 'Yoga'],
    musicGenres: ['Classical', 'Indie Folk', 'Acoustic'],
    movieGenres: ['Period Drama', 'Romance', 'Literary Adaptation']
  },
  {
    username: 'george_gamer',
    email: 'george@test.com',
    password: 'password123',
    bio: '🎮 Esports enthusiast and game designer wannabe. Let\'s play!',
    major: 'Game Design',
    year: '2025',
    location: 'Seattle, WA',
    interests: ['Gaming', 'Game Design', 'Animation'],
    hobbies: ['Gaming', '3D Modeling', 'Streaming'],
    favoriteSubjects: ['Game Development', '3D Animation', 'Level Design'],
    sports: ['Table Tennis', 'Badminton'],
    musicGenres: ['Video Game Music', 'Electronic', 'Synthwave'],
    movieGenres: ['Sci-Fi', 'Fantasy', 'Animation']
  },
  {
    username: 'hannah_explorer',
    email: 'hannah@test.com',
    password: 'password123',
    bio: '🌍 Travel blogger and adventure seeker. Life is too short to stay in one place!',
    major: 'International Relations',
    year: '2024',
    location: 'Denver, CO',
    interests: ['Travel', 'Photography', 'Culture'],
    hobbies: ['Traveling', 'Photography', 'Blogging'],
    favoriteSubjects: ['World History', 'Cultural Studies', 'Languages'],
    sports: ['Hiking', 'Rock Climbing', 'Skiing'],
    musicGenres: ['World Music', 'Indie', 'Folk'],
    movieGenres: ['Adventure', 'Documentary', 'Foreign Films']
  }
];

// Test activities
const testActivities = [
  {
    title: 'Weekend Basketball Game',
    description: 'Join us for a friendly basketball game at the local court. All skill levels welcome!',
    category: 'sports',
    location: 'Central Park Basketball Court',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    time: '14:00',
    maxParticipants: 10
  },
  {
    title: 'Coffee & Code Study Session',
    description: 'Let\'s study together! Working on algorithms and data structures. Bring your laptop.',
    category: 'educational',
    location: 'Starbucks Downtown',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    time: '10:00',
    maxParticipants: 8
  },
  {
    title: 'Movie Night: Sci-Fi Marathon',
    description: 'Classic sci-fi movies marathon! Popcorn and drinks provided. BYOB (bring your own blanket).',
    category: 'entertainment',
    location: 'Student Lounge, Building A',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    time: '19:00',
    maxParticipants: 15
  },
  {
    title: 'Beach Cleanup Volunteer',
    description: 'Help us clean up the local beach! Making our community better, one piece of trash at a time.',
    category: 'volunteer',
    location: 'Santa Monica Beach',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    time: '09:00',
    maxParticipants: 20
  },
  {
    title: 'Game Night: Board Games & Chill',
    description: 'Bring your favorite board games! We have Catan, Ticket to Ride, and more.',
    category: 'social',
    location: 'Community Center',
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    time: '18:00',
    maxParticipants: 12
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('\n🗑️  Clearing existing users and activities...');
    await User.deleteMany({});
    await Activity.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create users
    console.log('\n👥 Creating test users...');
    const createdUsers = [];

    for (const userData of testUsers) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const user = new User({
        ...userData,
        password: hashedPassword,
        profilePicture: `https://avatars.dicebear.com/api/avataaars/${userData.username}.svg?mood=happy`
      });

      await user.save();
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.username} (${user.email})`);
    }

    // Create activities
    console.log('\n🎉 Creating test activities...');
    for (let i = 0; i < testActivities.length; i++) {
      const activityData = testActivities[i];
      const creator = createdUsers[i % createdUsers.length]; // Rotate through users

      const activity = new Activity({
        ...activityData,
        creator: creator._id,
        participants: [creator._id]
      });

      await activity.save();
      console.log(`✅ Created activity: ${activity.title}`);
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📝 TEST USER CREDENTIALS (use these to login):');
    console.log('─'.repeat(60));
    
    testUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Major: ${user.major}`);
    });
    
    console.log('\n' + '─'.repeat(60));
    console.log(`\n✨ Created ${createdUsers.length} users and ${testActivities.length} activities`);
    console.log('\n💡 You can now:');
    console.log('   1. Login with any of the above credentials');
    console.log('   2. Send friend requests between users');
    console.log('   3. Join activities');
    console.log('   4. Test messaging features');
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

// Run the seeder
seedDatabase();
