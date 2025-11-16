const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getBattleStats,
  getBattleHistory,
  getBattleDetails,
  createFriendChallenge,
  getChallengeDetails,
  getOnlineUsers,
  searchUsers,
  getQueueStats,
  requestRematch,
  getBattleLeaderboard,
  cancelChallenge
} = require('../controllers/battleController');

const router = express.Router();

// Battle stats and history
router.get('/stats', auth, getBattleStats);
router.get('/history', auth, getBattleHistory);
router.get('/leaderboard', auth, getBattleLeaderboard);
router.get('/:battleId', auth, getBattleDetails);

// Friend challenges
router.post('/challenge/create', auth, createFriendChallenge);
router.get('/challenge/:challengeCode', getChallengeDetails);
router.delete('/challenge/:challengeCode', auth, cancelChallenge);

// Online users and search
router.get('/users/online', auth, getOnlineUsers);
router.get('/users/search', auth, searchUsers);

// Queue stats
router.get('/queue/stats', auth, getQueueStats);

// Rematch
router.post('/:battleId/rematch', auth, requestRematch);

module.exports = router;
