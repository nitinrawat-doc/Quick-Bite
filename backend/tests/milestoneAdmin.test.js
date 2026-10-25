const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_for_milestone_admin_testing_123456';
process.env.ADMIN_SETUP_TOKEN = 'test_admin_setup_token_xyz_2026';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/quickbite_test_admin';

const app = require('../server');
const User = require('../src/models/User');
const FoodItem = require('../src/models/FoodItem');
const Category = require('../src/models/Category');
const Order = require('../src/models/Order');
const AdminInvite = require('../src/models/AdminInvite');

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

describe('QuickBite Admin Panel & Security Test Suite', () => {
  let adminToken, studentToken;
  let testCategoryId, testFoodId, testOrderId;
  let generatedInviteCode;

  before(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    await Promise.all([
      User.deleteMany({}),
      FoodItem.deleteMany({}),
      Category.deleteMany({}),
      Order.deleteMany({}),
      AdminInvite.deleteMany({}),
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

  // 1. Normal User Registration
  test('POST /api/auth/register — normal user registers with student role', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Student User',
        email: 'student.test@campus.edu',
        password: 'Password123!',
        phone: '9876543210',
      }),
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.data.user.role, 'student');
    assert.ok(res.data.data.token);
    studentToken = res.data.data.token;
  });

  // 2. Admin Role-Selection & Tampering Attempts
  test('POST /api/auth/register — ignores role=admin in registration body', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Sneaky User',
        email: 'sneaky@campus.edu',
        password: 'Password123!',
        role: 'admin',
      }),
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.data.user.role, 'student'); // Role forced to student
  });

  // 3. Unauthorized Admin Registration Attempts
  test('POST /api/auth/setup-admin — rejects setup without invite or secret token (403)', async () => {
    const res = await request('/api/auth/setup-admin', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Unauth Admin',
        email: 'unauth@campus.edu',
        password: 'Password123!',
      }),
    });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.data.success, false);
  });

  test('POST /api/auth/setup-admin — rejects invalid invite code (403)', async () => {
    const res = await request('/api/auth/setup-admin', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Unauth Admin',
        email: 'unauth2@campus.edu',
        password: 'Password123!',
        inviteCode: 'fake_invalid_code_123',
      }),
    });
    assert.strictEqual(res.status, 403);
  });

  // 4. Secure First-Admin Provisioning
  test('POST /api/auth/setup-admin — provisions first admin via server setup token', async () => {
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

  // 5. Admin Invitation Generation & Single-Use Flow
  test('POST /api/admin/invites — authorized admin generates a single-use invitation', async () => {
    const res = await request('/api/admin/invites', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        invitedEmail: 'newadmin@quickbite.campus',
        expiresInHours: 24,
      }),
    });
    assert.strictEqual(res.status, 201);
    assert.ok(res.data.data.code);
    assert.strictEqual(res.data.data.isUsed, false);
    generatedInviteCode = res.data.data.code;
  });

  test('POST /api/auth/setup-admin — redeems valid single-use invitation code', async () => {
    const res = await request('/api/auth/setup-admin', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Second Admin',
        email: 'newadmin@quickbite.campus',
        password: 'AdminPassword123!',
        inviteCode: generatedInviteCode,
      }),
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.data.user.role, 'admin');
  });

  test('POST /api/auth/setup-admin — prevents reuse of redeemed invitation code (403)', async () => {
    const res = await request('/api/auth/setup-admin', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Third Admin Imposter',
        email: 'thirdadmin@quickbite.campus',
        password: 'AdminPassword123!',
        inviteCode: generatedInviteCode,
      }),
    });
    assert.strictEqual(res.status, 403);
    assert.match(res.data.message, /already been used/i);
  });

  test('POST /api/auth/setup-admin — rejects expired invitation code (403)', async () => {
    // Create an expired invite
    const expiredInvite = await AdminInvite.create({
      code: 'qb_inv_expired_test_code',
      expiresAt: new Date(Date.now() - 10000), // in the past
      isUsed: false,
    });

    const res = await request('/api/auth/setup-admin', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Late Admin',
        email: 'late@quickbite.campus',
        password: 'AdminPassword123!',
        inviteCode: expiredInvite.code,
      }),
    });
    assert.strictEqual(res.status, 403);
    assert.match(res.data.message, /expired/i);
  });

  // 6. Student Access to Admin Routes
  test('GET /api/admin/orders — rejects student access with 403 Forbidden', async () => {
    const res = await request('/api/admin/orders', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(res.status, 403);
  });

  test('GET /api/admin/categories — rejects unauthenticated access with 401 Unauthorized', async () => {
    const res = await request('/api/admin/categories');
    assert.strictEqual(res.status, 401);
  });

  // 7. Role Immutability in Profile Updates
  test('PUT /api/auth/profile — prevents updating role to admin through profile update', async () => {
    const res = await request('/api/auth/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        name: 'Student Updated',
        role: 'admin',
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.user.role, 'student'); // still student

    // Verify in database
    const me = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(me.data.data.user.role, 'student');
  });

  // 8. Category CRUD and Safety Protection
  test('POST /api/admin/categories — admin creates category', async () => {
    const res = await request('/api/admin/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Beverages & Juices',
        slug: 'beverages-and-juices',
        icon: '🥤',
        description: 'Fresh campus beverages and coolers',
      }),
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.data.name, 'Beverages & Juices');
    testCategoryId = res.data.data._id;
  });

  test('PUT /api/admin/categories/:id — admin updates category', async () => {
    const res = await request(`/api/admin/categories/${testCategoryId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Cool Beverages & Drinks',
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.name, 'Cool Beverages & Drinks');
  });

  // 9. Food CRUD
  test('POST /api/admin/food — admin creates food item in category', async () => {
    const res = await request('/api/admin/food', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Iced Lemon Tea',
        description: 'Chilled refreshing lemon brew',
        category: testCategoryId,
        sellingPrice: 40,
        costPrice: 15,
        stockQuantity: 25,
        lowStockThreshold: 5,
        isVeg: true,
      }),
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.data.name, 'Iced Lemon Tea');
    assert.strictEqual(res.data.data.stockQuantity, 25);
    testFoodId = res.data.data._id;
  });

  // 10. Category Safe Deletion Check
  test('DELETE /api/admin/categories/:id — blocks deletion when active food items exist (400)', async () => {
    const res = await request(`/api/admin/categories/${testCategoryId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 400);
    assert.match(res.data.message, /Cannot delete category/i);
  });

  // 11. Inventory Management & Negative Stock Prevention
  test('PATCH /api/admin/food/:id/stock — updates stock and threshold', async () => {
    const res = await request(`/api/admin/food/${testFoodId}/stock`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        stockQuantity: 10,
        lowStockThreshold: 4,
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.stockQuantity, 10);
    assert.strictEqual(res.data.data.lowStockThreshold, 4);
  });

  test('PATCH /api/admin/food/:id/stock — rejects negative stock with 400', async () => {
    const res = await request(`/api/admin/food/${testFoodId}/stock`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        stockQuantity: -5,
      }),
    });
    assert.strictEqual(res.status, 400);
    assert.match(res.data.message, /negative/i);
  });

  // 12. Order Management & Status Transitions
  test('Order flow — creates order, tests valid and invalid status transitions', async () => {
    // Student creates an order
    const orderRes = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        items: [{ foodItemId: testFoodId, quantity: 2 }],
        paymentMethod: 'pay_at_pickup',
      }),
    });
    assert.strictEqual(orderRes.status, 201);
    testOrderId = orderRes.data.data._id;

    // Admin rejects invalid transition directly from pending to completed (400)
    const invalidTrans = await request(`/api/admin/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'completed' }),
    });
    assert.strictEqual(invalidTrans.status, 400);
    assert.match(invalidTrans.data.message, /invalid status transition/i);

    // Valid progression: pending -> confirmed -> preparing -> ready_for_pickup -> completed
    const confRes = await request(`/api/admin/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'confirmed' }),
    });
    assert.strictEqual(confRes.status, 200);
    assert.strictEqual(confRes.data.data.orderStatus, 'confirmed');

    const prepRes = await request(`/api/admin/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'preparing' }),
    });
    assert.strictEqual(prepRes.status, 200);

    const readyRes = await request(`/api/admin/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'ready_for_pickup' }),
    });
    assert.strictEqual(readyRes.status, 200);

    const compRes = await request(`/api/admin/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'completed' }),
    });
    assert.strictEqual(compRes.status, 200);
    assert.strictEqual(compRes.data.data.orderStatus, 'completed');
  });

  // 13. Safe Food Deletion With Order References
  test('DELETE /api/admin/food/:id — soft-deletes item preserving historical order', async () => {
    const res = await request(`/api/admin/food/${testFoodId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.softDeleted, true);

    // Verify food record still exists in DB with isDeleted: true
    const item = await FoodItem.findById(testFoodId);
    assert.ok(item);
    assert.strictEqual(item.isDeleted, true);
    assert.strictEqual(item.isAvailable, false);
  });
});
