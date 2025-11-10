const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Word = require('../models/Word');
const Level = require('../models/Level');
const CoinPack = require('../models/CoinPack');

// Sample data
const sampleWords = [
  { text: 'CAT', difficulty: 'easy', points: 10, category: 'animals' },
  { text: 'DOG', difficulty: 'easy', points: 10, category: 'animals' },
  { text: 'BIRD', difficulty: 'easy', points: 15, category: 'animals' },
  { text: 'FISH', difficulty: 'easy', points: 15, category: 'animals' },
  { text: 'BEAR', difficulty: 'medium', points: 20, category: 'animals' },
  { text: 'LION', difficulty: 'medium', points: 20, category: 'animals' },
  { text: 'TIGER', difficulty: 'medium', points: 25, category: 'animals' },
  { text: 'EAGLE', difficulty: 'medium', points: 25, category: 'animals' },
  { text: 'DOLPHIN', difficulty: 'hard', points: 35, category: 'animals' },
  { text: 'ELEPHANT', difficulty: 'hard', points: 40, category: 'animals' },
  { text: 'HOUSE', difficulty: 'easy', points: 15, category: 'places' },
  { text: 'WATER', difficulty: 'easy', points: 15, category: 'nature' },
  { text: 'LIGHT', difficulty: 'medium', points: 20, category: 'nature' },
  { text: 'SOUND', difficulty: 'medium', points: 20, category: 'nature' },
  { text: 'MUSIC', difficulty: 'medium', points: 20, category: 'arts' },
  { text: 'PAINT', difficulty: 'medium', points: 20, category: 'arts' },
  { text: 'DANCE', difficulty: 'medium', points: 20, category: 'arts' },
  { text: 'THEATER', difficulty: 'hard', points: 35, category: 'arts' },
  { text: 'COMPUTER', difficulty: 'hard', points: 40, category: 'technology' },
  { text: 'SCIENCE', difficulty: 'hard', points: 35, category: 'education' }
];

const sampleCoinPacks = [
  { title: 'Starter Pack', amount: 100, price: 0.99, bonusCoins: 10, description: 'Perfect for beginners' },
  { title: 'Value Pack', amount: 250, price: 1.99, bonusCoins: 25, description: 'Great value for regular players' },
  { title: 'Premium Pack', amount: 500, price: 3.99, bonusCoins: 75, description: 'For serious word gamers' },
  { title: 'Mega Pack', amount: 1000, price: 7.99, bonusCoins: 200, description: 'The ultimate coin package', featured: true },
  { title: 'Daily Deal', amount: 200, price: 1.49, bonusCoins: 50, description: 'Limited time offer', popular: true }
];

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/harfland');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    console.log('Starting database seed...');

    // Clear existing data
    await User.deleteMany({});
    await Word.deleteMany({});
    await Level.deleteMany({});
    await CoinPack.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      username: 'admin',
      email: 'admin@harfland.com',
      password: adminPassword,
      isAdmin: true,
      coins: 1000
    });
    await admin.save();
    console.log('Created admin user: admin@harfland.com / admin123');

    // Create sample users
    const userPassword = await bcrypt.hash('user123', 10);
    const users = [];
    for (let i = 1; i <= 5; i++) {
      const user = new User({
        username: `player${i}`,
        email: `player${i}@example.com`,
        password: userPassword,
        coins: Math.floor(Math.random() * 500) + 100,
        totalScore: Math.floor(Math.random() * 5000) + 100,
        levelsCleared: Math.floor(Math.random() * 20) + 1,
        wordsFound: Math.floor(Math.random() * 100) + 10,
        bestStreak: Math.floor(Math.random() * 20) + 5
      });
      users.push(user);
    }
    await User.insertMany(users);
    console.log('Created sample users');

    // Create words
    const createdWords = await Word.insertMany(sampleWords);
    console.log(`Created ${createdWords.length} sample words`);

    // Create levels with simplified model
    const levels = [
      {
        order: 1,
        words: createdWords.slice(0, 5).map(w => w._id),
        letters: 'CATDOGB',
        isPublished: true
      },
      {
        order: 2,
        words: createdWords.slice(5, 10).map(w => w._id),
        letters: 'LIONTER',
        isPublished: true
      },
      {
        order: 3,
        words: createdWords.slice(10, 15).map(w => w._id),
        letters: 'WATERLI',
        isPublished: true
      }
    ];

    const createdLevels = await Level.insertMany(levels);
    console.log(`Created ${createdLevels.length} sample levels`);

    // Create coin packs
    const createdPacks = await CoinPack.insertMany(sampleCoinPacks);
    console.log(`Created ${createdPacks.length} sample coin packs`);

    console.log('Database seed completed successfully!');
    console.log('\nSample accounts:');
    console.log('Admin: admin@harfland.com / admin123');
    console.log('Users: player1@example.com through player5@example.com / user123');

  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

// Run the seed script
const runSeed = async () => {
  try {
    await connectDB();
    await seedDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Failed to run seed:', error);
    process.exit(1);
  }
};

// Only run if called directly
if (require.main === module) {
  runSeed();
}

module.exports = { seedDatabase };