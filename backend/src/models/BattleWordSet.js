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
  definition: {
    type: String,
    trim: true,
    maxlength: 280,
    default: '',
  },
  category: {
    type: String,
    trim: true,
    maxlength: 64,
    default: 'عمومی',
  },
  difficulty: {
    type: Number,
    min: 1,
    max: 5,
    default: 3,
  },
  letters: {
    type: [String],
    default: [],
  },
  minLetters: {
    type: Number,
    min: 3,
    default: 3,
  },
}, { _id: true });

battleWordSchema.pre('validate', function(next) {
  if (this.word) {
    this.word = this.word.toUpperCase().trim();
    this.letters = this.word.split('');
    this.minLetters = this.minLetters || this.word.length;
  }
  next();
});

const battleWordSetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 120,
  },
  difficulty: {
    type: String,
    enum: ['آسان', 'متوسط', 'سخت'],
    default: 'متوسط',
  },
  words: {
    type: [battleWordSchema],
    default: [],
  },
  gridSize: {
    type: Number,
    min: 6,
    max: 24,
    default: 12,
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
battleWordSetSchema.index({ difficulty: 1, isActive: 1 });
battleWordSetSchema.index({ 'words.word': 1 });

module.exports = mongoose.model('BattleWordSet', battleWordSetSchema);
