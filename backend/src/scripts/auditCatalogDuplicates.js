const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const FoodItem = require('../models/FoodItem');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const items = await FoodItem.find({}).sort({ category: 1, name: 1 }).lean();
  console.log('Total items in DB:', items.length);
  const urlMap = {};
  items.forEach(it => {
    urlMap[it.imageUrl] = (urlMap[it.imageUrl] || 0) + 1;
  });
  console.log('Unique URLs:', Object.keys(urlMap).length);
  const duplicates = Object.entries(urlMap).filter(([url, count]) => count > 1 && url);
  console.log('Duplicate URLs count:', duplicates.length);
  duplicates.forEach(([url, count]) => {
    const dishNames = items.filter(it => it.imageUrl === url).map(it => it.name);
    console.log('\nURL (' + count + ' items): ' + url);
    console.log('   Dishes: ' + dishNames.join(', '));
  });
  await mongoose.disconnect();
}
main().catch(console.error);
