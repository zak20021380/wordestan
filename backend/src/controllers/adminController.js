const Word = require('../models/Word');
const Level = require('../models/Level');
const CoinPack = require('../models/CoinPack');
const User = require('../models/User');
const Purchase = require('../models/Purchase');
const { validationResult } = require('express-validator');

// Word Management
// @desc    Get all words
// @route   GET /api/admin/words
// @access  Admin
const getWords = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', difficulty = '', isActive = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Build search query
    let query = {};
    if (search) {
      query.text = { $regex: search, $options: 'i' };
    }
    if (difficulty) {
      query.difficulty = difficulty;
    }
    if (isActive !== '') {
      query.isActive = isActive === 'true';
    }

    const words = await Word.find(query)
      .sort({ text: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const totalCount = await Word.countDocuments(query);

    res.json({
      success: true,
      data: {
        words,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount
        }
      }
    });
  } catch (error) {
    console.error('Get words error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching words'
    });
  }
};

// @desc    Create a new word
// @route   POST /api/admin/words
// @access  Admin
const createWord = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { text, difficulty, points, category, description } = req.body;

    // Check if word already exists
    const existingWord = await Word.findOne({ text: text.toUpperCase() });
    if (existingWord) {
      return res.status(400).json({
        success: false,
        message: 'Word already exists'
      });
    }

    const word = new Word({
      text,
      difficulty,
      points,
      category,
      description
    });

    await word.save();

    res.status(201).json({
      success: true,
      message: 'Word created successfully',
      data: word
    });
  } catch (error) {
    console.error('Create word error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating word'
    });
  }
};

// @desc    Update a word
// @route   PUT /api/admin/words/:id
// @access  Admin
const updateWord = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { text, difficulty, points, category, description, isActive } = req.body;

    const word = await Word.findByIdAndUpdate(
      id,
      { text, difficulty, points, category, description, isActive },
      { new: true, runValidators: true }
    );

    if (!word) {
      return res.status(404).json({
        success: false,
        message: 'Word not found'
      });
    }

    res.json({
      success: true,
      message: 'Word updated successfully',
      data: word
    });
  } catch (error) {
    console.error('Update word error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating word'
    });
  }
};

// @desc    Delete a word
// @route   DELETE /api/admin/words/:id
// @access  Admin
const deleteWord = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if word is used in any level
    const levelCount = await Level.countDocuments({ words: id });
    if (levelCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete word. It is used in one or more levels.'
      });
    }

    const word = await Word.findByIdAndDelete(id);

    if (!word) {
      return res.status(404).json({
        success: false,
        message: 'Word not found'
      });
    }

    res.json({
      success: true,
      message: 'Word deleted successfully'
    });
  } catch (error) {
    console.error('Delete word error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting word'
    });
  }
};

// Level Management
// @desc    Get all levels
// @route   GET /api/admin/levels
// @access  Admin
const getLevels = async (req, res) => {
  try {
    const { page = 1, limit = 20, isPublished = '', search = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let query = {};
    if (isPublished !== '') {
      query.isPublished = isPublished === 'true';
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const levels = await Level.find(query)
      .populate('words', 'text length difficulty')
      .sort({ order: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const totalCount = await Level.countDocuments(query);

    res.json({
      success: true,
      data: {
        levels,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount
        }
      }
    });
  } catch (error) {
    console.error('Get levels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching levels'
    });
  }
};

// @desc    Create a new level
// @route   POST /api/admin/levels
// @access  Admin
const createLevel = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, order, words, letters, centerLetter, difficulty, description } = req.body;

    // Check if order already exists
    const existingOrder = await Level.findOne({ order });
    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: 'Level with this order already exists'
      });
    }

    // Validate all words exist
    const wordCount = await Word.countDocuments({ _id: { $in: words } });
    if (wordCount !== words.length) {
      return res.status(400).json({
        success: false,
        message: 'Some words do not exist'
      });
    }

    // Validate letters array
    if (letters.length < 5 || letters.length > 12) {
      return res.status(400).json({
        success: false,
        message: 'Letters array must contain between 5 and 12 letters'
      });
    }

    // Validate center letter is in letters array
    if (!letters.includes(centerLetter.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Center letter must be in the letters array'
      });
    }

    const level = new Level({
      name,
      order,
      words,
      letters,
      centerLetter,
      difficulty,
      description
    });

    await level.save();
    await level.populate('words', 'text length difficulty');

    res.status(201).json({
      success: true,
      message: 'Level created successfully',
      data: level
    });
  } catch (error) {
    console.error('Create level error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating level'
    });
  }
};

