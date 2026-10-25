/**
 * Idempotent Indian College Canteen Seed Script for QuickBite
 *
 * Expands the campus canteen catalog to an authentic Indian college canteen
 * with ~85+ realistic food & beverage items across 7 core categories:
 * - Breakfast
 * - Maggi & Quick Snacks
 * - Indian Meals & Main Course
 * - Chinese & Indo-Chinese
 * - Pizza & Fast Food
 * - Beverages
 * - Desserts
 *
 * Safe Upsert Logic:
 * - Categories are upserted by unique slug.
 * - Food items are matched by unique name.
 * - If an item already exists, admin-edited prices, stock, image, and availability
 *   are strictly PRESERVED (no overwrites).
 * - Existing user accounts, orders, payments, and custom admin foods are untouched.
 *
 * Usage:
 *   cd backend
 *   npm run seed
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Category = require('../models/Category');
const FoodItem = require('../models/FoodItem');
const User = require('../models/User');
const { FOOD_IMAGE_MAP, getCorrectImageUrl } = require('../config/foodImageMap');

// ─── Categories ───────────────────────────────────────────────────────────────
const categories = [
  {
    name: 'Breakfast',
    slug: 'breakfast',
    icon: '🥞',
    sortOrder: 1,
    description: 'Hot fresh Indian breakfast & morning staples',
  },
  {
    name: 'Maggi & Quick Snacks',
    slug: 'snacks',
    icon: '🍟',
    sortOrder: 2,
    description: 'Crispy bites, pakoras, samosas & canteen Maggi',
  },
  {
    name: 'Indian Meals',
    slug: 'indian',
    icon: '🍛',
    sortOrder: 3,
    description: 'Comforting thalis, curries, rice bowls & combos',
  },
  {
    name: 'Chinese & Indo-Chinese',
    slug: 'chinese',
    icon: '🥢',
    sortOrder: 4,
    description: 'Sizzling noodles, fried rice & Manchurian',
  },
  {
    name: 'Pizza & Fast Food',
    slug: 'fast-food',
    icon: '🍕',
    sortOrder: 5,
    description: 'Loaded pizzas, pastas, burgers & sandwiches',
  },
  {
    name: 'Beverages',
    slug: 'drinks',
    icon: '☕',
    sortOrder: 6,
    description: 'Campus cutting chai, coffee, shakes & coolers',
  },
  {
    name: 'Desserts',
    slug: 'desserts',
    icon: '🍨',
    sortOrder: 7,
    description: 'Traditional Indian sweets, pastries & ice creams',
  },
  // Backward-compatibility categories for legacy items
  {
    name: 'Burgers',
    slug: 'burgers',
    icon: '🍔',
    sortOrder: 8,
    description: 'Juicy hand-crafted burgers',
  },
  {
    name: 'Pizza',
    slug: 'pizza',
    icon: '🍕',
    sortOrder: 9,
    description: 'Wood-fired style pizzas',
  },
  {
    name: 'Sandwiches',
    slug: 'sandwiches',
    icon: '🥪',
    sortOrder: 10,
    description: 'Fresh pressed sandwiches & subs',
  },
  {
    name: 'Momos',
    slug: 'momos',
    icon: '🥟',
    sortOrder: 11,
    description: 'Steamed & fried dumplings',
  },
];

// ─── Food Catalog by Category Slug ───────────────────────────────────────────
const foodCatalog = {
  // ─── A. Breakfast ───────────────────────────────────────────────────────────
  breakfast: [
    {
      name: 'Aloo Paratha',
      description: 'Spiced potato stuffed whole wheat paratha, pan-toasted with Amul butter and served with tangy mixed pickle.',
      sellingPrice: 45, costPrice: 18, stockQuantity: 40, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 8, tags: ['breakfast', 'bestseller', 'veg'],
    },
    {
      name: 'Paneer Paratha',
      description: 'Stuffed with freshly grated spiced paneer, green chillies and fresh herbs, served golden crisp with butter.',
      sellingPrice: 60, costPrice: 26, stockQuantity: 35, lowStockThreshold: 6,
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 10, tags: ['breakfast', 'popular', 'veg'],
    },
    {
      name: 'Plain Paratha',
      description: 'Flaky layered whole-wheat tawa paratha served piping hot with mango pickle and butter.',
      sellingPrice: 25, costPrice: 9, stockQuantity: 50, lowStockThreshold: 10,
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 6, tags: ['breakfast', 'budget', 'veg'],
    },
    {
      name: 'Aloo Puri',
      description: '4 fluffy golden deep-fried puris served with spicy, tangy Delhi-style rasedaar aloo sabzi and pickle.',
      sellingPrice: 50, costPrice: 20, stockQuantity: 45, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 8, tags: ['breakfast', 'popular', 'veg'],
    },
    {
      name: 'Poha',
      description: 'Light flattened rice tempered with mustard seeds, curry leaves, onions, crunchy roasted peanuts and lemon.',
      sellingPrice: 35, costPrice: 13, stockQuantity: 60, lowStockThreshold: 12,
      imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 5, tags: ['breakfast', 'light', 'veg'],
    },
    {
      name: 'Upma',
      description: 'Traditional roasted semolina porridge tempered with ginger, mustard seeds, green chillies, cashews and curry leaves.',
      sellingPrice: 35, costPrice: 12, stockQuantity: 40, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 5, tags: ['breakfast', 'healthy', 'veg'],
    },
    {
      name: 'Idli Sambhar',
      description: '3 soft, fluffy steamed rice-lentil cakes served with piping hot vegetable sambhar and fresh coconut chutney.',
      sellingPrice: 45, costPrice: 16, stockQuantity: 50, lowStockThreshold: 10,
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 5, tags: ['breakfast', 'south-indian', 'veg'],
    },
    {
      name: 'Masala Dosa',
      description: 'Golden crispy fermented crepe filled with spiced potato masala, served with sambhar and coconut chutney.',
      sellingPrice: 65, costPrice: 24, stockQuantity: 40, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 10, tags: ['breakfast', 'south-indian', 'bestseller'],
    },
    {
      name: 'Plain Dosa',
      description: 'Crisp golden rice-lentil crepe cooked with fresh butter, served with lentil sambhar and coconut chutney.',
      sellingPrice: 50, costPrice: 18, stockQuantity: 45, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 8, tags: ['breakfast', 'south-indian', 'veg'],
    },
    {
      name: 'Uttapam',
      description: 'Thick savoury rice pancake topped with finely chopped onions, tomatoes, green chillies and fresh coriander.',
      sellingPrice: 55, costPrice: 20, stockQuantity: 30, lowStockThreshold: 6,
      imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 10, tags: ['breakfast', 'south-indian', 'veg'],
    },
    {
      name: 'Bread Butter',
      description: '2 slices of fresh white bread spread generously with creamy salted Amul butter.',
      sellingPrice: 25, costPrice: 9, stockQuantity: 80, lowStockThreshold: 15,
      imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc7b?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 3, tags: ['breakfast', 'quick', 'veg'],
    },
    {
      name: 'Bread Omelette',
      description: 'Double egg fluffy spiced omelette seasoned with onions, chillies and coriander, wrapped between toasted bread.',
      sellingPrice: 45, costPrice: 17, stockQuantity: 50, lowStockThreshold: 10,
      imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80',
      isVeg: false, preparationTimeMinutes: 5, tags: ['breakfast', 'non-veg', 'popular'],
    },
    {
      name: 'Boiled Eggs',
      description: '2 fresh hard-boiled farm eggs sprinkled with black pepper, rock salt and chaat masala.',
      sellingPrice: 25, costPrice: 10, stockQuantity: 60, lowStockThreshold: 12,
      imageUrl: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=600&auto=format&fit=crop&q=80',
      isVeg: false, preparationTimeMinutes: 3, tags: ['breakfast', 'protein', 'non-veg'],
    },
  ],

  // ─── B. Maggi & Quick Snacks ───────────────────────────────────────────────
  snacks: [
    {
      name: 'Plain Maggi',
      description: 'Classic 2-minute canteen style noodles cooked in signature Maggi tastemaker broth.',
      sellingPrice: 30, costPrice: 11, stockQuantity: 100, lowStockThreshold: 20,
      imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 5, tags: ['maggi', 'canteen-special', 'veg'],
    },
    {
      name: 'Masala Maggi',
      description: 'Maggi noodles tossed with extra roasted cumin, garam masala, sautéed onions, chillies and fresh coriander.',
      sellingPrice: 40, costPrice: 15, stockQuantity: 90, lowStockThreshold: 15,
      imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 6, tags: ['maggi', 'bestseller', 'spicy'],
    },
    {
      name: 'Veg Maggi',
      description: 'Maggi noodles loaded with sweet green peas, diced carrots, capsicum, onions and sweet corn.',
      sellingPrice: 45, costPrice: 17, stockQuantity: 80, lowStockThreshold: 15,
      imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 7, tags: ['maggi', 'veg', 'popular'],
    },
    {
      name: 'Cheese Maggi',
      description: 'Hot masala Maggi topped with generous molten shredded processed cheddar cheese.',
      sellingPrice: 55, costPrice: 22, stockQuantity: 70, lowStockThreshold: 12,
      imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 7, tags: ['maggi', 'cheese', 'bestseller'],
    },
    {
      name: 'Paneer Maggi',
      description: 'Masala noodles stir-fried with juicy sautéed paneer cubes, crunchy capsicum and special herbs.',
      sellingPrice: 60, costPrice: 25, stockQuantity: 65, lowStockThreshold: 10,
      imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 8, tags: ['maggi', 'paneer', 'veg'],
    },
    {
      name: 'Veg Sandwich',
      description: 'Classic double-slice sandwich filled with fresh cucumber, tomato, onion and tangy green mint chutney.',
      sellingPrice: 35, costPrice: 13, stockQuantity: 60, lowStockThreshold: 10,
      imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 5, tags: ['sandwich', 'light', 'veg'],
    },
    {
      name: 'Grilled Sandwich',
      description: 'Crisp buttery toasted sandwich with spiced vegetable filling, potatoes and cheese spread.',
      sellingPrice: 50, costPrice: 19, stockQuantity: 50, lowStockThreshold: 10,
      imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 7, tags: ['sandwich', 'grilled', 'popular'],
    },
    {
      name: 'Cheese Sandwich',
      description: 'Golden butter-grilled sandwich stuffed with melting mozzarella-cheddar blend, herbs and capsicum.',
      sellingPrice: 60, costPrice: 24, stockQuantity: 45, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 6, tags: ['sandwich', 'cheese', 'veg'],
    },
    {
      name: 'Paneer Sandwich',
      description: 'Grilled sandwich packed with tandoori spiced paneer cubes, onion rings and creamy green mayo.',
      sellingPrice: 65, costPrice: 27, stockQuantity: 40, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 8, tags: ['sandwich', 'paneer', 'bestseller'],
    },
    {
      name: 'Veg Burger',
      description: 'Crispy seasoned vegetable patty in a sesame brioche bun with lettuce, tomato and signature QB burger sauce.',
      sellingPrice: 50, costPrice: 19, stockQuantity: 50, lowStockThreshold: 10,
      imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 7, tags: ['burger', 'veg', 'bestseller'],
    },
    {
      name: 'Cheese Burger',
      description: 'Crispy veg patty topped with a melted cheddar slice, pickles, onion rings and creamy herb sauce.',
      sellingPrice: 65, costPrice: 25, stockQuantity: 40, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 8, tags: ['burger', 'cheese', 'popular'],
    },
    {
      name: 'Paneer Burger',
      description: 'Spiced grilled paneer patty with chipotle dressing, onions, sliced tomato and crisp lettuce in a soft bun.',
      sellingPrice: 75, costPrice: 30, stockQuantity: 35, lowStockThreshold: 6,
      imageUrl: 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 8, tags: ['burger', 'paneer', 'veg'],
    },
    {
      name: 'French Fries',
      description: 'Golden crispy salted potato fingers served hot with tomato ketchup and garlic mayo dip.',
      sellingPrice: 50, costPrice: 16, stockQuantity: 80, lowStockThreshold: 15,
      imageUrl: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 5, tags: ['snacks', 'fries', 'veg'],
    },
    {
      name: 'Peri Peri Fries',
      description: 'Crisp hot fries tossed in an aromatic, zesty African peri peri spice blend.',
      sellingPrice: 60, costPrice: 20, stockQuantity: 75, lowStockThreshold: 15,
      imageUrl: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 5, tags: ['snacks', 'fries', 'spicy'],
    },
    {
      name: 'Veg Momos',
      description: '6 delicate steamed dumplings stuffed with minced cabbage, carrot, ginger and spring onions, with fiery chilli dip.',
      sellingPrice: 50, costPrice: 18, stockQuantity: 60, lowStockThreshold: 12,
      imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 8, tags: ['momos', 'steamed', 'bestseller'],
    },
    {
      name: 'Fried Momos',
      description: '6 golden crispy fried dumplings served with spicy garlic-tomato chutney and mayonnaise.',
      sellingPrice: 60, costPrice: 22, stockQuantity: 50, lowStockThreshold: 10,
      imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 8, tags: ['momos', 'crispy', 'popular'],
    },
    {
      name: 'Spring Rolls',
      description: '2 crispy fried golden rolls packed with shredded wok-tossed vegetables and glass noodles.',
      sellingPrice: 50, costPrice: 19, stockQuantity: 45, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1616501268004-0b4ecac6c2b3?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 8, tags: ['snacks', 'crispy', 'veg'],
    },
    {
      name: 'Samosa',
      description: 'Flaky, golden triangular pastry stuffed with spicy cumin-tempered potatoes and green peas.',
      sellingPrice: 15, costPrice: 5, stockQuantity: 120, lowStockThreshold: 25,
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 2, tags: ['snacks', 'budget', 'bestseller'],
    },
    {
      name: 'Bread Pakora',
      description: 'Spiced potato mash sandwiched in bread, dipped in seasoned gram flour batter and deep-fried golden.',
      sellingPrice: 25, costPrice: 9, stockQuantity: 70, lowStockThreshold: 15,
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 4, tags: ['snacks', 'chai-time', 'veg'],
    },
    {
      name: 'Veg Cutlet',
      description: '2 spiced mashed potato, beetroot and pea patties with a crispy breadcrumb coating, served with mint chutney.',
      sellingPrice: 35, costPrice: 13, stockQuantity: 50, lowStockThreshold: 10,
      imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 5, tags: ['snacks', 'crispy', 'veg'],
    },
    {
      name: 'Masala Fries',
      description: 'Thick-cut fries tossed with chaat masala, lemon and coriander. Irresistibly addictive.',
      sellingPrice: 59, costPrice: 18, stockQuantity: 80, lowStockThreshold: 15,
      imageUrl: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&q=80',
      isVeg: true, preparationTimeMinutes: 7, tags: ['veg', 'sides'],
    },
    {
      name: 'Chicken Nuggets (6 pcs)',
      description: 'Golden crispy chicken nuggets with a seasoned crumb. Served with dipping sauce.',
      sellingPrice: 89, costPrice: 35, stockQuantity: 55, lowStockThreshold: 10,
      imageUrl: '/images/food/chicken-nuggets.jpg',
      isVeg: false, preparationTimeMinutes: 10, tags: ['non-veg', 'kids'],
    },
  ],

  // ─── C. Indian Meals & Main Course ──────────────────────────────────────────
  indian: [
    {
      name: 'Rajma Chawal',
      description: 'Slow-simmered Punjabi red kidney beans in rich spiced tomato gravy served with fluffy steamed basmati rice.',
      sellingPrice: 70, costPrice: 27, stockQuantity: 45, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 5, tags: ['meals', 'punjabi', 'bestseller'],
    },
    {
      name: 'Chole Chawal',
      description: 'Traditional Amritsari spiced chickpeas cooked in onion-tomato masala served with hot steamed basmati rice.',
      sellingPrice: 70, costPrice: 27, stockQuantity: 45, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 5, tags: ['meals', 'chole', 'popular'],
    },
    {
      name: 'Dal Rice',
      description: 'Homestyle yellow arhar dal tempered with cumin, garlic and ghee served with steamed rice and pickle.',
      sellingPrice: 60, costPrice: 21, stockQuantity: 50, lowStockThreshold: 10,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 4, tags: ['meals', 'homestyle', 'budget'],
    },
    {
      name: 'Kadhi Chawal',
      description: 'Tangy spiced yogurt and gram-flour kadhi with soft onion pakoras served with hot basmati rice.',
      sellingPrice: 65, costPrice: 23, stockQuantity: 40, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 5, tags: ['meals', 'homestyle', 'veg'],
    },
    {
      name: 'Veg Pulao',
      description: 'Fragrant long-grain basmati rice cooked with fresh seasonal vegetables, whole spices and mint.',
      sellingPrice: 75, costPrice: 28, stockQuantity: 40, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 6, tags: ['meals', 'rice', 'veg'],
    },
    {
      name: 'Veg Biryani',
      description: 'Layered dum biryani with marinated vegetables, aromatic saffron rice, fried onions and cooling cucumber raita.',
      sellingPrice: 95, costPrice: 36, stockQuantity: 35, lowStockThreshold: 6,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 8, tags: ['meals', 'biryani', 'bestseller'],
    },
    {
      name: 'Chole Bhature',
      description: '2 large puffy golden bhatures served with spicy pindi chole, pickled onions, fried green chilli and lemon.',
      sellingPrice: 75, costPrice: 29, stockQuantity: 50, lowStockThreshold: 10,
      imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 8, tags: ['meals', 'punjabi', 'bestseller'],
    },
    {
      name: 'Aloo Paratha with Curd',
      description: '2 stuffed aloo parathas served with a bowl of chilled creamy curd, Amul butter and spicy mixed pickle.',
      sellingPrice: 80, costPrice: 31, stockQuantity: 40, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 10, tags: ['meals', 'paratha', 'combo'],
    },
    {
      name: 'Paneer Butter Masala with Rice',
      description: 'Soft cottage cheese cubes in silky tomato-cashew makhani gravy served with steamed fragrant basmati rice.',
      sellingPrice: 110, costPrice: 44, stockQuantity: 30, lowStockThreshold: 5,
      imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&q=80',
      isVeg: true, preparationTimeMinutes: 8, tags: ['meals', 'paneer', 'premium'],
    },
    {
      name: 'Shahi Paneer with Rice',
      description: 'Royal preparation of soft paneer in fragrant sweet-and-nutty cream gravy served with basmati rice.',
      sellingPrice: 115, costPrice: 46, stockQuantity: 28, lowStockThreshold: 5,
      imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&q=80',
      isVeg: true, preparationTimeMinutes: 8, tags: ['meals', 'paneer', 'popular'],
    },
    {
      name: 'Dal Makhani with Rice',
      description: 'Overnight slow-cooked black lentils simmered with butter and fresh cream, served with steamed basmati rice.',
      sellingPrice: 95, costPrice: 36, stockQuantity: 35, lowStockThreshold: 6,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 6, tags: ['meals', 'dal', 'classic'],
    },
    {
      name: 'Mix Veg with Roti',
      description: 'Fresh medley of seasonal vegetables sautéed with dry Indian spices, served with 4 whole-wheat tawa rotis.',
      sellingPrice: 75, costPrice: 28, stockQuantity: 30, lowStockThreshold: 6,
      imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&q=80',
      isVeg: true, preparationTimeMinutes: 8, tags: ['meals', 'roti', 'healthy'],
    },
    {
      name: 'Seasonal Sabzi with Roti',
      description: 'Daily campus canteen seasonal vegetable special served with 4 soft buttered whole-wheat rotis.',
      sellingPrice: 65, costPrice: 24, stockQuantity: 40, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&q=80',
      isVeg: true, preparationTimeMinutes: 8, tags: ['meals', 'daily-special', 'veg'],
    },
    {
      name: 'Dal Roti',
      description: 'Comforting homestyle yellow dal tadka served with 4 soft whole-wheat tawa rotis and onion salad.',
      sellingPrice: 60, costPrice: 21, stockQuantity: 45, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 6, tags: ['meals', 'homestyle', 'budget'],
    },
    {
      name: 'Veg Thali',
      description: 'Wholesome campus thali: Dal Tadka, Seasonal Sabzi, Steamed Basmati Rice, 3 Tawa Rotis, Salad and Pickle.',
      sellingPrice: 90, costPrice: 35, stockQuantity: 50, lowStockThreshold: 10,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 6, tags: ['meals', 'thali', 'bestseller'],
    },
    {
      name: 'Special Thali',
      description: 'Premium canteen thali: Shahi Paneer, Dal Makhani, Veg Pulao, 4 Butter Rotis, Boondi Raita, Salad, Papad and Gulab Jamun.',
      sellingPrice: 140, costPrice: 54, stockQuantity: 30, lowStockThreshold: 5,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 8, tags: ['meals', 'thali', 'premium'],
    },
    {
      name: 'Dal Makhani Thali',
      description: 'Slow-cooked black lentil dal with 3 rotis, steamed rice, salad and pickle.',
      sellingPrice: 129, costPrice: 50, stockQuantity: 20, lowStockThreshold: 5,
      imageUrl: '/images/food/dal-makhani.jpg',
      isVeg: true, preparationTimeMinutes: 5, tags: ['veg', 'meal'],
    },
    {
      name: 'Butter Chicken Rice Bowl',
      description: 'Tender chicken in a rich tomato-butter-cream gravy served over steamed basmati rice.',
      sellingPrice: 149, costPrice: 60, stockQuantity: 18, lowStockThreshold: 4,
      imageUrl: '/images/food/butter-chicken-rice-bowl.jpg',
      isVeg: false, preparationTimeMinutes: 8, tags: ['non-veg', 'popular'],
    },
  ],

  // ─── D. Chinese & Indo-Chinese ───────────────────────────────────────────────
  chinese: [
    {
      name: 'Veg Hakka Noodles',
      description: 'Wok-tossed noodles with shredded cabbage, crunchy capsicum, carrots, spring onions and dark soy sauce.',
      sellingPrice: 65, costPrice: 24, stockQuantity: 50, lowStockThreshold: 10,
      imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 7, tags: ['chinese', 'noodles', 'bestseller'],
    },
    {
      name: 'Schezwan Noodles',
      description: 'Fiery wok-fried noodles tossed in house-made spicy Sichuan chilli paste, garlic and crunchy vegetables.',
      sellingPrice: 75, costPrice: 28, stockQuantity: 45, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 8, tags: ['chinese', 'noodles', 'spicy'],
    },
    {
      name: 'Veg Fried Rice',
      description: 'Fluffy long-grain rice wok-tossed with finely diced vegetables, garlic, pepper and dark soy seasoning.',
      sellingPrice: 65, costPrice: 24, stockQuantity: 45, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 7, tags: ['chinese', 'rice', 'veg'],
    },
    {
      name: 'Schezwan Fried Rice',
      description: 'Wok-tossed spicy fried rice coated in red chilli schezwan sauce with spring onion greens and vegetables.',
      sellingPrice: 75, costPrice: 28, stockQuantity: 40, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 8, tags: ['chinese', 'rice', 'spicy'],
    },
    {
      name: 'Chilli Potato',
      description: 'Crispy deep-fried potato batons tossed in a spicy, tangy Indo-Chinese chilli garlic sauce with spring onions.',
      sellingPrice: 60, costPrice: 22, stockQuantity: 55, lowStockThreshold: 10,
      imageUrl: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 7, tags: ['chinese', 'starter', 'bestseller'],
    },
    {
      name: 'Honey Chilli Potato',
      description: 'Golden fried potato fingers coated in sweet honey glaze, toasted sesame seeds and spicy red chilli sauce.',
      sellingPrice: 70, costPrice: 26, stockQuantity: 50, lowStockThreshold: 10,
      imageUrl: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 7, tags: ['chinese', 'starter', 'popular'],
    },
    {
      name: 'Chilli Paneer',
      description: 'Crispy batter-fried paneer cubes tossed with diced bell peppers, onions, green chillies and dark soya sauce.',
      sellingPrice: 95, costPrice: 38, stockQuantity: 35, lowStockThreshold: 6,
      imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 9, tags: ['chinese', 'paneer', 'bestseller'],
    },
    {
      name: 'Veg Manchurian',
      description: 'Crispy fried vegetable dumplings tossed in savoury ginger, garlic, green coriander and soya gravy.',
      sellingPrice: 80, costPrice: 30, stockQuantity: 40, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 8, tags: ['chinese', 'manchurian', 'popular'],
    },
    {
      name: 'Manchurian Fried Rice',
      description: 'Savoury combination plate of vegetable fried rice served with crispy veg manchurian balls in rich gravy.',
      sellingPrice: 99, costPrice: 39, stockQuantity: 35, lowStockThreshold: 6,
      imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 9, tags: ['chinese', 'combo', 'bestseller'],
    },
  ],

  // ─── E. Pizza & Fast Food ───────────────────────────────────────────────────
  'fast-food': [
    {
      name: 'Margherita Pizza',
      description: '7-inch personal pan pizza with San Marzano tomato herb sauce, extra-virgin olive oil and mozzarella cheese.',
      sellingPrice: 119, costPrice: 46, stockQuantity: 30, lowStockThreshold: 5,
      imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 12, tags: ['pizza', 'cheese', 'classic'],
    },
    {
      name: 'Veggie Pizza',
      description: '7-inch pan pizza loaded with diced capsicum, red onion, sweet corn, sliced tomatoes and mozzarella.',
      sellingPrice: 139, costPrice: 53, stockQuantity: 28, lowStockThreshold: 5,
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 12, tags: ['pizza', 'veggie', 'popular'],
    },
    {
      name: 'Garlic Bread',
      description: '3 slices of freshly toasted French baguette brushed with garlic herb butter and parsley.',
      sellingPrice: 50, costPrice: 17, stockQuantity: 50, lowStockThreshold: 10,
      imageUrl: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 6, tags: ['fast-food', 'sides', 'veg'],
    },
    {
      name: 'Cheese Garlic Bread',
      description: 'Warm oven-toasted garlic bread smothered with melting mozzarella, chilli flakes and Italian oregano.',
      sellingPrice: 75, costPrice: 28, stockQuantity: 40, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 8, tags: ['fast-food', 'cheese', 'bestseller'],
    },
    {
      name: 'Veg Pasta',
      description: 'Penne pasta tossed with sautéed seasonal vegetables, garlic, herbs and a balanced house sauce.',
      sellingPrice: 85, costPrice: 32, stockQuantity: 35, lowStockThreshold: 6,
      imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 10, tags: ['pasta', 'veg', 'popular'],
    },
    {
      name: 'White Sauce Pasta',
      description: 'Creamy Italian penne pasta tossed in rich cheesy béchamel sauce with sweet corn, mushrooms and herbs.',
      sellingPrice: 99, costPrice: 38, stockQuantity: 35, lowStockThreshold: 6,
      imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 10, tags: ['pasta', 'creamy', 'bestseller'],
    },
    {
      name: 'Red Sauce Pasta',
      description: 'Penne pasta simmered in tangy, spicy arrabbiata tomato sauce with black olives and bell peppers.',
      sellingPrice: 95, costPrice: 36, stockQuantity: 35, lowStockThreshold: 6,
      imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 10, tags: ['pasta', 'tangy', 'veg'],
    },
  ],

  // ─── F. Beverages ───────────────────────────────────────────────────────────
  drinks: [
    {
      name: 'Masala Chai',
      description: 'Authentic college canteen milk tea freshly brewed with crushed ginger, green cardamom and black tea leaves.',
      sellingPrice: 15, costPrice: 5, stockQuantity: 150, lowStockThreshold: 30,
      imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 3, tags: ['beverages', 'chai', 'bestseller'],
    },
    {
      name: 'Regular Tea',
      description: 'Classic Indian milk chai brewed with premium Assam tea leaves and sugar to taste.',
      sellingPrice: 12, costPrice: 4, stockQuantity: 120, lowStockThreshold: 25,
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 3, tags: ['beverages', 'chai', 'budget'],
    },
    {
      name: 'Coffee',
      description: 'Hot frothy milk coffee prepared canteen-style with rich blended roasted chicory-coffee beans.',
      sellingPrice: 20, costPrice: 7, stockQuantity: 100, lowStockThreshold: 20,
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 3, tags: ['beverages', 'coffee', 'popular'],
    },
    {
      name: 'Cold Coffee',
      description: 'Thick, frothy chilled blended coffee with rich dairy milk, vanilla ice cream and chocolate drizzle.',
      sellingPrice: 50, costPrice: 18, stockQuantity: 80, lowStockThreshold: 15,
      imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 3, tags: ['beverages', 'cold', 'bestseller'],
    },
    {
      name: 'Iced Tea',
      description: 'Refreshing chilled black tea infused with real lemon juice, fresh mint sprigs and cane sugar.',
      sellingPrice: 40, costPrice: 12, stockQuantity: 60, lowStockThreshold: 12,
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 2, tags: ['beverages', 'iced', 'refreshing'],
    },
    {
      name: 'Hot Chocolate',
      description: 'Rich, creamy warm milk cocoa drink topped with dark chocolate shavings.',
      sellingPrice: 55, costPrice: 20, stockQuantity: 40, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 4, tags: ['beverages', 'chocolate', 'sweet'],
    },
    {
      name: 'Fresh Lime Soda',
      description: 'Freshly squeezed lime juice with chilled sparkling soda, rock salt and sugar syrup (Sweet / Salt / Mixed).',
      sellingPrice: 30, costPrice: 9, stockQuantity: 90, lowStockThreshold: 15,
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 2, tags: ['beverages', 'cooler', 'popular'],
    },
    {
      name: 'Lemon Water',
      description: 'Classic chilled shikanji with freshly squeezed lime, roasted cumin, black salt and mint.',
      sellingPrice: 20, costPrice: 6, stockQuantity: 90, lowStockThreshold: 15,
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 2, tags: ['beverages', 'cooler', 'budget'],
    },
    {
      name: 'Mango Shake',
      description: 'Thick chilled mango milkshake prepared with real Alphonso mango pulp and creamy dairy milk.',
      sellingPrice: 50, costPrice: 18, stockQuantity: 60, lowStockThreshold: 12,
      imageUrl: 'https://images.unsplash.com/photo-1570696516188-ade861b84a49?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 3, tags: ['beverages', 'shake', 'bestseller'],
    },
    {
      name: 'Banana Shake',
      description: 'Freshly blended ripe bananas with cold milk, honey and a pinch of fragrant cardamom.',
      sellingPrice: 45, costPrice: 15, stockQuantity: 50, lowStockThreshold: 10,
      imageUrl: 'https://images.unsplash.com/photo-1570696516188-ade861b84a49?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 3, tags: ['beverages', 'shake', 'energy'],
    },
    {
      name: 'Chocolate Shake',
      description: 'Decadent thick shake blended with cocoa, rich chocolate syrup, milk and vanilla ice cream.',
      sellingPrice: 55, costPrice: 20, stockQuantity: 50, lowStockThreshold: 10,
      imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 3, tags: ['beverages', 'shake', 'popular'],
    },
    {
      name: 'Buttermilk',
      description: 'Spiced salted chhaas tempered with roasted cumin, rock salt, ginger and fresh green coriander.',
      sellingPrice: 20, costPrice: 7, stockQuantity: 80, lowStockThreshold: 15,
      imageUrl: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 2, tags: ['beverages', 'healthy', 'traditional'],
    },
    {
      name: 'Lassi',
      description: 'Traditional sweet thick Punjabi curd drink served chilled with a rich creamy layer on top.',
      sellingPrice: 40, costPrice: 14, stockQuantity: 60, lowStockThreshold: 12,
      imageUrl: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 2, tags: ['beverages', 'traditional', 'popular'],
    },
    {
      name: 'Bottled Water',
      description: '1 Litre sealed packaged mineral drinking water bottle.',
      sellingPrice: 20, costPrice: 13, stockQuantity: 150, lowStockThreshold: 30,
      imageUrl: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 1, tags: ['beverages', 'essential', 'veg'],
    },
    {
      name: 'Packaged Juice',
      description: '200ml tetra pack of chilled fruit juice (Mixed Fruit / Guava / Mango).',
      sellingPrice: 25, costPrice: 17, stockQuantity: 100, lowStockThreshold: 20,
      imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 1, tags: ['beverages', 'juice', 'packaged'],
    },
    {
      name: 'Mango Lassi',
      description: 'Thick, chilled yogurt drink blended with Alphonso mango pulp and a pinch of cardamom.',
      sellingPrice: 69, costPrice: 22, stockQuantity: 77, lowStockThreshold: 10,
      imageUrl: '/images/food/mango-lassi.jpg',
      isVeg: true, preparationTimeMinutes: 3, tags: ['veg', 'refreshing'],
    },
  ],

  // ─── G. Desserts ────────────────────────────────────────────────────────────
  desserts: [
    {
      name: 'Gulab Jamun',
      description: '2 warm, soft milk-solid dumplings soaked in aromatic green cardamom and rosewater sugar syrup.',
      sellingPrice: 35, costPrice: 12, stockQuantity: 60, lowStockThreshold: 12,
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 2, tags: ['desserts', 'indian-sweet', 'bestseller'],
    },
    {
      name: 'Ice Cream',
      description: 'Single scoop of rich creamy dairy ice cream (Choice of Vanilla, Rich Chocolate, or Butterscotch).',
      sellingPrice: 30, costPrice: 11, stockQuantity: 80, lowStockThreshold: 15,
      imageUrl: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 1, tags: ['desserts', 'chilled', 'popular'],
    },
    {
      name: 'Chocolate Brownie',
      description: 'Warm fudge chocolate brownie loaded with walnut bits, drizzled with hot chocolate ganache.',
      sellingPrice: 55, costPrice: 20, stockQuantity: 40, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 3, tags: ['desserts', 'chocolate', 'bestseller'],
    },
    {
      name: 'Pastry',
      description: 'Fresh slice of bakery cream pastry (Black Forest, Pineapple, or Dutch Chocolate).',
      sellingPrice: 45, costPrice: 16, stockQuantity: 40, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 1, tags: ['desserts', 'bakery', 'popular'],
    },
    {
      name: 'Kheer',
      description: 'Traditional slow-cooked fragrant rice pudding in sweetened whole milk, garnished with sliced almonds and pistachios.',
      sellingPrice: 40, costPrice: 14, stockQuantity: 35, lowStockThreshold: 6,
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 2, tags: ['desserts', 'traditional', 'veg'],
    },
    {
      name: 'Seasonal Sweet',
      description: 'Daily campus canteen special Indian sweet (Hot Gajar Halwa in winters / Besan Ladoo / Fresh Jalebi).',
      sellingPrice: 40, costPrice: 14, stockQuantity: 40, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
      isVeg: true, preparationTimeMinutes: 2, tags: ['desserts', 'daily-special', 'sweet'],
    },
  ],

  // ─── H. Burgers (Legacy & Classic) ──────────────────────────────────────────
  burgers: [
    {
      name: 'Classic Smash Burger',
      description: 'Double smash patty with American cheese, pickles, caramelised onions and special QB sauce on a brioche bun.',
      sellingPrice: 149, costPrice: 65, stockQuantity: 40, lowStockThreshold: 8,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
      isVeg: false, preparationTimeMinutes: 12, tags: ['bestseller', 'non-veg'],
    },
    {
      name: 'Crispy Chicken Burger',
      description: 'Buttermilk-marinated crispy chicken thigh with coleslaw, jalapeños and chipotle mayo.',
      sellingPrice: 139, costPrice: 58, stockQuantity: 35, lowStockThreshold: 6,
      imageUrl: 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=600&q=80',
      isVeg: false, preparationTimeMinutes: 14, tags: ['non-veg', 'spicy'],
    },
    {
      name: 'Veg Aloo Tikki Burger',
      description: 'Spiced potato patty with mint chutney, onion rings and tomato in a soft sesame bun.',
      sellingPrice: 89, costPrice: 30, stockQuantity: 47, lowStockThreshold: 10,
      imageUrl: '/images/hero-burger-crispy.jpg',
      isVeg: true, preparationTimeMinutes: 10, tags: ['veg', 'popular'],
    },
  ],

  // ─── I. Pizza (Legacy & Classic) ────────────────────────────────────────────
  pizza: [
    {
      name: 'Margherita Classic',
      description: 'San Marzano tomato base, fresh mozzarella, hand-torn basil and extra-virgin olive oil.',
      sellingPrice: 179, costPrice: 70, stockQuantity: 25, lowStockThreshold: 5,
      imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
      isVeg: true, preparationTimeMinutes: 18, tags: ['veg', 'classic'],
    },
    {
      name: 'Paneer Tikka Pizza',
      description: 'Tandoori-spiced paneer cubes, crisp bell peppers, red onions and mozzarella on a tikka sauce base.',
      sellingPrice: 199, costPrice: 78, stockQuantity: 30, lowStockThreshold: 6,
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
      isVeg: true, preparationTimeMinutes: 18, tags: ['veg', 'popular'],
    },
    {
      name: 'Peri-Peri Chicken Pizza',
      description: 'Spicy peri-peri chicken strips, capsicum, red onion and mozzarella on a garlic butter base.',
      sellingPrice: 219, costPrice: 90, stockQuantity: 20, lowStockThreshold: 4,
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
      isVeg: false, preparationTimeMinutes: 20, tags: ['non-veg', 'spicy'],
    },
  ],

  // ─── J. Sandwiches (Legacy & Classic) ───────────────────────────────────────
  sandwiches: [
    {
      name: 'Grilled Club Sandwich',
      description: 'Triple-decker with grilled chicken, bacon strips, egg, lettuce, tomato and mayo.',
      sellingPrice: 119, costPrice: 48, stockQuantity: 29, lowStockThreshold: 6,
      imageUrl: '/images/food/club-sandwich.jpg',
      isVeg: false, preparationTimeMinutes: 10, tags: ['non-veg', 'hearty'],
    },
    {
      name: 'Bombay Masala Toast',
      description: 'Spiced potato filling with green chutney, cheese and crunchy sev on toasted bread.',
      sellingPrice: 69, costPrice: 22, stockQuantity: 60, lowStockThreshold: 12,
      imageUrl: '/images/food/bombay-masala-toast.jpg',
      isVeg: true, preparationTimeMinutes: 8, tags: ['veg', 'street-food'],
    },
  ],

  // ─── K. Momos (Legacy & Classic) ───────────────────────────────────────────
  momos: [
    {
      name: 'Steamed Veg Momos',
      description: 'Silky steamed dumplings filled with spiced cabbage, carrot and tofu. Served with red chilli chutney.',
      sellingPrice: 79, costPrice: 28, stockQuantity: 45, lowStockThreshold: 10,
      imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&q=80',
      isVeg: true, preparationTimeMinutes: 15, tags: ['veg', 'bestseller'],
    },
    {
      name: 'Fried Chicken Momos',
      description: 'Pan-fried juicy chicken momos tossed in a fiery chilli-garlic sauce.',
      sellingPrice: 99, costPrice: 40, stockQuantity: 38, lowStockThreshold: 8,
      imageUrl: '/images/food/fried-momos.jpg',
      isVeg: false, preparationTimeMinutes: 18, tags: ['non-veg', 'spicy'],
    },
  ],
};

// Ensure all catalog entries in code reference their canonical verified images
for (const items of Object.values(foodCatalog)) {
  for (const item of items) {
    const verified = getCorrectImageUrl(item.name);
    if (verified) {
      item.imageUrl = verified;
    }
  }
}

// ─── Main Seed Function ───────────────────────────────────────────────────────
async function seed() {
  console.log('\n======================================================');
  console.log('   🌱  QuickBite Indian College Canteen Menu Seeder');
  console.log('======================================================\n');

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is missing.');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅  Connected to MongoDB database\n');

    // 1. Upsert categories (ensures categories exist with icons and descriptions)
    console.log('📂  Upserting Canteen Categories…');
    const categoryDocs = {};
    for (const cat of categories) {
      const doc = await Category.findOneAndUpdate(
        { slug: cat.slug },
        {
          $set: {
            name: cat.name,
            icon: cat.icon,
            sortOrder: cat.sortOrder,
            description: cat.description,
            isActive: true,
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
      categoryDocs[cat.slug] = doc._id;
      console.log(`   ${cat.icon}  ${cat.name} (/${cat.slug})`);
    }
    console.log(`\n✅  ${Object.keys(categoryDocs).length} categories ready.\n`);

    // 2. Safe, Idempotent Food Item Seeding
    // If an item with the same name already exists: PRESERVE it so admin modifications are kept!
    // If it does not exist: INSERT it.
    console.log('🍽️  Checking and seeding Food Items…');
    let inserted = 0;
    let preserved = 0;
    const categoryCounts = {};

    for (const [slug, items] of Object.entries(foodCatalog)) {
      const catId = categoryDocs[slug];
      if (!catId) {
        console.warn(`⚠️  Category slug "${slug}" not found in database. Skipping.`);
        continue;
      }

      categoryCounts[slug] = 0;

      for (const item of items) {
        const canonicalImage = getCorrectImageUrl(item.name) || item.imageUrl;
        // Check if an item with this exact name already exists
        const existing = await FoodItem.findOne({ name: item.name });

        if (!existing) {
          // Brand new item: insert with default catalog values and canonical verified image
          await FoodItem.create({
            ...item,
            imageUrl: canonicalImage,
            category: catId,
          });
          inserted++;
          console.log(`   ✨  NEW: ${item.name} (₹${item.sellingPrice})`);
        } else {
          // Item already exists: PRESERVE admin modifications!
          let modified = false;
          if (!existing.category) {
            existing.category = catId;
            modified = true;
          }
          // Preserve custom admin uploads (/uploads/...), but ensure verified canonical image
          if (!existing.imageUrl?.startsWith('/uploads/') && existing.imageUrl !== canonicalImage) {
            existing.imageUrl = canonicalImage;
            modified = true;
          }
          if (modified) {
            await existing.save();
          }
          preserved++;
          console.log(`   🔒  PRESERVED: ${item.name} (₹${existing.sellingPrice})`);
        }

        categoryCounts[slug]++;
      }
    }

    const totalInCatalog = inserted + preserved;
    const totalInDb = await FoodItem.countDocuments({ isDeleted: { $ne: true } });

    console.log('\n------------------------------------------------------');
    console.log(`📊  Canteen Catalog Seeding Summary:`);
    console.log(`   - Items processed from catalog : ${totalInCatalog}`);
    console.log(`   - Newly inserted items        : ${inserted}`);
    console.log(`   - Preserved existing items     : ${preserved}`);
    console.log(`   - Total active items in DB     : ${totalInDb}`);
    console.log('------------------------------------------------------\n');

    console.log('📋  Category Item Breakdown:');
    for (const [slug, count] of Object.entries(categoryCounts)) {
      const cat = categories.find((c) => c.slug === slug);
      console.log(`   ${cat?.icon || '🍽️'}  ${cat?.name || slug}: ${count} items`);
    }

    // 3. Ensure Default Admin User Exists
    const adminEmail = 'admin@quickbite.campus';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        name: 'Canteen Administrator',
        email: adminEmail,
        password: 'AdminSecure123!',
        role: 'admin',
        phone: '9999999999',
      });
      console.log(`\n✅  Admin user created: ${adminEmail} (Password: AdminSecure123!)`);
    } else {
      console.log(`\nℹ️   Admin user verified: ${adminEmail}`);
    }

    console.log('\n🎉  Seeding completed successfully with zero duplicates!\n');
  } catch (err) {
    console.error('\n❌  Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌  Disconnected from MongoDB.\n');
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed, categories, foodCatalog };
