const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const crypto = require('crypto');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_for_milestone_3_testing_123456';
process.env.ADMIN_SETUP_TOKEN = 'test_admin_setup_token_xyz_2026';
process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_secret_key_2026';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_razorpay_webhook_secret_2026';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/quickbite_test_m3';

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

describe('QuickBite Milestone 3 Test Suite', () => {
  let adminToken, studentToken, studentId;
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
  });

  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  // ─── 1. Admin Authorization & Protected Setup ─────────────────────────────
  test('POST /api/auth/setup-admin — rejects setup with invalid setup token (403)', async () => {
    const res = await request('/api/auth/setup-admin', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Hacker',
        email: 'hacker@campus.edu',
        password: 'Password123!',
        setupToken: 'wrong_setup_token',
      }),
    });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.data.success, false);
  });

  test('POST /api/auth/setup-admin — creates admin account with valid setup token', async () => {
    const res = await request('/api/auth/setup-admin', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Head Administrator',
        email: 'headadmin@quickbite.campus',
        password: 'AdminPassword123!',
        setupToken: 'test_admin_setup_token_xyz_2026',
      }),
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.data.user.role, 'admin');
    assert.ok(res.data.data.token);
    adminToken = res.data.data.token;
  });

  test('POST /api/auth/register — student registration cannot escalate to admin', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Aryan Student',
        email: 'aryan@campus.edu',
        password: 'StudentPassword123!',
        role: 'admin', // Malicious escalation attempt
      }),
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.data.user.role, 'student', 'Role must remain student');
    studentToken = res.data.data.token;
    studentId = res.data.data.user._id;
  });

  test('GET /api/admin/orders — student token gets 403 Forbidden', async () => {
    const res = await request('/api/admin/orders', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(res.status, 403);
  });

  // ─── 2. Food & Category Management CRUD ─────────────────────────────────────
  test('POST /api/admin/categories — admin creates category', async () => {
    const res = await request('/api/admin/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Desserts & Sweets',
        slug: 'desserts',
        icon: '🍰',
        description: 'Mouthwatering sweets',
      }),
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.data.slug, 'desserts');
    testCatId = res.data.data._id;
  });

  test('POST /api/admin/food — admin creates food item with cost price & stock', async () => {
    const res = await request('/api/admin/food', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Gulab Jamun (2 pcs)',
        description: 'Hot syrup gulab jamun',
        category: testCatId,
        sellingPrice: 60,
        costPrice: 25,
        stockQuantity: 20,
        lowStockThreshold: 4,
        isVeg: true,
      }),
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.data.sellingPrice, 60);
    assert.strictEqual(res.data.data.costPrice, 25);
    testFoodId = res.data.data._id;
  });

  test('PUT /api/admin/food/:id — admin updates food item', async () => {
    const res = await request(`/api/admin/food/${testFoodId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        sellingPrice: 70,
        stockQuantity: 25,
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.sellingPrice, 70);
    assert.strictEqual(res.data.data.stockQuantity, 25);
  });

  test('PATCH /api/admin/food/:id/toggle-availability — admin toggles availability', async () => {
    const res = await request(`/api/admin/food/${testFoodId}/toggle-availability`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.isAvailable, false);

    // Toggle back to true
    await request(`/api/admin/food/${testFoodId}/toggle-availability`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  });

  test('DELETE /api/admin/categories/:id — prevents deletion when active items exist', async () => {
    const res = await request(`/api/admin/categories/${testCatId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 400);
    assert.ok(res.data.message.includes('active food item(s) are assigned'));
  });

  // ─── 3. Online Payments with Razorpay (Signatures, Amount & Webhooks) ───────
  let testOrderId, rzpOrderId;
  test('POST /api/payments/create-order — creates Razorpay payment order', async () => {
    // Student places an order
    const orderRes = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        items: [{ foodItemId: testFoodId, quantity: 2 }],
        paymentMethod: 'razorpay',
      }),
    });
    assert.strictEqual(orderRes.status, 201);
    testOrderId = orderRes.data.data._id;

    // Create payment order
    const payRes = await request('/api/payments/create-order', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ orderId: testOrderId }),
    });

    assert.strictEqual(payRes.status, 200);
    assert.strictEqual(payRes.data.success, true);
    assert.ok(payRes.data.data.razorpayOrderId);
    assert.strictEqual(payRes.data.data.amount, 140); // 70 * 2 = 140
    rzpOrderId = payRes.data.data.razorpayOrderId;
  });

  test('POST /api/payments/verify — rejects mismatched payment amount (400)', async () => {
    const fakePaymentId = 'pay_test_mismatch_123';
    const fakeSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${rzpOrderId}|${fakePaymentId}`)
      .digest('hex');

    const res = await request('/api/payments/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        orderId: testOrderId,
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: fakePaymentId,
        razorpaySignature: fakeSignature,
        expectedAmount: 9999, // Mismatched amount!
      }),
    });

    assert.strictEqual(res.status, 400);
    assert.ok(res.data.message.includes('Payment amount mismatch'));
  });

  test('POST /api/payments/verify — rejects forged/invalid HMAC signature (400)', async () => {
    const res = await request('/api/payments/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        orderId: testOrderId,
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: 'pay_test_bad_123',
        razorpaySignature: 'forged_invalid_signature',
      }),
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
  });

  test('POST /api/payments/verify — verifies valid HMAC-SHA256 signature and confirms order', async () => {
    const validPaymentId = 'pay_test_valid_888';
    const validSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${rzpOrderId}|${validPaymentId}`)
      .digest('hex');

    const res = await request('/api/payments/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        orderId: testOrderId,
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: validPaymentId,
        razorpaySignature: validSignature,
        expectedAmount: 140,
      }),
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.paymentStatus, 'completed');
    assert.strictEqual(res.data.data.orderStatus, 'confirmed');

    // Idempotency: verify repeating the call succeeds without duplicate mutation
    const repeatRes = await request('/api/payments/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        orderId: testOrderId,
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: validPaymentId,
        razorpaySignature: validSignature,
      }),
    });
    assert.strictEqual(repeatRes.status, 200);
    assert.strictEqual(repeatRes.data.data.paymentStatus, 'completed');
  });

  test('POST /api/payments/cancel — restores stock when payment fails/abandoned', async () => {
    // Current stock of testFoodId
    const stockBefore = (await FoodItem.findById(testFoodId)).stockQuantity;

    // Student starts an order of 3 items
    const orderRes = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        items: [{ foodItemId: testFoodId, quantity: 3 }],
        paymentMethod: 'razorpay',
      }),
    });
    const orderToAbandon = orderRes.data.data._id;
    assert.strictEqual((await FoodItem.findById(testFoodId)).stockQuantity, stockBefore - 3);

    // Cancel payment
    const cancelRes = await request('/api/payments/cancel', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        orderId: orderToAbandon,
        reason: 'Payment gateway timeout',
      }),
    });

    assert.strictEqual(cancelRes.status, 200);
    assert.strictEqual(cancelRes.data.data.orderStatus, 'cancelled');
    // Stock must be restored
    assert.strictEqual((await FoodItem.findById(testFoodId)).stockQuantity, stockBefore);
  });

  // ─── 4. Order Status Progression & Transitions ──────────────────────────────
  test('PATCH /api/admin/orders/:id/status — enforces valid transitions', async () => {
    // testOrderId is currently confirmed
    // Invalid transition: confirmed directly to completed (must go preparing -> ready_for_pickup)
    const badRes = await request(`/api/admin/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'completed' }),
    });
    assert.strictEqual(badRes.status, 400);
    assert.ok(badRes.data.message.includes('Invalid status transition'));

    // Valid: confirmed -> preparing
    const prepRes = await request(`/api/admin/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'preparing' }),
    });
    assert.strictEqual(prepRes.status, 200);
    assert.strictEqual(prepRes.data.data.orderStatus, 'preparing');

    // Valid: preparing -> ready_for_pickup
    const readyRes = await request(`/api/admin/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'ready_for_pickup' }),
    });
    assert.strictEqual(readyRes.status, 200);
    assert.strictEqual(readyRes.data.data.orderStatus, 'ready_for_pickup');

    // Valid: ready_for_pickup -> completed
    const completeRes = await request(`/api/admin/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'completed' }),
    });
    assert.strictEqual(completeRes.status, 200);
    assert.strictEqual(completeRes.data.data.orderStatus, 'completed');

    // Terminal: completed order cannot be transitioned
    const finalRes = await request(`/api/admin/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'preparing' }),
    });
    assert.strictEqual(finalRes.status, 400);
  });

  // ─── 5. Payment Records & Refund Workflow ───────────────────────────────────
  let refundTestPaymentId;
  test('POST /api/admin/payments/:id/refund — processes refund & prevents duplicate refunds', async () => {
    // Find payment record for completed testOrderId
    const payment = await Payment.findOne({ order: testOrderId });
    assert.ok(payment);
    refundTestPaymentId = payment._id;

    // Process refund
    const refundRes = await request(`/api/admin/payments/${refundTestPaymentId}/refund`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        refundAmount: 140,
        reason: 'Customer complaint about order delay',
      }),
    });

    assert.strictEqual(refundRes.status, 200);
    assert.strictEqual(refundRes.data.data.refundStatus, 'processed');
    assert.strictEqual(refundRes.data.data.refundAmount, 140);

    // Duplicate refund attempt must be rejected (400)
    const dupRes = await request(`/api/admin/payments/${refundTestPaymentId}/refund`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ refundAmount: 140 }),
    });

    assert.strictEqual(dupRes.status, 400);
    assert.ok(dupRes.data.message.includes('already been refunded'));
  });

  // ─── 6. Sales Analytics Aggregations ────────────────────────────────────────
  test('GET /api/admin/analytics — aggregates sales, COGS, gross profit & exclusions', async () => {
    const res = await request('/api/admin/analytics?range=30days', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.summary, 'Summary stats must be present');
    assert.ok(res.data.data.kpis, 'KPIs stats must be present');
    assert.ok(res.data.data.statusCounts, 'statusCounts must be present');
    assert.ok(res.data.data.ordersByStatus, 'ordersByStatus must be present');
    assert.ok(res.data.data.summary.profitLabel.includes('Estimated gross profit'));
    assert.ok(Array.isArray(res.data.data.bestSellingItems));
    assert.ok(Array.isArray(res.data.data.topSellingItems));
    assert.ok(Array.isArray(res.data.data.dailyTimeline));
  });

  // ─── 7. Safe Food Soft-Deletion ─────────────────────────────────────────────
  test('DELETE /api/admin/food/:id — soft deletes item with historical orders', async () => {
    const res = await request(`/api/admin/food/${testFoodId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.softDeleted, true, 'Item with order history must be soft-deleted');

    // Confirm it is excluded from public student menu
    const menuRes = await request('/api/menu');
    const isPresent = menuRes.data.data.foodItems.some(
      (i) => i._id.toString() === testFoodId.toString()
    );
    assert.strictEqual(isPresent, false, 'Soft-deleted item must not show in student menu');
  });
});
