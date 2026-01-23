/**
 * Keyboard Shortcuts Manager
 */
class Shortcuts {
  constructor() {
    this.shortcuts = new Map();

    this.init();
  }

  /**
   * Detect if running on macOS
   */
  isMac() {
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  }

  /**
   * Get the modifier key for the current platform
   * Returns 'Ctrl+Shift' for Mac, 'Alt' for Windows/Linux
   */
  getModifierKey() {
    return this.isMac() ? 'Ctrl+Shift' : 'Alt';
  }

  init() {
    const mod = this.getModifierKey();

    // Register default shortcuts
    this.register(`${mod}+F`, () => {
      if (window.ghostBar) {
        window.ghostBar.focus();
      }
    });

    this.register(`${mod}+N`, () => {
      if (window.ghostBar) {
        window.ghostBar.focus();
      }
    });

    this.register(`${mod}+Enter`, () => {
      // Handled by ghost-bar and detail-panel
    });

    this.register(`${mod}+1`, () => {
      this.setQuickStatus('Todo');
    });

    this.register(`${mod}+2`, () => {
      this.setQuickStatus('In-progress');
    });

    this.register(`${mod}+3`, () => {
      this.setQuickStatus('Pending');
    });

    this.register(`${mod}+4`, () => {
      this.setQuickStatus('Completed');
    });

    this.register(`${mod}+5`, () => {
      this.setQuickStatus('Cancelled');
    });

    this.register('Escape', () => {
      // Handled by detail-panel and modal
    });

    this.register(`${mod}+ArrowUp`, () => {
      if (window.taskList) {
        window.taskList.navigateUp();
      }
    });

    this.register(`${mod}+ArrowDown`, () => {
      if (window.taskList) {
        window.taskList.navigateDown();
      }
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

    // For digit keys, use e.code to handle Shift+digit correctly
    // e.code returns the physical key position (e.g., "Digit2")
    // e.key returns the character produced (e.g., "@" for Shift+2)
    if (e.code && e.code.startsWith('Digit')) {
      parts.push(e.code.replace('Digit', ''));
    } else if (e.code && e.code === 'Enter') {
      parts.push('Enter');
    } else if (e.code && e.code.startsWith('Arrow')) {
      parts.push(e.code);
    } else {
      parts.push(e.key);
    }

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