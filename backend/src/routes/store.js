const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { adminAuth } = require('../middleware/auth');
const {
  getCoinPacks,
  mockPurchase,
  getPurchaseHistory,
  getStoreStats
} = require('../controllers/storeController');

const router = express.Router();

// Validation rules
const purchaseValidation = [
  body('packId')
    .isMongoId()
    .withMessage('Valid pack ID is required'),
  body('paymentMethod')
    .optional()
    .isIn(['mock', 'stripe', 'paypal'])
    .withMessage('Invalid payment method')
];

// Public routes
router.get('/packs', getCoinPacks);

// Private routes
router.post('/purchase', auth, purchaseValidation, mockPurchase);
router.get('/purchases', auth, getPurchaseHistory);

// Admin routes
router.get('/stats', adminAuth, getStoreStats);

module.exports = router;