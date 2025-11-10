const mongoose = require('mongoose');
const Level = require('../models/Level');
const Word = require('../models/Word');
const User = require('../models/User');
const GameSetting = require('../models/GameSetting');

const LEVEL_UNLOCK_COST = parseInt(process.env.LEVEL_UNLOCK_COST, 10) || 70;

const DEFAULT_REWARD_SETTINGS = {
  skipLevelCoinsReward: 0,
  skipLevelPointsReward: 0,
  wordFoundCoinsReward: parseInt(process.env.WORD_COMPLETE_REWARD, 10) || 20,
  wordFoundPointsReward: parseInt(process.env.WORD_COMPLETE_POINTS, 10) || 20,
};

const resolveRewardValue = (value, fallback) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return fallback;
  }
  return numeric;
};

const getResolvedRewardSettings = async () => {
  try {
    const settings = await GameSetting.findOne({}, {}, { sort: { updatedAt: -1 } }).lean();

    if (!settings) {
      return { ...DEFAULT_REWARD_SETTINGS };
    }

    return {
      skipLevelCoinsReward: resolveRewardValue(
        settings.skipLevelCoinsReward,
        DEFAULT_REWARD_SETTINGS.skipLevelCoinsReward
      ),
      skipLevelPointsReward: resolveRewardValue(
        settings.skipLevelPointsReward,
        DEFAULT_REWARD_SETTINGS.skipLevelPointsReward
      ),
      wordFoundCoinsReward: resolveRewardValue(
        settings.wordFoundCoinsReward,
        DEFAULT_REWARD_SETTINGS.wordFoundCoinsReward
      ),
      wordFoundPointsReward: resolveRewardValue(
        settings.wordFoundPointsReward,
        DEFAULT_REWARD_SETTINGS.wordFoundPointsReward
      ),
    };
  } catch (error) {
    console.error('Failed to load game reward settings:', error);
    return { ...DEFAULT_REWARD_SETTINGS };
  }
};

const parseOrderNumber = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
};

const toStringId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value.toString === 'function') {
    return value.toString();
  }

  return null;
};

const extractLevelId = (entry) => {
  if (!entry) {
    return null;
  }

  if (entry.levelId) {
    return toStringId(entry.levelId);
  }

  return toStringId(entry);
};

const determineStarsFromProgress = (progress) => {
  if (!progress) {
    return 3;
  }

  if (progress.usedAutoSolve) {
    return 1;
  }

  if (progress.usedShuffle) {
    return 2;
  }

  return 3;
};

// @desc    Get the first level (public)
// @route   GET /api/game/level/1
// @access  Public
const getFirstLevel = async (req, res) => {
  try {
    const level = await Level.findOne({ order: 1, isPublished: true })
      .populate('words');

    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'First level not available yet'
      });
    }

    return res.json({
      success: true,
      data: level
    });
  } catch (error) {
    console.error('Get first level error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching first level'
    });
  }
};

