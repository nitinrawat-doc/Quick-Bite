const fs = require('fs');
const path = require('path');

const items = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../scratch/items_full_list.json'), 'utf8'));

// Check what local files exist
const localDir = path.resolve(__dirname, '../../../frontend/public/images/food');
const localFiles = fs.readdirSync(localDir);

console.log(`Auditing ${items.length} dishes...`);

// Group by imageUrl
const byUrl = {};
items.forEach(it => {
  const u = it.imageUrl || '(empty)';
  if (!byUrl[u]) byUrl[u] = [];
  byUrl[u].push(it);
});

console.log('\n--- Duplicate groups (>1 item sharing URL) ---');
let dupCount = 0;
for (const [url, list] of Object.entries(byUrl)) {
  if (list.length > 1) {
    dupCount += list.length;
    console.log(`\nURL (${list.length} dishes): ${url}`);
    list.forEach(i => console.log(`   - [${i.category}] ${i.name} (Veg: ${i.isVeg})`));
  }
}
console.log(`\nTotal items sharing a URL: ${dupCount}`);
