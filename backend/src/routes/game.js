const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  getNextLevel,
  completeWord,
  getHint,
  autoSolve,
  getGameStats
} = require('../controllers/gameController');

const router = express.Router();

// Validation rules
const completeWordValidation = [
  body('word')
    .isLength({ min: 3, max: 12 })
    .withMessage('Word must be between 3 and 12 characters')
    .matches(/^[A-Za-z]+$/)
    .withMessage('Word can only contain letters'),
  body('levelId')
    .isMongoId()
    .withMessage('Valid level ID is required')
];

const hintValidation = [
  body('levelId')
    .isMongoId()
    .withMessage('Valid level ID is required')
];

const autoSolveValidation = [
  body('levelId')
    .isMongoId()
    .withMessage('Valid level ID is required')
];

// Routes
router.get('/next-level', auth, getNextLevel);
router.post('/complete-word', auth, completeWordValidation, completeWord);
router.post('/hint', auth, hintValidation, getHint);
router.post('/auto-solve', auth, autoSolveValidation, autoSolve);
router.get('/stats', auth, getGameStats);

module.exports = router;