// @desc    Get next level for user or load a specific level
// @route   GET /api/game/next-level
// @access  Private
const getNextLevel = async (req, res) => {
  try {
    const user = req.user;
    const { levelId } = req.query ?? {};

    const userProgress = {
      currentLevel: user.currentLevel,
      levelsCleared: user.levelsCleared,
      coins: user.coins,
      totalScore: user.totalScore
    };

    if (levelId) {
      if (!mongoose.Types.ObjectId.isValid(levelId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid level ID'
        });
      }

      const targetLevel = await Level.findOne({
        _id: levelId,
        isPublished: true
      })
        .populate('words', 'text length difficulty points meaning');

      if (!targetLevel) {
        return res.status(404).json({
          success: false,
          message: 'Level not found'
        });
      }

      const levelIdString = targetLevel._id.toString();
      const completedLevels = Array.isArray(user.completedLevels) ? user.completedLevels : [];
      const unlockedLevels = Array.isArray(user.unlockedLevels) ? user.unlockedLevels : [];

      const isCompleted = completedLevels.some(entry => extractLevelId(entry) === levelIdString);
      const isUnlocked = unlockedLevels.some(entry => toStringId(entry) === levelIdString);
      const isWithinProgress = targetLevel.order <= user.currentLevel;

      if (!isCompleted && !isUnlocked && !isWithinProgress) {
        return res.status(403).json({
          success: false,
          message: 'Level is locked'
        });
      }

      if (isCompleted) {
        return res.status(403).json({
          success: false,
          message: 'Level already completed',
          meta: {
            status: 'level_completed_locked',
            requestedLevelId: levelId,
          }
        });
      }

      await user.updateLastActive();

      const levelObject = targetLevel.toObject({ getters: true });
      const completedWords = levelObject.words
        .filter(word => user.hasCompletedWordInLevel(targetLevel._id, word._id))
        .map(word => word.text);
      const levelProgress = user.getLevelProgress(targetLevel._id);
      const powerUpsUsed = {
        shuffle: Boolean(levelProgress?.usedShuffle),
        autoSolve: Boolean(levelProgress?.usedAutoSolve)
      };

      return res.json({
        success: true,
        data: {
          level: levelObject,
          completedWords,
          userProgress,
          powerUpsUsed,
        },
        meta: {
          status: isCompleted ? 'level_revisit' : 'level_selected',
          requestedLevelId: levelId
        }
      });
    }

    const nextLevel = await Level.findOne({
      order: { $gte: user.currentLevel },
      isPublished: true
    })
      .populate('words', 'text length difficulty points meaning')
      .sort({ order: 1 });

    if (!nextLevel) {
      const hasPublishedLevels = await Level.exists({ isPublished: true });
      const firstPublishedLevel = hasPublishedLevels
        ? await Level.findOne({ isPublished: true }).sort({ order: 1 }).select('order')
        : null;

      await user.updateLastActive();

      let status = 'all_levels_completed';

      if (!hasPublishedLevels) {
        status = 'no_published_levels';
      } else if (user.levelsCleared === 0) {
        status = 'no_levels_for_new_user';
      }

      return res.json({
        success: true,
        data: null,
        meta: {
          status,
          firstLevelOrder: firstPublishedLevel?.order ?? null,
          userProgress
        }
      });
    }

    await user.updateLastActive();

    const levelObject = nextLevel.toObject({ getters: true });
    const completedWords = levelObject.words
      .filter(word => user.hasCompletedWordInLevel(nextLevel._id, word._id))
      .map(word => word.text);
    const levelProgress = user.getLevelProgress(nextLevel._id);
    const powerUpsUsed = {
      shuffle: Boolean(levelProgress?.usedShuffle),
      autoSolve: Boolean(levelProgress?.usedAutoSolve)
    };

    return res.json({
      success: true,
      data: {
        level: levelObject,
        completedWords,
        userProgress,
        powerUpsUsed,
      },
      meta: {
        status: 'level_available'
      }
    });
  } catch (error) {
    console.error('Get next level error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching next level'
    });
  }
};

