const mongoose = require('mongoose');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const FoodItem = require('../models/FoodItem');
const User = require('../models/User');

// GET /api/admin/analytics — sales analytics with aggregations
const getAnalytics = async (req, res, next) => {
  try {
    const { range = '7days', startDate, endDate } = req.query;

    let start = new Date();
    let end = new Date();

    if (range === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (range === '30days') {
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    } else if (range === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      // Default: 7 days
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    }

    const dateFilter = { createdAt: { $gte: start, $lte: end } };

    // 1. Order status counts
    const statusCountsAgg = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$orderStatus', count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } },
    ]);

    const statusCounts = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready_for_pickup: 0,
      completed: 0,
      cancelled: 0,
    };
    let totalOrders = 0;

    for (const item of statusCountsAgg) {
      if (statusCounts[item._id] !== undefined) {
        statusCounts[item._id] = item.count;
      }
      totalOrders += item.count;
    }

    // 2. Verified Sales Aggregation
    // Exclude cancelled and failed orders.
    // Verified sales: completed/delivered orders OR paid orders (online payment completed)
    const verifiedSalesAgg = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          orderStatus: { $ne: 'cancelled' },
          $or: [
            { paymentStatus: 'completed' },
            { orderStatus: 'completed' },
          ],
        },
      },
      {
        $unwind: '$items',
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$items.subtotal' },
          totalCOGS: {
            $sum: {
              $multiply: [
                { $ifNull: ['$items.costPrice', 0] },
                '$items.quantity',
              ],
            },
          },
          totalItemsSold: { $sum: '$items.quantity' },
          verifiedOrderCount: { $addToSet: '$_id' },
        },
      },
    ]);

    // Account for refunds
    const refundAgg = await Payment.aggregate([
      {
        $match: {
          ...dateFilter,
          paymentStatus: 'refunded',
        },
      },
      {
        $group: {
          _id: null,
          totalRefunded: { $sum: { $ifNull: ['$refundAmount', '$amount'] } },
        },
      },
    ]);

    const totalRefunded = refundAgg[0]?.totalRefunded || 0;
    const rawRevenue = verifiedSalesAgg[0]?.totalRevenue || 0;
    const verifiedSales = Math.max(0, rawRevenue - totalRefunded);
    const estimatedCOGS = verifiedSalesAgg[0]?.totalCOGS || 0;
    const totalItemsSold = verifiedSalesAgg[0]?.totalItemsSold || 0;
    const verifiedOrderCount = verifiedSalesAgg[0]?.verifiedOrderCount?.length || 0;
    const estimatedGrossProfit = Math.max(0, verifiedSales - estimatedCOGS);

    // 3. Best-Selling Food Items
    const bestSellingItems = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          orderStatus: { $ne: 'cancelled' },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.foodItem',
          name: { $first: '$items.name' },
          quantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          unitPrice: { $first: '$items.unitPrice' },
          imageUrl: { $first: '$items.imageUrl' },
          isVeg: { $first: '$items.isVeg' },
          totalCost: {
            $sum: {
              $multiply: [
                { $ifNull: ['$items.costPrice', 0] },
                '$items.quantity',
              ],
            },
          },
        },
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 8 },
    ]);

    const formattedBestSelling = bestSellingItems.map((item) => ({
      _id: item._id,
      name: item.name,
      quantitySold: item.quantitySold,
      totalQuantity: item.quantitySold,
      totalRevenue: item.totalRevenue,
      unitPrice: item.unitPrice,
      imageUrl: item.imageUrl,
      isVeg: item.isVeg,
      estimatedCost: item.totalCost || 0,
      estimatedProfit: Math.max(0, item.totalRevenue - (item.totalCost || 0)),
    }));

    // 4. Daily Sales Timeline (for trend chart)
    const dailyTimeline = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          orderStatus: { $ne: 'cancelled' },
          $or: [
            { paymentStatus: 'completed' },
            { orderStatus: 'completed' },
          ],
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const formattedTimeline = dailyTimeline.map((item) => ({
      _id: item._id,
      date: item._id,
      day: item._id ? item._id.slice(5) : '',
      revenue: item.revenue,
      orders: item.orders,
    }));

    // 5. Low-stock alert count, total active items, and lifetime order counts
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [totalFoodItems, lowStockItems, totalStudents, totalLifetimeOrders, todayOrdersCount] = await Promise.all([
      FoodItem.countDocuments({ isDeleted: { $ne: true } }),
      FoodItem.countDocuments({
        isDeleted: { $ne: true },
        $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
      }),
      User.countDocuments({ role: 'student', isActive: true }),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
    ]);

    const grossMarginPercent =
      verifiedSales > 0
        ? Math.round((estimatedGrossProfit / verifiedSales) * 100)
        : 0;

    const kpis = {
      totalRevenue: rawRevenue,
      totalRefunds: totalRefunded,
      netVerifiedSales: verifiedSales,
      paidOrdersCount: verifiedOrderCount,
      avgOrderValue:
        verifiedOrderCount > 0
          ? Math.round(verifiedSales / verifiedOrderCount)
          : 0,
      estimatedCogs: estimatedCOGS,
      estimatedGrossProfit,
      grossMarginPercent,
    };

    res.json({
      success: true,
      data: {
        timeframe: { range, start, end },
        summary: {
          verifiedSales,
          totalRefunded,
          estimatedCOGS,
          estimatedGrossProfit,
          profitLabel: 'Estimated gross profit (based on recorded item costs; excludes general operating expenses)',
          totalOrders,
          totalLifetimeOrders,
          todayOrdersCount,
          verifiedOrderCount,
          totalItemsSold,
          averageOrderValue:
            verifiedOrderCount > 0
              ? Math.round(verifiedSales / verifiedOrderCount)
              : 0,
        },
        kpis,
        statusCounts,
        ordersByStatus: statusCounts,
        bestSellingItems: formattedBestSelling,
        topSellingItems: formattedBestSelling,
        dailyTimeline: formattedTimeline,
        inventoryOverview: {
          totalFoodItems,
          lowStockItems,
          totalStudents,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAnalytics };
