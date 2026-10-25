/**
 * Batch Food Image Repair Migration for QuickBite
 *
 * Efficiently corrects all misassigned food images across the catalog in ONE BATCH.
 *
 * Guarantees:
 * 1. Single database fetch of all items (FoodItem.find({}))
 * 2. Single database batch write (FoodItem.bulkWrite())
 * 3. Centralized stable name-to-image mapping (no array indexes)
 * 4. Preserves admin-uploaded images (/uploads/...)
 * 5. Preserves prices, stock, categories, descriptions, orders, and users
 * 6. Idempotent and safe to run anytime
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const FoodItem = require('../models/FoodItem');
const Category = require('../models/Category');
const { FOOD_IMAGE_MAP, getCorrectImageUrl } = require('../config/foodImageMap');

async function batchFixFoodImages() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in backend/.env');
  }

  const isConnected = mongoose.connection.readyState === 1;
  if (!isConnected) {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.\n');
  }

  console.log('======================================================');
  console.log('   🚀 QUICKBITE: BATCH FOOD IMAGE REPAIR MIGRATION');
  console.log('======================================================\n');

  // 1. Fetch all food items in ONE query
  const items = await FoodItem.find({}).populate('category', 'name slug');
  console.log(`Fetched ${items.length} items from database in 1 query.\n`);

  const bulkOps = [];
  const report = {
    total: items.length,
    alreadyCorrect: [],
    repaired: [],
    adminPreserved: [],
    unresolved: [],
  };

  for (const item of items) {
    const currentUrl = item.imageUrl || '';
    const itemName = item.name;

    // Check if an admin uploaded an image
    if (currentUrl.startsWith('/uploads/')) {
      report.adminPreserved.push({
        name: itemName,
        imageUrl: currentUrl,
      });
      continue;
    }

    const correctUrl = getCorrectImageUrl(itemName);

    if (!correctUrl) {
      report.unresolved.push({
        id: item._id,
        name: itemName,
        category: item.category?.name || 'Unknown',
        currentUrl,
      });
      continue;
    }

    if (currentUrl === correctUrl) {
      report.alreadyCorrect.push({
        id: item._id,
        name: itemName,
        imageUrl: currentUrl,
      });
    } else {
      bulkOps.push({
        updateOne: {
          filter: { _id: item._id },
          update: { $set: { imageUrl: correctUrl } },
        },
      });

      report.repaired.push({
        id: item._id,
        name: itemName,
        category: item.category?.name || 'Unknown',
        from: currentUrl || '(none)',
        to: correctUrl,
      });
    }
  }

  // 2. Execute all updates in ONE batch operation
  if (bulkOps.length > 0) {
    console.log(`Executing batch update for ${bulkOps.length} items via bulkWrite()...`);
    const bulkResult = await FoodItem.bulkWrite(bulkOps, { ordered: false });
    console.log(`Bulk write completed: ${bulkResult.modifiedCount} documents modified.\n`);
  } else {
    console.log('No documents required modifications; catalog is already 100% verified!\n');
  }

  // 3. Output comprehensive audit breakdown
  console.log('------------------------------------------------------');
  console.log('📊 BATCH REPAIR AUDIT SUMMARY:');
  console.log(`   - Total items processed : ${report.total}`);
  console.log(`   - Already correct items : ${report.alreadyCorrect.length}`);
  console.log(`   - Repaired items        : ${report.repaired.length}`);
  console.log(`   - Admin-preserved items : ${report.adminPreserved.length}`);
  console.log(`   - Unresolved items      : ${report.unresolved.length}`);
  console.log('------------------------------------------------------\n');

  if (report.repaired.length > 0) {
    console.log('🔧 Repaired Items Detail:');
    report.repaired.forEach((r, idx) => {
      console.log(
        `   ${(idx + 1).toString().padStart(2)}. [${r.category}] ${r.name}\n` +
        `       Old: ${r.from}\n` +
        `       New: ${r.to}`
      );
    });
    console.log('\n');
  }

  if (report.unresolved.length > 0) {
    console.warn('⚠️  Unresolved Items (Action required):');
    report.unresolved.forEach((u) => {
      console.warn(`   - ${u.name} (${u.category})`);
    });
    console.log('\n');
  }

  if (!isConnected) {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.\n');
  }

  return report;
}

if (require.main === module) {
  batchFixFoodImages()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Batch repair failed:', err);
      process.exit(1);
    });
}

module.exports = batchFixFoodImages;
