const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  order: {
    type: Number,
    required: true,
    unique: true,
    min: 1
  },
  words: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Word',
    required: true
  }],
  letters: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v.length >= 5 && v.length <= 12;
      },
      message: 'Letters array must contain between 5 and 12 letters'
    }
  },
  centerLetter: {
    type: String,
    required: true,
    uppercase: true,
    length: 1
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  requiredScore: {
    type: Number,
    default: 0,
    min: 0
  },
  bonusCoins: {
    type: Number,
    default: 50,
    min: 0
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  timesCompleted: {
    type: Number,
    default: 0,
    min: 0
  },
  completionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Index for efficient querying
levelSchema.index({ order: 1 });
levelSchema.index({ isPublished: 1, order: 1 });
levelSchema.index({ difficulty: 1 });

// Virtual for word count
levelSchema.virtual('wordCount').get(function() {
  return this.words.length;
});

// Pre-save middleware to ensure letters are uppercase
levelSchema.pre('save', function(next) {
  this.letters = this.letters.map(letter => letter.toUpperCase());
  this.centerLetter = this.centerLetter.toUpperCase();
  next();
});

module.exports = mongoose.model('Level', levelSchema);