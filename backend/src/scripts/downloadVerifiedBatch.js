const https = require('https');
const fs = require('fs');
const path = require('path');

const destDir = path.resolve(__dirname, '../../../frontend/public/images/food');
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

function getWikiImageUrl(pageTitle) {
  return new Promise((resolve, reject) => {
    const cleanTitle = pageTitle.startsWith('File:') ? pageTitle : `File:${pageTitle}`;
    const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(cleanTitle)}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json`;
    https.get(url, { headers: { 'User-Agent': 'QuickBiteBot/1.0 (canteen@college.edu)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query.pages;
          const pageId = Object.keys(pages)[0];
          const info = pages[pageId].imageinfo;
          if (info && info[0]) {
            resolve(info[0].thumburl || info[0].url);
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, destFilename) {
  return new Promise((resolve, reject) => {
    const destPath = path.join(destDir, destFilename);
    const file = fs.createWriteStream(destPath);
    https.get(url, { headers: { 'User-Agent': 'QuickBiteBot/1.0 (canteen@college.edu)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        return downloadFile(res.headers.location, destFilename).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          const size = fs.statSync(destPath).size;
          console.log(`✅ Saved ${destFilename} (${size} bytes)`);
          resolve(destPath);
        });
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

const directFiles = [
  { title: 'File:Honey chilli potato 2.jpg', filename: 'honey-chilli-potato.jpg' },
  { title: 'File:Schezwan Egg Fried Rice with raitha 03.jpg', filename: 'schezwan-fried-rice.jpg' },
  { title: 'File:Homemade Veg Manchurian and fried rice.jpg', filename: 'manchurian-fried-rice.jpg' },
  { title: 'File:Bread omelette.jpg', filename: 'bread-omelette.jpg' },
  { title: 'File:Plain dosa with tamato coconut chutney.jpg', filename: 'plain-dosa.jpg' },
  { title: 'File:A thali with daal roti bhindi ki sabzi and mango pickle.jpg', filename: 'dal-roti.jpg' },
  { title: 'File:Traditional Indian vegetarian meal served in a stainless steel thali in Uttar Pradesh.jpg', filename: 'veg-thali.jpg' },
  { title: 'File:Garlic Bread Mozzarella - Oregano Pizzeria 2025-05-17.jpg', filename: 'cheese-garlic-bread.jpg' },
  { title: 'File:Peri Peri French Fries - Mum\'s Cafe, Vadodara - Gujarat - 01.jpg', filename: 'peri-peri-fries.jpg' },
  { title: 'File:Grilled Veggie Tofu Paneer Sandwich with Mango Chutney (4918261631).jpg', filename: 'paneer-sandwich.jpg' },
  { title: 'File:Veg Sandwich.jpg', filename: 'veg-sandwich.jpg' },
  { title: 'File:Indian Food snacks prasad-107.jpg', filename: 'fresh-lime-soda.jpg' },
  { title: 'File:Toast with butter - 2007-06-18.jpg', filename: 'bread-butter.jpg' },
  { title: 'File:Momos, fried.jpg', filename: 'fried-momos.jpg' },
  { title: 'File:Shahi Paneer (Paneer cooked in a rich, creamy, and mildly sweet gravy).jpg', filename: 'shahi-paneer.jpg' },
  { title: 'File:Club sandwich, 2021.jpg', filename: 'club-sandwich.jpg' },
  { title: 'File:Bombay Veg Sandwich.jpg', filename: 'bombay-masala-toast.jpg' }
];

async function main() {
  for (const item of directFiles) {
    try {
      console.log(`Fetching direct URL for ${item.title}...`);
      const directUrl = await getWikiImageUrl(item.title);
      if (directUrl) {
        await downloadFile(directUrl, item.filename);
      } else {
        console.warn(`No direct URL found for ${item.title}`);
      }
    } catch (e) {
      console.warn(`Error on ${item.title}: ${e.message}`);
    }
  }
}

main().catch(console.error);
