const express = require('express');
const router = express.Router();
const { getMenu, getFoodItem } = require('../controllers/menuController');

// GET /api/menu
router.get('/', getMenu);

// GET /api/menu/:id
router.get('/:id', getFoodItem);

module.exports = router;