// @desc    Get all levels with progress overview
// @route   GET /api/game/levels
// @access  Private
const getLevels = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const levels = await Level.find({ isPublished: true })
      .sort({ order: 1 })
      .lean();

    const highestLevelOrder = levels.length > 0
      ? parseOrderNumber(levels[levels.length - 1].order)
      : null;

    const completedEntries = Array.isArray(user.completedLevels) ? user.completedLevels : [];
    const completedSet = new Set(
      completedEntries
        .map(entry => extractLevelId(entry))
        .filter(Boolean)
    );

    const completedMap = new Map();

    completedEntries.forEach(entry => {
      const id = extractLevelId(entry);
      if (!id) {
        return;
      }

      let stars = 0;
      if (entry && typeof entry === 'object') {
        if (typeof entry.stars === 'number') {
          stars = Math.min(3, Math.max(0, Math.round(entry.stars)));
        } else {
          stars = 3;
        }
      } else {
        stars = 3;
      }

      completedMap.set(id, {
        stars,
        completedAt: entry?.completedAt ?? null
      });
    });

    const unlockedSet = new Set(
      (user.unlockedLevels || [])
        .map(entry => toStringId(entry))
        .filter(Boolean)
    );

    const progressMap = new Map();

    if (Array.isArray(user.levelProgress)) {
      user.levelProgress.forEach(entry => {
        const id = toStringId(entry?.levelId);
        if (!id) {
          return;
        }

        const completedWordsCount = Array.isArray(entry.completedWords)
          ? entry.completedWords.length
          : 0;

        progressMap.set(id, {
          completedWords: completedWordsCount,
          isComplete: Boolean(entry.isComplete),
          usedShuffle: Boolean(entry.usedShuffle),
          usedAutoSolve: Boolean(entry.usedAutoSolve),
          stars: Math.min(3, Math.max(0, Math.round(entry.stars ?? 0)))
        });
      });
    }

    const levelsData = levels.map(level => {
      const id = level._id.toString();
      const totalWords = Array.isArray(level.words) ? level.words.length : 0;
      const progress = progressMap.get(id) || { completedWords: 0, isComplete: false };
      const completedWords = progress.completedWords ?? 0;
      const completionRate = totalWords === 0 ? 0 : completedWords / totalWords;
      const completionPercentage = Math.round(completionRate * 100);
      const completedInfo = completedMap.get(id) || null;
      let stars = 0;

      if (progress.isComplete || completedSet.has(id)) {
        if (progress.stars) {
          stars = Math.max(stars, progress.stars);
        }

        const derivedStars = determineStarsFromProgress(progress);
        stars = Math.max(stars, derivedStars);

        if (completedInfo?.stars) {
          stars = Math.max(stars, completedInfo.stars);
        }

        if (stars === 0) {
          stars = 3;
        }
      }

      const isCompleted = progress.isComplete || completedSet.has(id);
      const isUnlocked = unlockedSet.has(id);
      const isPastLevel = level.order < user.currentLevel;
      const isCurrentLevel = level.order === user.currentLevel
        || (highestLevelOrder !== null
          && user.currentLevel > highestLevelOrder
          && level.order === highestLevelOrder);

      let status = 'locked';

      if (isCompleted) {
        status = 'completed';
      } else if (isCurrentLevel || isUnlocked || isPastLevel) {
        status = 'available';
      }

      const canUnlock = status === 'locked'
        && level.order > user.currentLevel
        && !isUnlocked;

      return {
        id,
        order: level.order,
        letters: level.letters,
        totalWords,
        completedWords,
        completionRate,
        completionPercentage,
        stars,
        completed: isCompleted,
        status,
        isCurrent: isCurrentLevel,
        isUnlocked,
        isCompleted,
        canUnlock,
        unlockCost: LEVEL_UNLOCK_COST
      };
    });

    const totalLevels = levelsData.length;
    const completedLevelsCount = levelsData.filter(level => level.isCompleted).length;
    const totalStarsEarned = levelsData.reduce((sum, level) => (
      level.isCompleted ? sum + Math.max(0, Math.min(3, level.stars || 0)) : sum
    ), 0);
    const maxStars = totalLevels * 3;
    const availableLevelsCount = levelsData.filter(level => level.status !== 'locked').length;
    const lockedLevelsCount = totalLevels - availableLevelsCount;
    const progressPercentage = totalLevels === 0
      ? 0
      : Math.round((completedLevelsCount / totalLevels) * 100);

    await user.updateLastActive();

    return res.json({
      success: true,
      data: {
        levels: levelsData,
        stats: {
          totalLevels,
          completedLevels: completedLevelsCount,
          availableLevels: availableLevelsCount,
          lockedLevels: lockedLevelsCount,
          progressPercentage,
          currentLevel: user.currentLevel,
          coins: user.coins,
          totalStars: totalStarsEarned,
          maxStars
        },
        unlockCost: LEVEL_UNLOCK_COST
      }
    });
  } catch (error) {
    console.error('Get levels overview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching levels overview'
    });
  }
};

