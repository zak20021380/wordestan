const express = require('express');
const { body, param } = require('express-validator');
const { auth } = require('../middleware/auth');
const { getCards, addCard, reviewCard } = require('../controllers/leitnerController');

const router = express.Router();

const addCardValidation = [
  body('word')
    .isString()
    .trim()
    .isLength({ min: 2, max: 32 })
    .withMessage('کلمه باید بین ۲ تا ۳۲ کاراکتر باشد'),
  body('meaning')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 300 })
    .withMessage('معنی باید حداکثر ۳۰۰ کاراکتر باشد'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('یادداشت باید حداکثر ۵۰۰ کاراکتر باشد'),
];

const reviewValidation = [
  param('cardId')
    .isMongoId()
    .withMessage('شناسه کارت نامعتبر است'),
  body('result')
    .isIn(['success', 'fail'])
    .withMessage('نتیجه مرور نامعتبر است'),
];

router.get('/cards', auth, getCards);
router.post('/cards', auth, addCardValidation, addCard);
router.post('/cards/:cardId/review', auth, reviewValidation, reviewCard);

module.exports = router;
