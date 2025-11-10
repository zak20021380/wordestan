const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const levelProgressSchema = new mongoose.Schema({
  levelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
    required: true
  },
  completedWords: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Word'
  }],
  isComplete: {
    type: Boolean,
    default: false
  }
}, { _id: false });

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
  levelProgress: {
    type: [levelProgressSchema],
    default: []
  },
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
  const normalizedLevelId = toObjectId(levelId);
  if (!normalizedLevelId) {
    return this.save();
  }

  const progress = this.getLevelProgress(normalizedLevelId, { createIfMissing: true });

  if (!progress.isComplete) {
    progress.isComplete = true;
    this.levelsCleared += 1;
    // Don't increment currentLevel here - it will be incremented when user loads the next level
    this.totalScore += 100; // Level completion bonus
  }

  if (!Array.isArray(this.completedLevels)) {
    this.completedLevels = [];
  }

  const alreadyTracked = this.completedLevels.some(id => {
    if (!id) {
      return false;
    }

    if (typeof id.equals === 'function') {
      return id.equals(normalizedLevelId);
    }

    return id.toString() === normalizedLevelId.toString();
  });
  if (!alreadyTracked) {
    this.completedLevels.push(normalizedLevelId);
  }

  return this.save();
};

// Advance to next level
userSchema.methods.advanceToNextLevel = function() {
  this.currentLevel += 1;
  return this.save();
};

const toObjectId = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  return new mongoose.Types.ObjectId(value);
};

userSchema.methods.getLevelProgress = function(levelId, { createIfMissing = false } = {}) {
  if (!Array.isArray(this.levelProgress)) {
    this.levelProgress = [];
  }

  const normalizedLevelId = toObjectId(levelId);
  if (!normalizedLevelId) {
    return null;
  }

  let progress = this.levelProgress.find(entry => {
    if (!entry?.levelId) {
      return false;
    }

    if (typeof entry.levelId.equals === 'function') {
      return entry.levelId.equals(normalizedLevelId);
    }

    return entry.levelId.toString() === normalizedLevelId.toString();
  });

  if (!progress && createIfMissing) {
    this.levelProgress.push({
      levelId: normalizedLevelId,
      completedWords: [],
      isComplete: false
    });
    progress = this.levelProgress[this.levelProgress.length - 1];
  }

  return progress || null;
};

userSchema.methods.hasCompletedWordInLevel = function(levelId, wordId) {
  const progress = this.getLevelProgress(levelId);
  if (!progress || !Array.isArray(progress.completedWords)) {
    return false;
  }

  const normalizedWordId = toObjectId(wordId);
  if (!normalizedWordId) {
    return false;
  }

  return progress.completedWords.some(id => {
    if (!id) {
      return false;
    }

    if (typeof id.equals === 'function') {
      return id.equals(normalizedWordId);
    }

    return id.toString() === normalizedWordId.toString();
  });
};

// Complete word
userSchema.methods.completeWord = function(levelId, wordId) {
  const normalizedWordId = toObjectId(wordId);
  if (!normalizedWordId) {
    return this.save();
  }

  const progress = this.getLevelProgress(levelId, { createIfMissing: true });
  if (!Array.isArray(progress.completedWords)) {
    progress.completedWords = [];
  }

  const alreadyCompleted = progress.completedWords.some(id => {
    if (!id) {
      return false;
    }

    if (typeof id.equals === 'function') {
      return id.equals(normalizedWordId);
    }

    return id.toString() === normalizedWordId.toString();
  });

  if (!alreadyCompleted) {
    progress.completedWords.push(normalizedWordId);
    this.wordsFound += 1;
    this.totalScore += 20; // Word completion bonus
    this.currentStreak += 1;
    this.bestStreak = Math.max(this.bestStreak, this.currentStreak);
  }

  return this.save();
};

// Reset streak
userSchema.methods.resetStreak = function() {
  this.currentStreak = 0;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
