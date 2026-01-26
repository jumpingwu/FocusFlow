/**
 * Helper functions for FocusFlow
 */

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date to readable string
 */
function formatDateReadable(date) {
  const d = new Date(date);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString('en-US', options);
}

/**
 * Format datetime to readable string
 */
function formatDateTime(date) {
  const d = new Date(date);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return d.toLocaleString('en-US', options);
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getToday() {
  return formatDate(new Date());
}

/**
 * Check if date is overdue
 */
function isOverdue(targetDate, status) {
  if (!targetDate || status === 'Completed' || status === 'Cancelled') {
    return false;
  }
  const today = getToday();
  return targetDate < today;
}

/**
 * Get relative time string for a date
 */
function getRelativeTime(targetDate, status) {
  if (!targetDate) {
    return 'Set date';
  }

  const today = getToday();
  const target = new Date(targetDate);
  const current = new Date(today);
  
  // Calculate difference in days
  const diffTime = target - current;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Check if item is completed/cancelled
  if (status === 'Completed' || status === 'Cancelled') {
    return formatDateReadable(targetDate);
  }

  if (diffDays < 0) {
    const daysOverdue = Math.abs(diffDays);
    if (daysOverdue === 1) {
      return 'Overdue by 1 day';
    }
    return `Overdue by ${daysOverdue} days`;
  } else if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays <= 7) {
    return `In ${diffDays} days`;
  } else {
    return formatDateReadable(targetDate);
  }
}

/**
 * Get matrix quadrant for item
 */
function getMatrixQuadrant(item) {
  if (item.type === 'Idea') {
    return 'ideas';
  }

  const isBurning = item.urgency === 'Burning' || item.priority === 'Critical';
  const isToday = item.urgency === 'Today' || item.priority === 'High';

  if (isBurning) {
    return 'burning';
  } else if (isToday) {
    return 'today';
  } else {
    return 'other';
  }
}

/**
 * Generate UUID v4
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Debounce function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Convert URLs to clickable links
 */
function linkify(text) {
  // Split by markdown links to avoid processing URLs inside them
  const parts = text.split(/(\[[^\]]*\]\([^)]+\))/g);

  return parts.map(part => {
    // Skip markdown links (including those with nested brackets in link text)
    if (part.match(/\[[\s\S]*?\]\([^)]+\)/)) {
      return part;
    }

    // Convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s<]+|www\.[^\s<]+|localhost:[^\s<]+)/g;
    return part.replace(urlRegex, (url) => {
      let href = url;
      if (!href.startsWith('http')) {
        href = 'http://' + url;
      }
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
  }).join('');
}

/**
 * Parse markdown-like syntax
 */
function parseMarkdown(text) {
  if (!text) return '';

  // Step 1: Process tables FIRST (before anything else)
  const tables = [];
  text = text.replace(/(\|[^\n]+\|\n\|[-\s:|]+\|\n(?:\|[^\n]+\|\n?)+)/g, (match) => {
    const lines = match.trim().split('\n');
    if (lines.length < 3) return match;

    // Skip separator row (index 1)
    const headerCells = lines[0].split('|').filter(c => c.trim());
    const headerHtml = `<thead><tr>${headerCells.map(c => `<th>${c.trim()}</th>`).join('')}</tr></thead>`;

    const bodyRows = lines.slice(2).map(line => {
      const cells = line.split('|').filter(c => c.trim());
      return `<tr>${cells.map(c => `<td>${c.trim()}</td>`).join('')}</tr>`;
    }).join('');

    const tableHtml = `<table>${headerHtml}<tbody>${bodyRows}</tbody></table>`;
    const placeholder = `___TABLE_${tables.length}___`;
    tables.push(tableHtml);
    return placeholder;
  });

  let html = text;

  // Step 2: Protect markdown links and images with placeholders
  // Handle links with nested brackets: match [text](url) where text can contain []
  html = html.replace(/\[((?:[^\]]|\](?!\()|\[\])*)\]\(([^)]+)\)/g, '___MD_LINK_START___$1___MD_LINK_URL___$2___MD_LINK_END___');
  html = html.replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '___MD_IMG_START___$1___MD_IMG_URL___$2___MD_IMG_END___');

  // Step 3: Escape HTML (but not our placeholders)
  html = escapeHtml(html);

  // Step 4: Restore protected elements
  html = html.replace(/___MD_LINK_START___(.+?)___MD_LINK_URL___(.+?)___MD_LINK_END___/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.replace(/___MD_IMG_START___(.+?)___MD_IMG_URL___(.+?)___MD_IMG_END___/g, '<img src="$2" alt="$1">');
  
  // Restore tables
  tables.forEach((tableHtml, index) => {
    html = html.replace(`___TABLE_${index}___`, tableHtml);
  });

  // Step 5: Process code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Step 6: Process inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Step 7: Process ordered lists (before unordered to avoid conflicts)
  html = html.replace(/^[\s]*(\d+)\.\s+(.+)$/gm, '<li>$2</li>');
  // Wrap consecutive ordered list items
  html = html.replace(/(<li>.*<\/li>)\n(?!<li>)/g, '$1</ol>\n');
  html = html.replace(/(?<!<\/ol>\n)(<li>)/g, '<ol>$1');

  // Step 8: Process lists (both ordered and unordered)
  const lines = html.split('\n');
  let result = [];
  let inUnordered = false;
  let inOrdered = false;
  let currentList = [];
  let listType = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const unorderedMatch = line.match(/^[\s]*[-*]\s+(.+)$/);
    const orderedMatch = line.match(/^[\s]*(\d+)\.\s+(.+)$/);

    if (unorderedMatch) {
      if (!inUnordered) {
        // Close ordered list if open
        if (inOrdered) {
          result.push(`<ol>${currentList.join('')}</ol>`);
          inOrdered = false;
          currentList = [];
        }
        inUnordered = true;
        listType = 'ul';
      }
      currentList.push(`<li>${unorderedMatch[1]}</li>`);
    } else if (orderedMatch) {
      if (!inOrdered) {
        // Close unordered list if open
        if (inUnordered) {
          result.push(`<ul>${currentList.join('')}</ul>`);
          inUnordered = false;
          currentList = [];
        }
        inOrdered = true;
        listType = 'ol';
      }
      currentList.push(`<li>${orderedMatch[2]}</li>`);
    } else {
      // Close any open list
      if (inUnordered) {
        result.push(`<ul>${currentList.join('')}</ul>`);
        inUnordered = false;
        currentList = [];
      } else if (inOrdered) {
        result.push(`<ol>${currentList.join('')}</ol>`);
        inOrdered = false;
        currentList = [];
      }
      result.push(line);
    }
  }

  // Don't forget the last list
  if (inUnordered) {
    result.push(`<ul>${currentList.join('')}</ul>`);
  } else if (inOrdered) {
    result.push(`<ol>${currentList.join('')}</ol>`);
  }

  html = result.join('\n');

  // Step 10: Process headers
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Step 11: Process bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Step 12: Process line breaks (but not inside block elements)
  // First, add breaks after block elements
  html = html.replace(/(<\/table>|<\/ul>|<\/ol>|<\/pre>)\n/g, '$1<br><br>');
  // Then convert remaining newlines
  html = html.replace(/\n\n/g, '<br><br>');
  html = html.replace(/\n/g, '<br>');

  return html;
}