// @desc    Unlock a specific level for coins
// @route   POST /api/game/unlock-level
// @access  Private
const unlockLevel = async (req, res) => {
  try {
    const { levelId } = req.body;

    if (!levelId || !mongoose.Types.ObjectId.isValid(levelId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid level ID is required'
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const level = await Level.findOne({
      _id: levelId,
      isPublished: true
    });

    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found'
      });
    }

    const levelIdString = level._id.toString();

    if (Array.isArray(user.completedLevels)
      && user.completedLevels.some(entry => extractLevelId(entry) === levelIdString)) {
      return res.status(400).json({
        success: false,
        message: 'Level already completed'
      });
    }

    if (Array.isArray(user.unlockedLevels)
      && user.unlockedLevels.some(entry => toStringId(entry) === levelIdString)) {
      return res.status(400).json({
        success: false,
        message: 'Level already unlocked'
      });
    }

    if (level.order <= user.currentLevel) {
      return res.status(400).json({
        success: false,
        message: 'Level is already available'
      });
    }

    if (user.coins < LEVEL_UNLOCK_COST) {
      return res.status(400).json({
        success: false,
        message: 'Not enough coins to unlock level'
      });
    }

    user.coins -= LEVEL_UNLOCK_COST;

    if (!Array.isArray(user.unlockedLevels)) {
      user.unlockedLevels = [];
    }

    user.unlockedLevels.push(level._id);

    if (!user.currentLevel || level.order > user.currentLevel) {
      user.currentLevel = level.order;
    }

    user.lastActive = new Date();
    await user.save();

    return res.json({
      success: true,
      message: 'Level unlocked successfully',
      data: {
        levelId: level._id,
        levelOrder: level.order,
        coins: user.coins,
        currentLevel: user.currentLevel,
        unlockedLevels: user.unlockedLevels
          .map(entry => toStringId(entry))
          .filter(Boolean)
      },
      meta: {
        unlockCost: LEVEL_UNLOCK_COST
      }
    });
  } catch (error) {
    console.error('Unlock level error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error unlocking level'
    });
  }
};

// @desc    Submit a completed word
// @route   POST /api/game/complete-word
// @access  Private
const completeWord = async (req, res) => {
  try {
    const { word, levelId, powerUpsUsed: rawPowerUps } = req.body;
    const user = req.user;

    // Validate input
    if (!word || !levelId) {
      return res.status(400).json({
        success: false,
        message: 'Word and levelId are required'
      });
    }

    // Find the level
    const level = await Level.findById(levelId).populate('words');
    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found'
      });
    }

    // Check if word exists in the level's target words
    const targetWord = level.words.find(w => w.text === word.toUpperCase());
    if (!targetWord) {
      await user.resetStreak();
      return res.status(400).json({
        success: false,
        message: 'Word not found in this level'
      });
    }

    const powerUpsUsed = {
      shuffle: Boolean(rawPowerUps?.shuffle),
      autoSolve: Boolean(rawPowerUps?.autoSolve)
    };

    const existingProgress = user.getLevelProgress(level._id, { createIfMissing: true });
    const wasLevelAlreadyComplete = Boolean(existingProgress?.isComplete);

    // Check if user has already completed this word
    if (user.hasCompletedWordInLevel(level._id, targetWord._id)) {
      return res.status(400).json({
        success: false,
        message: 'Word already completed'
      });
    }

    // Award coins and update progress based on configurable rewards
    const rewardSettings = await getResolvedRewardSettings();
    const wordCoinsReward = rewardSettings.wordFoundCoinsReward;
    const wordPointsReward = rewardSettings.wordFoundPointsReward;

    if (wordCoinsReward > 0) {
      await user.addCoins(wordCoinsReward);
    }

    await user.completeWord(level._id, targetWord._id, {
      usedShuffle: powerUpsUsed.shuffle,
      usedAutoSolve: powerUpsUsed.autoSolve,
      pointsReward: wordPointsReward
    });

    // Update word completion stats
    targetWord.timesCompleted += 1;
    await targetWord.save();

    // Check if level is completed
    const levelProgress = user.getLevelProgress(level._id);
    const completedWordsCount = levelProgress?.completedWords?.length || 0;

    const isLevelCompleted = completedWordsCount === level.words.length;
    const levelReward = parseInt(process.env.LEVEL_COMPLETE_REWARD) || 100;
    const usageSnapshot = {
      shuffle: Boolean(levelProgress?.usedShuffle),
      autoSolve: Boolean(levelProgress?.usedAutoSolve)
    };

    let starsEarned = null;

    if (isLevelCompleted) {
      starsEarned = determineStarsFromProgress(levelProgress);

      if (!wasLevelAlreadyComplete) {
        // Award level completion bonus
        await user.addCoins(levelReward);
      }

      const updatedUser = await user.completeLevel(level._id, { stars: starsEarned });
      console.log('Level completed and saved:', {
        userId: user?._id?.toString?.() ?? null,
        levelId: level._id?.toString?.() ?? null,
        stars: starsEarned,
        completedLevels: Array.isArray(updatedUser?.completedLevels)
          ? updatedUser.completedLevels.map(entry => ({
              levelId: entry?.levelId?.toString?.() ?? null,
              stars: entry?.stars ?? 0,
              completedAt: entry?.completedAt ?? null,
            }))
          : [],
      });
    }

    res.json({
      success: true,
      message: isLevelCompleted ? 'Level completed!' : 'Word completed!',
      data: {
        word: targetWord,
        coinsEarned: wordCoinsReward,
        pointsEarned: wordPointsReward,
        totalCoins: user.coins,
        totalScore: user.totalScore,
        levelCompleted: isLevelCompleted,
        levelBonus: isLevelCompleted && !wasLevelAlreadyComplete ? levelReward : 0,
        starsEarned,
        powerUpsUsed: usageSnapshot
      }
    });
  } catch (error) {
    console.error('Complete word error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error completing word'
    });
  }
};

