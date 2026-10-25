const https = require('https');

const candidates = [
  // Cheeseburger
  { name: 'cheese-burger', url: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&auto=format&fit=crop&q=80' },
  // White Sauce Pasta
  { name: 'white-sauce-pasta', url: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&auto=format&fit=crop&q=80' },
  // Veg Pasta
  { name: 'veg-pasta', url: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=600&auto=format&fit=crop&q=80' },
  // Club Sandwich
  { name: 'club-sandwich', url: 'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=600&auto=format&fit=crop&q=80' },
  // Bombay Masala Toast / Grilled Sandwich
  { name: 'grilled-sandwich', url: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=600&auto=format&fit=crop&q=80' },
  // Bread Butter
  { name: 'bread-butter', url: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=600&auto=format&fit=crop&q=80' },
  // Fried Dumplings / Momos
  { name: 'fried-momos', url: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600&auto=format&fit=crop&q=80' },
  // Boiled Eggs
  { name: 'boiled-eggs', url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&auto=format&fit=crop&q=80' },
  // Egg Scramble / Bhurji
  { name: 'egg-bhurji', url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80' },
  // Masala Fries
  { name: 'masala-fries', url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80' },
  // Shahi Paneer
  { name: 'shahi-paneer', url: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&auto=format&fit=crop&q=80' },
  // Paneer Burger
  { name: 'paneer-burger', url: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=600&auto=format&fit=crop&q=80' },
  // Noodles / Maggi bowl
  { name: 'maggi-bowl', url: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=600&auto=format&fit=crop&q=80' },
  // Cheese Noodles
  { name: 'cheese-maggi', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80' }
];

async function checkUrl(item) {
  return new Promise((resolve) => {
    https.get(item.url, (res) => {
      console.log(`[HTTP ${res.statusCode}] ${item.name} -> content-type: ${res.headers['content-type']}, length: ${res.headers['content-length']}`);
      resolve({ name: item.name, status: res.statusCode });
    }).on('error', (e) => {
      console.log(`[ERR] ${item.name}: ${e.message}`);
      resolve({ name: item.name, status: 0 });
    });
  });
}

async function main() {
  for (const c of candidates) {
    await checkUrl(c);
  }
}

main().catch(console.error);
