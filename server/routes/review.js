const express = require('express');
const router = express.Router();
const { getAllItems, updateLastReviewDate, getLastReviewDate, archiveItem } = require('../data-manager');

/**
 * GET /api/review/overdue
 * Get all overdue items
 */
router.get('/overdue', (req, res) => {
  try {
    const items = getAllItems();
    const today = new Date().toISOString().split('T')[0];

    const overdueItems = items.filter(item => {
      const isNotCompleted = item.status !== 'Completed' && item.status !== 'Cancelled';
      const isOverdue = item.targetDate && item.targetDate < today;
      return isNotCompleted && isOverdue;
    });

    res.json(overdueItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/review/status
 * Check if daily review is needed
 */
router.get('/status', (req, res) => {
  try {
    const lastReviewDate = getLastReviewDate();
    const today = new Date().toISOString().split('T')[0];
    const needsReview = lastReviewDate !== today;

    // Check if there are any overdue items
    const items = getAllItems();
    const overdueCount = items.filter(item => {
      const isNotCompleted = item.status !== 'Completed' && item.status !== 'Cancelled';
      const isOverdue = item.targetDate && item.targetDate < today;
      return isNotCompleted && isOverdue;
    }).length;

    res.json({
      needsReview,
      lastReviewDate,
      overdueCount,
      today
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/review/complete
 * Mark daily review as complete
 */
router.post('/complete', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const data = updateLastReviewDate(today);

    res.json({
      success: true,
      lastReviewDate: today
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/review/morning-reset
 * Archive completed items
 */
router.post('/morning-reset', (req, res) => {
  try {
    const items = getAllItems();

    const completedItems = items.filter(item => item.status === 'Completed');

    completedItems.forEach(item => {
      archiveItem(item.id, 'morning_reset');
    });

    res.json({
      success: true,
      archivedCount: completedItems.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;