const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const token = jwt.sign(
  { id: '6ad4fc7539cd0c97da70d597', role: 'student' },
  process.env.JWT_SECRET || 'quickbite_jwt_secret_dev_key_2026',
  { expiresIn: '1d' }
);

async function verify() {
  console.log('--- 1. Testing GET /api/orders/QB-261024-6306 ---');
  const res = await fetch('http://localhost:5000/api/orders/QB-261024-6306', {
    headers: { Authorization: 'Bearer ' + token },
  });
  const data = await res.json();
  console.log('Response Status:', res.status, '| Success:', data.success);
  console.log('Order ID:', data.data?.orderId);

  for (const item of data.data.items) {
    const url = item.imageUrl.startsWith('/')
      ? 'http://localhost:5173' + item.imageUrl
      : item.imageUrl;
    const imgRes = await fetch(url);
    console.log(
      `Item: "${item.name}" | imageUrl: "${item.imageUrl}" -> HTTP ${imgRes.status} (${imgRes.headers.get('content-type')})`
    );
  }

  console.log('\n--- 2. Testing GET /api/orders (Student History) ---');
  const histRes = await fetch('http://localhost:5000/api/orders', {
    headers: { Authorization: 'Bearer ' + token },
  });
  const histData = await histRes.json();
  console.log('Response Status:', histRes.status, '| Orders Count:', histData.data?.orders?.length);

  for (const ord of histData.data.orders) {
    console.log(`Order ${ord.orderId} (${ord.items.length} items):`);
    for (const item of ord.items) {
      console.log(`  - "${item.name}": ${item.imageUrl}`);
    }
  }
}

verify().catch(console.error);
