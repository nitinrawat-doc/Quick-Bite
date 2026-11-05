const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const crypto = require('crypto');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_for_razorpay_suite_123456';
process.env.RAZORPAY_KEY_ID = 'rzp_test_suite_key_id';
process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_secret_key_2026';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_razorpay_webhook_secret_2026';
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const rawMongoUri = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI;
if (rawMongoUri && rawMongoUri.includes('mongodb')) {
  const parts = rawMongoUri.split('?');
  const base = parts[0].replace(/\/+$/, '');
  const query = parts[1] ? `?${parts[1]}` : '';
  process.env.MONGODB_URI = `${base}/quickbite_test_razorpay${query}`;
} else {
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/quickbite_test_razorpay';
}

const app = require('../server');
const User = require('../src/models/User');
const FoodItem = require('../src/models/FoodItem');
const Category = require('../src/models/Category');
const Order = require('../src/models/Order');
const Payment = require('../src/models/Payment');

let server;
let baseUrl;

const request = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, headers: res.headers, data };
};

describe('QuickBite Razorpay Secure Payment Integration Suite', () => {
  let student1Token, student1Id;
  let student2Token, student2Id;
  let testCatId, testFoodId;

  before(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    await Promise.all([
      User.deleteMany({}),
      FoodItem.deleteMany({}),
      Category.deleteMany({}),
      Order.deleteMany({}),
      Payment.deleteMany({}),
    ]);

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    // Register Student 1
    const s1Res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Rohan Sharma',
        email: 'rohan@campus.edu',
        password: 'Password123!',
      }),
    });
    assert.strictEqual(s1Res.status, 201);
    student1Token = s1Res.data.data.token;
    student1Id = s1Res.data.data.user._id;

    // Register Student 2
    const s2Res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Priya Patel',
        email: 'priya@campus.edu',
        password: 'Password123!',
      }),
    });
    assert.strictEqual(s2Res.status, 201);
    student2Token = s2Res.data.data.token;
    student2Id = s2Res.data.data.user._id;

    // Seed category and food item
    const cat = await Category.create({
      name: 'Meals & Bowls',
      slug: 'meals',
      icon: '🍛',
      description: 'Hot campus lunch meals',
    });
    testCatId = cat._id;

    const food = await FoodItem.create({
      name: 'Paneer Rice Bowl',
      description: 'Fresh paneer curry with aromatic basmati rice',
      category: testCatId,
      sellingPrice: 120,
      costPrice: 50,
      stockQuantity: 30,
      lowStockThreshold: 5,
      isVeg: true,
      isAvailable: true,
    });
    testFoodId = food._id;
  });

  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  // ─── 1. Pay at Pickup Flow Remains Fully Functional ─────────────────────────
  test('Pay at Pickup — preserves cash/UPI at counter flow without online gateway', async () => {
    const stockBefore = (await FoodItem.findById(testFoodId)).stockQuantity;

    const res = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        items: [{ foodItemId: testFoodId, quantity: 2 }],
        paymentMethod: 'pay_at_pickup',
        specialInstructions: 'Make it spicy',
      }),
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.paymentMethod, 'pay_at_pickup');
    assert.strictEqual(res.data.data.paymentStatus, 'pending');
    assert.strictEqual(res.data.data.orderStatus, 'pending');
    assert.strictEqual(res.data.data.totalAmount, 240);
    assert.ok(res.data.data.pickupToken);

    // Stock deducted accurately
    const stockAfter = (await FoodItem.findById(testFoodId)).stockQuantity;
    assert.strictEqual(stockAfter, stockBefore - 2);

    // Payment record created with pay_at_pickup
    const payment = await Payment.findOne({ order: res.data.data._id });
    assert.ok(payment);
    assert.strictEqual(payment.paymentMethod, 'pay_at_pickup');
    assert.strictEqual(payment.paymentStatus, 'pending');
  });

  // ─── 2. Security: Authentication & Ownership Verification ───────────────────
  let onlineOrderId;
  test('POST /api/payments/create-order — rejects unauthenticated request (401)', async () => {
    const res = await request('/api/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ orderId: 'some_order_id' }),
    });
    assert.strictEqual(res.status, 401);
  });

  test('POST /api/payments/create-order — prevents cross-user payment initialization (403)', async () => {
    // Student 1 creates an online order
    const orderRes = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        items: [{ foodItemId: testFoodId, quantity: 1 }],
        paymentMethod: 'razorpay',
      }),
    });
    assert.strictEqual(orderRes.status, 201);
    onlineOrderId = orderRes.data.data._id;

    // Student 2 attempts to initialize payment for Student 1's order
    const payRes = await request('/api/payments/create-order', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student2Token}` },
      body: JSON.stringify({ orderId: onlineOrderId }),
    });
    assert.strictEqual(payRes.status, 403);
    assert.ok(payRes.data.message.includes('Forbidden') || payRes.data.message.includes('own'));
  });

  // ─── 3. Razorpay Order Creation & Secret Non-Leakage ────────────────────────
  let rzpOrderId;
  test('POST /api/payments/create-order — creates gateway order without exposing Key Secret', async () => {
    const res = await request('/api/payments/create-order', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({ orderId: onlineOrderId }),
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.razorpayOrderId);
    assert.strictEqual(res.data.data.amount, 120);
    assert.strictEqual(res.data.data.amountInPaise, 12000);
    assert.strictEqual(res.data.data.currency, 'INR');
    assert.strictEqual(res.data.data.keyId, process.env.RAZORPAY_KEY_ID);

    // SECURITY CHECK: Key Secret MUST NEVER be returned in response body
    assert.strictEqual(res.data.data.keySecret, undefined);
    assert.strictEqual(JSON.stringify(res.data).includes(process.env.RAZORPAY_KEY_SECRET), false);

    rzpOrderId = res.data.data.razorpayOrderId;

    // Check DB persistence
    const updatedOrder = await Order.findById(onlineOrderId);
    assert.strictEqual(updatedOrder.razorpayOrderId, rzpOrderId);
    assert.strictEqual(updatedOrder.paymentMethod, 'razorpay');
  });

  // ─── 4. Security: Amount Tampering, Forged Signatures & ID Mismatch ─────────
  test('POST /api/payments/verify — rejects mismatched/tampered amount (400)', async () => {
    const fakePaymentId = 'pay_test_tampered_001';
    const fakeSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${rzpOrderId}|${fakePaymentId}`)
      .digest('hex');

    const res = await request('/api/payments/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        orderId: onlineOrderId,
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: fakePaymentId,
        razorpaySignature: fakeSignature,
        expectedAmount: 1, // Tampered amount (expected 120)
      }),
    });

    assert.strictEqual(res.status, 400);
    assert.ok(res.data.message.includes('mismatch'));
  });

  test('POST /api/payments/verify — rejects invalid/forged signature (400)', async () => {
    const res = await request('/api/payments/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        orderId: onlineOrderId,
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: 'pay_test_forged_999',
        razorpaySignature: '38a8e38d727b4e99f43a992bc9837a2f1c84918e90a6f81e8fbcda98a39e8312',
      }),
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
    assert.ok(res.data.message.includes('Invalid payment signature'));
  });

  test('POST /api/payments/verify — rejects Razorpay Order ID mismatch for this order (400)', async () => {
    const foreignRzpOrderId = 'order_rzp_foreign_12345678_999';
    const fakePaymentId = 'pay_test_foreign_001';
    const foreignSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${foreignRzpOrderId}|${fakePaymentId}`)
      .digest('hex');

    const res = await request('/api/payments/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        orderId: onlineOrderId,
        razorpayOrderId: foreignRzpOrderId, // Does not match onlineOrderId's stored razorpayOrderId!
        razorpayPaymentId: fakePaymentId,
        razorpaySignature: foreignSig,
      }),
    });

    assert.strictEqual(res.status, 400);
    assert.ok(res.data.message.includes('Razorpay Order ID mismatch'));
  });

  test('POST /api/payments/verify — rejects cross-student verification attempt (403)', async () => {
    const validPaymentId = 'pay_test_cross_001';
    const validSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${rzpOrderId}|${validPaymentId}`)
      .digest('hex');

    const res = await request('/api/payments/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student2Token}` }, // Student 2 trying to verify Student 1's order
      body: JSON.stringify({
        orderId: onlineOrderId,
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: validPaymentId,
        razorpaySignature: validSig,
      }),
    });

    assert.strictEqual(res.status, 403);
  });

  // ─── 5. Successful Signature Verification & Status Transitions ──────────────
  let validPaymentId;
  test('POST /api/payments/verify — verifies valid HMAC-SHA256 signature and confirms order', async () => {
    validPaymentId = `pay_rzp_valid_${Date.now()}`;
    const validSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${rzpOrderId}|${validPaymentId}`)
      .digest('hex');

    const res = await request('/api/payments/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        orderId: onlineOrderId,
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: validPaymentId,
        razorpaySignature: validSignature,
        expectedAmount: 120,
      }),
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.paymentStatus, 'completed');
    assert.strictEqual(res.data.data.orderStatus, 'confirmed');
    assert.strictEqual(res.data.data.razorpayPaymentId, validPaymentId);

    // Verify Payment document in DB
    const payment = await Payment.findOne({ order: onlineOrderId });
    assert.strictEqual(payment.paymentStatus, 'completed');
    assert.strictEqual(payment.razorpayPaymentId, validPaymentId);
    assert.strictEqual(payment.transactionId, validPaymentId);
  });

  // ─── 6. Idempotency & Duplicate Callback Protection ─────────────────────────
  test('POST /api/payments/verify — handles duplicate verification calls idempotently', async () => {
    const validSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${rzpOrderId}|${validPaymentId}`)
      .digest('hex');

    // Repeated call with same parameters
    const repeatRes = await request('/api/payments/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        orderId: onlineOrderId,
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: validPaymentId,
        razorpaySignature: validSignature,
      }),
    });

    assert.strictEqual(repeatRes.status, 200);
    assert.strictEqual(repeatRes.data.data.paymentStatus, 'completed');
    assert.ok(repeatRes.data.message.includes('already been verified'));
  });

  // ─── 7. Payment Status Query Endpoint ───────────────────────────────────────
  test('GET /api/payments/:orderId/status — returns verified payment and order details', async () => {
    const res = await request(`/api/payments/${onlineOrderId}/status`, {
      headers: { Authorization: `Bearer ${student1Token}` },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.paymentStatus, 'completed');
    assert.strictEqual(res.data.data.orderStatus, 'confirmed');
    assert.strictEqual(res.data.data.razorpayPaymentId, validPaymentId);
    assert.strictEqual(res.data.data.totalAmount, 120);
    assert.ok(res.data.data.pickupToken);
  });

  test('GET /api/payments/:orderId/status — rejects cross-student status inquiry (403)', async () => {
    const res = await request(`/api/payments/${onlineOrderId}/status`, {
      headers: { Authorization: `Bearer ${student2Token}` },
    });
    assert.strictEqual(res.status, 403);
  });

  // ─── 8. Cancel Payment & Safe Inventory Restoration ────────────────────────
  test('POST /api/payments/cancel — cancels pending payment & safely restores inventory', async () => {
    const stockBefore = (await FoodItem.findById(testFoodId)).stockQuantity;

    // Student 1 starts an online order for 4 items
    const orderRes = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        items: [{ foodItemId: testFoodId, quantity: 4 }],
        paymentMethod: 'razorpay',
      }),
    });
    assert.strictEqual(orderRes.status, 201);
    const abandonOrderId = orderRes.data.data._id;

    // Stock deducted by 4
    assert.strictEqual((await FoodItem.findById(testFoodId)).stockQuantity, stockBefore - 4);

    // Student closes payment modal or dismisses checkout
    const cancelRes = await request('/api/payments/cancel', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        orderId: abandonOrderId,
        reason: 'User cancelled payment modal',
      }),
    });

    assert.strictEqual(cancelRes.status, 200);
    assert.strictEqual(cancelRes.data.data.orderStatus, 'cancelled');
    assert.strictEqual(cancelRes.data.data.paymentStatus, 'failed');

    // Stock must be exactly restored back to stockBefore
    const stockAfter = (await FoodItem.findById(testFoodId)).stockQuantity;
    assert.strictEqual(stockAfter, stockBefore);

    // Repeated cancel request should not double restore stock
    const repeatCancelRes = await request('/api/payments/cancel', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        orderId: abandonOrderId,
        reason: 'Repeated cancel',
      }),
    });
    assert.strictEqual(repeatCancelRes.status, 200);
    assert.strictEqual((await FoodItem.findById(testFoodId)).stockQuantity, stockBefore);
  });

  // ─── 9. Webhook Signature Verification with Raw Body ────────────────────────
  test('POST /api/payments/webhook — rejects missing or invalid webhook signature (400)', async () => {
    const res = await request('/api/payments/webhook', {
      method: 'POST',
      headers: { 'x-razorpay-signature': 'bad_webhook_sig' },
      body: JSON.stringify({ event: 'payment.captured' }),
    });
    assert.strictEqual(res.status, 400);
  });

  test('POST /api/payments/webhook — verifies valid HMAC webhook and confirms order', async () => {
    // Create new order to be paid via webhook
    const orderRes = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        items: [{ foodItemId: testFoodId, quantity: 1 }],
        paymentMethod: 'razorpay',
      }),
    });
    const webhookTestOrderId = orderRes.data.data._id;

    const payOrderRes = await request('/api/payments/create-order', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({ orderId: webhookTestOrderId }),
    });
    const webhookRzpOrderId = payOrderRes.data.data.razorpayOrderId;

    const webhookPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_webhook_live_777',
            order_id: webhookRzpOrderId,
            amount: 12000,
            status: 'captured',
          },
        },
      },
    });

    const validWebhookSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(webhookPayload)
      .digest('hex');

    const webhookRes = await request('/api/payments/webhook', {
      method: 'POST',
      headers: {
        'x-razorpay-signature': validWebhookSig,
      },
      body: webhookPayload,
    });

    assert.strictEqual(webhookRes.status, 200);
    assert.strictEqual(webhookRes.data.received, true);

    // Confirm order was verified
    const verifiedOrder = await Order.findById(webhookTestOrderId);
    assert.strictEqual(verifiedOrder.paymentStatus, 'completed');
    assert.strictEqual(verifiedOrder.orderStatus, 'confirmed');
    assert.strictEqual(verifiedOrder.razorpayPaymentId, 'pay_webhook_live_777');
  });

  // ─── 10. Scenario Tests: Unpaid Persistence, Rejection Safety & Retry Isolation
  test('Pending Order Persistence — page refresh/repeated status checks never convert unpaid order to paid', async () => {
    // Create online order in pending status
    const orderRes = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        items: [{ foodItemId: testFoodId, quantity: 2 }],
        paymentMethod: 'razorpay',
      }),
    });
    const pendingId = orderRes.data.data._id;

    // Initialize payment
    await request('/api/payments/create-order', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({ orderId: pendingId }),
    });

    // Query status repeatedly (simulating frontend polling / page refreshes)
    for (let i = 0; i < 3; i++) {
      const statusRes = await request(`/api/payments/${pendingId}/status`, {
        headers: { Authorization: `Bearer ${student1Token}` },
      });
      assert.strictEqual(statusRes.status, 200);
      assert.strictEqual(statusRes.data.data.paymentStatus, 'pending');
      assert.strictEqual(statusRes.data.data.orderStatus, 'pending');
    }

    // Verify DB directly
    const dbOrder = await Order.findById(pendingId);
    assert.strictEqual(dbOrder.paymentStatus, 'pending');
    assert.strictEqual(dbOrder.orderStatus, 'pending');
  });

  test('Retry Isolation — cancelling abandoned payment and reordering prevents double stock deductions', async () => {
    const stockStart = (await FoodItem.findById(testFoodId)).stockQuantity;

    // 1st attempt: Student orders 3 items
    const firstOrderRes = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        items: [{ foodItemId: testFoodId, quantity: 3 }],
        paymentMethod: 'razorpay',
      }),
    });
    const firstOrderId = firstOrderRes.data.data._id;
    assert.strictEqual((await FoodItem.findById(testFoodId)).stockQuantity, stockStart - 3);

    // Student cancels/dismisses checkout modal
    const cancelRes = await request('/api/payments/cancel', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        orderId: firstOrderId,
        reason: 'Superseded by new payment attempt',
      }),
    });
    assert.strictEqual(cancelRes.status, 200);

    // Stock immediately restored
    assert.strictEqual((await FoodItem.findById(testFoodId)).stockQuantity, stockStart);

    // 2nd attempt (Retry): Student places order again
    const retryOrderRes = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        items: [{ foodItemId: testFoodId, quantity: 3 }],
        paymentMethod: 'razorpay',
      }),
    });
    assert.strictEqual(retryOrderRes.status, 201);
    const retryOrderId = retryOrderRes.data.data._id;

    // Stock is cleanly deducted only once for the active order
    assert.strictEqual((await FoodItem.findById(testFoodId)).stockQuantity, stockStart - 3);

    // Verify 1st order remains cancelled and 2nd is pending
    const order1 = await Order.findById(firstOrderId);
    const order2 = await Order.findById(retryOrderId);
    assert.strictEqual(order1.orderStatus, 'cancelled');
    assert.strictEqual(order2.orderStatus, 'pending');
    assert.strictEqual(order2.paymentStatus, 'pending');
  });

  test('Forged Verification Attempt — invalid signature keeps payment status pending and cart is not cleared', async () => {
    const orderRes = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        items: [{ foodItemId: testFoodId, quantity: 1 }],
        paymentMethod: 'razorpay',
      }),
    });
    const testOid = orderRes.data.data._id;

    const payRes = await request('/api/payments/create-order', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({ orderId: testOid }),
    });
    const rzpOid = payRes.data.data.razorpayOrderId;

    // Send forged signature
    const verifyRes = await request('/api/payments/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        orderId: testOid,
        razorpayOrderId: rzpOid,
        razorpayPaymentId: 'pay_attacker_attempt_999',
        razorpaySignature: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      }),
    });

    assert.strictEqual(verifyRes.status, 400);
    assert.strictEqual(verifyRes.data.success, false);

    // Order must NOT be marked completed
    const orderCheck = await Order.findById(testOid);
    assert.notStrictEqual(orderCheck.paymentStatus, 'completed');
    assert.notStrictEqual(orderCheck.orderStatus, 'confirmed');
  });

  test('UPI Payment Verification — verifies valid HMAC-SHA256 signature for UPI flow and records UPI method & VPA', async () => {
    const orderRes = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        items: [{ foodItemId: testFoodId, quantity: 2 }],
        paymentMethod: 'razorpay',
      }),
    });
    assert.strictEqual(orderRes.status, 201);
    const orderId = orderRes.data.data._id;

    const payRes = await request('/api/payments/create-order', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({ orderId }),
    });
    assert.strictEqual(payRes.status, 200);
    const razorpayOrderId = payRes.data.data.razorpayOrderId;
    const razorpayPaymentId = `pay_upi_test_${Date.now()}`;

    // Compute valid HMAC-SHA256 signature
    const signaturePayload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const validSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(signaturePayload)
      .digest('hex');

    // Verify payment with UPI method and VPA
    const verifyRes = await request('/api/payments/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: validSignature,
        expectedAmount: payRes.data.data.amount,
        method: 'upi',
        vpa: 'student@okaxis',
      }),
    });

    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyRes.data.success, true);
    assert.strictEqual(verifyRes.data.data.paymentStatus, 'completed');
    assert.strictEqual(verifyRes.data.data.orderStatus, 'confirmed');

    // Verify Order status history contains UPI reference
    const updatedOrder = await Order.findById(orderId);
    const lastHistory = updatedOrder.statusHistory[updatedOrder.statusHistory.length - 1];
    assert.ok(lastHistory.note.includes('UPI'));

    // Verify Payment document has method and VPA in gatewayResponse
    const paymentDoc = await Payment.findOne({ order: orderId });
    assert.strictEqual(paymentDoc.paymentStatus, 'completed');
    assert.strictEqual(paymentDoc.gatewayResponse.method, 'upi');
    assert.strictEqual(paymentDoc.gatewayResponse.vpa, 'student@okaxis');
    assert.strictEqual(paymentDoc.note, 'Payment verified successfully via UPI');
  });
});


