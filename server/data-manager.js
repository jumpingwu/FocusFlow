const fs = require('fs');
const path = require('path');
const { sanitizeItem, validateItem, validateLogEntry, generateUUID } = require('./validators');

const DATA_FILE = path.join(__dirname, '..', 'data.json');
const BACKUP_FILE = path.join(__dirname, '..', 'data.json.bak');
const ARCHIVE_FILE = path.join(__dirname, '..', 'data_archive.json');

/**
 * Read data from data.json
 */
function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { items: [], categories: [], lastReviewDate: null };
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data.json:', error);
    return { items: [], categories: [], lastReviewDate: null };
  }
}

/**
 * Write data to data.json with backup
 */
function writeData(data) {
  try {
    // Create backup if file exists
    if (fs.existsSync(DATA_FILE)) {
      fs.copyFileSync(DATA_FILE, BACKUP_FILE);
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing data.json:', error);
    return false;
  }
}

/**
 * Get all items
 */
function getAllItems() {
  const data = readData();
  return data.items || [];
}

/**
 * Get item by ID
 */
function getItemById(id) {
  const items = getAllItems();
  return items.find(item => item.id === id) || null;
}

/**
 * Create new item
 */
function createItem(itemData) {
  const data = readData();

  // Sanitize and validate
  const item = sanitizeItem(itemData);
  item.id = generateUUID();
  item.createdAt = new Date().toISOString();
  item.logs = [{
    timestamp: new Date().toISOString(),
    type: 'system',
    msg: `Item created as ${item.type}`
  }];

  const validation = validateItem(item);
  if (!validation.valid) {
    throw new Error(`Invalid item data: ${validation.errors.join(', ')}`);
  }

  // Add category if new
  if (item.category && !data.categories.includes(item.category)) {
    data.categories.push(item.category);
  }

  data.items.push(item);
  writeData(data);

  return item;
}

/**
 * Update item
 */
function updateItem(id, updates) {
  const data = readData();
  const itemIndex = data.items.findIndex(item => item.id === id);

  if (itemIndex === -1) {
    throw new Error('Item not found');
  }

  const oldItem = data.items[itemIndex];
  const logs = [...(oldItem.logs || [])];

  // Track changes for audit logging
  const changes = [];

  // Check for field changes
  if (updates.type && updates.type !== oldItem.type) {
    changes.push(`Type changed from ${oldItem.type} to ${updates.type}`);
  }

  if (updates.title && updates.title !== oldItem.title) {
    changes.push(`Title changed from "${oldItem.title}" to "${updates.title}"`);
  }

  if (updates.status && updates.status !== oldItem.status) {
    changes.push(`Status changed from ${oldItem.status} to ${updates.status}`);
  }

  if (updates.priority && updates.priority !== oldItem.priority) {
    changes.push(`Priority changed from ${oldItem.priority} to ${updates.priority}`);
  }

  if (updates.urgency && updates.urgency !== oldItem.urgency) {
    changes.push(`Urgency changed from ${oldItem.urgency} to ${updates.urgency}`);
  }

  if (updates.category && updates.category !== oldItem.category) {
    changes.push(`Category changed from ${oldItem.category || 'none'} to ${updates.category}`);
  }

  if (updates.targetDate !== undefined && updates.targetDate !== oldItem.targetDate) {
    const oldDate = oldItem.targetDate || 'none';
    const newDate = updates.targetDate || 'none';
    changes.push(`Target date changed from ${oldDate} to ${newDate}`);
  }

  if (updates.notes !== undefined && updates.notes !== oldItem.notes) {
    logs.push({
      timestamp: new Date().toISOString(),
      type: 'system',
      msg: 'Notes updated',
      previousValue: oldItem.notes
    });
  }

  // Add system logs for changes
  changes.forEach(change => {
    logs.push({
      timestamp: new Date().toISOString(),
      type: 'system',
      msg: change
    });
  });

  // Update item
  const updatedItem = { ...oldItem, ...updates, logs };
  const validation = validateItem(updatedItem);

  if (!validation.valid) {
    throw new Error(`Invalid item data: ${validation.errors.join(', ')}`);
  }

  data.items[itemIndex] = updatedItem;

  // Add new category if needed
  if (updatedItem.category && !data.categories.includes(updatedItem.category)) {
    data.categories.push(updatedItem.category);
  }

  writeData(data);

  return updatedItem;
}

/**
 * Add manual log entry
 */
function addManualLog(itemId, message) {
  const data = readData();
  const itemIndex = data.items.findIndex(item => item.id === itemId);

  if (itemIndex === -1) {
    throw new Error('Item not found');
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    type: 'manual',
    msg: message
  };

  const validation = validateLogEntry(logEntry);
  if (!validation.valid) {
    throw new Error(`Invalid log entry: ${validation.errors.join(', ')}`);
  }

  data.items[itemIndex].logs.push(logEntry);
  writeData(data);

  return data.items[itemIndex];
}

/**
 * Delete item
 */
function deleteItem(id) {
  const data = readData();
  const initialLength = data.items.length;

  data.items = data.items.filter(item => item.id !== id);

  if (data.items.length === initialLength) {
    throw new Error('Item not found');
  }

  writeData(data);

  return { success: true };
}

/**
 * Get all categories
 */
function getCategories() {
  const data = readData();
  return data.categories || [];
}

/**
 * Update last review date
 */
function updateLastReviewDate(date) {
  const data = readData();
  data.lastReviewDate = date;
  writeData(data);
  return data;
}

/**
 * Get last review date
 */
function getLastReviewDate() {
  const data = readData();
  return data.lastReviewDate;
}

/**
 * Read archive data from data_archive.json
 */
function readArchiveData() {
  try {
    if (!fs.existsSync(ARCHIVE_FILE)) {
      return { archivedItems: [] };
    }
    const data = fs.readFileSync(ARCHIVE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data_archive.json:', error);
    return { archivedItems: [] };
  }
}

/**
 * Write archive data to data_archive.json
 */
function writeArchiveData(data) {
  try {
    fs.writeFileSync(ARCHIVE_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing data_archive.json:', error);
    return false;
  }
}

/**
 * Archive an item
 */
function archiveItem(id, archivedBy = 'manual') {
  const data = readData();
  const itemIndex = data.items.findIndex(item => item.id === id);

  if (itemIndex === -1) {
    throw new Error('Item not found');
  }

  const item = data.items[itemIndex];

  // Add log entry about archival
  item.logs.push({
    timestamp: new Date().toISOString(),
    type: 'system',
    msg: `Item archived (${archivedBy})`
  });

  // Create archived entry
  const archivedEntry = {
    item: { ...item }, // Complete snapshot with log
    archivedAt: new Date().toISOString(),
    archivedBy: archivedBy
  };

  // Add to archive
  const archiveData = readArchiveData();
  archiveData.archivedItems.push(archivedEntry);
  writeArchiveData(archiveData);

  // Remove from main data
  data.items.splice(itemIndex, 1);
  writeData(data);

  return archivedEntry;
}

/**
 * Restore an archived item
 */
function restoreItem(archivedId) {
  const archiveData = readArchiveData();
  const archiveIndex = archiveData.archivedItems.findIndex(entry => entry.item.id === archivedId);

  if (archiveIndex === -1) {
    throw new Error('Archived item not found');
  }

  const archivedEntry = archiveData.archivedItems[archiveIndex];
  const item = archivedEntry.item;

  // Add log entry about restore
  item.logs.push({
    timestamp: new Date().toISOString(),
    type: 'system',
    msg: 'Item restored from archive'
  });

  // Add to main data
  const data = readData();
  data.items.push(item);
  writeData(data);

  // Remove from archive
  archiveData.archivedItems.splice(archiveIndex, 1);
  writeArchiveData(archiveData);

  return item;
}

/**
 * Permanently delete an archived item
 */
function permanentDeleteArchivedItem(archivedId) {
  const archiveData = readArchiveData();
  const initialLength = archiveData.archivedItems.length;

  archiveData.archivedItems = archiveData.archivedItems.filter(entry => entry.item.id !== archivedId);

  if (archiveData.archivedItems.length === initialLength) {
    throw new Error('Archived item not found');
  }

  writeArchiveData(archiveData);

  return { success: true };
}

/**
 * Get all archived items
 */
function getArchivedItems() {
  const archiveData = readArchiveData();
  return archiveData.archivedItems;
}

module.exports = {
  readData,
  writeData,
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  addManualLog,
  getCategories,
  updateLastReviewDate,
  getLastReviewDate,
  readArchiveData,
  writeArchiveData,
  archiveItem,
  restoreItem,
  permanentDeleteArchivedItem,
  getArchivedItems
};