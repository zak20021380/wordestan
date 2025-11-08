require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const makeAdmin = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Find and update the user
    const email = 'zakaria@wordestan.com';
    console.log(`\nLooking for user with email: ${email}`);

    const user = await User.findOneAndUpdate(
      { email: email },
      { isAdmin: true },
      { new: true }
    );

    if (user) {
      console.log('✓ Success! User updated to admin:');
      console.log(`  - Username: ${user.username}`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - isAdmin: ${user.isAdmin}`);
    } else {
      console.log('✗ Error: User not found with email:', email);
      console.log('Please make sure the user exists in the database.');
    }

    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);

  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

makeAdmin();
