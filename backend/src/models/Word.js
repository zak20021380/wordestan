const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    minlength: 3,
    maxlength: 12
  },
  length: {
    type: Number,
    required: true,
    min: 3,
    max: 12
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  points: {
    type: Number,
    default: 20,
    min: 10,
    max: 100
  },
  category: {
    type: String,
    trim: true,
    default: 'general'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  },
  meaning: {
    type: String,
    trim: true,
    maxlength: 200
  },
  isActive: {
    type: Boolean,
    default: true
  },
  timesCompleted: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Auto-calculate length before saving
wordSchema.pre('save', function(next) {
  this.length = this.text.length;
  this.text = this.text.toUpperCase();
  next();
});

// Index for efficient searching
wordSchema.index({ text: 1 });
wordSchema.index({ length: 1 });
wordSchema.index({ difficulty: 1 });

module.exports = mongoose.model('Word', wordSchema);
