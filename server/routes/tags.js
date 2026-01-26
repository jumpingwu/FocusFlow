const express = require('express');
const router = express.Router();
const { getAllTags, getUnusedTags, deleteUnusedTags, getAllItems } = require('../data-manager');

/**
 * GET /api/tags - Get all tags with usage counts
 */
router.get('/', async (req, res) => {
  try {
    const tags = getAllTags();
    const allItems = getAllItems();

    // Calculate usage counts from items
    const tagCounts = {};
    allItems.forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    // Sort by frequency (descending)
    const tagsWithCounts = tags.map(tag => ({
      name: tag,
      count: tagCounts[tag] || 0
    })).sort((a, b) => b.count - a.count);

    res.json(tagsWithCounts);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tags/unused - Get unused tags
 */
router.get('/unused', async (req, res) => {
  try {
    const unusedTags = getUnusedTags();
    res.json(unusedTags);
  } catch (error) {
    console.error('Error fetching unused tags:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/tags/unused - Delete unused tags
 */
router.delete('/unused', async (req, res) => {
  try {
    const result = deleteUnusedTags();
    res.json(result);
  } catch (error) {
    console.error('Error deleting unused tags:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;