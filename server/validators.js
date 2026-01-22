/**
 * Data validation utilities for FocusFlow
 */

const VALID_STATUSES = ['Todo', 'In-progress', 'Pending', 'Completed', 'Cancelled'];
const VALID_PRIORITIES = ['Critical', 'High', 'Medium', 'Low', 'Undefined'];
const VALID_URGENCIES = ['Burning', 'Today', 'Later', 'Undefined'];
const VALID_TYPES = ['Task', 'Idea'];

/**
 * Validate item data structure
 */
function validateItem(item) {
  const errors = [];

  if (!item.id || typeof item.id !== 'string') {
    errors.push('Item must have a valid id');
  }

  if (!VALID_TYPES.includes(item.type)) {
    errors.push(`Item type must be one of: ${VALID_TYPES.join(', ')}`);
  }

  if (!item.title || typeof item.title !== 'string' || item.title.trim().length === 0) {
    errors.push('Item must have a non-empty title');
  }

  if (!VALID_STATUSES.includes(item.status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (!VALID_PRIORITIES.includes(item.priority)) {
    errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }

  if (!VALID_URGENCIES.includes(item.urgency)) {
    errors.push(`Urgency must be one of: ${VALID_URGENCIES.join(', ')}`);
  }

  if (item.targetDate && !isValidDate(item.targetDate)) {
    errors.push('Target date must be in YYYY-MM-DD format');
  }

  if (!item.createdAt || !isValidDateTime(item.createdAt)) {
    errors.push('Item must have a valid createdAt timestamp');
  }

  if (!Array.isArray(item.logs)) {
    errors.push('Item must have a logs array');
  }

  if (!Array.isArray(item.attachments)) {
    errors.push('Item must have an attachments array');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate log entry
 */
function validateLogEntry(log) {
  const errors = [];

  if (!log.timestamp || !isValidDateTime(log.timestamp)) {
    errors.push('Log must have a valid timestamp');
  }

  if (!['manual', 'system'].includes(log.type)) {
    errors.push('Log type must be "manual" or "system"');
  }

  if (!log.msg || typeof log.msg !== 'string') {
    errors.push('Log must have a message');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if date string is valid YYYY-MM-DD format
 */
function isValidDate(dateStr) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
}

/**
 * Check if datetime string is valid ISO format
 */
function isValidDateTime(dateTimeStr) {
  const date = new Date(dateTimeStr);
  return date instanceof Date && !isNaN(date);
}

/**
 * Sanitize item data (remove extra fields, set defaults)
 */
function sanitizeItem(item) {
  const sanitized = {
    id: item.id || generateUUID(),
    type: VALID_TYPES.includes(item.type) ? item.type : 'Task',
    title: item.title || '',
    notes: item.notes || '',
    category: item.category || '',
    status: VALID_STATUSES.includes(item.status) ? item.status : 'Todo',
    priority: VALID_PRIORITIES.includes(item.priority) ? item.priority : 'Undefined',
    urgency: VALID_URGENCIES.includes(item.urgency) ? item.urgency : 'Undefined',
    targetDate: isValidDate(item.targetDate) ? item.targetDate : '',
    createdAt: isValidDateTime(item.createdAt) ? item.createdAt : new Date().toISOString(),
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
    logs: Array.isArray(item.logs) ? item.logs : []
  };

  // For Ideas, set priority/urgency/targetDate to Undefined
  if (sanitized.type === 'Idea') {
    sanitized.priority = 'Undefined';
    sanitized.urgency = 'Undefined';
    sanitized.targetDate = '';
  }

  return sanitized;
}

/**
 * Generate a UUID v4
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

module.exports = {
  validateItem,
  validateLogEntry,
  isValidDate,
  isValidDateTime,
  sanitizeItem,
  generateUUID,
  VALID_STATUSES,
  VALID_PRIORITIES,
  VALID_URGENCIES,
  VALID_TYPES
};