const fs = require('fs');
const https = require('https');

const items = JSON.parse(fs.readFileSync('db_items_dump.json', 'utf8'));

// Extract all unique photo URLs
const uniqueUrls = new Set();
items.forEach(i => {
  if (i.imageUrl) uniqueUrls.add(i.imageUrl);
});

console.log('Total items:', items.length);
console.log('Unique image URLs:', uniqueUrls.size);

// List all items grouped by imageUrl
const urlToItems = {};
items.forEach(i => {
  const url = i.imageUrl || 'EMPTY';
  if (!urlToItems[url]) urlToItems[url] = [];
  urlToItems[url].push(i);
});

fs.writeFileSync('url_to_items.json', JSON.stringify(urlToItems, null, 2));
console.log('Saved to url_to_items.json');
