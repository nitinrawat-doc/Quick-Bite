/**
 * Centralized Food Item Image Mapping for QuickBite Frontend
 *
 * Maps every dish by its canonical, stable food name directly to its verified
 * correct image URL or local static asset path.
 */

export const FOOD_IMAGE_MAP = {
  // ─── Breakfast ──────────────────────────────────────────────────────────────
  'Aloo Paratha': '/images/food/aloo-paratha.jpg',
  'Aloo Paratha with Curd': '/images/food/aloo-paratha-curd.jpg',
  'Aloo Puri': '/images/food/aloo-puri.jpg',
  'Boiled Eggs': '/images/food/boiled-eggs.jpg',
  'Bread Butter': '/images/food/bread-butter.jpg',
  'Bread Omelette': '/images/food/bread-omelette.jpg',
  'Idli Sambhar': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
  'Masala Dosa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
  'Paneer Paratha': '/images/food/paneer-paratha.jpg',
  'Plain Dosa': '/images/food/plain-dosa.jpg',
  'Plain Paratha': '/images/food/plain-paratha.jpg',
  'Poha': '/images/food/poha.jpg',
  'Upma': '/images/food/upma.jpg',
  'Uttapam': '/images/food/uttapam.jpg',

  // ─── Maggi & Quick Snacks ───────────────────────────────────────────────────
  'Bread Pakora': '/images/food/bread-pakora.jpg',
  'Cheese Burger': '/images/food/cheese-burger.jpg',
  'Cheese Maggi': '/images/food/maggi-noodles.jpg',
  'Cheese Sandwich': '/images/food/cheese-sandwich.jpg',
  'Chicken Nuggets (6 pcs)': '/images/food/chicken-nuggets.jpg',
  'French Fries': 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&auto=format&fit=crop&q=80',
  'Fried Momos': '/images/food/fried-momos.jpg',
  'Grilled Sandwich': '/images/food/veg-sandwich.jpg',
  'Masala Fries': 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&q=80',
  'Masala Maggi': '/images/food/maggi-noodles.jpg',
  'Paneer Burger': '/images/food/paneer-burger.jpg',
  'Paneer Maggi': '/images/food/maggi-noodles.jpg',
  'Paneer Sandwich': '/images/food/paneer-sandwich.jpg',
  'Peri Peri Fries': '/images/food/peri-peri-fries.jpg',
  'Plain Maggi': '/images/food/plain-maggi.jpg',
  'Samosa': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
  'Spring Rolls': '/images/food/spring-rolls.jpg',
  'Veg Burger': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80',
  'Veg Cutlet': '/images/food/veg-cutlet.jpg',
  'Veg Maggi': '/images/food/maggi-noodles.jpg',
  'Veg Momos': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
  'Veg Sandwich': '/images/food/veg-sandwich.jpg',

  // ─── Indian Meals ───────────────────────────────────────────────────────────
  'Butter Chicken Rice Bowl': '/images/food/butter-chicken-rice-bowl.jpg',
  'Chole Bhature': '/images/food/chole-bhature.jpg',
  'Chole Chawal': '/images/food/chole-chawal.jpg',
  'Dal Makhani Thali': '/images/food/dal-makhani.jpg',
  'Dal Makhani with Rice': '/images/food/dal-makhani.jpg',
  'Dal Rice': '/images/food/dal-rice.jpg',
  'Dal Roti': '/images/food/dal-roti.jpg',
  'Kadhi Chawal': '/images/food/kadhi-chawal.jpg',
  'Mix Veg with Roti': '/images/food/mix-veg-roti.jpg',
  'Paneer Butter Masala with Rice': '/images/food/shahi-paneer.jpg',
  'Rajma Chawal': '/images/food/rajma-chawal.jpg',
  'Seasonal Sabzi with Roti': '/images/food/seasonal-sabzi-roti.jpg',
  'Shahi Paneer with Rice': '/images/food/shahi-paneer.jpg',
  'Special Thali': '/images/food/veg-thali.jpg',
  'Veg Biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
  'Veg Pulao': '/images/food/veg-pulao.jpg',
  'Veg Thali': '/images/food/veg-thali.jpg',

  // ─── Chinese & Indo-Chinese ─────────────────────────────────────────────────
  'Chilli Paneer': '/images/food/chilli-paneer.jpg',
  'Chilli Potato': '/images/food/chilli-potato.jpg',
  'Honey Chilli Potato': '/images/food/honey-chilli-potato.jpg',
  'Manchurian Fried Rice': '/images/food/manchurian-fried-rice.jpg',
  'Schezwan Fried Rice': '/images/food/schezwan-fried-rice.jpg',
  'Schezwan Noodles': '/images/food/schezwan-noodles.jpg',
  'Veg Fried Rice': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
  'Veg Hakka Noodles': '/images/food/veg-hakka-noodles.jpg',
  'Veg Manchurian': '/images/food/veg-manchurian.jpg',

  // ─── Pizza & Fast Food ──────────────────────────────────────────────────────
  'Cheese Garlic Bread': '/images/food/cheese-garlic-bread.jpg',
  'Garlic Bread': 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=600&auto=format&fit=crop&q=80',
  'Margherita Pizza': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80',
  'Red Sauce Pasta': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&auto=format&fit=crop&q=80',
  'Veg Pasta': '/images/food/veg-pasta.jpg',
  'Veggie Pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
  'White Sauce Pasta': '/images/food/white-sauce-pasta.jpg',

  // ─── Beverages ──────────────────────────────────────────────────────────────
  'Banana Shake': '/images/food/banana-shake.jpg',
  'Bottled Water': '/images/food/bottled-water.jpg',
  'Buttermilk': '/images/food/buttermilk.jpg',
  'Chocolate Shake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80',
  'Coffee': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
  'Cold Coffee': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80',
  'Fresh Lime Soda': '/images/food/fresh-lime-soda.jpg',
  'Hot Chocolate': 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600&auto=format&fit=crop&q=80',
  'Iced Tea': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
  'Lassi': '/images/food/lassi.jpg',
  'Lemon Water': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
  'Mango Lassi': '/images/food/mango-lassi.jpg',
  'Mango Shake': '/images/food/mango-shake.jpg',
  'Masala Chai': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80',
  'Packaged Juice': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80',
  'Regular Tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',

  // ─── Desserts ───────────────────────────────────────────────────────────────
  'Chocolate Brownie': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
  'Gulab Jamun': '/images/food/gulab-jamun.jpg',
  'Ice Cream': 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&auto=format&fit=crop&q=80',
  'Kheer': '/images/food/kheer.jpg',
  'Pastry': '/images/food/pastry.jpg',
  'Seasonal Sweet': '/images/food/seasonal-sweet.jpg',

  // ─── Burgers, Pizzas, Sandwiches, Momos (Legacy Categories) ──────────────────
  'Classic Smash Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
  'Crispy Chicken Burger': 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=600&q=80',
  'Veg Aloo Tikki Burger': '/images/hero-burger-crispy.jpg',
  'Margherita Classic': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
  'Paneer Tikka Pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
  'Peri-Peri Chicken Pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
  'Bombay Masala Toast': '/images/food/bombay-masala-toast.jpg',
  'Grilled Club Sandwich': '/images/food/club-sandwich.jpg',
  'Fried Chicken Momos': '/images/food/fried-momos.jpg',
  'Steamed Veg Momos': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&q=80',
};

export function getFoodImageByName(name) {
  if (!name || typeof name !== 'string') return null;
  return FOOD_IMAGE_MAP[name.trim()] || null;
}
