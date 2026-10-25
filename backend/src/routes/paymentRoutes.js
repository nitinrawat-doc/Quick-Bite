const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createPaymentOrder,
  verifyPayment,
  cancelPayment,
  handleRazorpayWebhook,
} = require('../controllers/paymentController');

// Webhook endpoint (public, verified via HMAC signature)
router.post('/webhook', handleRazorpayWebhook);

// Protected student payment endpoints
router.post('/create-order', protect, createPaymentOrder);
router.post('/verify', protect, verifyPayment);
router.post('/cancel', protect, cancelPayment);

module.exports = router;
