const mongoose = require('mongoose');
const FoodItem = require('../models/FoodItem');
const Category = require('../models/Category');
const Order = require('../models/Order');

// ─── Food Items ───────────────────────────────────────────────────────────────

// GET /api/admin/food — list all food items
const getAllFoodItems = async (req, res, next) => {
  try {
    const { category, search, stockStatus } = req.query;
    const filter = { isDeleted: { $ne: true } };

    if (category && category !== 'all') {
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.category = category;
      } else {
        const cat = await Category.findOne({ slug: category });
        if (cat) filter.category = cat._id;
      }
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (stockStatus === 'out') {
      filter.stockQuantity = 0;
    } else if (stockStatus === 'low') {
      filter.$expr = {
        $and: [
          { $gt: ['$stockQuantity', 0] },
          { $lte: ['$stockQuantity', '$lowStockThreshold'] },
        ],
      };
    }

    const items = await FoodItem.find(filter)
      .populate('category', 'name slug icon')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: items,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/food — create new food item
const createFoodItem = async (req, res, next) => {
  try {
    const {
      name,
      description,
      category,
      sellingPrice,
      costPrice,
      stockQuantity,
      lowStockThreshold = 5,
      imageUrl,
      isVeg = true,
      isAvailable = true,
      tags,
      preparationTimeMinutes = 10,
    } = req.body;

    if (!name || !category || sellingPrice === undefined || costPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, selling price, and cost price are required.',
      });
    }

    if (Number(sellingPrice) < 0 || Number(costPrice) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Prices cannot be negative.',
      });
    }

    // Verify category exists
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Selected category does not exist.',
      });
    }

    const item = await FoodItem.create({
      name: String(name).trim(),
      description: description ? String(description).trim() : '',
      category,
      sellingPrice: Number(sellingPrice),
      costPrice: Number(costPrice),
      stockQuantity: Math.max(0, Number(stockQuantity) || 0),
      lowStockThreshold: Math.max(0, Number(lowStockThreshold) || 5),
      imageUrl: imageUrl || null,
      isVeg: Boolean(isVeg),
      isAvailable: Boolean(isAvailable),
      tags: Array.isArray(tags) ? tags : [],
      preparationTimeMinutes: Math.max(1, Number(preparationTimeMinutes) || 10),
    });

    const populated = await FoodItem.findById(item._id).populate(
      'category',
      'name slug icon'
    );

    res.status(201).json({
      success: true,
      message: 'Food item created successfully.',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/food/:id — update food item
const updateFoodItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      sellingPrice,
      costPrice,
      stockQuantity,
      lowStockThreshold,
      imageUrl,
      isVeg,
      isAvailable,
      tags,
      preparationTimeMinutes,
    } = req.body;

    const item = await FoodItem.findById(id);
    if (!item || item.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found.',
      });
    }

    if (name !== undefined) item.name = String(name).trim();
    if (description !== undefined) item.description = String(description).trim();
    if (category !== undefined) {
      const catExists = await Category.findById(category);
      if (!catExists) {
        return res.status(400).json({
          success: false,
          message: 'Selected category does not exist.',
        });
      }
      item.category = category;
    }
    if (sellingPrice !== undefined) item.sellingPrice = Math.max(0, Number(sellingPrice));
    if (costPrice !== undefined) item.costPrice = Math.max(0, Number(costPrice));
    if (stockQuantity !== undefined) item.stockQuantity = Math.max(0, Number(stockQuantity));
    if (lowStockThreshold !== undefined) item.lowStockThreshold = Math.max(0, Number(lowStockThreshold));
    if (imageUrl !== undefined) item.imageUrl = imageUrl || null;
    if (isVeg !== undefined) item.isVeg = Boolean(isVeg);
    if (isAvailable !== undefined) item.isAvailable = Boolean(isAvailable);
    if (tags !== undefined) item.tags = Array.isArray(tags) ? tags : [];
    if (preparationTimeMinutes !== undefined) {
      item.preparationTimeMinutes = Math.max(1, Number(preparationTimeMinutes));
    }

    await item.save();

    const populated = await FoodItem.findById(item._id).populate(
      'category',
      'name slug icon'
    );

    res.json({
      success: true,
      message: 'Food item updated successfully.',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/food/:id/toggle-availability
const toggleAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await FoodItem.findById(id);
    if (!item || item.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found.',
      });
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.json({
      success: true,
      message: `Item marked as ${item.isAvailable ? 'available' : 'unavailable'}.`,
      data: item,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/food/:id/stock — quick stock adjustment
const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stockQuantity, lowStockThreshold } = req.body;

    const item = await FoodItem.findById(id);
    if (!item || item.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found.',
      });
    }

    if (stockQuantity !== undefined) {
      const parsedStock = Number(stockQuantity);
      if (isNaN(parsedStock) || parsedStock < 0) {
        return res.status(400).json({
          success: false,
          message: 'Stock quantity cannot be negative.',
        });
      }
      item.stockQuantity = parsedStock;
    }
    if (lowStockThreshold !== undefined) {
      const parsedThreshold = Number(lowStockThreshold);
      if (isNaN(parsedThreshold) || parsedThreshold < 0) {
        return res.status(400).json({
          success: false,
          message: 'Low stock threshold cannot be negative.',
        });
      }
      item.lowStockThreshold = parsedThreshold;
    }

    await item.save();

    res.json({
      success: true,
      message: 'Stock updated successfully.',
      data: item,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/food/:id — delete or safe soft-delete
const deleteFoodItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await FoodItem.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found.',
      });
    }

    // Check if referenced in historical orders
    const hasOrderHistory = await Order.exists({ 'items.foodItem': id });

    if (hasOrderHistory) {
      // Safe soft delete: preserve order integrity
      item.isDeleted = true;
      item.isAvailable = false;
      await item.save();

      return res.json({
        success: true,
        message: 'Item has order history; safely archived and removed from menu.',
        softDeleted: true,
        isSoftDeleted: true,
      });
    }

    // Hard delete if never ordered
    await FoodItem.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Food item deleted successfully.',
      softDeleted: false,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Categories ───────────────────────────────────────────────────────────────

