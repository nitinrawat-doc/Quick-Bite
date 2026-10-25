const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');

const {
  getAllFoodItems,
  createFoodItem,
  updateFoodItem,
  toggleAvailability,
  updateStock,
  deleteFoodItem,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/adminFoodController');

const {
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
} = require('../controllers/adminOrderController');

const { getAnalytics } = require('../controllers/adminAnalyticsController');
const { getAllPayments, processRefund } = require('../controllers/paymentController');
const {
  uploadMiddleware,
  handleImageUpload,
} = require('../controllers/adminUploadController');

const {
  createInvite,
  listInvites,
  revokeInvite,
} = require('../controllers/adminInviteController');

// All routes in this router require authentication and administrator role
router.use(protect, adminOnly);

// Admin Invitations
router.get('/invites', listInvites);
router.post('/invites', createInvite);
router.delete('/invites/:id', revokeInvite);

// Food Items CRUD
router.get('/food', getAllFoodItems);
router.post('/food', createFoodItem);
router.put('/food/:id', updateFoodItem);
router.patch('/food/:id/toggle-availability', toggleAvailability);
router.patch('/food/:id/stock', updateStock);
router.delete('/food/:id', deleteFoodItem);

// Categories CRUD
router.get('/categories', getAllCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Orders Management
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderDetails);
router.patch('/orders/:id/status', updateOrderStatus);

// Sales Analytics
router.get('/analytics', getAnalytics);

// Payment Records & Refunds
router.get('/payments', getAllPayments);
router.post('/payments/:id/refund', processRefund);

// Image Upload
router.post('/upload', uploadMiddleware, handleImageUpload);

module.exports = router;
