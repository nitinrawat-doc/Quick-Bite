const Category = require('../models/Category');
const FoodItem = require('../models/FoodItem');

// GET /api/menu  — returns categories + food items (optionally filtered)
const getMenu = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 200 } = req.query;
    const parsedLimit = Math.min(Math.max(1, Number(limit) || 200), 500);
    const parsedPage = Math.max(1, Number(page) || 1);
    const skip = (parsedPage - 1) * parsedLimit;

    // Build food item filter
    const filter = { isAvailable: true, isDeleted: { $ne: true } };
    if (category && category !== 'all') {
      const cat = await Category.findOne({ slug: category, isActive: true });
      if (cat) filter.category = cat._id;
    }
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } },
      ];
    }

    const [categories, foodItems, total] = await Promise.all([
      Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }),
      FoodItem.find(filter)
        .populate('category', 'name slug icon')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      FoodItem.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        categories,
        foodItems,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/menu/:id  — single food item
const getFoodItem = async (req, res, next) => {
  try {
    const item = await FoodItem.findById(req.params.id).populate(
      'category',
      'name slug icon'
    );
    if (!item) {
      const err = new Error('Food item not found');
      err.statusCode = 404;
      return next(err);
    }
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMenu, getFoodItem };
