const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_m4_suite_2026';
process.env.ADMIN_SETUP_SECRET = 'm4_test_setup_secret_key';
process.env.RAZORPAY_KEY_ID = 'rzp_test_m4_sandbox';
process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_secret_m4';
process.env.CLIENT_URL = 'http://localhost:5173,http://localhost:3000';

const app = require('../server');
const User = require('../src/models/User');
const FoodItem = require('../src/models/FoodItem');
const Category = require('../src/models/Category');
const Order = require('../src/models/Order');
const Payment = require('../src/models/Payment');

const TEST_DB_URI =
  process.env.TEST_MONGODB_URI ||
  'mongodb://127.0.0.1:27017/quickbite_m4_qa_test';

let server;
let serverPort;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const opt = {
      hostname: '127.0.0.1',
      port: serverPort,
      path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(opt, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch {
          parsed = body;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

describe('QuickBite Milestone 4 — Final QA, Security & Polish Suite', () => {
  let studentToken;
  let adminToken;
  let studentUser;
  let adminUser;
  let testCategory;
  let testFood;

  before(async () => {
    await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 5000 });
    await mongoose.connection.dropDatabase();

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        serverPort = server.address().port;
        resolve();
      });
    });

    // Seed test Category & Food
    testCategory = await Category.create({
      name: 'QA Healthy Bites',
      slug: 'qa-healthy',
      icon: '🥗',
    });

    testFood = await FoodItem.create({
      name: 'Superfood Salad Bowl',
      description: 'Avocado, quinoa, fresh greens',
      category: testCategory._id,
      sellingPrice: 180,
      costPrice: 90,
      stockQuantity: 15,
      lowStockThreshold: 3,
      isAvailable: true,
      isVeg: true,
    });
  });

  after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    if (server) await new Promise((res) => server.close(res));
  });

  // ─── 1. System Health Check & CORS ──────────────────────────────────────────
  test('GET /health & /api/health — reports healthy uptime and database connection', async () => {
    const resRoot = await request('/health');
    assert.strictEqual(resRoot.status, 200);
    assert.strictEqual(resRoot.data.success, true);
    assert.strictEqual(resRoot.data.status, 'healthy');
    assert.strictEqual(resRoot.data.database, 'connected');
    assert.ok(typeof resRoot.data.uptimeSeconds === 'number');

    const resApi = await request('/api/health');
    assert.strictEqual(resApi.status, 200);
    assert.strictEqual(resApi.data.status, 'healthy');
  });

  // ─── 2. Auth & Privilege Escalation Resistance ─────────────────────────────
  test('POST /api/auth/setup-admin — accepts ADMIN_SETUP_SECRET token', async () => {
    const res = await request('/api/auth/setup-admin', {
      method: 'POST',
      body: JSON.stringify({
        name: 'QA Head Admin',
        email: 'qa.admin@quickbite.test',
        password: 'AdminPassword123!',
        setupToken: 'm4_test_setup_secret_key',
      }),
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.data.user.role, 'admin');
    adminToken = res.data.data.token;
    adminUser = res.data.data.user;
  });

  test('POST /api/auth/register — rejects role tampering from student signup', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Student QA',
        email: 'student.qa@quickbite.test',
        password: 'Password123!',
        role: 'admin', // Malicious attempt to escalate
      }),
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.data.user.role, 'student'); // Must remain student
    studentToken = res.data.data.token;
    studentUser = res.data.data.user;
  });

  test('GET /api/admin/orders — rejects student token with 403 Forbidden', async () => {
    const res = await request('/api/admin/orders', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.data.success, false);
  });

  test('GET /api/auth/me — rejects expired or tampered JWT with 401', async () => {
    // Generate an expired token
    const expiredToken = jwt.sign(
      { id: studentUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const res = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });

    assert.strictEqual(res.status, 401);
    assert.ok(res.data.message.includes('expired'));
  });

  test('GET /api/menu/:id — handles invalid MongoDB ObjectId gracefully with 400', async () => {
    const res = await request('/api/menu/not-a-valid-object-id-12345');
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
    assert.ok(res.data.message.includes('Invalid'));
  });

  test('POST /api/orders — rejects negative quantity and float values with 400', async () => {
    const resFloat = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        items: [{ foodItemId: testFood._id.toString(), quantity: 1.5 }],
      }),
    });
    assert.strictEqual(resFloat.status, 400);

    const resNegative = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        items: [{ foodItemId: testFood._id.toString(), quantity: -2 }],
      }),
    });
    assert.strictEqual(resNegative.status, 400);
  });

  // ─── 4. Order Lifecycle & Payment Sync on Cancellation ──────────────────────
  let testOrderId;

  test('POST /api/orders — creates order, reserves inventory and creates Payment record', async () => {
    const initialStock = (await FoodItem.findById(testFood._id)).stockQuantity;

    const res = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        items: [{ foodItemId: testFood._id.toString(), quantity: 3 }],
        paymentMethod: 'pay_at_pickup',
      }),
    });

    assert.strictEqual(res.status, 201);
    testOrderId = res.data.data._id;
    assert.strictEqual(res.data.data.totalAmount, 540); // 180 * 3

    // Check inventory was decremented
    const updatedStock = (await FoodItem.findById(testFood._id)).stockQuantity;
    assert.strictEqual(updatedStock, initialStock - 3);

    // Check Payment record was created in pending state
    const payment = await Payment.findOne({ order: testOrderId });
    assert.ok(payment);
    assert.strictEqual(payment.paymentStatus, 'pending');
  });

  test('PATCH /api/orders/:id/cancel — restores stock and synchronizes Payment status', async () => {
    const initialStock = (await FoodItem.findById(testFood._id)).stockQuantity;

    const res = await request(`/api/orders/${testOrderId}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ reason: 'QA Cancellation Test' }),
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.orderStatus, 'cancelled');

    // Stock should be restored
    const restoredStock = (await FoodItem.findById(testFood._id)).stockQuantity;
    assert.strictEqual(restoredStock, initialStock + 3);

    // Payment record should be synchronized to failed
    const payment = await Payment.findOne({ order: testOrderId });
    assert.strictEqual(payment.paymentStatus, 'failed');
    assert.ok(payment.note.includes('QA Cancellation Test'));
  });

  test('PATCH /api/orders/:id/cancel — prevents double cancellation and double stock restoration', async () => {
    const stockBefore = (await FoodItem.findById(testFood._id)).stockQuantity;

    const res = await request(`/api/orders/${testOrderId}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ reason: 'Attempt double cancel' }),
    });

    assert.strictEqual(res.status, 400);

    const stockAfter = (await FoodItem.findById(testFood._id)).stockQuantity;
    assert.strictEqual(stockAfter, stockBefore); // Stock unchanged
  });

  // ─── 5. Admin Soft Delete Safeguard ────────────────────────────────────────
  test('DELETE /api/admin/food/:id — soft-deletes item preserving historical order references', async () => {
    const res = await request(`/api/admin/food/${testFood._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.isSoftDeleted, true);

    // Verify it is hidden from student menu
    const menuRes = await request('/api/menu');
    const itemInMenu = menuRes.data.data.foodItems.find(
      (i) => i._id.toString() === testFood._id.toString()
    );
    assert.strictEqual(itemInMenu, undefined);

    // But historical order item snapshot still exists
    const orderDoc = await Order.findById(testOrderId);
    assert.ok(orderDoc.items.length > 0);
    assert.strictEqual(orderDoc.items[0].name, 'Superfood Salad Bowl');
  });
});
