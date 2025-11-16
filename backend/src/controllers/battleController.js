const Battle = require('../models/Battle');
const User = require('../models/User');
const Level = require('../models/Level');
const Word = require('../models/Word');
const matchmakingService = require('../services/matchmakingService');

/**
 * Get user's battle statistics
 */
exports.getBattleStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('battleStats username');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد'
      });
    }

    const stats = user.getBattleStats();

    return res.json({
      success: true,
      message: 'آمار نبردها دریافت شد',
      data: {
        username: user.username,
        stats
      }
    });
  } catch (error) {
    console.error('Get battle stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در دریافت آمار نبردها'
    });
  }
};

/**
 * Get battle history for a user
 */
exports.getBattleHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const battles = await Battle.find({
      'players.userId': userId,
      status: 'completed'
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('level', 'title orderNumber')
      .populate('players.userId', 'username avatar')
      .lean();

    const total = await Battle.countDocuments({
      'players.userId': userId,
      status: 'completed'
    });

    // Format battles for response
    const formattedBattles = battles.map(battle => {
      const userPlayer = battle.players.find(
        p => p.userId._id.toString() === userId
      );
      const opponent = battle.players.find(
        p => p.userId._id.toString() !== userId
      );

      return {
        battleId: battle.battleId,
        type: battle.type,
        level: battle.level,
        opponent: {
          userId: opponent.userId._id,
          username: opponent.userId.username,
          avatar: opponent.userId.avatar,
          wordsFound: opponent.wordsFound.length,
          score: opponent.score
        },
        result: battle.isDraw ? 'draw' : (userPlayer.isWinner ? 'win' : 'loss'),
        yourStats: {
          wordsFound: userPlayer.wordsFound.length,
          score: userPlayer.score
        },
        duration: battle.duration,
        createdAt: battle.createdAt,
        endTime: battle.endTime
      };
    });

    return res.json({
      success: true,
      message: 'تاریخچه نبردها دریافت شد',
      data: {
        battles: formattedBattles,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get battle history error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در دریافت تاریخچه نبردها'
    });
  }
};

/**
 * Get battle details by ID
 */
exports.getBattleDetails = async (req, res) => {
  try {
    const { battleId } = req.params;
    const userId = req.user.id;

    const battle = await Battle.findOne({ battleId })
      .populate('level', 'title orderNumber grid')
      .populate('players.userId', 'username avatar')
      .populate('players.wordsFound.wordId', 'word meaning')
      .lean();

    if (!battle) {
      return res.status(404).json({
        success: false,
        message: 'نبرد یافت نشد'
      });
    }

    // Check if user is participant
    const isParticipant = battle.players.some(
      p => p.userId._id.toString() === userId
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'شما دسترسی به این نبرد ندارید'
      });
    }

    return res.json({
      success: true,
      message: 'جزئیات نبرد دریافت شد',
      data: { battle }
    });
  } catch (error) {
    console.error('Get battle details error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در دریافت جزئیات نبرد'
    });
  }
};

/**
 * Create a friend challenge
 */
exports.createFriendChallenge = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('username avatar');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد'
      });
    }

    // Check if user already in a battle
    if (matchmakingService.isUserInBattle(userId)) {
      return res.status(400).json({
        success: false,
        message: 'شما در حال حاضر در یک نبرد هستید'
      });
    }

    // Generate challenge code
    let challengeCode;
    let attempts = 0;
    do {
      challengeCode = Battle.generateChallengeCode();
      attempts++;
    } while (matchmakingService.getChallenge(challengeCode) && attempts < 10);

    if (attempts >= 10) {
      return res.status(500).json({
        success: false,
        message: 'خطا در ایجاد کد چالش'
      });
    }

    // Create challenge in matchmaking service
    const challenge = matchmakingService.createChallenge(challengeCode, {
      userId,
      username: user.username,
      avatar: user.avatar
    });

    return res.json({
      success: true,
      message: 'چالش ایجاد شد',
      data: {
        challengeCode,
        shareUrl: `${process.env.FRONTEND_URL || 'https://game.king-ofiq.ir'}/battle/${challengeCode}`,
        expiresAt: challenge.expiresAt
      }
    });
  } catch (error) {
    console.error('Create friend challenge error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در ایجاد چالش'
    });
  }
};

/**
 * Get challenge details
 */
