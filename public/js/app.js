/**
 * FocusFlow Application Entry Point
 */

// Initialize storage
window.storage.initialize();

// Check for categories update event
document.addEventListener('ghostbar:taskcreated', (e) => {
  // Refresh categories if new category was created
  if (e.detail.item.category) {
    const event = new CustomEvent('categories:updated');
    document.dispatchEvent(event);
  }
});