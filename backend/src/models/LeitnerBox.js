const mongoose = require('mongoose');

/**
 * Leitner Box System for Spaced Repetition Learning
 *
 * The Leitner System uses 5 boxes with increasing review intervals:
 * - Box 1: Review every day (new/difficult words)
 * - Box 2: Review every 3 days
 * - Box 3: Review every week (7 days)
 * - Box 4: Review every 2 weeks (14 days)
 * - Box 5: Review every month (30 days) - mastered words
 *
 * When a word is reviewed correctly, it moves to the next box.
 * When incorrect, it moves back to Box 1.
 */

const leitnerBoxSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  wordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Word',
    required: true,
    index: true
  },
  // Leitner box number (1-5)
  box: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
    max: 5
  },
  // Next review date (calculated based on box number)
  nextReviewDate: {
    type: Date,
    required: true,
    index: true
  },
  // Total number of times this word has been reviewed
  reviewCount: {
    type: Number,
    default: 0
  },
  // Consecutive correct reviews
  correctStreak: {
    type: Number,
    default: 0
  },
  // Last time the word was reviewed
  lastReviewedAt: {
    type: Date,
    default: null
  },
  // Result of last review
  lastReviewResult: {
    type: String,
    enum: ['correct', 'incorrect', 'skipped', null],
    default: null
  },
  // Statistics
  correctCount: {
    type: Number,
    default: 0
  },
  incorrectCount: {
    type: Number,
    default: 0
  },
  // Personal notes about the word
  notes: {
    type: String,
    maxlength: 500,
    default: ''
  },
  // When the word was added to the Leitner box
  addedAt: {
    type: Date,
    default: Date.now
  },
  // Level where the word was found
  levelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
    default: null
  },
  // Whether this card is archived (removed from active learning)
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate words per user
leitnerBoxSchema.index({ userId: 1, wordId: 1 }, { unique: true });

// Index for finding words due for review
leitnerBoxSchema.index({ userId: 1, nextReviewDate: 1, isArchived: 1 });

/**
 * Calculate next review date based on box number
 */
leitnerBoxSchema.methods.calculateNextReviewDate = function() {
  const intervals = {
    1: 1,    // 1 day
    2: 3,    // 3 days
    3: 7,    // 1 week
    4: 14,   // 2 weeks
    5: 30    // 1 month
  };

  const daysToAdd = intervals[this.box] || 1;
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + daysToAdd);
  nextDate.setHours(0, 0, 0, 0); // Reset to midnight

  return nextDate;
};

/**
 * Mark review as correct - move to next box
 */
leitnerBoxSchema.methods.reviewCorrect = async function() {
  this.reviewCount += 1;
  this.correctCount += 1;
  this.correctStreak += 1;
  this.lastReviewedAt = new Date();
  this.lastReviewResult = 'correct';

  // Move to next box (max 5)
  if (this.box < 5) {
    this.box += 1;
  }

  // Calculate next review date
  this.nextReviewDate = this.calculateNextReviewDate();

  await this.save();
  return this;
};

/**
 * Mark review as incorrect - move back to box 1
 */
leitnerBoxSchema.methods.reviewIncorrect = async function() {
  this.reviewCount += 1;
  this.incorrectCount += 1;
  this.correctStreak = 0;
  this.lastReviewedAt = new Date();
  this.lastReviewResult = 'incorrect';

  // Move back to box 1
  this.box = 1;

  // Calculate next review date
  this.nextReviewDate = this.calculateNextReviewDate();

  await this.save();
  return this;
};

/**
 * Mark review as skipped
 */
leitnerBoxSchema.methods.reviewSkipped = async function() {
  this.lastReviewedAt = new Date();
  this.lastReviewResult = 'skipped';

  // Move next review to tomorrow
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 1);
  nextDate.setHours(0, 0, 0, 0);
  this.nextReviewDate = nextDate;

  await this.save();
  return this;
};

/**
 * Check if word is due for review
 */
leitnerBoxSchema.methods.isDueForReview = function() {
  if (this.isArchived) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return this.nextReviewDate <= now;
};

/**
 * Archive the card (remove from active learning)
 */
leitnerBoxSchema.methods.archive = async function() {
  this.isArchived = true;
  await this.save();
  return this;
};

/**
 * Unarchive the card
 */
leitnerBoxSchema.methods.unarchive = async function() {
  this.isArchived = false;
  await this.save();
  return this;
};

/**
 * Get accuracy percentage
 */
leitnerBoxSchema.methods.getAccuracy = function() {
  const totalReviews = this.correctCount + this.incorrectCount;
  if (totalReviews === 0) return 0;
  return Math.round((this.correctCount / totalReviews) * 100);
};

/**
 * Static method: Get words due for review for a user
 */
leitnerBoxSchema.statics.getDueForReview = async function(userId, limit = 20) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return this.find({
    userId,
    isArchived: false,
    nextReviewDate: { $lte: now }
  })
  .populate('wordId')
  .sort({ nextReviewDate: 1, box: 1 })
  .limit(limit);
};

/**
 * Static method: Get statistics for user's Leitner box
 */
leitnerBoxSchema.statics.getUserStats = async function(userId) {
  const cards = await this.find({ userId, isArchived: false });

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const stats = {
    totalCards: cards.length,
    byBox: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    dueForReview: 0,
    reviewedToday: 0,
    totalReviews: 0,
    averageAccuracy: 0,
    masteredWords: 0 // Box 5
  };

  let totalCorrect = 0;
  let totalAttempts = 0;

  cards.forEach(card => {
    // Count by box
    stats.byBox[card.box] = (stats.byBox[card.box] || 0) + 1;

    // Count due for review
    if (card.isDueForReview()) {
      stats.dueForReview += 1;
    }

    // Count reviewed today
    if (card.lastReviewedAt) {
      const reviewDate = new Date(card.lastReviewedAt);
      reviewDate.setHours(0, 0, 0, 0);
      if (reviewDate.getTime() === now.getTime()) {
        stats.reviewedToday += 1;
      }
    }

    // Total reviews
    stats.totalReviews += card.reviewCount;

    // Accuracy calculation
    totalCorrect += card.correctCount;
    totalAttempts += (card.correctCount + card.incorrectCount);

    // Mastered words
    if (card.box === 5) {
      stats.masteredWords += 1;
    }
  });

  // Calculate average accuracy
  if (totalAttempts > 0) {
    stats.averageAccuracy = Math.round((totalCorrect / totalAttempts) * 100);
  }

  return stats;
};

/**
 * Static method: Get words by box number
 */
leitnerBoxSchema.statics.getWordsByBox = async function(userId, boxNumber) {
  return this.find({
    userId,
    box: boxNumber,
    isArchived: false
  })
  .populate('wordId')
  .sort({ nextReviewDate: 1 });
};

const LeitnerBox = mongoose.model('LeitnerBox', leitnerBoxSchema);

module.exports = LeitnerBox;
