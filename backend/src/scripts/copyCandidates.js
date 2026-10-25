const fs = require('fs');
const path = require('path');

const candidatesDir = path.resolve(__dirname, '../../scratch/candidates');
const destDir = path.resolve(__dirname, '../../../frontend/public/images/food');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const map = {
  'poha.jpg': 'poha.jpg',
  'upma.jpg': 'upma.jpg',
  'uttapam.jpg': 'uttapam.jpg',
  'chole_bhature.jpg': 'chole-bhature.jpg',
  'bread_pakora.jpg': 'bread-pakora.jpg',
  'veg_cutlet.jpg': 'veg-cutlet.jpg',
  'kadhi_chawal.jpg': 'kadhi-chawal.jpg',
  'dal_makhani.jpg': 'dal-makhani.jpg',
  'chole_chawal.jpg': 'chole-chawal.jpg',
  'dal_chawal.jpg': 'dal-rice.jpg',
  'butter_chicken.jpg': 'butter-chicken-rice-bowl.jpg',
  'mix_veg_roti.jpg': 'mix-veg-roti.jpg',
  'seasonal_sabzi_roti.jpg': 'seasonal-sabzi-roti.jpg',
  'veg_hakka_noodles.jpg': 'veg-hakka-noodles.jpg',
  'schezwan_noodles.jpg': 'schezwan-noodles.jpg',
  'chilli_paneer.jpg': 'chilli-paneer.jpg',
  'veg_manchurian.jpg': 'veg-manchurian.jpg',
  'chilli_potato.jpg': 'chilli-potato.jpg',
  'instant_noodles.jpg': 'maggi-noodles.jpg',
};

for (const [src, dest] of Object.entries(map)) {
  const srcPath = path.join(candidatesDir, src);
  const destPath = path.join(destDir, dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${src} -> ${dest} (${fs.statSync(destPath).size} bytes)`);
  } else {
    console.warn(`Source not found: ${srcPath}`);
  }
}
