const mongoose = require('mongoose');
const Order = require('../models/Order');
const FoodItem = require('../models/FoodItem');
const Payment = require('../models/Payment');
const { getCorrectImageUrl } = require('../config/foodImageMap');

const resolveOrderItemImage = (item) => {
  return (
    item.imageUrl ||
    (item.foodItem && typeof item.foodItem === 'object' && item.foodItem.imageUrl) ||
    getCorrectImageUrl(item.name) ||
    null
  );
};

// Allowed status transitions map
const VALID_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: ['completed'],
  completed: [], // Terminal
  cancelled: [], // Terminal
};

// GET /api/admin/orders — list orders with filters and pagination
const getAllOrders = async (req, res, next) => {
  try {
    const {
      status,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 25,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};

    if (status && status !== 'all') {
      filter.orderStatus = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { pickupToken: { $regex: search, $options: 'i' } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email phone')
        .populate('items.foodItem', 'name imageUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    const sanitizedOrders = orders.map((order) => {
      const orderObj = order.toObject ? order.toObject() : order;
      if (orderObj && Array.isArray(orderObj.items)) {
        orderObj.items = orderObj.items.map((item) => ({
          ...item,
          imageUrl: resolveOrderItemImage(item),
        }));
      }
      return orderObj;
    });

    res.json({
      success: true,
      data: {
        orders: sanitizedOrders,
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

// GET /api/admin/orders/:id — order details
const getOrderDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { orderId: id };

    const order = await Order.findOne(query)
      .populate('user', 'name email phone')
      .populate('items.foodItem', 'name imageUrl');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    const payment = await Payment.findOne({ order: order._id });

    const orderObj = order.toObject ? order.toObject() : order;
    if (orderObj && Array.isArray(orderObj.items)) {
      orderObj.items = orderObj.items.map((item) => ({
        ...item,
        imageUrl: resolveOrderItemImage(item),
      }));
    }

    res.json({
      success: true,
      data: {
        order: orderObj,
        payment,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/orders/:id/status — update order status with transition validation
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note = '', cancellationReason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Target status is required.',
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    const currentStatus = order.orderStatus;

    if (currentStatus === status) {
      return res.json({
        success: true,
        message: `Order is already in "${status}" status.`,
        data: order,
      });
    }

    // Validate transition
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from "${currentStatus}" to "${status}". Allowed transitions: ${allowed.join(', ') || 'none (order is final)'}.`,
      });
    }

    // If transitioning to cancelled: atomically update and restore stock
    if (status === 'cancelled') {
      const reason = cancellationReason || note || 'Cancelled by admin';

      const updated = await Order.findOneAndUpdate(
        {
          _id: order._id,
          orderStatus: { $ne: 'cancelled' },
        },
        {
          orderStatus: 'cancelled',
          cancellationReason: reason,
          cancelledAt: new Date(),
          $push: {
            statusHistory: {
              status: 'cancelled',
              timestamp: new Date(),
              note: `Admin cancelled: ${reason}`,
              updatedBy: req.user ? req.user.email : 'admin',
            },
          },
        },
        { returnDocument: 'after' }
      );

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'Order has already been cancelled.',
        });
      }

      // Restore inventory for all items
      for (const item of updated.items) {
        await FoodItem.findByIdAndUpdate(item.foodItem, {
          $inc: { stockQuantity: item.quantity },
        });
      }

      await Payment.findOneAndUpdate(
        { order: updated._id, paymentStatus: 'pending' },
        { paymentStatus: 'failed', note: `Admin cancelled: ${reason}` }
      );

      return res.json({
        success: true,
        message: 'Order cancelled and stock restored to inventory.',
        data: updated,
      });
    }

    // Regular progression
    order.orderStatus = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status} by admin`,
      updatedBy: req.user ? req.user.email : 'admin',
    });

    // If order is completed, mark counter payment as completed
    if (status === 'completed' && order.paymentStatus === 'pending') {
      order.paymentStatus = 'completed';
      await Payment.findOneAndUpdate(
        { order: order._id },
        { paymentStatus: 'completed', note: 'Counter payment completed upon collection' }
      );
    }

    await order.save();

    res.json({
      success: true,
      message: `Order status updated to "${status}".`,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
};
