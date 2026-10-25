const https = require('https');

function searchWiki(query) {
  return new Promise((resolve, reject) => {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&format=json`;
    https.get(url, { headers: { 'User-Agent': 'QuickBiteBot/1.0 (canteen@college.edu)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.query && json.query.search ? json.query.search : []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

const dishes = [
  'Fresh Lime Soda glass',
  'Honey Chilli Potato',
  'Schezwan Fried Rice',
  'Manchurian Fried Rice',
  'Boiled eggs halves',
  'Bread butter toast',
  'Bread omelette street food',
  'Plain dosa chutney',
  'Dal roti Indian thali',
  'Shahi paneer bowl',
  'Indian vegetarian thali meal',
  'Garlic bread cheese mozzarella',
  'White sauce penne pasta alfredo',
  'Fried momos plate',
  'Bombay veg sandwich',
  'Club sandwich sliced',
  'Cheeseburger burger melted',
  'Cheese Maggi noodles bowl',
  'Peri peri french fries',
  'Paneer sandwich grilled',
  'Veg sandwich tomato cucumber'
];

async function main() {
  for (const d of dishes) {
    const results = await searchWiki(d);
    const imageFiles = results.filter(r => /\.(jpe?g|png|webp)$/i.test(r.title));
    console.log(`\nSearch "${d}":`);
    imageFiles.slice(0, 3).forEach(r => console.log(`  - ${r.title}`));
  }
}

main().catch(console.error);
