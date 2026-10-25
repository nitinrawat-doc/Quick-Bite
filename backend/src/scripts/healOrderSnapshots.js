/**
 * Batch Order Image Healing Script for QuickBite
 *
 * Safely inspects all existing orders in the database.
 * If any order item has a missing, blank, or outdated image, it updates
 * the item's snapshot to use the canonical food image from foodItem reference
 * or centralized foodImageMap.
 *
 * Constraints:
 * - Does not delete, drop, or recreate orders.
 * - Does not modify prices, quantities, status, payment details, or timestamps.
 * - Idempotent: safe to run multiple times.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Order = require('../models/Order');
const FoodItem = require('../models/FoodItem');
require('../models/Category');
const { getCorrectImageUrl } = require('../config/foodImageMap');

async function healOrderSnapshots() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is missing.');
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected successfully.\n');

  const orders = await Order.find({}).populate('items.foodItem', 'name imageUrl');
  console.log(`Found ${orders.length} total orders to inspect.\n`);

  let ordersRepaired = 0;
  let itemsRepaired = 0;

  for (const order of orders) {
    let orderModified = false;
    const updatedItems = order.items.map((item) => {
      const canonicalImage =
        (item.foodItem && typeof item.foodItem === 'object' && item.foodItem.imageUrl) ||
        getCorrectImageUrl(item.name);

      // If current item lacks imageUrl or canonicalImage is available and current is invalid/empty/outdated
      if (canonicalImage && item.imageUrl !== canonicalImage) {
        console.log(`[Heal] Order ${order.orderId} - Item "${item.name}":`);
        console.log(`   Old: ${item.imageUrl}`);
        console.log(`   New: ${canonicalImage}`);
        itemsRepaired++;
        orderModified = true;
        item.imageUrl = canonicalImage;
      }
      return item;
    });

    if (orderModified) {
      await Order.updateOne(
        { _id: order._id },
        { $set: { items: updatedItems } }
      );
      ordersRepaired++;
    }
  }

  console.log('\n--- Healing Summary ---');
  console.log(`Total orders inspected: ${orders.length}`);
  console.log(`Orders updated: ${ordersRepaired}`);
  console.log(`Item snapshots healed: ${itemsRepaired}`);

  await mongoose.disconnect();
  console.log('Database disconnected cleanly.');
}

healOrderSnapshots().catch((err) => {
  console.error('Healing failed:', err);
  process.exit(1);
});
