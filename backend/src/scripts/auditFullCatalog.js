const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const FoodItem = require('../models/FoodItem');
const Category = require('../models/Category');
const { FOOD_IMAGE_MAP, getCorrectImageUrl } = require('../config/foodImageMap');

async function audit() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quickbite';
  await mongoose.connect(mongoUri);

  const items = await FoodItem.find({}).populate('category', 'name slug').sort({ 'category.name': 1, name: 1 });
  console.log(`TOTAL ITEMS IN DATABASE: ${items.length}\n`);

  const results = items.map((item, index) => {
    const url = item.imageUrl || '';
    const canonical = getCorrectImageUrl(item.name);
    let status = 'VALID';
    let issue = '';

    if (!url || url.trim() === '') {
      status = 'EMPTY_FALLBACK';
      issue = 'Safely uses QuickBite SVG fallback (No image assigned)';
    } else if (url.startsWith('/uploads/')) {
      status = 'ADMIN_UPLOAD';
      issue = 'Admin custom uploaded photo';
    } else if (canonical && url === canonical) {
      status = 'VERIFIED_CANONICAL';
      issue = url.startsWith('/images/food/') ? 'Local high-res verified image' : 'Curated verified photo';
    } else if (canonical && url !== canonical) {
      status = 'MISMATCH';
      issue = `Current: ${url} (Expected: ${canonical})`;
    } else {
      status = 'UNMAPPED';
      issue = 'Item not in centralized mapping';
    }

    return {
      index: index + 1,
      id: item._id,
      name: item.name,
      category: item.category?.name || 'Unknown',
      isVeg: item.isVeg,
      url,
      canonical,
      status,
      issue,
    };
  });

  const summary = {
    total: results.length,
    verifiedCanonical: results.filter(r => r.status === 'VERIFIED_CANONICAL').length,
    adminUpload: results.filter(r => r.status === 'ADMIN_UPLOAD').length,
    mismatches: results.filter(r => r.status === 'MISMATCH').length,
    emptyFallback: results.filter(r => r.status === 'EMPTY_FALLBACK').length,
    unmapped: results.filter(r => r.status === 'UNMAPPED').length,
  };

  console.log('AUDIT SUMMARY:', JSON.stringify(summary, null, 2));

  console.log('\n--- ALL ITEMS STATUS ---');
  results.forEach(r => {
    console.log(`${r.index.toString().padStart(3)}. [${r.status}] ${r.name} (${r.category}) -> ${r.url} [${r.issue}]`);
  });

  await mongoose.disconnect();
  return summary;
}

if (require.main === module) {
  audit().catch(console.error);
}

module.exports = audit;
