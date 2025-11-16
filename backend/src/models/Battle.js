const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
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
  wordsFound: [{
    wordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Word'
    },
    word: String,
    foundAt: {
      type: Date,
      default: Date.now
    },
    timeTaken: Number // milliseconds from battle start
  }],
  score: {
    type: Number,
    default: 0
  },
  completedAt: {
    type: Date,
    default: null
  },
  isWinner: {
    type: Boolean,
    default: false
  },
  disconnectedAt: {
    type: Date,
    default: null
  },
  reconnectedAt: {
    type: Date,
    default: null
  },
  reactionsSent: {
    type: Number,
    default: 0
  }
}, { _id: false });

const battleSchema = new mongoose.Schema({
  battleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    enum: ['quick', 'friend'],
    required: true
  },
  challengeCode: {
    type: String,
    default: null,
    index: true,
    sparse: true
  },
  players: {
    type: [playerSchema],
    validate: {
      validator: function(v) {
        return v.length === 2;
      },
      message: 'Battle must have exactly 2 players'
    }
  },
  level: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'countdown', 'active', 'completed', 'cancelled', 'abandoned'],
    default: 'waiting',
    index: true
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
    type: Number, // seconds
    default: null
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isDraw: {
    type: Boolean,
    default: false
  },
  timeLimit: {
    type: Number, // seconds
    default: 120 // 2 minutes
  },
  totalWords: {
    type: Number,
    required: true
  },
  rematchRequested: {
    type: Boolean,
    default: false
  },
  rematchRequestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rematchBattleId: {
    type: String,
    default: null
  },
  metadata: {
    levelNumber: Number,
    levelTitle: String,
    gridSize: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
battleSchema.index({ 'players.userId': 1 });
battleSchema.index({ status: 1, createdAt: -1 });
battleSchema.index({ createdAt: -1 });

// Method to get opponent for a given user
battleSchema.methods.getOpponent = function(userId) {
  const userIdStr = userId.toString();
  return this.players.find(p => p.userId.toString() !== userIdStr);
};

// Method to get player data for a given user
battleSchema.methods.getPlayer = function(userId) {
  const userIdStr = userId.toString();
  return this.players.find(p => p.userId.toString() === userIdStr);
};

// Method to check if user is participant
battleSchema.methods.isParticipant = function(userId) {
  const userIdStr = userId.toString();
  return this.players.some(p => p.userId.toString() === userIdStr);
};

// Method to record word found
battleSchema.methods.recordWordFound = function(userId, wordId, word, timeTaken) {
  const player = this.getPlayer(userId);
  if (!player) return false;

  // Check if word already found by this player
  const alreadyFound = player.wordsFound.some(w =>
    w.wordId && w.wordId.toString() === wordId.toString()
  );

  if (alreadyFound) return false;

  player.wordsFound.push({
    wordId,
    word,
    foundAt: new Date(),
    timeTaken
  });

  return true;
};

// Method to calculate score for a player
battleSchema.methods.calculateScore = function(userId) {
  const player = this.getPlayer(userId);
  if (!player) return 0;

  const opponent = this.getOpponent(userId);
  let score = 0;

  player.wordsFound.forEach(word => {
    // Base points per word
    score += 10;

    // Bonus for long words (6+ letters)
    if (word.word && word.word.length >= 6) {
      score += 10;
    }

    // Bonus for finding word first (before opponent)
    if (opponent) {
      const opponentFoundSameWord = opponent.wordsFound.find(w =>
        w.word === word.word
      );
      if (!opponentFoundSameWord || word.foundAt < opponentFoundSameWord.foundAt) {
        score += 5;
      }
    }
  });

  player.score = score;
  return score;
};

// Method to determine winner
battleSchema.methods.determineWinner = function() {
  if (this.players.length !== 2) return null;

  const [player1, player2] = this.players;

  // Recalculate scores
  this.calculateScore(player1.userId);
  this.calculateScore(player2.userId);

  // Winner determination:
  // 1. Most words found
  // 2. If tied, highest score
  // 3. If still tied, fastest completion time
  const p1Words = player1.wordsFound.length;
  const p2Words = player2.wordsFound.length;

  if (p1Words > p2Words) {
    player1.isWinner = true;
    player2.isWinner = false;
    this.winner = player1.userId;
    this.isDraw = false;
  } else if (p2Words > p1Words) {
    player1.isWinner = false;
    player2.isWinner = true;
    this.winner = player2.userId;
    this.isDraw = false;
  } else {
    // Same word count - check score
    if (player1.score > player2.score) {
      player1.isWinner = true;
      player2.isWinner = false;
      this.winner = player1.userId;
      this.isDraw = false;
    } else if (player2.score > player1.score) {
      player1.isWinner = false;
      player2.isWinner = true;
      this.winner = player2.userId;
      this.isDraw = false;
    } else {
      // Same score - check completion time
      if (player1.completedAt && player2.completedAt) {
        if (player1.completedAt < player2.completedAt) {
          player1.isWinner = true;
          player2.isWinner = false;
          this.winner = player1.userId;
          this.isDraw = false;
        } else if (player2.completedAt < player1.completedAt) {
          player1.isWinner = false;
          player2.isWinner = true;
          this.winner = player2.userId;
          this.isDraw = false;
        } else {
          // Perfect tie
          this.isDraw = true;
          this.winner = null;
        }
      } else {
        // No completion times - it's a draw
        this.isDraw = true;
        this.winner = null;
      }
    }
  }

  return this.winner;
};

// Method to check if battle is complete
battleSchema.methods.checkIfComplete = function() {
  if (this.players.length !== 2) return false;

  // Battle is complete if:
  // 1. Any player found all words
  // 2. Time limit exceeded
  // 3. Both players disconnected

  const [player1, player2] = this.players;

  // Check if any player found all words
  if (player1.wordsFound.length >= this.totalWords ||
      player2.wordsFound.length >= this.totalWords) {
    return true;
  }

  // Check if time limit exceeded
  if (this.startTime) {
    const elapsed = (Date.now() - this.startTime.getTime()) / 1000;
    if (elapsed >= this.timeLimit) {
      return true;
    }
  }

  // Check if both disconnected
  if (player1.disconnectedAt && player2.disconnectedAt &&
      !player1.reconnectedAt && !player2.reconnectedAt) {
    return true;
  }

  return false;
};

// Method to mark player as disconnected
battleSchema.methods.playerDisconnected = function(userId) {
  const player = this.getPlayer(userId);
  if (player) {
    player.disconnectedAt = new Date();
    player.reconnectedAt = null;
  }
};

// Method to mark player as reconnected
battleSchema.methods.playerReconnected = function(userId) {
  const player = this.getPlayer(userId);
  if (player) {
    player.reconnectedAt = new Date();
  }
};

// Static method to generate unique battle ID
battleSchema.statics.generateBattleId = function() {
  return `battle_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Static method to generate challenge code
battleSchema.statics.generateChallengeCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Clean up expired challenge codes (older than 5 minutes, status waiting)
battleSchema.statics.cleanupExpiredChallenges = async function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.updateMany(
    {
      type: 'friend',
      status: 'waiting',
      challengeCode: { $ne: null },
      createdAt: { $lt: fiveMinutesAgo }
    },
    {
      status: 'cancelled'
    }
  );
};

module.exports = mongoose.model('Battle', battleSchema);
