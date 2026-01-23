/**
 * Keyboard Shortcuts Manager
 */
class Shortcuts {
  constructor() {
    this.shortcuts = new Map();

    this.init();
  }

  init() {
    // Register default shortcuts
    this.register('Cmd+F', () => {
      if (window.ghostBar) {
        window.ghostBar.focus();
      }
    });

    this.register('Cmd+N', () => {
      if (window.ghostBar) {
        window.ghostBar.focus();
      }
    });

    this.register('Cmd+Enter', () => {
      // Handled by ghost-bar and detail-panel
    });

    this.register('Alt+1', () => {
      this.setQuickStatus('Todo');
    });

    this.register('Alt+2', () => {
      this.setQuickStatus('In-progress');
    });

    this.register('Alt+3', () => {
      this.setQuickStatus('Pending');
    });

    this.register('Alt+4', () => {
      this.setQuickStatus('Completed');
    });

    this.register('Alt+5', () => {
      this.setQuickStatus('Cancelled');
    });

    this.register('Escape', () => {
      // Handled by detail-panel and modal
    });

    // Listen for keyboard events
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  register(key, callback) {
    this.shortcuts.set(key.toLowerCase(), callback);
  }

  handleKeydown(e) {
    const key = this.buildKey(e);

    if (this.shortcuts.has(key)) {
      const callback = this.shortcuts.get(key);
      e.preventDefault(); // Prevent browser default behavior
      callback(e);
    }
  }

  buildKey(e) {
    const parts = [];

    if (e.metaKey) parts.push('Cmd');
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');

    parts.push(e.key);

    return parts.join('+').toLowerCase();
  }

  async setQuickStatus(status) {
    // Only works if detail panel is open
    const detailPanel = document.getElementById('detail-panel');
    if (!detailPanel || !detailPanel.classList.contains('open')) {
      return;
    }

    // Find and click the status pill
    const statusPill = document.querySelector(`#status-selector .status-pill[data-status="${status}"]`);
    if (statusPill) {
      statusPill.click();
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.shortcuts = new Shortcuts();
});