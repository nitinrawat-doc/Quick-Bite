const fs = require('fs');
const path = require('path');
const https = require('https');

const destDir = path.resolve(__dirname, '../../../frontend/public/images/food');
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

function downloadImage(url, destFilename) {
  return new Promise((resolve, reject) => {
    const destPath = path.join(destDir, destFilename);
    const file = fs.createWriteStream(destPath);
    const req = https.get(url, {
      headers: {
        'User-Agent': 'QuickBiteCanteenApp/1.0 (contact: canteen@college.edu)'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // handle redirect
        file.close();
        fs.unlinkSync(destPath);
        return downloadImage(res.headers.location, destFilename).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          const size = fs.statSync(destPath).size;
          console.log(`✅ Saved ${destFilename} (${size} bytes)`);
          resolve(destPath);
        });
      });
    });
    req.on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

// Map of authentic food dish images from Wikimedia Commons / open sources
const downloads = [
  // Rajma Chawal
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Rajma_Chawal_with_onion_and_green_chilli.jpg/800px-Rajma_Chawal_with_onion_and_green_chilli.jpg',
    filename: 'rajma-chawal.jpg'
  },
  // Plain Paratha / Tawa Paratha
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Paratha_with_ghee.jpg/800px-Paratha_with_ghee.jpg',
    filename: 'plain-paratha.jpg'
  },
  // Veg Pulao
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Veg_Pulao.jpg/800px-Veg_Pulao.jpg',
    filename: 'veg-pulao.jpg'
  },
  // Spring Rolls
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Spring_rolls_with_sweet_chilli_sauce.jpg/800px-Spring_rolls_with_sweet_chilli_sauce.jpg',
    filename: 'spring-rolls.jpg'
  },
  // White Sauce Pasta / Alfredo Penne
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Penne_with_cream_sauce.jpg/800px-Penne_with_cream_sauce.jpg',
    filename: 'white-sauce-pasta.jpg'
  },
  // Bombay Masala Toast
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Bombay_Veg_Sandwich.jpg/800px-Bombay_Veg_Sandwich.jpg',
    filename: 'bombay-masala-toast.jpg'
  },
  // Grilled Club Sandwich
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Club_sandwich.png/800px-Club_sandwich.png',
    filename: 'club-sandwich.png'
  },
  // Cheese Sandwich / Grilled Sandwich
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tomato_je_04.jpg/800px-Tomato_je_04.jpg',
    filename: 'cheese-sandwich.jpg'
  },
  // Veg Sandwich
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Vegetable_Sandwich.jpg/800px-Vegetable_Sandwich.jpg',
    filename: 'veg-sandwich.jpg'
  },
  // Paneer Sandwich
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Paneer_Sandwich.jpg/800px-Paneer_Sandwich.jpg',
    filename: 'paneer-sandwich.jpg'
  },
  // Bread Butter
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Toast_with_butter.jpg/800px-Toast_with_butter.jpg',
    filename: 'bread-butter.jpg'
  },
  // Fried Momos
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Fried_Momo.jpg/800px-Fried_Momo.jpg',
    filename: 'fried-momos.jpg'
  },
  // Steamed Momos
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Momos_nepal.jpg/800px-Momos_nepal.jpg',
    filename: 'steamed-momos.jpg'
  },
  // Chicken Momos
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Chicken_momos.jpg/800px-Chicken_momos.jpg',
    filename: 'chicken-momos.jpg'
  },
  // Shahi Paneer
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Shahi_Paneer.jpg/800px-Shahi_Paneer.jpg',
    filename: 'shahi-paneer.jpg'
  },
  // Boiled Eggs
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Hard_boiled_egg_halves.jpg/800px-Hard_boiled_egg_halves.jpg',
    filename: 'boiled-eggs.jpg'
  },
  // Bread Omelette
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Bread_omelette_cut.jpg/800px-Bread_omelette_cut.jpg',
    filename: 'bread-omelette.jpg'
  },
  // Egg Bhurji
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Egg_Bhurji.jpg/800px-Egg_Bhurji.jpg',
    filename: 'egg-bhurji.jpg'
  },
  // Fresh Lime Soda
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Fresh_Lime_Soda.jpg/800px-Fresh_Lime_Soda.jpg',
    filename: 'fresh-lime-soda.jpg'
  },
  // Cheese Garlic Bread
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Garlic_bread_with_cheese.jpg/800px-Garlic_bread_with_cheese.jpg',
    filename: 'cheese-garlic-bread.jpg'
  },
  // Honey Chilli Potato
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Honey_Chilli_Potato.jpg/800px-Honey_Chilli_Potato.jpg',
    filename: 'honey-chilli-potato.jpg'
  },
  // Peri Peri Fries
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Peri_peri_french_fries.jpg/800px-Peri_peri_french_fries.jpg',
    filename: 'peri-peri-fries.jpg'
  },
  // Plain Dosa
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Dosa_chutney.jpg/800px-Dosa_chutney.jpg',
    filename: 'plain-dosa.jpg'
  },
  // Cheese Maggi
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Cheese_Maggi.jpg/800px-Cheese_Maggi.jpg',
    filename: 'cheese-maggi.jpg'
  },
  // Dal Roti
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Dal_and_Roti.jpg/800px-Dal_and_Roti.jpg',
    filename: 'dal-roti.jpg'
  }
];

async function main() {
  console.log(`Starting downloads for ${downloads.length} items...`);
  for (const item of downloads) {
    try {
      await downloadImage(item.url, item.filename);
    } catch (err) {
      console.warn(`Failed ${item.filename}: ${err.message}`);
    }
  }
  console.log('Finished download pass.');
}

main().catch(console.error);
