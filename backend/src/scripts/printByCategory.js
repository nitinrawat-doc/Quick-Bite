const fs = require('fs');
const path = require('path');

const items = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../scratch/items_full_list.json'), 'utf8'));

const byCat = {};
items.forEach(it => {
  if (!byCat[it.category]) byCat[it.category] = [];
  byCat[it.category].push(it);
});

for (const [cat, list] of Object.entries(byCat)) {
  console.log(`\n=================== CATEGORY: ${cat} (${list.length} items) ===================`);
  list.forEach(i => {
    console.log(`- ${i.name} [Veg: ${i.isVeg}] -> ${i.imageUrl}`);
  });
}
