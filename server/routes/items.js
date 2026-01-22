const express = require('express');
const router = express.Router();
const {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  addManualLog,
  archiveItem,
  restoreItem,
  permanentDeleteArchivedItem,
  getArchivedItems
} = require('../data-manager');

/**
 * GET /api/items
 * Get all items with optional filtering
 */
router.get('/', (req, res) => {
  try {
    const items = getAllItems();
    const { status, type, category, search, overdue } = req.query;

    let filteredItems = items;

    // Filter by status
    if (status) {
      filteredItems = filteredItems.filter(item => item.status === status);
    }

    // Filter by type
    if (type) {
      filteredItems = filteredItems.filter(item => item.type === type);
    }

    // Filter by category (including empty string for "No Category")
    if (category !== undefined) {
      filteredItems = filteredItems.filter(item => {
        const match = item.category === category;
        return match;
      });
    }

    // Search in title, category, notes, and manual logs
    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = filteredItems.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(searchLower);
        const categoryMatch = item.category.toLowerCase().includes(searchLower);
        const notesMatch = item.notes.toLowerCase().includes(searchLower);
        const logMatch = item.logs.some(log =>
          log.type === 'manual' && log.msg.toLowerCase().includes(searchLower)
        );
        return titleMatch || categoryMatch || notesMatch || logMatch;
      });

      // Also search in archived items
      const archivedItems = getArchivedItems();
      const archivedMatches = archivedItems.filter(item => {
        const titleMatch = item.item.title.toLowerCase().includes(searchLower);
        const categoryMatch = item.item.category.toLowerCase().includes(searchLower);
        const notesMatch = item.item.notes.toLowerCase().includes(searchLower);
        const logMatch = item.item.logs.some(log =>
          log.type === 'manual' && log.msg.toLowerCase().includes(searchLower)
        );
        return titleMatch || categoryMatch || notesMatch || logMatch;
      });

      // Add archived items to results (with archive metadata)
      archivedMatches.forEach(archived => {
        const itemWithArchiveMetadata = {
          ...archived.item,
          archivedAt: archived.archivedAt,
          archivedBy: archived.archivedBy
        };
        filteredItems.push(itemWithArchiveMetadata);
      });
    }

    // Filter overdue items
    if (overdue === 'true') {
      const today = new Date().toISOString().split('T')[0];
      filteredItems = filteredItems.filter(item => {
        const isNotCompleted = item.status !== 'Completed' && item.status !== 'Cancelled';
        const isOverdue = item.targetDate && item.targetDate < today;
        return isNotCompleted && isOverdue;
      });
    }

    res.json(filteredItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/archived
 * Get all archived items
 */
router.get('/archived', (req, res) => {
  try {
    const archivedItems = getArchivedItems();
    res.json(archivedItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/archived/:id/restore
 * Restore an archived item
 */
router.post('/archived/:id/restore', (req, res) => {
  try {
    const item = restoreItem(req.params.id);
    res.json(item);
  } catch (error) {
    if (error.message === 'Archived item not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/archived/:id
 * Permanently delete an archived item
 */
router.delete('/archived/:id', (req, res) => {
  try {
    const result = permanentDeleteArchivedItem(req.params.id);
    res.json(result);
  } catch (error) {
    if (error.message === 'Archived item not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/items/:id
 * Get a single item by ID
 */
router.get('/:id', (req, res) => {
  try {
    // First try to find in main collection
    let item = getItemById(req.params.id);

    // If not found in main collection, search in archive
    if (!item) {
      const archivedItems = getArchivedItems();
      const archivedEntry = archivedItems.find(entry => entry.item.id === req.params.id);

      if (archivedEntry) {
        // Return archived item with archive metadata
        item = {
          ...archivedEntry.item,
          archivedAt: archivedEntry.archivedAt,
          archivedBy: archivedEntry.archivedBy
        };
      }
    }

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/items
 * Create a new item
 */
router.post('/', (req, res) => {
  try {
    const item = createItem(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/items/:id
 * Update an item
 */
router.put('/:id', (req, res) => {
  try {
    const item = updateItem(req.params.id, req.body);
    res.json(item);
  } catch (error) {
    if (error.message === 'Item not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/items/:id
 * Delete an item
 */
router.delete('/:id', (req, res) => {
  try {
    const result = deleteItem(req.params.id);
    res.json(result);
  } catch (error) {
    if (error.message === 'Item not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/items/:id/logs
 * Add a manual log entry to an item
 */
router.post('/:id/logs', (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const item = addManualLog(req.params.id, message);
    res.json(item);
  } catch (error) {
    if (error.message === 'Item not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/items/:id/archive
 * Archive an item
 */
router.post('/:id/archive', (req, res) => {
  try {
    const { archivedBy } = req.body;
    const archivedEntry = archiveItem(req.params.id, archivedBy || 'manual');
    res.json(archivedEntry);
  } catch (error) {
    if (error.message === 'Item not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;