// GET /api/admin/categories
const getAllCategories = async (_req, res, next) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });

    // Count items per category
    const counts = await FoodItem.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

    const categoriesWithCount = categories.map((cat) => ({
      ...cat.toObject(),
      itemCount: countMap.get(cat._id.toString()) || 0,
    }));

    res.json({
      success: true,
      data: categoriesWithCount,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/categories
const createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, icon = '🍽️', sortOrder = 0, isActive = true } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.',
      });
    }

    const finalSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existing = await Category.findOne({
      $or: [{ name: String(name).trim() }, { slug: finalSlug }],
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name or slug already exists.',
      });
    }

    const category = await Category.create({
      name: String(name).trim(),
      slug: finalSlug,
      description: description ? String(description).trim() : '',
      icon: icon || '🍽️',
      sortOrder: Number(sortOrder) || 0,
      isActive: Boolean(isActive),
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: category,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, description, icon, sortOrder, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    if (name !== undefined) category.name = String(name).trim();
    if (slug !== undefined) {
      category.slug = slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    if (description !== undefined) category.description = String(description).trim();
    if (icon !== undefined) category.icon = icon;
    if (sortOrder !== undefined) category.sortOrder = Number(sortOrder) || 0;
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully.',
      data: category,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    // Check if food items belong to this category
    const itemCount = await FoodItem.countDocuments({
      category: id,
      isDeleted: { $ne: true },
    });
    if (itemCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. ${itemCount} active food item(s) are assigned to it. Please reassign or delete them first.`,
      });
    }

    await Category.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Category deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllFoodItems,
  createFoodItem,
  updateFoodItem,
  toggleAvailability,
  updateStock,
  deleteFoodItem,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