/**
 * Get file icon based on mime type
 */
function getFileIcon(mimeType) {
  const iconMap = {
    'application/pdf': '📄',
    'image/jpeg': '🖼️',
    'image/png': '🖼️',
    'image/gif': '🖼️',
    'image/webp': '🖼️',
    'text/plain': '📝',
    'application/msword': '📝',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  };

  return iconMap[mimeType] || '📎';
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get urgency color class
 */
function getUrgencyColorClass(urgency) {
  const colorMap = {
    'Burning': 'dot-urgency-burning',
    'Today': 'dot-urgency-today',
    'Later': 'dot-urgency-later',
    'Undefined': '',
  };

  return colorMap[urgency] || '';
}

/**
 * Get priority color class
 */
function getPriorityColorClass(priority) {
  const colorMap = {
    'Critical': 'dot-priority-critical',
    'High': 'dot-priority-high',
    'Medium': 'dot-priority-medium',
    'Low': 'dot-priority-low',
    'Undefined': '',
  };

  return colorMap[priority] || '';
}

/**
 * Get status color class
 */
function getStatusColorClass(status) {
  const colorMap = {
    'Todo': 'status-todo',
    'In-progress': 'status-inprogress',
    'Pending': 'status-pending',
    'Completed': 'status-completed',
    'Cancelled': 'status-cancelled',
    'Archived': 'status-archived',
  };

  return colorMap[status] || '';
}

/**
 * Sort items by priority and urgency
 */
function sortItems(items) {
  const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3, 'Undefined': 4 };
  const urgencyOrder = { 'Burning': 0, 'Today': 1, 'Later': 2, 'Undefined': 3 };

  return items.sort((a, b) => {
    // Sort by priority first
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by urgency
    const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;

    // Finally by target date (earlier first)
    if (a.targetDate && b.targetDate) {
      return a.targetDate.localeCompare(b.targetDate);
    }

    return 0;
  });
}

/**
 * Group items by matrix quadrant
 */
function groupItemsByMatrix(items) {
  const groups = {
    burning: [],
    today: [],
    other: [],
    ideas: [],
  };

  items.forEach(item => {
    const quadrant = getMatrixQuadrant(item);
    if (groups[quadrant]) {
      groups[quadrant].push(item);
    }
  });

  // Sort each group
  Object.keys(groups).forEach(key => {
    groups[key] = sortItems(groups[key]);
  });

  return groups;
}

/**
 * Count items by status
 */
function countByStatus(items) {
  const counts = {
    Todo: 0,
    'In-progress': 0,
    Pending: 0,
    Completed: 0,
    Cancelled: 0,
    Archived: 0,
  };

  items.forEach(item => {
    if (counts[item.status] !== undefined) {
      counts[item.status]++;
    }
  });

  return counts;
}

/**
 * Count items by category
 */
function countByCategory(items) {
  const counts = {};

  items.forEach(item => {
    const category = item.category === '' || item.category === undefined ? '' : item.category;
    counts[category] = (counts[category] || 0) + 1;
  });

  return counts;
}

/**
 * Count items by tag
 */
function countByTag(items) {
  const counts = {};

  items.forEach(item => {
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    }
  });

  return counts;
}

// Export helpers
window.helpers = {
  formatDate,
  formatDateReadable,
  formatDateTime,
  getToday,
  isOverdue,
  getRelativeTime,
  getMatrixQuadrant,
  generateUUID,
  debounce,
  throttle,
  escapeHtml,
  linkify,
  parseMarkdown,
  getFileIcon,
  formatFileSize,
  getUrgencyColorClass,
  getPriorityColorClass,
  getStatusColorClass,
  sortItems,
  groupItemsByMatrix,
  countByStatus,
  countByCategory,
  countByTag,
};