const https = require('https');
const fs = require('fs');
const path = require('path');

const destDir = path.resolve(__dirname, '../../../frontend/public/images/food');

const list = [
  { filename: 'cheese-burger.jpg', url: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&auto=format&fit=crop&q=80' },
  { filename: 'white-sauce-pasta.jpg', url: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&auto=format&fit=crop&q=80' },
  { filename: 'veg-pasta.jpg', url: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=600&auto=format&fit=crop&q=80' },
  { filename: 'club-sandwich.jpg', url: 'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=600&auto=format&fit=crop&q=80' },
  { filename: 'bombay-masala-toast.jpg', url: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=600&auto=format&fit=crop&q=80' },
  { filename: 'bread-butter.jpg', url: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=600&auto=format&fit=crop&q=80' },
  { filename: 'fried-momos.jpg', url: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600&auto=format&fit=crop&q=80' },
  { filename: 'boiled-eggs.jpg', url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&auto=format&fit=crop&q=80' },
  { filename: 'shahi-paneer.jpg', url: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&auto=format&fit=crop&q=80' },
  { filename: 'paneer-burger.jpg', url: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=600&auto=format&fit=crop&q=80' },
  { filename: 'plain-maggi.jpg', url: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=600&auto=format&fit=crop&q=80' }
];

function download(item) {
  return new Promise((resolve, reject) => {
    const dest = path.join(destDir, item.filename);
    const file = fs.createWriteStream(dest);
    https.get(item.url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          console.log(`Saved ${item.filename} (${fs.statSync(dest).size} bytes)`);
          resolve();
        });
      });
    }).on('error', reject);
  });
}

async function main() {
  for (const it of list) {
    try {
      await download(it);
    } catch (e) {
      console.warn(`Error on ${it.filename}: ${e.message}`);
    }
  }
}

main().catch(console.error);
