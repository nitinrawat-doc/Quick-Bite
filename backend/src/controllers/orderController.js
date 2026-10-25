const mongoose = require('mongoose');
const Order = require('../models/Order');
const FoodItem = require('../models/FoodItem');
const Payment = require('../models/Payment');
const { getCorrectImageUrl } = require('../config/foodImageMap');

// Helper to resolve an order item's image from snapshot, populated foodItem, or canonical mapping
const resolveOrderItemImage = (item) => {
  return (
    item.imageUrl ||
    (item.foodItem && typeof item.foodItem === 'object' && item.foodItem.imageUrl) ||
    getCorrectImageUrl(item.name) ||
    null
  );
};

// Helper to generate human-readable unique order ID and pickup token
const generateOrderIdentifier = () => {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `QB-${dateStr}-${randomSuffix}`;
};

const generatePickupToken = () => {
  return String(Math.floor(100 + Math.random() * 900));
};

// POST /api/orders — Checkout & order creation
const createOrder = async (req, res, next) => {
  const reservedItems = []; // Tracking for rollback

  try {
    const { items, paymentMethod = 'pay_at_pickup', specialInstructions } = req.body;

    // 1. Validation
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item.',
      });
    }

    // Validate structure and quantities
    for (const item of items) {
      if (!item.foodItemId || !mongoose.Types.ObjectId.isValid(item.foodItemId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid food item identifier.',
        });
      }
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Item quantity must be a positive integer.',
        });
      }
    }

    // 2. Fetch all requested food items from DB
    const itemIds = items.map((i) => i.foodItemId);
    const dbItems = await FoodItem.find({ _id: { $in: itemIds } });
    const itemMap = new Map(dbItems.map((i) => [i._id.toString(), i]));

    for (const item of items) {
      const dbItem = itemMap.get(item.foodItemId);
      if (!dbItem) {
        return res.status(404).json({
          success: false,
          message: `Food item not found for ID: ${item.foodItemId}`,
        });
      }
      if (!dbItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `"${dbItem.name}" is currently unavailable.`,
        });
      }
      if (dbItem.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${dbItem.name}". Available: ${dbItem.stockQuantity}, Requested: ${item.quantity}.`,
        });
      }
    }

    // 3. Atomic stock reservation with rollback
    for (const item of items) {
      const qty = Number(item.quantity);
      const reserved = await FoodItem.findOneAndUpdate(
        {
          _id: item.foodItemId,
          stockQuantity: { $gte: qty },
          isAvailable: true,
        },
        {
          $inc: { stockQuantity: -qty },
        },
        { returnDocument: 'after' }
      );

      if (!reserved) {
        // Concurrency collision or out of stock: rollback previous reservations
        for (const prev of reservedItems) {
          await FoodItem.findByIdAndUpdate(prev.id, {
            $inc: { stockQuantity: prev.qty },
          });
        }
        const target = itemMap.get(item.foodItemId);
        return res.status(400).json({
          success: false,
          message: `Could not reserve stock for "${target ? target.name : 'item'}". It may have just sold out.`,
        });
      }

      reservedItems.push({ id: item.foodItemId, qty });
    }

    // 4. Server-side price calculation & snapshot creation
    let subtotal = 0;
    const orderItemSnapshots = items.map((i) => {
      const dbItem = itemMap.get(i.foodItemId);
      const unitPrice = dbItem.sellingPrice;
      const costPrice = dbItem.costPrice || 0;
      const itemSubtotal = unitPrice * Number(i.quantity);
      subtotal += itemSubtotal;

      return {
        foodItem: dbItem._id,
        name: dbItem.name,
        unitPrice,
        costPrice,
        quantity: Number(i.quantity),
        subtotal: itemSubtotal,
        imageUrl: dbItem.imageUrl || getCorrectImageUrl(dbItem.name) || null,
        isVeg: dbItem.isVeg,
      };
    });

    const totalAmount = subtotal; // Pickup orders: no delivery fees; tax included

    // 5. Create Order document
    const orderId = generateOrderIdentifier();
    const pickupToken = generatePickupToken();

    const order = await Order.create({
      orderId,
      user: req.user._id,
      items: orderItemSnapshots,
      subtotal,
      totalAmount,
      pickupToken,
      estimatedPickupMinutes: 15,
      specialInstructions: specialInstructions ? String(specialInstructions).trim() : '',
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'pending',
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date(),
          note: 'Order placed — awaiting canteen confirmation',
        },
      ],
    });

    // 6. Create Payment record (stub for future payment gateway)
    await Payment.create({
      order: order._id,
      user: req.user._id,
      amount: totalAmount,
      paymentMethod,
      paymentStatus: 'pending',
      note: 'Payment integration pending (Milestone 3). Pay at pickup counter.',
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Please collect your order from the canteen counter.',
      data: order,
    });
  } catch (err) {
    // If order creation failed, rollback all reserved stock
    for (const prev of reservedItems) {
      try {
        await FoodItem.findByIdAndUpdate(prev.id, {
          $inc: { stockQuantity: prev.qty },
        });
      } catch (rollbackErr) {
        console.error('Failed to rollback stock for item:', prev.id, rollbackErr);
      }
    }
    next(err);
  }
};

// GET /api/orders — Student order history
const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { user: req.user._id };
    if (status && status !== 'all') {
      filter.orderStatus = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
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

// GET /api/orders/:id — Individual order details with ownership verification
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let order;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id)
        .populate('user', 'name email phone')
        .populate('items.foodItem', 'name imageUrl');
    } else {
      order = await Order.findOne({ orderId: id })
        .populate('user', 'name email phone')
        .populate('items.foodItem', 'name imageUrl');
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Security check: Only owner or admin can view
    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own orders.',
      });
    }

    const orderObj = order.toObject ? order.toObject() : order;
    if (orderObj && Array.isArray(orderObj.items)) {
      orderObj.items = orderObj.items.map((item) => ({
        ...item,
        imageUrl: resolveOrderItemImage(item),
      }));
    }

    res.json({
      success: true,
      data: orderObj,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/orders/:id/cancel — Student order cancellation with stock restoration
const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by student' } = req.body;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { orderId: id };

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Ownership check
    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You cannot cancel an order that belongs to another student.',
      });
    }

    // Check cancellable state
    if (!['pending', 'confirmed'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already "${order.orderStatus.replace(/_/g, ' ')}".`,
      });
    }

    // Atomic update status to 'cancelled' only if still in ['pending', 'confirmed']
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        orderStatus: { $in: ['pending', 'confirmed'] },
      },
      {
        orderStatus: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date(),
        $push: {
          statusHistory: {
            status: 'cancelled',
            timestamp: new Date(),
            note: `Cancelled: ${reason}`,
          },
        },
      },
      { returnDocument: 'after' }
    );

    if (!updatedOrder) {
      return res.status(400).json({
        success: false,
        message: 'Order status changed before cancellation could be completed.',
      });
    }

    // Restore stock safely for each item
    for (const item of updatedOrder.items) {
      await FoodItem.findByIdAndUpdate(item.foodItem, {
        $inc: { stockQuantity: item.quantity },
      });
    }

    await Payment.findOneAndUpdate(
      { order: updatedOrder._id, paymentStatus: 'pending' },
      { paymentStatus: 'failed', note: `Order cancelled: ${reason}` }
    );

    res.json({
      success: true,
      message: 'Order has been cancelled and stock has been restored.',
      data: updatedOrder,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
};
