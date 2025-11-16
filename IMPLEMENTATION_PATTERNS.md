# HarfLand - Implementation Patterns & Code Examples

## 1. CONTEXT PATTERN (Frontend State Management)

### How AuthContext works (model for BattleContext):

```javascript
// File: frontend/src/contexts/BattleContext.jsx (TO BE CREATED)

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { battleService } from '../services/battleService';

const BattleContext = createContext({});

export const useBattle = () => {
  const context = useContext(BattleContext);
  if (!context) {
    throw new Error('useBattle must be used within a BattleProvider');
  }
  return context;
};

export const BattleProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [battleState, setBattleState] = useState({
    isInQueue: false,
    opponent: null,
    currentLevel: null,
    myProgress: {},
    opponentProgress: {},
    battleStatus: 'idle' // idle, waiting, active, completed
  });
  const [isSearching, setIsSearching] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated) return;

    const newSocket = io(import.meta.env.VITE_API_URL, {
      auth: { token: localStorage.getItem('token') }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('battle:found', (data) => {
      // Opponent found, start battle
      setBattleState(prev => ({
        ...prev,
        opponent: data.opponent,
        currentLevel: data.level,
        battleStatus: 'active'
      }));
      setIsSearching(false);
    });

    newSocket.on('battle:opponent-move', (data) => {
      // Opponent submitted a word
      setBattleState(prev => ({
        ...prev,
        opponentProgress: data.progress
      }));
    });

    setSocket(newSocket);
    return () => newSocket.close();
  }, [isAuthenticated]);

  // Join queue for 1v1 battle
  const joinQueue = async () => {
    setIsSearching(true);
    socket.emit('battle:join-queue', {
      userId: user.id,
      level: 'beginner' // or user preference
    });
  };

  // Submit word during battle
  const submitBattleWord = async (word) => {
    if (!socket || !battleState.opponent) return;

    const response = await battleService.completeWord(
      word,
      battleState.currentLevel._id
    );

    // Notify opponent
    socket.emit('battle:word-submitted', {
      playerId: user.id,
      word,
      progress: response.data
    });

    setBattleState(prev => ({
      ...prev,
      myProgress: response.data
    }));

    // Check if battle is won
    if (response.data.levelCompleted) {
      endBattle('win');
    }
  };

  const endBattle = async (result) => {
    await battleService.recordBattle({
      opponent: battleState.opponent.id,
      result,
      level: battleState.currentLevel._id
    });

    setBattleState(prev => ({
      ...prev,
      battleStatus: 'completed'
    }));

    socket.emit('battle:ended', { result });
  };

  const value = {
    battleState,
    isSearching,
    socket,
    joinQueue,
    submitBattleWord,
    endBattle
  };

  return <BattleContext.Provider value={value}>{children}</BattleContext.Provider>;
};
```

---

## 2. CONTROLLER PATTERN (Backend Request Handling)

### How gameController works (model for battleController):

```javascript
// File: backend/src/controllers/battleController.js (TO BE CREATED)

const Battle = require('../models/Battle');
const User = require('../models/User');

// @desc Start a new 1v1 battle
// @route POST /api/battles/start
// @access Private
const startBattle = async (req, res) => {
  try {
    const { opponentId, levelId } = req.body;
    const userId = req.user.id;

    // Validation
    if (userId === opponentId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot battle yourself'
      });
    }

    // Get both users
    const [currentUser, opponent] = await Promise.all([
      User.findById(userId),
      User.findById(opponentId)
    ]);

    if (!opponent) {
      return res.status(404).json({
        success: false,
        message: 'Opponent not found'
      });
    }

    // Create battle record
    const battle = new Battle({
      player1: userId,
      player2: opponentId,
      levelId,
      status: 'active',
      startedAt: new Date()
    });

    await battle.save();

    res.status(201).json({
      success: true,
      data: {
        battleId: battle._id,
        opponent: {
          id: opponent._id,
          username: opponent.username,
          totalScore: opponent.totalScore
        },
        levelId
      }
    });
  } catch (error) {
    console.error('Start battle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start battle'
    });
  }
};

// @desc Complete battle
// @route POST /api/battles/:battleId/complete
// @access Private
const completeBattle = async (req, res) => {
  try {
    const { battleId } = req.params;
    const { winnerId } = req.body;
    const userId = req.user.id;

    const battle = await Battle.findById(battleId);
    if (!battle) {
      return res.status(404).json({
        success: false,
        message: 'Battle not found'
      });
    }

    // Verify user is part of battle
    if (battle.player1 !== userId && battle.player2 !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Determine winner/loser
    const loser = winnerId === battle.player1 ? battle.player2 : battle.player1;
    const winner = winnerId;

    // Update battle
    battle.status = 'completed';
    battle.winner = winner;
    battle.endedAt = new Date();
    await battle.save();

    // Update user stats
    const winnerUser = await User.findById(winner);
    const loserUser = await User.findById(loser);

    winnerUser.battleWins = (winnerUser.battleWins || 0) + 1;
    loserUser.battleLosses = (loserUser.battleLosses || 0) + 1;

    await Promise.all([winnerUser.save(), loserUser.save()]);

    res.json({
      success: true,
      data: {
        battleId: battle._id,
        winner: {
          id: winnerUser._id,
          username: winnerUser.username
        }
      }
    });
  } catch (error) {
    console.error('Complete battle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete battle'
    });
  }
};

module.exports = {
  startBattle,
  completeBattle
};
```

