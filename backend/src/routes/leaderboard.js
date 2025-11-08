const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const { auth } = require('../middleware/auth');
const {
  getLeaderboard,
  getMyRank,
  getLeaderboardStats
} = require('../controllers/leaderboardController');

const router = express.Router();

// Public routes
router.get('/', optionalAuth, getLeaderboard);
router.get('/stats', getLeaderboardStats);

// Private routes
router.get('/me', auth, getMyRank);

module.exports = router;