exports.getChallengeDetails = async (req, res) => {
  try {
    const { challengeCode } = req.params;

    const challenge = matchmakingService.getChallenge(challengeCode);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'چالش یافت نشد یا منقضی شده است'
      });
    }

    if (challenge.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: 'این چالش دیگر معتبر نیست'
      });
    }

    return res.json({
      success: true,
      message: 'جزئیات چالش دریافت شد',
      data: {
        creator: {
          username: challenge.creator.username,
          avatar: challenge.creator.avatar
        },
        expiresAt: challenge.expiresAt
      }
    });
  } catch (error) {
    console.error('Get challenge details error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در دریافت جزئیات چالش'
    });
  }
};

/**
 * Get online users for friend challenges
 */
exports.getOnlineUsers = async (req, res) => {
  try {
    const userId = req.user.id;

    const onlineUsers = matchmakingService.getOnlineUsers(userId);

    return res.json({
      success: true,
      message: 'لیست کاربران آنلاین دریافت شد',
      data: {
        users: onlineUsers,
        count: onlineUsers.length
      }
    });
  } catch (error) {
    console.error('Get online users error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در دریافت لیست کاربران'
    });
  }
};

/**
 * Search users by username
 */
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'لطفا حداقل 2 کاراکتر وارد کنید'
      });
    }

    const users = await User.find({
      username: { $regex: query, $options: 'i' },
      _id: { $ne: userId }
    })
      .select('username avatar isOnline')
      .limit(10)
      .lean();

    // Check which users are actually online
    const usersWithStatus = users.map(user => ({
      ...user,
      isOnline: matchmakingService.isUserOnline(user._id.toString())
    }));

    return res.json({
      success: true,
      message: 'نتایج جستجو دریافت شد',
      data: {
        users: usersWithStatus
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در جستجوی کاربران'
    });
  }
};

/**
 * Get matchmaking queue stats
 */
exports.getQueueStats = async (req, res) => {
  try {
    const stats = matchmakingService.getStats();

    return res.json({
      success: true,
      message: 'آمار صف دریافت شد',
      data: stats
    });
  } catch (error) {
    console.error('Get queue stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در دریافت آمار صف'
    });
  }
};

/**
 * Request rematch
 */
exports.requestRematch = async (req, res) => {
  try {
    const { battleId } = req.params;
    const userId = req.user.id;

    const battle = await Battle.findOne({ battleId });

    if (!battle) {
      return res.status(404).json({
        success: false,
        message: 'نبرد یافت نشد'
      });
    }

    // Check if user is participant
    const isParticipant = battle.players.some(
      p => p.userId.toString() === userId
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'شما دسترسی به این نبرد ندارید'
      });
    }

    // Check if battle is completed
    if (battle.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'فقط می‌توانید برای نبردهای تمام شده درخواست نبرد مجدد دهید'
      });
    }

    // Check if rematch already requested
    if (battle.rematchRequested) {
      return res.status(400).json({
        success: false,
        message: 'درخواست نبرد مجدد قبلا ارسال شده است'
      });
    }

    battle.rematchRequested = true;
    battle.rematchRequestedBy = userId;
    await battle.save();

    // Get opponent
    const opponent = battle.players.find(
      p => p.userId.toString() !== userId
    );

    return res.json({
      success: true,
      message: 'درخواست نبرد مجدد ارسال شد',
      data: {
        battleId: battle.battleId,
        opponentId: opponent.userId
      }
    });
  } catch (error) {
    console.error('Request rematch error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در ارسال درخواست نبرد مجدد'
    });
  }
};

/**
 * Get leaderboard
 */
exports.getBattleLeaderboard = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const users = await User.find({
      'battleStats.totalBattles': { $gt: 0 }
    })
      .select('username avatar battleStats')
      .sort({ 'battleStats.wins': -1, 'battleStats.winRate': -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments({
      'battleStats.totalBattles': { $gt: 0 }
    });

    const leaderboard = users.map((user, index) => ({
      rank: skip + index + 1,
      userId: user._id,
      username: user.username,
      avatar: user.avatar,
      stats: user.battleStats
    }));

    return res.json({
      success: true,
      message: 'جدول رتبه‌بندی دریافت شد',
      data: {
        leaderboard,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در دریافت جدول رتبه‌بندی'
    });
  }
};

/**
 * Cancel friend challenge
 */
exports.cancelChallenge = async (req, res) => {
  try {
    const { challengeCode } = req.params;
    const userId = req.user.id;

    const challenge = matchmakingService.getChallenge(challengeCode);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'چالش یافت نشد'
      });
    }

    // Check if user is the creator
    if (challenge.creator.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'شما نمی‌توانید این چالش را لغو کنید'
      });
    }

    matchmakingService.cancelChallenge(challengeCode);

    return res.json({
      success: true,
      message: 'چالش لغو شد'
    });
  } catch (error) {
    console.error('Cancel challenge error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در لغو چالش'
    });
  }
};
