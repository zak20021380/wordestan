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

const battleWordSetSchema = new mongoose.Schema({
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
        if (!Array.isArray(value) || value.length < 8 || value.length > 20) {
          return false;
        }
        return value.every(letter => LETTER_REGEX.test(letter));
      },
      message: 'حروف شبکه باید شامل ۸ تا ۲۰ حرف انگلیسی باشد',
    },
    set(value) {
      if (!Array.isArray(value)) {
        return [];
      }
      const unique = [];
      value.forEach(letter => {
        const normalized = (letter || '').toString().toUpperCase().trim();
        if (LETTER_REGEX.test(normalized) && !unique.includes(normalized)) {
          unique.push(normalized);
        }
      });
      return unique;
    },
  },
  words: {
    type: [battleWordSchema],
    default: [],
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

battleWordSetSchema.index({ name: 1 }, { unique: true });
battleWordSetSchema.index({ isActive: 1 });
battleWordSetSchema.index({ 'words.word': 1 });

module.exports = mongoose.model('BattleWordSet', battleWordSetSchema);