// @desc    Get a hint for current level
// @route   POST /api/game/hint
// @access  Private
const getHint = async (req, res) => {
  try {
    const { levelId } = req.body;
    const user = req.user;

    // Check if user has enough coins
    const hintCost = parseInt(process.env.HINT_COST) || 10;
    if (user.coins < hintCost) {
      return res.status(400).json({
        success: false,
        message: 'Not enough coins for hint'
      });
    }

    // Find the level
    const level = await Level.findById(levelId).populate('words');
    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found'
      });
    }

    // Find incomplete words in this level
    const incompleteWords = level.words.filter(word =>
      !user.hasCompletedWordInLevel(level._id, word._id)
    );

    if (incompleteWords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hints available - all words completed'
      });
    }

    // Select a random incomplete word and get its first letter
    const randomWord = incompleteWords[Math.floor(Math.random() * incompleteWords.length)];
    const firstLetter = randomWord.text[0];

    // Deduct coins
    await user.spendCoins(hintCost);

    res.json({
      success: true,
      message: 'Hint purchased',
      data: {
        hintLetter: firstLetter,
        wordLength: randomWord.text.length,
        coinsSpent: hintCost,
        remainingCoins: user.coins
      }
    });
  } catch (error) {
    console.error('Get hint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting hint'
    });
  }
};

// @desc    Purchase an additional shuffle for the current level
// @route   POST /api/game/shuffle
// @access  Private
const purchaseShuffle = async (req, res) => {
  try {
    const { levelId } = req.body;
    const user = req.user;
    const shuffleCost = parseInt(process.env.SHUFFLE_COST, 10) || 15;

    if (!levelId || !mongoose.Types.ObjectId.isValid(levelId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid level ID is required for shuffle purchase'
      });
    }

    const level = await Level.findById(levelId).select('_id');

    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found'
      });
    }

    if (user.coins < shuffleCost) {
      return res.status(400).json({
        success: false,
        message: 'Not enough coins for shuffle'
      });
    }

    const progress = user.getLevelProgress(level._id, { createIfMissing: true });
    if (progress) {
      progress.usedShuffle = true;
    }

    await user.spendCoins(shuffleCost);

    return res.json({
      success: true,
      message: 'Shuffle purchased',
      data: {
        coinsSpent: shuffleCost,
        remainingCoins: user.coins,
        powerUpsUsed: {
          shuffle: true,
          autoSolve: Boolean(progress?.usedAutoSolve)
        }
      }
    });
  } catch (error) {
    console.error('Purchase shuffle error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error purchasing shuffle'
    });
  }
};

