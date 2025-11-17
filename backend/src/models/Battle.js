const mongoose = require('mongoose');

const battlePlayerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: null
  },
  wordsFound: {
    type: [String],
    default: []
  },
  score: {
    type: Number,
    default: 0
  },
  finalTime: {
    type: Number,
    default: null
  },
  isWinner: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const battleSchema = new mongoose.Schema({
  battleId: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['quick', 'friend'],
    default: 'quick'
  },
  players: {
    type: [battlePlayerSchema],
    validate: value => Array.isArray(value) && value.length <= 2
  },
  level: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
    required: false
  },
  wordSet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BattleWordSet'
  },
  letters: {
    type: String,
    default: ''
  },
  words: {
    type: [{
      text: String,
      length: Number,
      points: Number,
      definition: String,
      category: String,
      difficulty: Number
    }],
    default: []
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'cancelled', 'timeout'],
    default: 'waiting'
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number,
    default: 0
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

battleSchema.index({ battleId: 1 }, { unique: true });
battleSchema.index({ 'players.userId': 1, createdAt: -1 });
battleSchema.index({ status: 1, createdAt: -1 });
battleSchema.index({ wordSet: 1, createdAt: -1 });

module.exports = mongoose.model('Battle', battleSchema);
