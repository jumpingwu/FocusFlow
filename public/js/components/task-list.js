/**
 * Task List Component - Matrix Grouping & Display
 */
class TaskList {
  constructor() {
    this.container = document.getElementById('task-list-container');
    this.items = [];
    this.currentFilter = 'inbox';
    this.currentCategory = null;
    this.searchQuery = '';
    this.selectedItemId = null;

    this.init();
  }

  init() {
    // Load items
    this.loadItems();

    // Listen for filter changes
    document.addEventListener('sidebar:filterchange', (e) => {
      this.currentFilter = e.detail.filter;
      this.currentCategory = e.detail.category;
      this.loadItems(); // Fetch filtered items instead of just rendering
    });

    // Listen for search changes
    document.addEventListener('ghostbar:search', (e) => {
      this.searchQuery = e.detail.query;
      this.loadItems(); // Fetch filtered items instead of just rendering
    });

    // Listen for task created
    document.addEventListener('ghostbar:taskcreated', (e) => {
      if (e.detail && e.detail.item) {
        this.selectedItemId = e.detail.item.id;
      }
      this.loadItems();
    });

    // Listen for item updates
    document.addEventListener('items:updated', (e) => {
      if (e.detail && e.detail.item) {
        this.selectedItemId = e.detail.item.id;
      }
      this.loadItems();
    });
  }

  async loadItems() {
    try {
      // Handle archived filter separately
      if (this.currentFilter === 'archived') {
        this.items = await window.api.items.getArchived();

        // Apply search filter to archived items
        if (this.searchQuery) {
          const searchLower = this.searchQuery.toLowerCase();
          this.items = this.items.filter(item => {
            const titleMatch = item.item.title.toLowerCase().includes(searchLower);
            const categoryMatch = item.item.category.toLowerCase().includes(searchLower);
            const notesMatch = item.item.notes.toLowerCase().includes(searchLower);
            const logMatch = item.item.logs.some(log =>
              log.type === 'manual' && log.msg.toLowerCase().includes(searchLower)
            );
            return titleMatch || categoryMatch || notesMatch || logMatch;
          });
        }

        this.renderArchived();
        this.updateSelection();
        return;
      }

      let filters = {};

      // Apply category filter (including empty string for "No Category")
      if (this.currentCategory !== undefined && this.currentCategory !== null) {
        filters.category = this.currentCategory;
      }

      // Apply search filter
      if (this.searchQuery) {
        filters.search = this.searchQuery;
      }

      // Apply special filters
      if (this.currentFilter === 'overdue') {
        filters.overdue = 'true';
      }

      this.items = await window.api.items.getAll(filters);

      // Apply additional frontend filters
      this.items = this.applyFilters(this.items);

      this.render();
      
      // Update selection after rendering
      this.updateSelection();
    } catch (error) {
      console.error('Error loading items:', error);
    }
  }

  applyFilters(items) {
    let filtered = items;

    // Filter out archived items (check for archivedAt or archivedBy metadata)
    // Do this first for all filters
    filtered = filtered.filter(item => !item.archivedAt && !item.archivedBy);

    // Apply today filter
    if (this.currentFilter === 'today') {
      const today = window.helpers.getToday();
      filtered = filtered.filter(item => {
        const isTargetToday = item.targetDate === today;
        const isUrgencyToday = item.urgency === 'Today';
        const isUrgencyBurning = item.urgency === 'Burning';
        return isTargetToday || isUrgencyToday || isUrgencyBurning;
      });
    }

    // For overdue filter, don't apply any additional filtering
    // The backend already handles the overdue logic
    if (this.currentFilter === 'overdue') {
      return filtered;
    }

    return filtered;
  }

  render() {
    this.container.innerHTML = '';

    if (this.items.length === 0) {
      this.container.innerHTML = '<p class="empty-state">No items found</p>';
      return;
    }

    // Group items by matrix quadrant
    const groups = window.helpers.groupItemsByMatrix(this.items);

    // Render each group
    this.renderGroup('CRITICAL & BURNING', groups.burning);
    this.renderGroup('TODAY & HIGH', groups.today);
    this.renderGroup('OTHER TASKS', groups.other);
    this.renderGroup('IDEAS', groups.ideas);
  }

  renderArchived() {
    this.container.innerHTML = '';

    if (this.items.length === 0) {
      this.container.innerHTML = '<p class="empty-state">No archived items found</p>';
      return;
    }

    // Normalize archived items - extract the nested item data and merge with archive metadata
    const normalizedItems = this.items.map(archived => ({
      ...archived.item,
      archivedAt: archived.archivedAt,
      archivedBy: archived.archivedBy
    }));

    // Create a single section for archived items
    this.renderGroup('ARCHIVED ITEMS', normalizedItems, true);
  }

