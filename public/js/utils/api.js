/**
 * API Client for FocusFlow
 * Handles all HTTP requests to the backend
 */

const API_BASE_URL = '/api';

/**
 * Generic API request function
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const config = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

/**
 * Items API
 */
const itemsApi = {
  /**
   * Get all items with optional filters
   */
  getAll(filters = {}) {
    // Build query params manually to handle empty strings
    const queryParams = Object.entries(filters)
      .filter(([key, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    return apiRequest(`/items${queryParams ? `?${queryParams}` : ''}`);
  },

  /**
   * Get item by ID
   */
  getById(id) {
    return apiRequest(`/items/${id}`);
  },

  /**
   * Create new item
   */
  create(itemData) {
    return apiRequest('/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },

  /**
   * Update item
   */
  update(id, updates) {
    return apiRequest(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Delete item
   */
  delete(id) {
    return apiRequest(`/items/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Add manual log entry
   */
  addLog(id, message) {
    return apiRequest(`/items/${id}/logs`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  /**
   * Archive item
   */
  archive(id, reason = 'manual') {
    return apiRequest(`/items/${id}/archive`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Restore archived item
   */
  restore(id) {
    return apiRequest(`/items/archived/${id}/restore`, {
      method: 'POST',
    });
  },

  /**
   * Permanently delete archived item
   */
  permanentDelete(id) {
    return apiRequest(`/items/archived/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get archived items
   */
  getArchived() {
    return apiRequest('/items/archived');
  },
};

/**
 * Upload API
 */
const uploadApi = {
  /**
   * Upload file
   */
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return await response.json();
  },

  /**
   * Delete file
   */
  deleteFile(filename) {
    return apiRequest(`/upload/${filename}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Categories API
 */
const categoriesApi = {
  /**
   * Get all categories
   */
  getAll() {
    return apiRequest('/categories');
  },
};

/**
 * Review API
 */
const reviewApi = {
  /**
   * Get overdue items
   */
  getOverdue() {
    return apiRequest('/review/overdue');
  },

  /**
   * Get review status
   */
  getStatus() {
    return apiRequest('/review/status');
  },

  /**
   * Mark review as complete
   */
  complete() {
    return apiRequest('/review/complete', {
      method: 'POST',
    });
  },

  /**
   * Morning reset - move completed to archived
   */
  morningReset() {
    return apiRequest('/review/morning-reset', {
      method: 'POST',
    });
  },
};

/**
 * Health check
 */
function healthCheck() {
  return apiRequest('/health');
}

// Export APIs
window.api = {
  items: itemsApi,
  upload: uploadApi,
  categories: categoriesApi,
  review: reviewApi,
  health: healthCheck,
};