// @desc    Auto-solve a word
// @route   POST /api/game/auto-solve
// @access  Private
const autoSolve = async (req, res) => {
  try {
    const { levelId, powerUpsUsed: rawPowerUps } = req.body;
    const user = req.user;

    // Check if user has enough coins
    const autoSolveCost = parseInt(process.env.AUTO_SOLVE_COST) || 50;
    if (user.coins < autoSolveCost) {
      return res.status(400).json({
        success: false,
        message: 'Not enough coins for auto-solve'
      });
    }

    // Find the level
    const level = await Level.findById(levelId).populate('words');
    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found'
      });
    }

    const powerUpsUsed = {
      shuffle: Boolean(rawPowerUps?.shuffle)
    };

    const existingProgress = user.getLevelProgress(level._id, { createIfMissing: true });
    const wasLevelAlreadyComplete = Boolean(existingProgress?.isComplete);

    // Find incomplete words in this level
    const incompleteWords = level.words.filter(word =>
      !user.hasCompletedWordInLevel(level._id, word._id)
    );

    if (incompleteWords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No words available for auto-solve'
      });
    }

    // Select a random incomplete word
    const randomWord = incompleteWords[Math.floor(Math.random() * incompleteWords.length)];

    // Get reward settings for skip level rewards
    const rewardSettings = await getResolvedRewardSettings();
    const skipLevelCoinsReward = rewardSettings.skipLevelCoinsReward;
    const skipLevelPointsReward = rewardSettings.skipLevelPointsReward;

    // Deduct coins for auto-solve cost
    await user.spendCoins(autoSolveCost);

    // Award skip level coins reward
    await user.addCoins(skipLevelCoinsReward);

    // Complete the word with skip level points reward
    await user.completeWord(level._id, randomWord._id, {
      usedAutoSolve: true,
      usedShuffle: powerUpsUsed.shuffle,
      pointsReward: skipLevelPointsReward
    });

    // Update word stats
    randomWord.timesCompleted += 1;
    await randomWord.save();

    // Check if level is now completed after auto-solve
    const levelProgress = user.getLevelProgress(level._id);
    const completedWordsCount = levelProgress?.completedWords?.length || 0;
    const isLevelCompleted = completedWordsCount === level.words.length;

    let levelBonus = 0;
    const usageSnapshot = {
      shuffle: Boolean(levelProgress?.usedShuffle),
      autoSolve: Boolean(levelProgress?.usedAutoSolve)
    };
    let starsEarned = null;

    if (isLevelCompleted) {
      const levelReward = parseInt(process.env.LEVEL_COMPLETE_REWARD) || 100;

      starsEarned = determineStarsFromProgress(levelProgress);

      if (!wasLevelAlreadyComplete) {
        await user.addCoins(levelReward);
        levelBonus = levelReward;
      }

      const updatedUser = await user.completeLevel(level._id, { stars: starsEarned });
      console.log('Level completed and saved:', {
        userId: user?._id?.toString?.() ?? null,
        levelId: level._id?.toString?.() ?? null,
        stars: starsEarned,
        completedLevels: Array.isArray(updatedUser?.completedLevels)
          ? updatedUser.completedLevels.map(entry => ({
              levelId: entry?.levelId?.toString?.() ?? null,
              stars: entry?.stars ?? 0,
              completedAt: entry?.completedAt ?? null,
            }))
          : [],
      });
    }

    res.json({
      success: true,
      message: 'Word auto-solved',
      data: {
        solvedWord: randomWord,
        coinsSpent: autoSolveCost,
        skipLevelCoinsReward,
        skipLevelPointsReward,
        netCoinsChange: skipLevelCoinsReward - autoSolveCost,
        remainingCoins: user.coins,
        totalScore: user.totalScore,
        levelCompleted: isLevelCompleted,
        levelBonus,
        starsEarned,
        powerUpsUsed: usageSnapshot
      }
    });
  } catch (error) {
    console.error('Auto-solve error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during auto-solve'
    });
  }
};

// @desc    Get user game statistics
// @route   GET /api/game/stats
// @access  Private
const getGameStats = async (req, res) => {
  try {
    const user = req.user;

    const stats = {
      totalScore: user.totalScore,
      levelsCleared: user.levelsCleared,
      wordsFound: user.wordsFound,
      currentStreak: user.currentStreak,
      bestStreak: user.bestStreak,
      coins: user.coins,
      currentLevel: user.currentLevel,
      totalWordsInCurrentLevel: 0,
      completedWordsInCurrentLevel: 0
    };

    // Get current level progress
    const currentLevel = await Level.findOne({
      order: user.currentLevel
    }).populate('words');

    if (currentLevel) {
      stats.totalWordsInCurrentLevel = currentLevel.words.length;
      const levelProgress = user.getLevelProgress(currentLevel._id);
      stats.completedWordsInCurrentLevel = levelProgress?.completedWords?.length || 0;
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get game stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching game stats'
    });
  }
};

module.exports = {
  getFirstLevel,
  getNextLevel,
  getLevels,
  unlockLevel,
  completeWord,
  getHint,
  purchaseShuffle,
  autoSolve,
  getGameStats
};
