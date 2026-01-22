/**
 * Sidebar Component - Filters & Category Navigation
 */
class Sidebar {
  constructor() {
    this.filterButtons = document.querySelectorAll('.filter-btn');
    this.categoryList = document.getElementById('category-list');
    this.overdueBadge = document.getElementById('overdue-badge');
    this.archivedBadge = document.getElementById('archived-badge');

    this.currentFilter = 'inbox';
    this.currentCategory = null;
    this.categories = [];

    this.init();
  }

  init() {
    // Load saved filter
    const savedFilter = window.storage.getSelectedFilter();
    if (savedFilter) {
      this.setFilter(savedFilter);
    }

    // Load saved category
    const savedCategory = window.storage.getSelectedCategory();
    if (savedCategory) {
      this.currentCategory = savedCategory;
    }

    // Event listeners
    this.filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        this.setFilter(filter);
      });
    });

    // Load categories
    this.loadCategories();

    // Listen for category updates
    document.addEventListener('categories:updated', () => {
      this.loadCategories();
    });

    // Listen for item updates to refresh categories and counts
    document.addEventListener('items:updated', () => {
      this.loadCategories();
    });
  }

  setFilter(filter) {
    this.currentFilter = filter;
    this.currentCategory = null;

    // Update UI
    this.filterButtons.forEach(btn => {
      if (btn.dataset.filter === filter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Save to storage
    window.storage.setSelectedFilter(filter);
    window.storage.setSelectedCategory(null);

    // Dispatch filter change event
    const event = new CustomEvent('sidebar:filterchange', {
      detail: { filter, category: null }
    });
    document.dispatchEvent(event);
  }

  setCategory(category) {
    console.log('Sidebar.setCategory: Called with category:', JSON.stringify(category));

    this.currentCategory = category;
    this.currentFilter = null;

    // Update UI
    this.filterButtons.forEach(btn => {
      btn.classList.remove('active');
    });

    // Update category list
    const categoryItems = this.categoryList.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
      if (item.dataset.category === category) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Save to storage
    window.storage.setSelectedFilter(null);
    window.storage.setSelectedCategory(category);

    // Dispatch filter change event
    console.log('Sidebar.setCategory: Dispatching event with category:', JSON.stringify(category));
    const event = new CustomEvent('sidebar:filterchange', {
      detail: { filter: null, category }
    });
    document.dispatchEvent(event);
  }

  async loadCategories() {
    try {
      const categories = await window.api.categories.getAll();
      this.categories = categories;
      this.renderCategories();
      this.updateCounts();
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  renderCategories() {
    this.categoryList.innerHTML = '';

    // Add "No Category" option at the top
    const noCategoryItem = document.createElement('button');
    noCategoryItem.className = 'category-item';
    noCategoryItem.dataset.category = '';
    noCategoryItem.innerHTML = `
      <span class="category-name">No Category</span>
      <span class="category-count" data-category="">0</span>
    `;

    noCategoryItem.addEventListener('click', () => {
      this.setCategory('');
    });

    this.categoryList.appendChild(noCategoryItem);

    if (this.categories.length === 0) {
      return;
    }

    // Add separator line
    const separator = document.createElement('div');
    separator.className = 'category-separator';
    this.categoryList.appendChild(separator);

    this.categories.forEach(category => {
      const item = document.createElement('button');
      item.className = 'category-item';
      item.dataset.category = category;
      item.innerHTML = `
        <span class="category-name">${window.helpers.escapeHtml(category)}</span>
        <span class="category-count" data-category="${category}">0</span>
      `;

      item.addEventListener('click', () => {
        this.setCategory(category);
      });

      this.categoryList.appendChild(item);
    });
  }

  async updateCounts() {
    try {
      // Update overdue badge
      const overdueItems = await window.api.items.getAll({ overdue: 'true' });
      this.overdueBadge.textContent = overdueItems.length;
      this.overdueBadge.style.display = overdueItems.length > 0 ? 'inline-flex' : 'none';

      // Update archived badge
      const archivedItems = await window.api.items.getArchived();
      this.archivedBadge.textContent = archivedItems.length;
      this.archivedBadge.style.display = archivedItems.length > 0 ? 'inline-flex' : 'none';

      // Update category counts
      const allItems = await window.api.items.getAll();
      const categoryCounts = window.helpers.countByCategory(allItems);

      const countElements = this.categoryList.querySelectorAll('.category-count');
      countElements.forEach(el => {
        const category = el.dataset.category;
        el.textContent = categoryCounts[category] || 0;
      });
    } catch (error) {
      console.error('Error updating counts:', error);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.sidebar = new Sidebar();
});