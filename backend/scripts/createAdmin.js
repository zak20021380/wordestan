const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/harfland';

const createAdmin = async () => {
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  try {
    const username = 'ZakcPar$$@@';
    const password = 'PingoPingp!@@058#';

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log(`⚠️  User already exists: ${username}`);
      return;
    }

    await User.create({
      username,
      password: hashedPassword,
      isAdmin: true,
      coins: 10000,
      totalScore: 0,
      levelsCleared: 0
    });

    console.log(`✅ Admin created: ${username}`);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

createAdmin();
