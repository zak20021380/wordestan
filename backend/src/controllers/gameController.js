const Level = require('../models/Level');
const Word = require('../models/Word');
const User = require('../models/User');

// @desc    Get next level for user
// @route   GET /api/game/next-level
// @access  Private
const getNextLevel = async (req, res) => {
  try {
    const user = req.user;
    
    // Find the next unpublished level for the user
    const nextLevel = await Level.findOne({
      order: { $gte: user.currentLevel },
      isPublished: true
    })
    .populate('words', 'text length difficulty points')
    .sort({ order: 1 });

    if (!nextLevel) {
      return res.status(404).json({
        success: false,
        message: 'No more levels available'
      });
    }

    // Update user's last active
    await user.updateLastActive();

    const levelObject = nextLevel.toObject({ getters: true });

    const completedWords = levelObject.words
      .filter(word =>
        user.completedWords.some(completedId => completedId.equals(word._id))
      )
      .map(word => word.text);

    res.json({
      success: true,
      data: {
        level: levelObject,
        completedWords,
        userProgress: {
          currentLevel: user.currentLevel,
          levelsCleared: user.levelsCleared,
          coins: user.coins,
          totalScore: user.totalScore
        }
      }
    });
  } catch (error) {
    console.error('Get next level error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching next level'
    });
  }
};

// @desc    Submit a completed word
// @route   POST /api/game/complete-word
// @access  Private
const completeWord = async (req, res) => {
  try {
    const { word, levelId } = req.body;
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

    // Check if user has already completed this word
    if (user.completedWords.includes(targetWord._id)) {
      return res.status(400).json({
        success: false,
        message: 'Word already completed'
      });
    }

    // Award coins and update progress
    const wordReward = parseInt(process.env.WORD_COMPLETE_REWARD) || 20;
    await user.addCoins(wordReward);
    await user.completeWord(targetWord._id);
    
    // Update word completion stats
    targetWord.timesCompleted += 1;
    await targetWord.save();

    // Check if level is completed
    const completedWordsCount = user.completedWords.filter(wordId => 
      level.words.some(levelWord => levelWord._id.equals(wordId))
    ).length;

    const isLevelCompleted = completedWordsCount === level.words.length;

    if (isLevelCompleted && !user.completedLevels.includes(level._id)) {
      // Award level completion bonus
      const levelReward = parseInt(process.env.LEVEL_COMPLETE_REWARD) || 100;
      await user.addCoins(levelReward);
      await user.completeLevel(level._id);
    }

    res.json({
      success: true,
      message: isLevelCompleted ? 'Level completed!' : 'Word completed!',
      data: {
        word: targetWord,
        coinsEarned: wordReward,
        totalCoins: user.coins,
        totalScore: user.totalScore,
        levelCompleted: isLevelCompleted,
        levelBonus: isLevelCompleted ? levelReward : 0
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
      !user.completedWords.includes(word._id)
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

// @desc    Auto-solve a word
// @route   POST /api/game/auto-solve
// @access  Private
const autoSolve = async (req, res) => {
  try {
    const { levelId } = req.body;
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

    // Find incomplete words in this level
    const incompleteWords = level.words.filter(word => 
      !user.completedWords.includes(word._id)
    );

    if (incompleteWords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No words available for auto-solve'
      });
    }

    // Select a random incomplete word
    const randomWord = incompleteWords[Math.floor(Math.random() * incompleteWords.length)];

    // Deduct coins
    await user.spendCoins(autoSolveCost);

    // Complete the word (without coin reward)
    await user.completeWord(randomWord._id);
    
    // Update word stats
    randomWord.timesCompleted += 1;
    await randomWord.save();

    res.json({
      success: true,
      message: 'Word auto-solved',
      data: {
        solvedWord: randomWord,
        coinsSpent: autoSolveCost,
        remainingCoins: user.coins,
        totalScore: user.totalScore
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
      stats.completedWordsInCurrentLevel = user.completedWords.filter(wordId =>
        currentLevel.words.some(levelWord => levelWord._id.equals(wordId))
      ).length;
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
  getNextLevel,
  completeWord,
  getHint,
  autoSolve,
  getGameStats
};