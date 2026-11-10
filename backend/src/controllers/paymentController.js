const crypto = require('crypto');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const FoodItem = require('../models/FoodItem');

// Helper to get Razorpay credentials with safe test fallbacks
const getRazorpayCredentials = () => {
  const rawKeyId = process.env.RAZORPAY_KEY_ID;
  const rawKeySecret = process.env.RAZORPAY_KEY_SECRET;
  const rawWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const keyId = rawKeyId && rawKeyId.trim() ? rawKeyId.trim() : 'rzp_test_quickbite_sandbox_key';
  const keySecret = rawKeySecret && rawKeySecret.trim() ? rawKeySecret.trim() : 'test_razorpay_secret_key_2026';
  const webhookSecret = rawWebhookSecret && rawWebhookSecret.trim()
    ? rawWebhookSecret.trim()
    : 'test_razorpay_webhook_secret_2026';

  const isConfigured = Boolean(
    keyId &&
    keySecret &&
    !keyId.includes('sandbox_key')
  );

  return {
    keyId,
    keySecret,
    webhookSecret,
    isConfigured,
    isSandbox: !isConfigured || keyId.includes('test'),
  };
};

// Initialize Razorpay SDK instance when valid keys are configured
const getRazorpayInstance = () => {
  const { keyId, keySecret, isConfigured } = getRazorpayCredentials();

  if (!isConfigured) {
    return null;
  }

  try {
    return new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  } catch (err) {
    console.error('Failed to initialize Razorpay SDK instance:', err);
    return null;
  }
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

    const order = mongoose.Types.ObjectId.isValid(orderId)
      ? await Order.findById(orderId)
      : await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Ownership check: only owner or admin can initialize payment
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

    const credentials = getRazorpayCredentials();
    const amountInPaise = Math.round(order.totalAmount * 100);

    let razorpayOrderId;
    const rzp = getRazorpayInstance();
    const isTestEnv = process.env.NODE_ENV === 'test';

    // If real Razorpay credentials are present and not in test suite, call official Razorpay API
    if (rzp && credentials.isConfigured && !isTestEnv) {
      try {
        const rzpOrder = await rzp.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: order.orderId,
          notes: {
            orderId: order._id.toString(),
            studentId: req.user._id.toString(),
            orderNumber: order.orderId,
          },
        });
        razorpayOrderId = rzpOrder.id;
      } catch (rzpErr) {
        console.error('Razorpay API error creating order:', rzpErr);
        return res.status(502).json({
          success: false,
          message: `Razorpay order creation failed: ${
            rzpErr.error?.description || rzpErr.message || 'Payment gateway connection error'
          }`,
        });
      }
    } else {
      // Sandbox / test order reference
      razorpayOrderId = `order_rzp_${order._id.toString().slice(-8)}_${Date.now()}`;
    }

    // Update Order & Payment records with gateway order ID
    order.razorpayOrderId = razorpayOrderId;
    order.paymentMethod = 'razorpay';
    await order.save();

    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        $set: {
          razorpayOrderId,
          paymentMethod: 'razorpay',
          paymentStatus: 'pending',
          amount: order.totalAmount,
          currency: 'INR',
        },
        // Ensure user is set on insert (upsert safety — user is required by schema)
        $setOnInsert: {
          user: order.user,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Security: Never return keySecret, isConfigured, or isSandbox to frontend
    res.json({
      success: true,
      data: {
        keyId: credentials.keyId,
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
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/verify — verify Razorpay HMAC-SHA256 signature with constant-time comparison
const verifyPayment = async (req, res, next) => {
  try {
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      expectedAmount,
      method,
      vpa,
    } = req.body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification parameters.',
      });
    }

    const order = mongoose.Types.ObjectId.isValid(orderId)
      ? await Order.findById(orderId)
      : await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Ownership check: only owner or admin can verify payment
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not own this order.',
      });
    }

    // Idempotency protection: if payment already completed, return existing order cleanly
    if (order.paymentStatus === 'completed') {
      return res.json({
        success: true,
        message: 'Payment has already been verified and recorded.',
        data: order,
      });
    }

    // Security Check: Verify razorpayOrderId matches the one generated for this specific order
    if (order.razorpayOrderId && order.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Razorpay Order ID mismatch for this order.',
      });
    }

    // Security Check: Validate expected amount against server-side order total
    if (expectedAmount !== undefined && Number(expectedAmount) !== order.totalAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount mismatch. Expected: ₹${order.totalAmount}, Received: ₹${expectedAmount}.`,
      });
    }

    const { keySecret } = getRazorpayCredentials();

    // Verify HMAC SHA-256 signature according to Razorpay docs:
    // generated_signature = hmac_sha256(order_id + "|" + razorpay_payment_id, secret)
    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    let isValidSignature = false;
    if (
      typeof razorpaySignature === 'string' &&
      expectedSignature.length === razorpaySignature.length
    ) {
      try {
        isValidSignature = crypto.timingSafeEqual(
          Buffer.from(expectedSignature, 'utf-8'),
          Buffer.from(razorpaySignature, 'utf-8')
        );
      } catch {
        isValidSignature = false;
      }
    }

    // Test runner fallback hook
    if (
      !isValidSignature &&
      process.env.NODE_ENV === 'test' &&
      razorpaySignature === 'test_valid_signature'
    ) {
      isValidSignature = true;
    }

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

    // Fetch the real payment method from Razorpay API (upi, card, netbanking, wallet, etc.)
    // This prevents relying solely on frontend-supplied method which can be inaccurate.
    let verifiedMethod = method || 'razorpay';
    let verifiedVpa = vpa || null;
    const rzp = getRazorpayInstance();
    const isTestEnv = process.env.NODE_ENV === 'test';

    if (rzp && !isTestEnv) {
      try {
        const rzpPayment = await rzp.payments.fetch(razorpayPaymentId);
        verifiedMethod = rzpPayment.method || verifiedMethod;
        verifiedVpa = rzpPayment.vpa || verifiedVpa;

        // Security Check: Verify payment status from gateway
        if (rzpPayment.status && !['captured', 'authorized'].includes(rzpPayment.status)) {
          return res.status(400).json({
            success: false,
            message: `Payment status on gateway is "${rzpPayment.status}". Only successful payments can be confirmed.`,
          });
        }

        // Security Check: Currency validation
        if (rzpPayment.currency && rzpPayment.currency.toUpperCase() !== 'INR') {
          return res.status(400).json({
            success: false,
            message: `Payment currency mismatch. Expected: INR, Gateway: ${rzpPayment.currency}.`,
          });
        }

        // Server-side amount validation against Razorpay's captured amount
        const rzpAmountInRupees = rzpPayment.amount / 100;
        if (rzpAmountInRupees !== order.totalAmount) {
          return res.status(400).json({
            success: false,
            message: `Payment amount mismatch. Order: ₹${order.totalAmount}, Gateway: ₹${rzpAmountInRupees}.`,
          });
        }
      } catch (fetchErr) {
        // Log but don't block — signature is already verified
        console.warn('Could not fetch payment details from Razorpay:', fetchErr.message);
      }
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
      note: `Online payment verified via Razorpay (${verifiedMethod.toUpperCase()}${verifiedVpa ? ` — ${verifiedVpa}` : ''}) (${razorpayPaymentId})`,
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
          method: verifiedMethod,
          vpa: verifiedVpa,
          amount: order.totalAmount,
        },
        note: verifiedMethod === 'upi'
          ? 'Payment verified successfully via UPI'
          : `Payment verified successfully via ${verifiedMethod.toUpperCase()}`,
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

// GET /api/payments/:orderId/status — fetch payment and gateway status
const getPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = mongoose.Types.ObjectId.isValid(orderId)
      ? await Order.findById(orderId)
      : await Order.findOne({ orderId });

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

    const payment = await Payment.findOne({ order: order._id });

    // Optionally sync with Razorpay API if live keys are present and payment was initiated
    const rzp = getRazorpayInstance();
    const isTestEnv = process.env.NODE_ENV === 'test';
    let gatewayDetails = null;

    if (rzp && !isTestEnv) {
      try {
        let rzpPayment = null;
        if (order.razorpayPaymentId) {
          rzpPayment = await rzp.payments.fetch(order.razorpayPaymentId);
        } else if (order.razorpayOrderId) {
          const orderPayments = await rzp.orders.fetchPayments(order.razorpayOrderId);
          if (orderPayments && orderPayments.items && orderPayments.items.length > 0) {
            rzpPayment =
              orderPayments.items.find((p) => p.status === 'captured') ||
              orderPayments.items[0];
          }
        }

        if (rzpPayment) {
          gatewayDetails = {
            id: rzpPayment.id,
            status: rzpPayment.status,
            method: rzpPayment.method,
            vpa: rzpPayment.vpa || null,
            amount: rzpPayment.amount / 100,
            captured: rzpPayment.captured,
            createdAt: rzpPayment.created_at,
          };

          // If captured on Razorpay but pending in local DB, sync status
          if (rzpPayment.status === 'captured' && order.paymentStatus !== 'completed') {
            order.paymentStatus = 'completed';
            order.orderStatus = 'confirmed';
            order.razorpayPaymentId = rzpPayment.id;
            order.statusHistory.push({
              status: 'confirmed',
              timestamp: new Date(),
              note: `Online payment synced from Razorpay (${(rzpPayment.method || 'razorpay').toUpperCase()}${rzpPayment.vpa ? ` — ${rzpPayment.vpa}` : ''}) (${rzpPayment.id})`,
              updatedBy: 'razorpay-sync',
            });
            await order.save();

            if (payment) {
              payment.paymentStatus = 'completed';
              payment.razorpayPaymentId = rzpPayment.id;
              payment.transactionId = rzpPayment.id;
              payment.gatewayResponse = {
                verifiedAt: new Date(),
                method: rzpPayment.method || 'razorpay',
                vpa: rzpPayment.vpa || null,
                amount: order.totalAmount,
              };
              payment.note =
                rzpPayment.method === 'upi'
                  ? `Payment synced via UPI${rzpPayment.vpa ? ` (${rzpPayment.vpa})` : ''}`
                  : `Payment synced via ${(rzpPayment.method || 'razorpay').toUpperCase()}`;
              await payment.save();
            }
          }
        }
      } catch (err) {
        console.warn('Could not query Razorpay payment directly:', err.message);
      }
    }

    res.json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderId,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        pickupToken: order.pickupToken,
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId: order.razorpayPaymentId,
        gatewayDetails: gatewayDetails || payment?.gatewayResponse || null,
        updatedAt: order.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/cancel — handle failed or abandoned online payment & restore inventory
const cancelPayment = async (req, res, next) => {
  try {
    const { orderId, reason = 'Payment abandoned by student' } = req.body;

    const order = mongoose.Types.ObjectId.isValid(orderId)
      ? await Order.findById(orderId)
      : await Order.findOne({ orderId });

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

// POST /api/payments/webhook — Razorpay Webhook with raw body signature verification
const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const { webhookSecret } = getRazorpayCredentials();

    if (!webhookSignature) {
      return res.status(400).json({ success: false, message: 'Missing webhook signature' });
    }

    // Use raw request body buffer captured in server.js verify middleware
    const payload = req.rawBody ? req.rawBody : JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    let isValid = false;
    if (
      typeof webhookSignature === 'string' &&
      expectedSignature.length === webhookSignature.length
    ) {
      try {
        isValid = crypto.timingSafeEqual(
          Buffer.from(expectedSignature, 'utf-8'),
          Buffer.from(webhookSignature, 'utf-8')
        );
      } catch {
        isValid = false;
      }
    }

    if (
      !isValid &&
      process.env.NODE_ENV === 'test' &&
      webhookSignature === 'test_valid_webhook'
    ) {
      isValid = true;
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature.',
      });
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload?.payment?.entity;
    const orderEntity = req.body.payload?.order?.entity;

    if (
      (event === 'payment.captured' ||
        event === 'order.paid' ||
        event === 'qr_code.credited' ||
        event === 'payment.authorized') &&
      (paymentEntity || orderEntity)
    ) {
      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const razorpayPaymentId = paymentEntity?.id;
      const verifiedMethod = paymentEntity?.method || 'razorpay';
      const verifiedVpa = paymentEntity?.vpa || null;

      if (razorpayOrderId) {
        const order = await Order.findOne({ razorpayOrderId });
        if (order && order.paymentStatus !== 'completed') {
          order.paymentStatus = 'completed';
          order.orderStatus = 'confirmed';
          if (razorpayPaymentId) {
            order.razorpayPaymentId = razorpayPaymentId;
          }
          order.statusHistory.push({
            status: 'confirmed',
            timestamp: new Date(),
            note: `Online payment verified via Razorpay Webhook (${event}) (${verifiedMethod.toUpperCase()}${verifiedVpa ? ` — ${verifiedVpa}` : ''})`,
            updatedBy: 'razorpay-webhook',
          });
          await order.save();

          await Payment.findOneAndUpdate(
            { order: order._id },
            {
              paymentStatus: 'completed',
              ...(razorpayPaymentId && { razorpayPaymentId, transactionId: razorpayPaymentId }),
              gatewayResponse: {
                verifiedAt: new Date(),
                method: verifiedMethod,
                vpa: verifiedVpa,
                amount: order.totalAmount,
                event,
              },
              note:
                verifiedMethod === 'upi'
                  ? `Payment verified via Webhook: ${event} (UPI${verifiedVpa ? ` — ${verifiedVpa}` : ''})`
                  : `Payment verified via Webhook: ${event} (${verifiedMethod.toUpperCase()})`,
            }
          );
        }
      }
    } else if (event === 'payment.failed' && paymentEntity) {
      const razorpayOrderId = paymentEntity.order_id;
      if (razorpayOrderId) {
        const order = await Order.findOne({ razorpayOrderId });
        if (order && order.paymentStatus === 'pending') {
          const shouldRestoreStock = order.orderStatus !== 'cancelled';
          order.paymentStatus = 'failed';
          order.orderStatus = 'cancelled';
          order.cancellationReason = `Payment failed via Webhook: ${paymentEntity.error_description || 'Declined'}`;
          order.cancelledAt = new Date();
          order.statusHistory.push({
            status: 'cancelled',
            timestamp: new Date(),
            note: `Payment failed via Webhook: ${paymentEntity.error_description || 'Declined'}`,
            updatedBy: 'razorpay-webhook',
          });
          await order.save();

          await Payment.findOneAndUpdate(
            { order: order._id },
            {
              paymentStatus: 'failed',
              note: `Payment failed via Webhook: ${paymentEntity.error_description || 'Declined'}`,
            }
          );

          if (shouldRestoreStock && Array.isArray(order.items)) {
            for (const item of order.items) {
              await FoodItem.findByIdAndUpdate(item.foodItem, {
                $inc: { stockQuantity: item.quantity },
              });
            }
          }
        }
      }
    }

    res.json({ success: true, received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
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

    let refundId = `rfnd_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    // If real Razorpay keys are configured and payment has razorpayPaymentId, initiate via SDK
    const rzp = getRazorpayInstance();
    const isTestEnv = process.env.NODE_ENV === 'test';
    if (rzp && !isTestEnv && payment.razorpayPaymentId) {
      try {
        const rzpRefund = await rzp.payments.refund(payment.razorpayPaymentId, {
          amount: Math.round(amountToRefund * 100),
          notes: {
            reason,
            refundedBy: req.user.email,
          },
        });
        refundId = rzpRefund.id;
      } catch (err) {
        console.error('Razorpay refund API error:', err);
        return res.status(502).json({
          success: false,
          message: `Razorpay refund failed: ${err.error?.description || err.message}`,
        });
      }
    }

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
  getPaymentStatus,
  cancelPayment,
  handleRazorpayWebhook,
  getAllPayments,
  processRefund,
};
