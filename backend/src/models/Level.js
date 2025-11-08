const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema({
  order: {
    type: Number,
    required: true,
    unique: true,
    min: 1
  },
  letters: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  words: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Word',
    required: true
  }],
  isPublished: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
levelSchema.index({ order: 1 });
levelSchema.index({ isPublished: 1, order: 1 });

// Virtual for word count
levelSchema.virtual('wordCount').get(function() {
  return this.words.length;
});

// Pre-save middleware to ensure letters are uppercase
levelSchema.pre('save', function(next) {
  if (this.letters) {
    this.letters = this.letters.toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Level', levelSchema);