  renderGroup(title, items, isArchived = false) {
    if (items.length === 0) return;

    const section = document.createElement('div');
    section.className = 'matrix-section';

    const header = document.createElement('div');
    header.className = 'matrix-header';
    header.textContent = title;
    section.appendChild(header);

    items.forEach((item, index) => {
      const row = this.createTaskRow(item, isArchived);
      row.classList.add('stagger-item');
      row.style.animationDelay = `${index * 50}ms`;
      section.appendChild(row);
    });

    this.container.appendChild(section);
  }

  createTaskRow(item, isArchived = false) {
    const row = document.createElement('div');
    row.className = 'task-row';
    row.dataset.id = item.id;

    // Check if selected
    if (this.selectedItemId === item.id) {
      row.classList.add('selected');
    }

    // Check if overdue
    const isOverdue = window.helpers.isOverdue(item.targetDate, item.status);
    if (isOverdue) {
      row.classList.add('overdue');
    }

    // Check if completed
    if (item.status === 'Completed') {
      row.classList.add('completed');
    }

    // Create checkbox (disabled for archived items)
    const checkbox = document.createElement('div');
    checkbox.className = 'task-checkbox';
    if (item.status === 'Completed') {
      checkbox.classList.add('checked');
    }
    if (isArchived) {
      checkbox.classList.add('disabled');
      checkbox.style.opacity = '0.3';
      checkbox.style.cursor = 'not-allowed';
    } else {
      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleComplete(item.id);
      });
    }
    row.appendChild(checkbox);

    // Create content
    const content = document.createElement('div');
    content.className = 'task-content';

    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = item.title;
    content.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'task-meta';

    // Urgency dot
    if (item.type === 'Task' && item.urgency !== 'Undefined') {
      const dot = document.createElement('span');
      dot.className = `dot ${window.helpers.getUrgencyColorClass(item.urgency)}`;
      meta.appendChild(dot);
    }

    // Category
    if (item.category) {
      const category = document.createElement('span');
      category.className = 'task-category';
      category.textContent = item.category;
      meta.appendChild(category);
    }

    content.appendChild(meta);
    row.appendChild(content);

    // Create right side metadata (status + date)
    const rightMeta = document.createElement('div');
    rightMeta.className = 'task-right-meta';

    // Status pill
    const statusPill = document.createElement('span');
    statusPill.className = `task-status-pill ${window.helpers.getStatusColorClass(item.status)}`;
    statusPill.textContent = item.status;
    rightMeta.appendChild(statusPill);

    // Relative date
    const dateEl = document.createElement('span');
    dateEl.className = 'task-date';
    const relativeTime = window.helpers.getRelativeTime(item.targetDate, item.status);
    dateEl.textContent = relativeTime;
    
    // Add overdue styling
    if (isOverdue) {
      dateEl.classList.add('overdue');
    }
    
    rightMeta.appendChild(dateEl);

    row.appendChild(rightMeta);

    // Click to open detail
    row.addEventListener('click', () => {
      this.openDetail(item.id);
    });

    return row;
  }

  async toggleComplete(id) {
    try {
      const item = await window.api.items.getById(id);
      const newStatus = item.status === 'Completed' ? 'Todo' : 'Completed';

      await window.api.items.update(id, { status: newStatus });

      // Trigger items updated event
      const event = new CustomEvent('items:updated', { detail: { item } });
      document.dispatchEvent(event);

      // Reload items
      this.loadItems();
    } catch (error) {
      console.error('Error toggling complete:', error);
    }
  }

  openDetail(id) {
    // Set selected item
    this.selectedItemId = id;
    
    // Update UI to show selection
    this.updateSelection();
    
    // Dispatch event to open detail panel
    const event = new CustomEvent('tasklist:opendetail', { detail: { id } });
    document.dispatchEvent(event);
  }

  updateSelection() {
    // Remove selected class from all rows
    const allRows = this.container.querySelectorAll('.task-row');
    allRows.forEach(row => {
      row.classList.remove('selected');
    });

    // Add selected class to the currently selected row
    if (this.selectedItemId) {
      const selectedRow = this.container.querySelector(`.task-row[data-id="${this.selectedItemId}"]`);
      if (selectedRow) {
        selectedRow.classList.add('selected');
      } else {
        // Selected item is not in the current filtered list
        // Close detail panel and clear selection
        this.selectedItemId = null;
        const event = new CustomEvent('tasklist:closedetail');
        document.dispatchEvent(event);
      }
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.taskList = new TaskList();
});