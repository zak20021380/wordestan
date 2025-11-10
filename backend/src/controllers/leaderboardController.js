const User = require('../models/User');

// @desc    Get leaderboard with top players
// @route   GET /api/leaderboard
// @access  Public
const getLeaderboard = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const limitNum = Math.min(parseInt(limit), 100); // Max 100 results
    const offsetNum = parseInt(offset);

    // Aggregate top players by username and total score
    const leaderboard = await User.aggregate([
      { $match: { isAdmin: false } },
      {
        $group: {
          _id: '$username',
          totalScore: { $max: '$totalScore' }
        }
      },
      { $sort: { totalScore: -1, _id: 1 } },
      { $skip: offsetNum },
      { $limit: limitNum }
    ]);

    // Add rank to each player and format the response
    const rankedLeaderboard = leaderboard.map((player, index) => ({
      username: player._id,
      totalScore: player.totalScore || 0,
      rank: offsetNum + index + 1
    }));

    // Get total count for pagination (distinct usernames)
    const totalCount = (
      await User.distinct('username', { isAdmin: false })
    ).length;

    res.json({
      success: true,
      data: {
        leaderboard: rankedLeaderboard,
        totalCount,
        limit: limitNum,
        offset: offsetNum
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching leaderboard'
    });
  }
};

// @desc    Get current user's rank and nearby players
// @route   GET /api/leaderboard/me
// @access  Private
const getMyRank = async (req, res) => {
  try {
    const user = req.user;
    
    // Get user's rank
    const usersAbove = await User.countDocuments({
      isAdmin: false,
      $or: [
        { totalScore: { $gt: user.totalScore } },
        { 
          totalScore: user.totalScore,
          levelsCleared: { $gt: user.levelsCleared }
        },
        { 
          totalScore: user.totalScore,
          levelsCleared: user.levelsCleared,
          wordsFound: { $gt: user.wordsFound }
        },
        {
          totalScore: user.totalScore,
          levelsCleared: user.levelsCleared,
          wordsFound: user.wordsFound,
          _id: { $lt: user._id }
        }
      ]
    });

    const userRank = usersAbove + 1;

    // Get nearby players (5 above and 5 below)
    const nearbyPlayers = await User.find({
      isAdmin: false,
      $or: [
        { totalScore: { $gt: user.totalScore } },
        { totalScore: user.totalScore }
      ]
    })
    .select('username totalScore levelsCleared wordsFound bestStreak createdAt')
    .sort({ totalScore: -1, levelsCleared: -1, wordsFound: -1 })
    .limit(10)
    .lean();

    // Add ranks to nearby players
    const rankedNearby = nearbyPlayers.map((player, index) => ({
      ...player,
      rank: Math.max(1, userRank - 5 + index)
    }));

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          totalScore: user.totalScore,
          levelsCleared: user.levelsCleared,
          wordsFound: user.wordsFound,
          bestStreak: user.bestStreak,
          rank: userRank
        },
        nearby: rankedNearby
      }
    });
  } catch (error) {
    console.error('Get my rank error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user rank'
    });
  }
};

// @desc    Get leaderboard statistics
// @route   GET /api/leaderboard/stats
// @access  Public
const getLeaderboardStats = async (req, res) => {
  try {
    const totalPlayers = await User.countDocuments({ isAdmin: false });
    
    const stats = await User.aggregate([
      { $match: { isAdmin: false } },
      {
        $group: {
          _id: null,
          totalScore: { $sum: '$totalScore' },
          averageScore: { $avg: '$totalScore' },
          maxScore: { $max: '$totalScore' },
          totalLevelsCleared: { $sum: '$levelsCleared' },
          averageLevelsCleared: { $avg: '$levelsCleared' },
          maxLevelsCleared: { $max: '$levelsCleared' },
          totalWordsFound: { $sum: '$wordsFound' },
          averageWordsFound: { $avg: '$wordsFound' },
          maxWordsFound: { $max: '$wordsFound' },
          totalCoins: { $sum: '$coins' },
          averageCoins: { $avg: '$coins' },
          maxCoins: { $max: '$coins' }
        }
      }
    ]);

    const activePlayersToday = await User.countDocuments({
      isAdmin: false,
      lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    const activePlayersWeek = await User.countDocuments({
      isAdmin: false,
      lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      data: {
        totalPlayers,
        activePlayersToday,
        activePlayersWeek,
        statistics: stats[0] || {
          totalScore: 0,
          averageScore: 0,
          maxScore: 0,
          totalLevelsCleared: 0,
          averageLevelsCleared: 0,
          maxLevelsCleared: 0,
          totalWordsFound: 0,
          averageWordsFound: 0,
          maxWordsFound: 0,
          totalCoins: 0,
          averageCoins: 0,
          maxCoins: 0
        }
      }
    });
  } catch (error) {
    console.error('Get leaderboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching leaderboard statistics'
    });
  }
};

module.exports = {
  getLeaderboard,
  getMyRank,
  getLeaderboardStats
};