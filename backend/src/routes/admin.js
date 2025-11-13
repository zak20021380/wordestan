const express = require('express');
const { body } = require('express-validator');
const { adminAuth } = require('../middleware/auth');
const {
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
  getDashboardStats,

  // Game settings
  getGameRewardSettings,
  updateGameRewardSettings,

  // Users
  getUsersWithStats,

  // Telegram broadcast
  broadcastToTelegramUsers
} = require('../controllers/adminController');

const router = express.Router();

// Validation rules
const wordValidation = [
  body('text')
    .isLength({ min: 3, max: 12 })
    .withMessage('Word must be between 3 and 12 characters')
    .matches(/^[A-Za-z]+$/)
    .withMessage('Word can only contain letters'),
  body('difficulty')
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),
  body('points')
    .isInt({ min: 10, max: 100 })
    .withMessage('Points must be between 10 and 100'),
  body('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Category must be less than 50 characters'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters')
];

const levelValidation = [
  body('letters')
    .optional()
    .isString()
    .isLength({ min: 1 })
    .withMessage('Letters must be a non-empty string')
    .matches(/^[A-Za-z]+$/)
    .withMessage('Letters can only contain alphabetic characters'),
  body('words')
    .optional()
];

const coinPackValidation = [
  body('name')
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters'),
  body('coins')
    .isInt({ min: 10, max: 10000 })
    .withMessage('Coins must be between 10 and 10000'),
  body('price')
    .isFloat({ min: 1, max: 10000000 })
    .withMessage('Price must be a valid number'),
  body('bonusCoins')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Bonus coins must be non-negative'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be zero or greater'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters'),
  body('currency')
    .optional()
    .isLength({ min: 1, max: 10 })
    .withMessage('Currency must be between 1 and 10 characters'),
  body('imageUrl')
    .optional()
    .isString()
    .isLength({ max: 300 })
    .withMessage('Image URL must be less than 300 characters'),
  body('featured')
    .optional()
    .isBoolean()
    .toBoolean()
    .withMessage('Featured must be a boolean value'),
  body('popular')
    .optional()
    .isBoolean()
    .toBoolean()
    .withMessage('Popular must be a boolean value'),
  body('isActive')
    .optional()
    .isBoolean()
    .toBoolean()
    .withMessage('isActive must be a boolean value')
];

const rewardSettingsValidation = [
  body('skipLevelCoinsReward')
    .isInt({ min: 0, max: 1000000 })
    .withMessage('Skip level coin reward must be between 0 and 1,000,000')
    .toInt(),
  body('skipLevelPointsReward')
    .isInt({ min: 0, max: 1000000 })
    .withMessage('Skip level point reward must be between 0 and 1,000,000')
    .toInt(),
  body('wordFoundCoinsReward')
    .isInt({ min: 0, max: 1000000 })
    .withMessage('Word found coin reward must be between 0 and 1,000,000')
    .toInt(),
  body('wordFoundPointsReward')
    .isInt({ min: 0, max: 1000000 })
    .withMessage('Word found point reward must be between 0 and 1,000,000')
    .toInt()
];

// Word management routes
router.get('/words', adminAuth, getWords);
router.post('/words', adminAuth, wordValidation, createWord);
router.put('/words/:id', adminAuth, wordValidation, updateWord);
router.delete('/words/:id', adminAuth, deleteWord);

// Level management routes
router.get('/levels', adminAuth, getLevels);
router.post('/levels', adminAuth, levelValidation, createLevel);
router.put('/levels/:id', adminAuth, levelValidation, updateLevel);
router.delete('/levels/:id', adminAuth, deleteLevel);

// Coin pack management routes
router.get('/packs', adminAuth, getCoinPacks);
router.post('/packs', adminAuth, coinPackValidation, createCoinPack);
router.put('/packs/:id', adminAuth, coinPackValidation, updateCoinPack);
router.delete('/packs/:id', adminAuth, deleteCoinPack);

// Dashboard
router.get('/dashboard', adminAuth, getDashboardStats);

// Game settings
router.get('/settings/rewards', adminAuth, getGameRewardSettings);
router.put('/settings/rewards', adminAuth, rewardSettingsValidation, updateGameRewardSettings);

// Users
router.get('/users', adminAuth, getUsersWithStats);

// Telegram broadcast
router.post('/broadcast', adminAuth, [
  body('message')
    .isString()
    .trim()
    .isLength({ min: 1, max: 4096 })
    .withMessage('Message must be between 1 and 4096 characters'),
  body('parse_mode')
    .optional()
    .isIn(['HTML', 'Markdown', 'MarkdownV2'])
    .withMessage('Parse mode must be HTML, Markdown, or MarkdownV2')
], broadcastToTelegramUsers);

module.exports = router;