const Battle = require('../models/Battle');
const matchmakingService = require('../services/matchmakingService');

const sanitizeBattleResponse = (battle) => ({
  battleId: battle.battleId,
  type: battle.type,
  status: battle.status,
  level: battle.battleLevel || battle.level,
  startTime: battle.startTime,
  endTime: battle.endTime,
  duration: battle.duration,
  winner: battle.winner,
  players: battle.players.map(player => ({
    ...player,
    userId: player.userId?.toString()
  }))
});

exports.joinQueue = async (req, res) => {
  const player = {
    userId: req.user._id,
    username: req.user.username,
    avatar: req.user.avatar ?? null,
    socketId: req.body.socketId || null
  };

  const match = matchmakingService.enqueue(player);
  res.json({
    success: true,
    data: {
      queueSize: matchmakingService.getQueueSize(),
      matchReady: Boolean(match)
    }
  });
};

exports.leaveQueue = async (req, res) => {
  const removed = matchmakingService.leaveQueue(req.body.socketId);
  res.json({
    success: true,
    data: { removed }
  });
};

exports.createChallenge = async (req, res) => {
  const payload = matchmakingService.createChallengeCode({
    userId: req.user._id,
    username: req.user.username,
    avatar: req.user.avatar ?? null
  });

  res.json({
    success: true,
    data: payload
  });
};

exports.getBattleHistory = async (req, res) => {
  const history = await Battle.find({ 'players.userId': req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.json({
    success: true,
    data: history.map(sanitizeBattleResponse)
  });
};

exports.getBattleStats = async (req, res) => {
  res.json({
    success: true,
    data: req.user.battleStats || {
      totalBattles: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      totalWordsFound: 0,
      fastestWin: null,
      longestStreak: 0,
      currentStreak: 0
    }
  });
};
