/**
 * Local Storage utilities for FocusFlow
 */

const STORAGE_KEYS = {
  LAST_REVIEW_DATE: 'focusflow_last_review_date',
  SELECTED_FILTER: 'focusflow_selected_filter',
  SELECTED_CATEGORY: 'focusflow_selected_category',
  COLLAPSED_SECTIONS: 'focusflow_collapsed_sections',
  THEME: 'focusflow_theme',
};

/**
 * Get item from localStorage
 */
function get(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
}

/**
 * Set item in localStorage
 */
function set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error writing to localStorage:', error);
    return false;
  }
}

/**
 * Remove item from localStorage
 */
function remove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return false;
  }
}

/**
 * Clear all FocusFlow data from localStorage
 */
function clearAll() {
  Object.values(STORAGE_KEYS).forEach(key => {
    remove(key);
  });
}

/**
 * Get last review date
 */
function getLastReviewDate() {
  return get(STORAGE_KEYS.LAST_REVIEW_DATE, null);
}

/**
 * Set last review date
 */
function setLastReviewDate(date) {
  return set(STORAGE_KEYS.LAST_REVIEW_DATE, date);
}

/**
 * Get selected filter
 */
function getSelectedFilter() {
  return get(STORAGE_KEYS.SELECTED_FILTER, 'inbox');
}

/**
 * Set selected filter
 */
function setSelectedFilter(filter) {
  return set(STORAGE_KEYS.SELECTED_FILTER, filter);
}

/**
 * Get selected category
 */
function getSelectedCategory() {
  return get(STORAGE_KEYS.SELECTED_CATEGORY, null);
}

/**
 * Set selected category
 */
function setSelectedCategory(category) {
  return set(STORAGE_KEYS.SELECTED_CATEGORY, category);
}

/**
 * Get collapsed sections
 */
function getCollapsedSections() {
  return get(STORAGE_KEYS.COLLAPSED_SECTIONS, {});
}

/**
 * Set collapsed sections
 */
function setCollapsedSections(sections) {
  return set(STORAGE_KEYS.COLLAPSED_SECTIONS, sections);
}

/**
 * Toggle section collapse
 */
function toggleSectionCollapse(sectionId) {
  const sections = getCollapsedSections();
  sections[sectionId] = !sections[sectionId];
  setCollapsedSections(sections);
  return sections[sectionId];
}

/**
 * Get theme
 */
function getTheme() {
  return get(STORAGE_KEYS.THEME, 'light');
}

/**
 * Set theme
 */
function setTheme(theme) {
  return set(STORAGE_KEYS.THEME, theme);
}

/**
 * Apply theme to document
 */
function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  setTheme(theme);
}

/**
 * Initialize storage with defaults
 */
function initialize() {
  // Ensure all keys have defaults
  if (getLastReviewDate() === null) {
    setLastReviewDate(null);
  }
  if (getSelectedFilter() === null) {
    setSelectedFilter('inbox');
  }
  if (getSelectedCategory() === null) {
    setSelectedCategory(null);
  }
  if (getCollapsedSections() === null) {
    setCollapsedSections({});
  }
  if (getTheme() === null) {
    setTheme('light');
  }

  // Apply theme
  applyTheme(getTheme());
}

// Export storage utilities
window.storage = {
  get,
  set,
  remove,
  clearAll,
  getLastReviewDate,
  setLastReviewDate,
  getSelectedFilter,
  setSelectedFilter,
  getSelectedCategory,
  setSelectedCategory,
  getCollapsedSections,
  setCollapsedSections,
  toggleSectionCollapse,
  getTheme,
  setTheme,
  applyTheme,
  initialize,
};