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
  getDashboardStats
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
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Level name must be between 1 and 100 characters'),
  body('order')
    .isInt({ min: 1 })
    .withMessage('Order must be a positive integer'),
  body('words')
    .isArray({ min: 1 })
    .withMessage('Words array must contain at least one word'),
  body('words.*')
    .isMongoId()
    .withMessage('Each word must be a valid ObjectId'),
  body('letters')
    .isArray({ min: 5, max: 12 })
    .withMessage('Letters array must contain between 5 and 12 letters'),
  body('letters.*')
    .isLength({ min: 1, max: 1 })
    .withMessage('Each letter must be a single character'),
  body('centerLetter')
    .isLength({ min: 1, max: 1 })
    .withMessage('Center letter must be a single character'),
  body('difficulty')
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
];

const coinPackValidation = [
  body('title')
    .isLength({ min: 1, max: 50 })
    .withMessage('Title must be between 1 and 50 characters'),
  body('amount')
    .isInt({ min: 10, max: 10000 })
    .withMessage('Amount must be between 10 and 10000'),
  body('price')
    .isFloat({ min: 0.99, max: 99.99 })
    .withMessage('Price must be between 0.99 and 99.99'),
  body('bonusCoins')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Bonus coins must be non-negative'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters')
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

module.exports = router;