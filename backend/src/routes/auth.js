const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  updateProfile,
  checkUsernameAvailability,
  telegramAuth
} = require('../controllers/authController');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const loginValidation = [
  body('username')
    .isLength({ min: 3 })
    .withMessage('Please provide a valid username'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const telegramValidation = [
  body('initData')
    .isString()
    .withMessage('Telegram initData must be a string')
    .notEmpty()
    .withMessage('Telegram initData is required')
];

const updateValidation = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Please provide a valid email address')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/telegram', telegramValidation, telegramAuth);
router.get('/me', auth, getMe);
router.put('/update', auth, updateValidation, updateProfile);
router.get('/check-username', checkUsernameAvailability);

module.exports = router;
