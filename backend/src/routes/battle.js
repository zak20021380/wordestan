const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const battleController = require('../controllers/battleController');

router.post('/queue/join', auth, battleController.joinQueue);
router.post('/queue/leave', auth, battleController.leaveQueue);
router.post('/challenge', auth, battleController.createChallenge);
router.get('/history', auth, battleController.getBattleHistory);
router.get('/stats', auth, battleController.getBattleStats);

module.exports = router;
