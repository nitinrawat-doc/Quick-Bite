const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_for_milestone_2_testing_123456';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/quickbite_test';

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

describe('QuickBite Milestone 2 Test Suite', () => {
  let student1Token, student1Id;
  let student2Token, student2Id;
  let testCategory, testFoodItem1, testFoodItem2;

  before(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    // Clean test database
    await Promise.all([
      User.deleteMany({}),
      FoodItem.deleteMany({}),
      Category.deleteMany({}),
      Order.deleteMany({}),
      Payment.deleteMany({}),
    ]);

    // Start HTTP server on random available port
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    // Seed test category and items
    testCategory = await Category.create({
      name: 'Burgers',
      slug: 'burgers',
      description: 'Juicy burgers',
      icon: '🍔',
    });

    testFoodItem1 = await FoodItem.create({
      name: 'Super Cheesy Smash Burger',
      description: 'Double patty melted cheese',
      category: testCategory._id,
      sellingPrice: 199,
      costPrice: 90,
      stockQuantity: 10,
      isAvailable: true,
      isVeg: false,
    });

    testFoodItem2 = await FoodItem.create({
      name: 'Paneer Loaded Wrap',
      description: 'Fresh grilled cottage cheese',
      category: testCategory._id,
      sellingPrice: 149,
      costPrice: 60,
      stockQuantity: 2,
      isAvailable: true,
      isVeg: true,
    });
  });

  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  // ─── 1. Authentication Tests ────────────────────────────────────────────────
  test('POST /api/auth/register — registers a student user and returns JWT', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Rahul Sharma',
        email: 'Rahul.Sharma@Campus.edu',
        password: 'Password123!',
        phone: '9876543210',
      }),
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.token, 'JWT token should be returned');
    assert.strictEqual(res.data.data.user.email, 'rahul.sharma@campus.edu', 'Email must be normalized to lowercase');
    assert.strictEqual(res.data.data.user.role, 'student');
    assert.strictEqual(res.data.data.user.password, undefined, 'Password hash must never be in response');

    student1Token = res.data.data.token;
    student1Id = res.data.data.user._id;

    // Verify in DB that password was hashed
    const dbUser = await User.findById(student1Id).select('+password');
    assert.ok(dbUser.password.startsWith('$2'), 'Password should be hashed with bcrypt');
  });

  test('POST /api/auth/register — enforces student role and ignores requested admin role', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Sneha Patel',
        email: 'sneha@campus.edu',
        password: 'Password123!',
        role: 'admin', // Malicious attempt to register as admin
      }),
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.data.user.role, 'student', 'Role must remain student');

    student2Token = res.data.data.token;
    student2Id = res.data.data.user._id;
  });

  test('POST /api/auth/register — rejects duplicate email registration with 409', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Rahul Duplicate',
        email: 'rahul.sharma@campus.edu',
        password: 'AnotherPassword!',
      }),
    });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.data.success, false);
    assert.ok(res.data.message.includes('already exists'));
  });

  test('POST /api/auth/register — validates short passwords (< 6 chars)', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Short PW',
        email: 'short@campus.edu',
        password: '123',
      }),
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
  });

  test('POST /api/auth/login — authenticates valid credentials', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'rahul.sharma@campus.edu',
        password: 'Password123!',
      }),
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.token);
    assert.strictEqual(res.data.data.user.email, 'rahul.sharma@campus.edu');
    assert.strictEqual(res.data.data.user.password, undefined);
  });

  test('POST /api/auth/login — rejects invalid password with 401', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'rahul.sharma@campus.edu',
        password: 'WrongPassword!',
      }),
    });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  test('GET /api/auth/me — rejects unauthenticated request with 401', async () => {
    const res = await request('/api/auth/me');
    assert.strictEqual(res.status, 401);
  });

  test('GET /api/auth/me — returns current student profile with valid token', async () => {
    const res = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${student1Token}` },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.user.name, 'Rahul Sharma');
    assert.strictEqual(res.data.data.user.email, 'rahul.sharma@campus.edu');
  });

  // ─── 2. Menu Retrieval & Filtering Tests ────────────────────────────────────
  test('GET /api/menu — returns categories and items', async () => {
    const res = await request('/api/menu');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.categories.length >= 1);
    assert.ok(res.data.data.foodItems.length >= 2);
  });

  test('GET /api/menu?category=burgers — filters items by category slug', async () => {
    const res = await request('/api/menu?category=burgers');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.foodItems.length, 2);
  });

  test('GET /api/menu?search=Paneer — searches items by text query', async () => {
    const res = await request('/api/menu?search=Paneer');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.foodItems.length, 1);
    assert.strictEqual(res.data.data.foodItems[0].name, 'Paneer Loaded Wrap');
  });

  // ─── 3. Checkout, Pricing & Inventory Tests ─────────────────────────────────
  test('POST /api/orders — rejects empty cart checkout with 400', async () => {
    const res = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({ items: [] }),
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
  });

  test('POST /api/orders — rejects invalid or negative quantity with 400', async () => {
    const res = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        items: [{ foodItemId: testFoodItem1._id.toString(), quantity: -2 }],
      }),
    });

    assert.strictEqual(res.status, 400);
  });

  test('POST /api/orders — recalculates prices on server (ignoring client-tampered price)', async () => {
    const res = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        items: [
          {
            foodItemId: testFoodItem1._id.toString(),
            quantity: 2,
            sellingPrice: 1, // Client tries to spoof 1 rupee!
          },
        ],
        paymentMethod: 'pay_at_pickup',
      }),
    });

    assert.strictEqual(res.status, 201);
    const order = res.data.data;
    // Server price is 199 * 2 = 398
    assert.strictEqual(order.subtotal, 398, 'Server must calculate true subtotal');
    assert.strictEqual(order.totalAmount, 398, 'Server must calculate true total');
    assert.strictEqual(order.items[0].unitPrice, 199);
    assert.strictEqual(order.orderStatus, 'pending');
    assert.ok(order.pickupToken, 'Pickup token must be present');
    assert.strictEqual(order.paymentStatus, 'pending');

    // Verify inventory was decremented atomically: was 10, minus 2 = 8
    const updatedItem = await FoodItem.findById(testFoodItem1._id);
    assert.strictEqual(updatedItem.stockQuantity, 8, 'Stock must decrease by 2');
  });

  test('POST /api/orders — rejects order when requested quantity exceeds inventory', async () => {
    // testFoodItem2 has stockQuantity = 2
    const res = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        items: [{ foodItemId: testFoodItem2._id.toString(), quantity: 5 }],
      }),
    });

    assert.strictEqual(res.status, 400);
    assert.ok(res.data.message.includes('Insufficient stock'));

    // Verify stock remains untouched at 2
    const item = await FoodItem.findById(testFoodItem2._id);
    assert.strictEqual(item.stockQuantity, 2);
  });

  test('POST /api/orders — handles concurrent ordering and prevents overselling', async () => {
    // testFoodItem2 has 2 in stock.
    // Try to run two concurrent orders of 2 items each at the exact same instant
    const [res1, res2] = await Promise.all([
      request('/api/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${student1Token}` },
        body: JSON.stringify({
          items: [{ foodItemId: testFoodItem2._id.toString(), quantity: 2 }],
        }),
      }),
      request('/api/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${student2Token}` },
        body: JSON.stringify({
          items: [{ foodItemId: testFoodItem2._id.toString(), quantity: 2 }],
        }),
      }),
    ]);

    // Exactly one should succeed (201) and one should fail (400)
    const successCount = [res1, res2].filter((r) => r.status === 201).length;
    const failCount = [res1, res2].filter((r) => r.status === 400).length;

    assert.strictEqual(successCount, 1, 'Only one concurrent order should succeed');
    assert.strictEqual(failCount, 1, 'Second concurrent order should be rejected due to stock');

    // Final stock should be 0
    const finalItem = await FoodItem.findById(testFoodItem2._id);
    assert.strictEqual(finalItem.stockQuantity, 0);
  });

  // ─── 4. Order History & Ownership Tests ─────────────────────────────────────
  let createdOrder;
  test('GET /api/orders — student only sees their own orders', async () => {
    // Student 1 places an order
    const placeRes = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        items: [{ foodItemId: testFoodItem1._id.toString(), quantity: 1 }],
      }),
    });
    createdOrder = placeRes.data.data;

    // Student 1 fetches their orders
    const s1Res = await request('/api/orders', {
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    assert.strictEqual(s1Res.status, 200);
    assert.ok(s1Res.data.data.orders.length >= 1);
    assert.ok(s1Res.data.data.orders.every((o) => o.user.toString() === student1Id.toString()));

    // Student 2 fetches their orders
    const s2Res = await request('/api/orders', {
      headers: { Authorization: `Bearer ${student2Token}` },
    });
    assert.strictEqual(s2Res.status, 200);
    // Student 2's order list must not contain Student 1's createdOrder
    const hasS1Order = s2Res.data.data.orders.some((o) => o.orderId === createdOrder.orderId);
    assert.strictEqual(hasS1Order, false, 'Student 2 must not see Student 1 orders in history');
  });

  test('GET /api/orders/:id — enforces ownership and rejects cross-student access with 403', async () => {
    // Student 2 tries to view Student 1's order
    const res = await request(`/api/orders/${createdOrder._id}`, {
      headers: { Authorization: `Bearer ${student2Token}` },
    });

    assert.strictEqual(res.status, 403, 'Cross-user order access must be forbidden');
    assert.strictEqual(res.data.success, false);
  });

  test('GET /api/orders/:id — allows owner to view order details', async () => {
    const res = await request(`/api/orders/${createdOrder._id}`, {
      headers: { Authorization: `Bearer ${student1Token}` },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.orderId, createdOrder.orderId);
    assert.strictEqual(res.data.data.pickupCounter, 'Main Canteen Counter #2');
  });

  // ─── 5. Cancellation & Stock Restoration Tests ──────────────────────────────
  test('PATCH /api/orders/:id/cancel — rejects cross-student cancellation with 403', async () => {
    const res = await request(`/api/orders/${createdOrder._id}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${student2Token}` },
      body: JSON.stringify({ reason: 'Malicious cancellation' }),
    });

    assert.strictEqual(res.status, 403);
  });

  test('PATCH /api/orders/:id/cancel — cancels order and restores inventory', async () => {
    // Check current stock of testFoodItem1
    const beforeItem = await FoodItem.findById(testFoodItem1._id);
    const initialStock = beforeItem.stockQuantity;

    // Owner cancels order (order had quantity: 1)
    const res = await request(`/api/orders/${createdOrder._id}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({ reason: 'Changed mind' }),
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.orderStatus, 'cancelled');
    assert.strictEqual(res.data.data.cancellationReason, 'Changed mind');

    // Verify inventory was restored (+1)
    const afterItem = await FoodItem.findById(testFoodItem1._id);
    assert.strictEqual(afterItem.stockQuantity, initialStock + 1, 'Stock must be restored on cancellation');
  });

  test('PATCH /api/orders/:id/cancel — prevents double cancellation and double stock restoration', async () => {
    const stockBefore = (await FoodItem.findById(testFoodItem1._id)).stockQuantity;

    // Attempt to cancel the already-cancelled order again
    const res = await request(`/api/orders/${createdOrder._id}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${student1Token}` },
    });

    assert.strictEqual(res.status, 400);
    assert.ok(res.data.message.includes('cannot be cancelled'));

    // Stock must not increase a second time
    const stockAfter = (await FoodItem.findById(testFoodItem1._id)).stockQuantity;
    assert.strictEqual(stockAfter, stockBefore, 'Stock must not be restored twice');
  });
});
