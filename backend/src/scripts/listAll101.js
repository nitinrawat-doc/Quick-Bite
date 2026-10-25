const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const FoodItem = require('../models/FoodItem');
const fs = require('fs');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const items = await FoodItem.find({}).sort({ category: 1, name: 1 }).lean();
  
  const publicFoodDir = path.resolve(__dirname, '../../../frontend/public/images/food');
  const localFiles = fs.existsSync(publicFoodDir) ? fs.readdirSync(publicFoodDir) : [];

  console.log(`Auditing ${items.length} items. Available local food images: ${localFiles.length}`);

  const itemReport = items.map((it, idx) => ({
    no: idx + 1,
    name: it.name,
    category: it.category,
    isVeg: it.isVeg,
    price: it.price,
    imageUrl: it.imageUrl
  }));

  fs.writeFileSync(path.resolve(__dirname, '../../scratch/items_full_list.json'), JSON.stringify(itemReport, null, 2));
  console.log('Saved items_full_list.json');

  await mongoose.disconnect();
}
main().catch(console.error);
