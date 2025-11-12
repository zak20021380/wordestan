const mongoose = require('mongoose');

const MAX_STAGE = 5;

const statsSchema = new mongoose.Schema(
  {
    repetitions: {
      type: Number,
      default: 0,
      min: 0,
    },
    successfulReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    failedReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const leitnerCardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    word: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 32,
    },
    meaning: {
      type: String,
      trim: true,
      default: null,
      maxlength: 300,
    },
    sourceWord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Word',
      default: null,
    },
    sourceLevel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Level',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    stage: {
      type: Number,
      min: 1,
      max: MAX_STAGE,
      default: 1,
    },
    nextReviewAt: {
      type: Date,
      default: () => new Date(),
    },
    lastReviewedAt: {
      type: Date,
      default: null,
    },
    lastResult: {
      type: String,
      enum: [null, 'success', 'fail'],
      default: null,
    },
    stats: {
      type: statsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

leitnerCardSchema.index({ user: 1, word: 1 }, { unique: true });
leitnerCardSchema.index({ user: 1, nextReviewAt: 1 });
leitnerCardSchema.index({ user: 1, stage: 1 });

leitnerCardSchema.statics.MAX_STAGE = MAX_STAGE;

module.exports = mongoose.model('LeitnerCard', leitnerCardSchema);
