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