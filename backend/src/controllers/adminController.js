const Word = require('../models/Word');
const Level = require('../models/Level');
const CoinPack = require('../models/CoinPack');
const User = require('../models/User');
const Purchase = require('../models/Purchase');
const { validationResult } = require('express-validator');

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
  }
  return Boolean(value);
};

const parseWordEntries = (input) => {
  if (!input) {
    return [];
  }

  const rawInput = Array.isArray(input) ? input.join('|') : String(input);

  const normalizedInput = rawInput
    .replace(/\r?\n/g, '|')
    .replace(/,/g, '|');

  const entries = normalizedInput
    .split('|')
    .map(entry => entry.trim())
    .filter(Boolean);

  const wordMap = new Map();

  for (const entry of entries) {
    const [wordPart, ...meaningParts] = entry.split(':');
    const text = (wordPart || '').trim().toUpperCase();

    if (!text) {
      continue;
    }

    const meaning = meaningParts.join(':').trim();
    wordMap.set(text, {
      text,
      meaning
    });
  }

  return Array.from(wordMap.values());
};

const upsertWordWithMeaning = async ({ text, meaning }) => {
  if (!text) {
    return null;
  }

  const normalizedText = text.trim().toUpperCase();
  const normalizedMeaning = (meaning || '').trim();
  const wordLength = normalizedText.length;

  const word = await Word.findOneAndUpdate(
    { text: normalizedText },
    {
      $set: {
        text: normalizedText,
        meaning: normalizedMeaning,
        length: wordLength
      },
      $setOnInsert: {
        difficulty: 'medium',
        points: wordLength * 10
      }
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  );

  return word;
};

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

    const { text, difficulty, points, category, description, meaning } = req.body;

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
      description,
      meaning
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
    const { text, difficulty, points, category, description, meaning, isActive } = req.body;

    const word = await Word.findByIdAndUpdate(
      id,
      { text, difficulty, points, category, description, meaning, isActive },
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
    const { page = 1, limit = 20, isPublished = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let query = {};
    if (isPublished !== '') {
      query.isPublished = isPublished === 'true';
    }

    const levels = await Level.find(query)
      .populate('words', 'text length difficulty meaning')
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

    const { letters, words } = req.body;

    // Validate input
    if (!letters || !words) {
      return res.status(400).json({
        success: false,
        message: 'Letters and words are required'
      });
    }

    const parsedWords = parseWordEntries(words);

    if (parsedWords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one word is required'
      });
    }

    // Auto-increment order (get max order + 1)
    const maxLevel = await Level.findOne().sort({ order: -1 }).select('order');
    const nextOrder = maxLevel ? maxLevel.order + 1 : 1;

    // Auto-create Word documents if they don't exist
    const wordIds = [];
    const seenWordIds = new Set();
    for (const entry of parsedWords) {
      const word = await upsertWordWithMeaning(entry);
      if (word) {
        const wordIdString = word._id.toString();
        if (!seenWordIds.has(wordIdString)) {
          seenWordIds.add(wordIdString);
          wordIds.push(word._id);
        }
      }
    }

    if (wordIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid words were provided'
      });
    }

    // Create level
    const level = new Level({
      order: nextOrder,
      letters: Array.isArray(letters)
        ? letters.join('').toUpperCase()
        : String(letters).replace(/\s+/g, '').toUpperCase(),
      words: wordIds,
      isPublished: true
    });

    await level.save();
    await level.populate('words', 'text length difficulty meaning');

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
    const { letters, words, isPublished } = req.body;

    const updateData = {};

    if (letters) {
      updateData.letters = Array.isArray(letters)
        ? letters.join('').toUpperCase()
        : String(letters).replace(/\s+/g, '').toUpperCase();
    }

    if (isPublished !== undefined) {
      updateData.isPublished = isPublished;
    }

    if (words) {
      const parsedWords = parseWordEntries(words);

      if (parsedWords.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one word is required'
        });
      }

      const wordIds = [];
      const seenWordIds = new Set();
      for (const entry of parsedWords) {
        const word = await upsertWordWithMeaning(entry);
        if (word) {
          const wordIdString = word._id.toString();
          if (!seenWordIds.has(wordIdString)) {
            seenWordIds.add(wordIdString);
            wordIds.push(word._id);
          }
        }
      }

      if (wordIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid words were provided'
        });
      }

      updateData.words = wordIds;
    }

    const level = await Level.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('words', 'text length difficulty meaning');

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
    console.log('Create coin pack request body:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('Create coin pack validation failed:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const name = typeof req.body.name === 'string' ? req.body.name.trim() : req.body.name;
    const coins = Number(req.body.coins);
    const price = Number(req.body.price);
    const bonusCoins = req.body.bonusCoins !== undefined
      ? Number(req.body.bonusCoins)
      : 0;
    const isActive = parseBoolean(req.body.isActive, true);
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : undefined;
    const imageUrl = typeof req.body.imageUrl === 'string' ? req.body.imageUrl.trim() : undefined;
    const currency = typeof req.body.currency === 'string' && req.body.currency.trim()
      ? req.body.currency.trim().toUpperCase()
      : undefined;

    const coinPackData = {
      name,
      description,
      coins,
      price,
      bonusCoins,
      totalCoins: coins + bonusCoins,
      order: req.body.order !== undefined ? Number(req.body.order) : 0,
      currency,
      imageUrl,
      featured: parseBoolean(req.body.featured, false),
      popular: parseBoolean(req.body.popular, false),
      isActive
    };

    console.log('Sanitized coin pack data before save:', coinPackData);

    const coinPack = new CoinPack(coinPackData);
    await coinPack.save();

    res.status(201).json({
      success: true,
      message: 'Coin pack created successfully',
      data: coinPack
    });
  } catch (error) {
    console.error('Create coin pack error message:', error.message);
    console.error('Create coin pack error stack:', error.stack);
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
    const coinPack = await CoinPack.findById(id);

    if (!coinPack) {
      return res.status(404).json({
        success: false,
        message: 'Coin pack not found'
      });
    }

    const updateData = { ...req.body };

    if (updateData.name !== undefined && typeof updateData.name === 'string') {
      updateData.name = updateData.name.trim();
    }
    if (updateData.coins !== undefined) {
      updateData.coins = Number(updateData.coins);
    }
    if (updateData.price !== undefined) {
      updateData.price = Number(updateData.price);
    }
    if (updateData.bonusCoins !== undefined) {
      updateData.bonusCoins = Number(updateData.bonusCoins);
    }
    if (updateData.order !== undefined) {
      updateData.order = Number(updateData.order);
    }
    if (updateData.isActive !== undefined) {
      updateData.isActive = parseBoolean(updateData.isActive, true);
    }
    if (updateData.featured !== undefined) {
      updateData.featured = parseBoolean(updateData.featured, false);
    }
    if (updateData.popular !== undefined) {
      updateData.popular = parseBoolean(updateData.popular, false);
    }
    if (updateData.description !== undefined && typeof updateData.description === 'string') {
      updateData.description = updateData.description.trim();
      if (updateData.description === '') {
        updateData.description = undefined;
      }
    }
    if (updateData.imageUrl !== undefined && typeof updateData.imageUrl === 'string') {
      updateData.imageUrl = updateData.imageUrl.trim();
      if (updateData.imageUrl === '') {
        updateData.imageUrl = undefined;
      }
    }
    if (updateData.currency !== undefined && typeof updateData.currency === 'string') {
      updateData.currency = updateData.currency.trim().toUpperCase();
      if (updateData.currency === '') {
        updateData.currency = undefined;
      }
    }

    Object.assign(coinPack, updateData);
    const coins = Number(coinPack.coins) || 0;
    const bonusCoins = Number(coinPack.bonusCoins) || 0;
    coinPack.totalCoins = coins + bonusCoins;

    await coinPack.save();

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
      .select('order letters')
      .populate('words', 'text')
      .sort({ order: 1 })
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