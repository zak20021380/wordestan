const mongoose = require('mongoose');

const battleWordSchema = new mongoose.Schema({
  word: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 15,
    uppercase: true,
    trim: true,
  },
  meaning: {
    type: String,
    trim: true,
    maxlength: 280,
    default: '',
  },
}, { _id: true });

battleWordSchema.pre('validate', function(next) {
  if (this.word) {
    this.word = this.word.toUpperCase().replace(/[^A-Z]/g, '').trim();
  }
  if (this.meaning) {
    this.meaning = this.meaning.trim();
  }
  next();
});

const LETTER_REGEX = /^[A-Z]$/;
const MIN_GRID = 8;
const MAX_GRID = 20;

const battleLevelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 120,
  },
  letters: {
    type: [String],
    required: true,
    default: [],
    validate: {
      validator(value) {
        if (!Array.isArray(value) || value.length < MIN_GRID || value.length > MAX_GRID) {
          return false;
        }
        return value.every(letter => LETTER_REGEX.test(letter));
      },
      message: `حروف مرحله باید شامل ${MIN_GRID} تا ${MAX_GRID} حرف انگلیسی باشد`,
    },
    set(value) {
      if (typeof value === 'string') {
        return value
          .toUpperCase()
          .replace(/[^A-Z]/g, '')
          .split('')
          .slice(0, MAX_GRID);
      }
      if (!Array.isArray(value)) {
        return [];
      }
      return value
        .map(letter => (letter || '').toString().toUpperCase().trim())
        .filter(letter => LETTER_REGEX.test(letter))
        .slice(0, MAX_GRID);
    },
  },
  words: {
    type: [battleWordSchema],
    default: [],
  },
  gridSize: {
    type: Number,
    default: MIN_GRID,
    min: MIN_GRID,
    max: MAX_GRID,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
}, { timestamps: true });

battleLevelSchema.virtual('letterString').get(function() {
  return Array.isArray(this.letters) ? this.letters.join('') : '';
});

battleLevelSchema.virtual('wordCount').get(function() {
  return Array.isArray(this.words) ? this.words.length : 0;
});

battleLevelSchema.pre('save', function(next) {
  if (Array.isArray(this.letters)) {
    this.gridSize = this.letters.length;
  }
  next();
});

battleLevelSchema.index({ name: 1 }, { unique: true });
battleLevelSchema.index({ isActive: 1 });
battleLevelSchema.index({ usageCount: -1 });

module.exports = mongoose.model('BattleLevel', battleLevelSchema);
