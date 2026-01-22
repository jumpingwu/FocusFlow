/**
 * Ghost Bar Component - Quick Capture & Search
 */
class GhostBar {
  constructor() {
    this.input = document.getElementById('ghost-input');
    this.typeToggle = document.getElementById('type-toggle');
    this.typeLabel = this.typeToggle.querySelector('.type-label');
    this.clearBtn = document.getElementById('ghost-clear');

    this.currentType = 'Task';
    this.isSearching = false;
    this.searchQuery = '';

    this.init();
  }

  init() {
    // Event listeners
    this.input.addEventListener('input', this.handleInput.bind(this));
    this.input.addEventListener('keydown', this.handleKeydown.bind(this));
    this.typeToggle.addEventListener('click', this.toggleType.bind(this));
    this.clearBtn.addEventListener('click', this.clear.bind(this));

    // Focus input on load
    this.input.focus();
  }

  handleInput(e) {
    const value = e.target.value.trim();

    if (value === '' && this.isSearching) {
      // Switch back to capture mode
      this.isSearching = false;
      this.searchQuery = '';
      this.input.placeholder = 'Search or capture (Ctrl+Enter)...';
      this.clearBtn.classList.remove('visible');

      // Trigger search clear
      this.onSearchChange('');
    } else if (value !== '' && !this.isSearching) {
      // Switch to search mode
      this.isSearching = true;
      this.searchQuery = value;
      this.clearBtn.classList.add('visible');
    } else if (this.isSearching) {
      // Update search query
      this.searchQuery = value;
      if (value) {
        this.clearBtn.classList.add('visible');
      } else {
        this.clearBtn.classList.remove('visible');
      }

      // Debounced search
      this.onSearchChange(value);
    }
  }

  handleKeydown(e) {
    // Cmd/Ctrl + Enter to create task or save
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation(); // Prevent event from bubbling to detail panel

      if (this.isSearching && this.searchQuery) {
        // Convert search to new task
        this.createTaskFromSearch();
      } else if (!this.isSearching) {
        // Create task from input
        this.createTask();
      }
    }
  }

  toggleType() {
    this.currentType = this.currentType === 'Task' ? 'Idea' : 'Task';
    this.typeLabel.textContent = this.currentType;

    if (this.currentType === 'Idea') {
      this.typeToggle.classList.add('idea-mode');
    } else {
      this.typeToggle.classList.remove('idea-mode');
    }
  }

  clear() {
    this.input.value = '';
    this.isSearching = false;
    this.searchQuery = '';
    this.input.placeholder = 'Search or capture (Ctrl+Enter)...';
    this.clearBtn.classList.remove('visible');

    // Focus input
    this.input.focus();

    // Trigger search clear
    this.onSearchChange('');
  }

  async createTask() {
    const title = this.input.value.trim();

    if (!title) {
      this.input.focus();
      return;
    }

    try {
      // Dispatch event to open detail panel in creation mode
      const event = new CustomEvent('ghostbar:opencreate', {
        detail: {
          type: this.currentType,
          title: title,
          category: ''
        }
      });
      document.dispatchEvent(event);

      // Clear input
      this.input.value = '';
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task: ' + error.message);
    }
  }

  async createTaskFromSearch() {
    const title = this.searchQuery.trim();

    if (!title) {
      return;
    }

    try {
      // Dispatch event to open detail panel in creation mode
      const event = new CustomEvent('ghostbar:opencreate', {
        detail: {
          type: this.currentType,
          title: title,
          category: ''
        }
      });
      document.dispatchEvent(event);

      // Clear input and reset to capture mode
      this.clear();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task: ' + error.message);
    }
  }

  focus() {
    this.input.focus();
  }

  // Event handlers (to be overridden)
  onSearchChange(query) {
    // Dispatch custom event
    const event = new CustomEvent('ghostbar:search', { detail: { query } });
    document.dispatchEvent(event);
  }

  onTaskCreated(item) {
    // Dispatch custom event
    const event = new CustomEvent('ghostbar:taskcreated', { detail: { item } });
    document.dispatchEvent(event);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.ghostBar = new GhostBar();
});