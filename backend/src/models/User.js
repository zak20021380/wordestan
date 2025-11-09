const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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
    trim: true,
    lowercase: true,
    default: null
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  coins: {
    type: Number,
    default: 100,
    min: 0
  },
  levelsCleared: {
    type: Number,
    default: 0,
    min: 0
  },
  totalScore: {
    type: Number,
    default: 0,
    min: 0
  },
  currentLevel: {
    type: Number,
    default: 1,
    min: 1
  },
  wordsFound: {
    type: Number,
    default: 0,
    min: 0
  },
  bestStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  currentStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  completedWords: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Word'
  }],
  completedLevels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level'
  }],
  isAdmin: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last active
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Add coins
userSchema.methods.addCoins = function(amount) {
  this.coins += amount;
  return this.save();
};

// Spend coins
userSchema.methods.spendCoins = function(amount) {
  if (this.coins < amount) {
    throw new Error('Insufficient coins');
  }
  this.coins -= amount;
  return this.save();
};

// Update level progress
userSchema.methods.completeLevel = function(levelId) {
  this.levelsCleared += 1;
  this.currentLevel += 1;
  this.totalScore += 100; // Level completion bonus
  this.completedLevels.push(levelId);
  return this.save();
};

// Complete word
userSchema.methods.completeWord = function(wordId) {
  this.wordsFound += 1;
  this.totalScore += 20; // Word completion bonus
  this.currentStreak += 1;
  this.bestStreak = Math.max(this.bestStreak, this.currentStreak);
  this.completedWords.push(wordId);
  return this.save();
};

// Reset streak
userSchema.methods.resetStreak = function() {
  this.currentStreak = 0;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);