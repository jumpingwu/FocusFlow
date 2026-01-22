const express = require('express');
const router = express.Router();
const { getCategories } = require('../data-manager');

/**
 * GET /api/categories
 * Get all categories
 */
router.get('/', (req, res) => {
  try {
    const categories = getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;