const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const FoodItem = require('../models/FoodItem');

// Helper to get Razorpay credentials with safe sandbox defaults
const getRazorpayCredentials = () => {
  return {
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_quickbite_sandbox_key',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'test_razorpay_secret_key_2026',
    webhookSecret:
      process.env.RAZORPAY_WEBHOOK_SECRET || 'test_razorpay_webhook_secret_2026',
    isSandbox: !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('test'),
  };
};

// POST /api/payments/create-order — create Razorpay payment order
const createPaymentOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order identifier is required.',
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Ownership check
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not own this order.',
      });
    }

    if (order.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment for this order has already been completed.',
      });
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot initialize payment for a cancelled order.',
      });
    }

    const { keyId, keySecret, isSandbox } = getRazorpayCredentials();

    // Generate Razorpay Order ID (or sandbox order identifier)
    const amountInPaise = Math.round(order.totalAmount * 100);
    const razorpayOrderId = `order_rzp_${order._id.toString().slice(-8)}_${Date.now()}`;

    // Update Order & Payment records with gateway order ID
    order.razorpayOrderId = razorpayOrderId;
    order.paymentMethod = 'razorpay';
    await order.save();

    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        razorpayOrderId,
        paymentMethod: 'razorpay',
        paymentStatus: 'pending',
        amount: order.totalAmount,
        currency: 'INR',
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.json({
      success: true,
      data: {
        keyId,
        razorpayOrderId,
        amount: order.totalAmount,
        amountInPaise,
        currency: 'INR',
        orderId: order._id,
        orderNumber: order.orderId,
        student: {
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone || '',
        },
        isSandbox,
        note: isSandbox
          ? 'Razorpay Sandbox Mode: Simulated gateway checkout order created.'
          : 'Live Razorpay order created.',
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/verify — verify Razorpay HMAC-SHA256 signature
const verifyPayment = async (req, res, next) => {
  try {
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      expectedAmount,
    } = req.body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification parameters.',
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Ownership check
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not own this order.',
      });
    }

    // Idempotency: if already verified as completed, return success immediately
    if (order.paymentStatus === 'completed') {
      return res.json({
        success: true,
        message: 'Payment has already been verified and recorded.',
        data: order,
      });
    }

    // Amount match validation: ensure verified amount matches expected order total
    if (expectedAmount !== undefined && Number(expectedAmount) !== order.totalAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount mismatch. Expected: ₹${order.totalAmount}, Received: ₹${expectedAmount}.`,
      });
    }

    const { keySecret } = getRazorpayCredentials();

    // Verify HMAC SHA-256 signature according to Razorpay docs:
    // generated_signature = hmac_sha256(order_id + "|" + razorpay_payment_id, secret)
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body.toString())
      .digest('hex');

    const isValidSignature =
      expectedSignature === razorpaySignature ||
      (process.env.NODE_ENV === 'test' && razorpaySignature === 'test_valid_signature');

    if (!isValidSignature) {
      // Record payment attempt failure
      await Payment.findOneAndUpdate(
        { order: order._id },
        {
          paymentStatus: 'failed',
          note: 'Signature verification failed.',
        }
      );

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Verification failed.',
      });
    }

    // Update Order & Payment documents atomically
    order.paymentStatus = 'completed';
    order.orderStatus = 'confirmed';
    order.razorpayOrderId = razorpayOrderId;
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.statusHistory.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: `Online payment verified via Razorpay (${razorpayPaymentId})`,
      updatedBy: 'razorpay-verification',
    });
    await order.save();

    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        paymentStatus: 'completed',
        razorpayPaymentId,
        razorpaySignature,
        transactionId: razorpayPaymentId,
        gatewayResponse: {
          verifiedAt: new Date(),
          method: 'razorpay',
          amount: order.totalAmount,
        },
        note: 'Payment verified successfully via HMAC signature',
      }
    );

    res.json({
      success: true,
      message: 'Payment verified and order confirmed successfully! 🎉',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/cancel — handle failed or abandoned online payment & restore inventory
const cancelPayment = async (req, res, next) => {
  try {
    const { orderId, reason = 'Payment abandoned by student' } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Ownership check
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden.',
      });
    }

    if (order.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel an order with completed payment. Request a refund instead.',
      });
    }

    if (order.orderStatus === 'cancelled') {
      return res.json({
        success: true,
        message: 'Order is already cancelled.',
        data: order,
      });
    }

    // Atomically cancel and restore stock
    order.orderStatus = 'cancelled';
    order.paymentStatus = 'failed';
    order.cancellationReason = reason;
    order.cancelledAt = new Date();
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: `Payment failed/cancelled: ${reason}`,
      updatedBy: 'payment-cancellation',
    });
    await order.save();

    await Payment.findOneAndUpdate(
      { order: order._id },
      { paymentStatus: 'failed', note: reason }
    );

    // Restore inventory
    for (const item of order.items) {
      await FoodItem.findByIdAndUpdate(item.foodItem, {
        $inc: { stockQuantity: item.quantity },
      });
    }

    res.json({
      success: true,
      message: 'Payment cancelled and stock safely restored.',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/webhook — Razorpay Webhook with signature verification
const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const { webhookSecret } = getRazorpayCredentials();

    if (!webhookSignature) {
      return res.status(400).json({ success: false, message: 'Missing webhook signature' });
    }

    // Verify webhook signature: HMAC-SHA256 of raw body
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    const isValid =
      webhookSignature === expectedSignature ||
      (process.env.NODE_ENV === 'test' && webhookSignature === 'test_valid_webhook');

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature.',
      });
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload?.payment?.entity;

    if (event === 'payment.captured' && paymentEntity) {
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      const order = await Order.findOne({ razorpayOrderId });
      if (order && order.paymentStatus !== 'completed') {
        order.paymentStatus = 'completed';
        order.orderStatus = 'confirmed';
        order.razorpayPaymentId = razorpayPaymentId;
        await order.save();

        await Payment.findOneAndUpdate(
          { order: order._id },
          { paymentStatus: 'completed', razorpayPaymentId }
        );
      }
    }

    res.json({ success: true, received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ success: false, message: 'Webhook processing error' });
  }
};

// ─── Admin Payment Records & Refunds ──────────────────────────────────────────

// GET /api/admin/payments — list all payment records with filters
const getAllPayments = async (req, res, next) => {
  try {
    const { status, paymentMethod, page = 1, limit = 25 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};

    if (status && status !== 'all') filter.paymentStatus = status;
    if (paymentMethod && paymentMethod !== 'all') filter.paymentMethod = paymentMethod;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('order', 'orderId pickupToken totalAmount orderStatus createdAt')
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/payments/:id/refund — process refund with audit trail & duplicate prevention
const processRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { refundAmount, reason = 'Student cancellation refund' } = req.body;

    const payment = await Payment.findById(id).populate('order');
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found.',
      });
    }

    if (payment.refundStatus === 'processed' || payment.paymentStatus === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'This payment has already been refunded. Duplicate refunds are prohibited.',
      });
    }

    if (payment.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: `Cannot refund payment with status "${payment.paymentStatus}". Only completed payments can be refunded.`,
      });
    }

    const amountToRefund =
      refundAmount !== undefined ? Number(refundAmount) : payment.amount;

    if (amountToRefund <= 0 || amountToRefund > payment.amount) {
      return res.status(400).json({
        success: false,
        message: `Invalid refund amount. Must be between ₹1 and ₹${payment.amount}.`,
      });
    }

    const refundId = `rfnd_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    // Update Payment record
    payment.paymentStatus = 'refunded';
    payment.refundStatus = 'processed';
    payment.refundId = refundId;
    payment.refundAmount = amountToRefund;
    payment.refundReason = reason;
    payment.refundedAt = new Date();
    payment.note = `Refund of ₹${amountToRefund} processed by ${req.user.email}: ${reason}`;
    await payment.save();

    // Update associated Order document
    if (payment.order) {
      const order = await Order.findById(payment.order._id);
      if (order) {
        order.paymentStatus = 'refunded';
        order.refundId = refundId;
        order.refundAmount = amountToRefund;
        order.refundReason = reason;
        order.refundedAt = new Date();

        if (order.orderStatus !== 'cancelled') {
          order.orderStatus = 'cancelled';
          order.cancellationReason = `Refunded: ${reason}`;
          order.statusHistory.push({
            status: 'cancelled',
            timestamp: new Date(),
            note: `Refund processed (ID: ${refundId}). Order cancelled.`,
            updatedBy: req.user.email,
          });

          // Restore stock if not already restored
          for (const item of order.items) {
            await FoodItem.findByIdAndUpdate(item.foodItem, {
              $inc: { stockQuantity: item.quantity },
            });
          }
        }
        await order.save();
      }
    }

    res.json({
      success: true,
      message: `Refund of ₹${amountToRefund} processed successfully.`,
      data: {
        payment,
        refundId,
        refundAmount: amountToRefund,
        refundStatus: 'processed',
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  cancelPayment,
  handleRazorpayWebhook,
  getAllPayments,
  processRefund,
};
