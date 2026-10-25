const https = require('https');
const fs = require('fs');
const path = require('path');

const destDir = path.resolve(__dirname, '../../../frontend/public/images/food');
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

function searchWiki(query) {
  return new Promise((resolve, reject) => {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&format=json`;
    https.get(url, { headers: { 'User-Agent': 'QuickBiteBot/1.0 (test@college.edu)' } }, (res) => {
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

function getWikiImageUrl(pageTitle) {
  return new Promise((resolve, reject) => {
    const cleanTitle = pageTitle.startsWith('File:') ? pageTitle : `File:${pageTitle}`;
    const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(cleanTitle)}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json`;
    https.get(url, { headers: { 'User-Agent': 'QuickBiteBot/1.0 (test@college.edu)' } }, (res) => {
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
    https.get(url, { headers: { 'User-Agent': 'QuickBiteBot/1.0 (test@college.edu)' } }, (res) => {
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
          console.log(`Saved ${destFilename} (${size} bytes)`);
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

const targets = [
  { term: 'Paratha with butter', filename: 'plain-paratha.jpg' },
  { term: 'Vegetable Pulao Indian', filename: 'veg-pulao.jpg' },
  { term: 'Spring rolls fried', filename: 'spring-rolls.jpg' },
  { term: 'Pasta Alfredo penne cream', filename: 'white-sauce-pasta.jpg' },
  { term: 'Bombay vegetable sandwich toast', filename: 'bombay-masala-toast.jpg' },
  { term: 'Club sandwich double decker', filename: 'club-sandwich.jpg' },
  { term: 'Grilled cheese sandwich', filename: 'cheese-sandwich.jpg' },
  { term: 'Vegetable sandwich bread', filename: 'veg-sandwich.jpg' },
  { term: 'Paneer sandwich grilled', filename: 'paneer-sandwich.jpg' },
  { term: 'Toast with butter slices', filename: 'bread-butter.jpg' },
  { term: 'Fried momos plate', filename: 'fried-momos.jpg' },
  { term: 'Steamed momos dumpling', filename: 'steamed-momos.jpg' },
  { term: 'Chicken momos steamed', filename: 'chicken-momos.jpg' },
  { term: 'Shahi Paneer gravy', filename: 'shahi-paneer.jpg' },
  { term: 'Hard boiled eggs sliced', filename: 'boiled-eggs.jpg' },
  { term: 'Bread omelette breakfast', filename: 'bread-omelette.jpg' },
  { term: 'Egg bhurji Indian', filename: 'egg-bhurji.jpg' },
  { term: 'Fresh lime soda glass', filename: 'fresh-lime-soda.jpg' },
  { term: 'Cheese garlic bread slices', filename: 'cheese-garlic-bread.jpg' },
  { term: 'Chilli potato crispy sesame', filename: 'honey-chilli-potato.jpg' },
  { term: 'Peri peri french fries spiced', filename: 'peri-peri-fries.jpg' },
  { term: 'Plain dosa Indian crepe', filename: 'plain-dosa.jpg' },
  { term: 'Cheese Maggi noodles', filename: 'cheese-maggi.jpg' },
  { term: 'Dal and roti Indian meal', filename: 'dal-roti.jpg' },
  { term: 'Cheeseburger cheddar burger', filename: 'cheese-burger.jpg' },
  { term: 'Schezwan fried rice wok', filename: 'schezwan-fried-rice.jpg' }
];

async function main() {
  for (const t of targets) {
    try {
      console.log(`\nQuerying for: ${t.term}`);
      const results = await searchWiki(t.term);
      if (results && results.length > 0) {
        let downloaded = false;
        for (let i = 0; i < Math.min(3, results.length); i++) {
          const directUrl = await getWikiImageUrl(results[i].title);
          if (directUrl) {
            console.log(`Attempting to download ${results[i].title}`);
            try {
              await downloadFile(directUrl, t.filename);
              downloaded = true;
              break;
            } catch (dlErr) {
              console.warn(`DL err: ${dlErr.message}`);
            }
          }
        }
        if (!downloaded) console.warn(`Could not download any candidate for ${t.filename}`);
      } else {
        console.warn(`No search results for ${t.term}`);
      }
    } catch (e) {
      console.warn(`Error on ${t.term}: ${e.message}`);
    }
  }
  console.log('\nAll done!');
}

main().catch(console.error);