// @desc    Update a level
// @route   PUT /api/admin/levels/:id
// @access  Admin
const updateLevel = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { name, order, words, letters, centerLetter, difficulty, isPublished, description } = req.body;

    // Check if order already exists for another level
    if (order) {
      const existingOrder = await Level.findOne({ order, _id: { $ne: id } });
      if (existingOrder) {
        return res.status(400).json({
          success: false,
          message: 'Level with this order already exists'
        });
      }
    }

    const level = await Level.findByIdAndUpdate(
      id,
      { name, order, words, letters, centerLetter, difficulty, isPublished, description },
      { new: true, runValidators: true }
    ).populate('words', 'text length difficulty');

    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found'
      });
    }

    res.json({
      success: true,
      message: 'Level updated successfully',
      data: level
    });
  } catch (error) {
    console.error('Update level error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating level'
    });
  }
};

// @desc    Delete a level
// @route   DELETE /api/admin/levels/:id
// @access  Admin
const deleteLevel = async (req, res) => {
  try {
    const { id } = req.params;

    const level = await Level.findByIdAndDelete(id);

    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found'
      });
    }

    res.json({
      success: true,
      message: 'Level deleted successfully'
    });
  } catch (error) {
    console.error('Delete level error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting level'
    });
  }
};

// Coin Pack Management
// @desc    Get all coin packs
// @route   GET /api/admin/packs
// @access  Admin
const getCoinPacks = async (req, res) => {
  try {
    const coinPacks = await CoinPack.find().sort({ order: 1, price: 1 });

    res.json({
      success: true,
      data: coinPacks
    });
  } catch (error) {
    console.error('Get coin packs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching coin packs'
    });
  }
};

// @desc    Create a coin pack
// @route   POST /api/admin/packs
// @access  Admin
const createCoinPack = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const coinPack = new CoinPack(req.body);
    await coinPack.save();

    res.status(201).json({
      success: true,
      message: 'Coin pack created successfully',
      data: coinPack
    });
  } catch (error) {
    console.error('Create coin pack error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating coin pack'
    });
  }
};

// @desc    Update a coin pack
// @route   PUT /api/admin/packs/:id
// @access  Admin
const updateCoinPack = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const coinPack = await CoinPack.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!coinPack) {
      return res.status(404).json({
        success: false,
        message: 'Coin pack not found'
      });
    }

    res.json({
      success: true,
      message: 'Coin pack updated successfully',
      data: coinPack
    });
  } catch (error) {
    console.error('Update coin pack error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating coin pack'
    });
  }
};

// @desc    Delete a coin pack
// @route   DELETE /api/admin/packs/:id
// @access  Admin
const deleteCoinPack = async (req, res) => {
  try {
    const { id } = req.params;

    const coinPack = await CoinPack.findByIdAndDelete(id);

    if (!coinPack) {
      return res.status(404).json({
        success: false,
        message: 'Coin pack not found'
      });
    }

    res.json({
      success: true,
      message: 'Coin pack deleted successfully'
    });
  } catch (error) {
    console.error('Delete coin pack error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting coin pack'
    });
  }
};

// Dashboard Statistics
// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isAdmin: false });
    const totalLevels = await Level.countDocuments();
    const totalWords = await Word.countDocuments();
    const totalCoinPacks = await CoinPack.countDocuments();
    
    const totalPurchases = await Purchase.countDocuments();
    const totalRevenue = await Purchase.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);

    const activeUsersToday = await User.countDocuments({
      isAdmin: false,
      lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    const newUsersToday = await User.countDocuments({
      isAdmin: false,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    const publishedLevels = await Level.countDocuments({ isPublished: true });
    const unpublishedLevels = totalLevels - publishedLevels;

    const topLevels = await Level.find({ isPublished: true })
      .select('name order timesCompleted')
      .sort({ timesCompleted: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalLevels,
          totalWords,
          totalCoinPacks
        },
        activity: {
          activeUsersToday,
          newUsersToday,
          totalPurchases,
          totalRevenue: totalRevenue[0]?.total || 0
        },
        levels: {
          published: publishedLevels,
          unpublished: unpublishedLevels,
          topLevels
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard statistics'
    });
  }
};

module.exports = {
  // Word management
  getWords,
  createWord,
  updateWord,
  deleteWord,
  
  // Level management
  getLevels,
  createLevel,
  updateLevel,
  deleteLevel,
  
  // Coin pack management
  getCoinPacks,
  createCoinPack,
  updateCoinPack,
  deleteCoinPack,
  
  // Dashboard
  getDashboardStats
};