---

## 3. MODEL PATTERN (Database Schema)

### How User model works (extend for battles):

```javascript
// File: backend/src/models/Battle.js (TO BE CREATED)

const mongoose = require('mongoose');

const battleSchema = new mongoose.Schema({
  // Players
  player1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  player2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Game details
  levelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
    required: true
  },

  // Match state
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed'],
    default: 'active'
  },

  // Results
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Word completions
  player1Progress: [{
    word: String,
    completedAt: { type: Date, default: Date.now }
  }],
  player2Progress: [{
    word: String,
    completedAt: { type: Date, default: Date.now }
  }],

  // Timing
  startedAt: Date,
  endedAt: Date,
  duration: Number // in milliseconds

}, {
  timestamps: true
});

// Index for efficient querying
battleSchema.index({ player1: 1, createdAt: -1 });
battleSchema.index({ player2: 1, createdAt: -1 });
battleSchema.index({ status: 1 });

// Virtual for calculating duration
battleSchema.virtual('durationSeconds').get(function() {
  if (!this.endedAt || !this.startedAt) return null;
  return Math.round((this.endedAt - this.startedAt) / 1000);
});

module.exports = mongoose.model('Battle', battleSchema);
```

---

## 4. SERVICE PATTERN (API Client)

### How gameService works (model for battleService):

```javascript
// File: frontend/src/services/battleService.js (TO BE CREATED)

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const battleService = {
  // Find opponent and start battle
  async findOpponent(level = 'beginner') {
    try {
      const response = await api.post('/battles/find-opponent', { level });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to find opponent');
    }
  },

  // Start a specific battle
  async startBattle(opponentId, levelId) {
    try {
      const response = await api.post('/battles/start', {
        opponentId,
        levelId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to start battle');
    }
  },

  // Submit word during battle
  async completeWord(word, levelId) {
    try {
      const response = await api.post('/battles/complete-word', {
        word,
        levelId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to complete word');
    }
  },

  // End battle (called when level completed)
  async endBattle(battleId, winnerId) {
    try {
      const response = await api.post(`/battles/${battleId}/complete`, {
        winnerId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to end battle');
    }
  },

  // Get battle history
  async getBattleHistory() {
    try {
      const response = await api.get('/battles/history');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to load battle history');
    }
  },

  // Get battle stats
  async getBattleStats() {
    try {
      const response = await api.get('/battles/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to load battle stats');
    }
  }
};
```

---

## 5. ROUTE PATTERN (API Endpoints)

### How game routes work (model for battle routes):

```javascript
// File: backend/src/routes/battles.js (TO BE CREATED)

const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  startBattle,
  completeBattle,
  getBattleHistory,
  getBattleStats
} = require('../controllers/battleController');

const router = express.Router();

// Validation rules
const startBattleValidation = [
  body('opponentId')
    .isMongoId()
    .withMessage('Valid opponent ID is required'),
  body('levelId')
    .isMongoId()
    .withMessage('Valid level ID is required')
];

const completeBattleValidation = [
  body('winnerId')
    .isMongoId()
    .withMessage('Valid winner ID is required')
];

// Routes
router.post('/start', auth, startBattleValidation, startBattle);
router.post('/:battleId/complete', auth, completeBattleValidation, completeBattle);
router.get('/history', auth, getBattleHistory);
router.get('/stats', auth, getBattleStats);

module.exports = router;
```

---

## 6. PAGE COMPONENT PATTERN

### How Game.jsx works (model for BattleRoom.jsx):

