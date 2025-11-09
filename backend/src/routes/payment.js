const express = require('express');
const { auth } = require('../middleware/auth');
const { requestPayment, verifyPayment } = require('../controllers/paymentController');

const router = express.Router();

router.post('/request', auth, requestPayment);
router.get('/verify', auth, verifyPayment);

module.exports = router;