```javascript
// File: frontend/src/pages/BattleRoom.jsx (TO BE CREATED)

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBattle } from '../contexts/BattleContext';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import GameCanvas from '../components/GameCanvas';
import toast from 'react-hot-toast';

const BattleRoom = () => {
  const { battleId } = useParams();
  const { battleState, submitBattleWord, endBattle } = useBattle();
  const { currentLevel, gameState, submitWord } = useGame();
  const { user } = useAuth();

  const [battleTimer, setBattleTimer] = useState(300); // 5 minutes
  const isMyTurn = battleState.currentTurn === user.id;

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setBattleTimer(t => {
        if (t <= 0) {
          // Time's up - end battle
          endBattle('timeout');
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleWordSubmit = async (word) => {
    try {
      const result = await submitBattleWord(word);
      toast.success('Word found!');

      // Check if battle won
      const totalWords = currentLevel?.words?.length || 0;
      const myWords = battleState.myProgress.length;
      const opponentWords = battleState.opponentProgress.length;

      if (myWords >= totalWords) {
        endBattle('win');
        toast.success('Battle Won!');
      } else if (opponentWords >= totalWords) {
        endBattle('loss');
        toast.error('Opponent Won!');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-wood bg-cover">
      <div className="max-w-6xl mx-auto p-4">
        {/* Battle Header */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* My Side */}
          <div className="bg-glass p-4 rounded-lg backdrop-blur">
            <h3 className="text-white font-bold">{user.username}</h3>
            <p className="text-2xl font-bold text-orange-400">
              {battleState.myProgress.length}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {battleState.myProgress.map(word => (
                <span key={word} className="text-xs bg-orange-400 px-2 py-1 rounded">
                  {word}
                </span>
              ))}
            </div>
          </div>

          {/* Center - Timer */}
          <div className="flex items-center justify-center">
            <div className="text-4xl font-bold text-white">
              {Math.floor(battleTimer / 60)}:{(battleTimer % 60).toString().padStart(2, '0')}
            </div>
          </div>

          {/* Opponent Side */}
          <div className="bg-glass p-4 rounded-lg backdrop-blur">
            <h3 className="text-white font-bold">{battleState.opponent.username}</h3>
            <p className="text-2xl font-bold text-purple-400">
              {battleState.opponentProgress.length}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {battleState.opponentProgress.map(word => (
                <span key={word} className="text-xs bg-purple-400 px-2 py-1 rounded">
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="bg-glass p-8 rounded-lg backdrop-blur mb-8">
          <GameCanvas />
        </div>

        {/* Submit Button */}
        <button
          onClick={() => handleWordSubmit(gameState.currentWord)}
          disabled={!gameState.currentWord || !isMyTurn}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg"
        >
          {isMyTurn ? 'Submit Word' : 'Waiting for opponent...'}
        </button>
      </div>
    </div>
  );
};

export default BattleRoom;
```

---

## 7. SOCKET.IO EVENT PATTERN

### Real-time communication structure:

```javascript
// File: backend/socketEvents.js (TO BE CREATED)

module.exports = (io) => {
  const battles = {}; // Track active battles

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins queue
    socket.on('battle:join-queue', (data) => {
      console.log(`${data.userId} joined queue`);
      // Add to matchmaking system
    });

    // Battle started
    socket.on('battle:started', (data) => {
      const { battleId, players } = data;
      battles[battleId] = {
        player1: players[0],
        player2: players[1],
        startTime: Date.now()
      };
      // Notify both players
      io.to(players[0]).emit('battle:ready', { opponent: players[1] });
      io.to(players[1]).emit('battle:ready', { opponent: players[0] });
    });

    // Player submits word
    socket.on('battle:word-submitted', (data) => {
      const { battleId, playerId, word, progress } = data;
      const battle = battles[battleId];
      
      // Notify opponent
      const opponent = battle.player1 === playerId 
        ? battle.player2 
        : battle.player1;
      
      io.to(opponent).emit('battle:opponent-move', {
        word,
        progress: progress.completedWords.length
      });
    });

    // Battle ended
    socket.on('battle:ended', (data) => {
      const { battleId, result } = data;
      io.to(battleId).emit('battle:finished', { result });
      delete battles[battleId];
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
```

---

## 8. RESPONSE FORMAT PATTERN

All API responses follow this format:

```javascript
// Success response
{
  success: true,
  message: "Operation completed",
  data: {
    // Actual response data
  }
}

// Error response
{
  success: false,
  message: "Error description",
  errors: [
    {
      field: "fieldName",
      message: "Validation error"
    }
  ]
}
```

---

## 9. MIDDLEWARE CHAIN PATTERN

```
Request
  ├─ CORS
  ├─ Body Parser
  ├─ Helmet
  ├─ Logging
  ├─ Express Validator (if route has validation)
  ├─ Auth Middleware (if route requires auth)
  │   ├─ Extract token from header
  │   ├─ Verify JWT signature
  │   ├─ Fetch user from DB
  │   └─ Set req.user
  │
  ├─ Route Controller
  │   ├─ Validate business logic
  │   ├─ Query/Update database
  │   └─ Return response
  │
  └─ Error Handler
      ├─ Check error type
      ├─ Format error message
      └─ Send error response
```

---

## 10. ENVIRONMENT VARIABLES NEEDED

```env
# Backend
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/wordconnect
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=365d

# Socket.IO
SOCKET_IO_CORS_ORIGIN=http://localhost:5173

# Battle settings
BATTLE_TIMEOUT=300 # 5 minutes in seconds
BATTLE_POINTS_MULTIPLIER=2 # Double points in battles
```

---

## KEY PATTERNS TO FOLLOW

1. **Always validate input** - Use express-validator on routes
2. **Always use auth middleware** - Protect user data
3. **Always fetch user from DB** - Don't trust JWT data alone
4. **Always return consistent response** - {success, message, data}
5. **Always handle errors** - Use try/catch in controllers
6. **Always invalidate React Query** - After mutations
7. **Always use context for shared state** - Not prop drilling
8. **Always namespace Socket.io events** - Like "battle:event"

---

**For detailed implementation, see:**
- `/backend/src/controllers/gameController.js` - Controller examples
- `/backend/src/models/User.js` - Model patterns
- `/backend/src/routes/game.js` - Route patterns
- `/frontend/src/contexts/GameContext.jsx` - Context patterns
- `/frontend/src/services/gameService.js` - Service patterns

