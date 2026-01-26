/**
 * MultiSelect Component - Dropdown with pill badges for selecting multiple values
 */
class MultiSelect {
  constructor(inputId, options = []) {
    this.input = document.getElementById(inputId);
    if (!this.input) return;

    this.options = options;
    this.filteredOptions = [...options];
    this.selectedValues = [];
    this.isOpen = false;
    this.selectedIndex = -1;

    this.init();
  }

  init() {
    // Create container with pills display
    this.container = document.createElement('div');
    this.container.className = 'multi-select-container';
    this.input.parentNode.insertBefore(this.container, this.input);

    // Create pills container
    this.pillsContainer = document.createElement('div');
    this.pillsContainer.className = 'multi-select-pills';
    this.container.appendChild(this.pillsContainer);

    // Move input into container
    this.input.classList.add('multi-select-input');
    this.container.appendChild(this.input);

    // Create dropdown
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'multi-select-dropdown';
    this.container.appendChild(this.dropdown);

    // Event listeners
    this.input.addEventListener('focus', () => this.open());
    this.input.addEventListener('input', (e) => this.handleInput(e));
    this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
    this.input.addEventListener('blur', () => this.handleBlur());

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.close();
      }
    });

    // Initial render
    this.renderPills();
    this.renderDropdown();
  }

  setOptions(options) {
    this.options = options;
    this.filteredOptions = [...options];
    this.renderDropdown();
  }

  handleInput(e) {
    const value = e.target.value.trim();
    this.filteredOptions = this.options.filter(opt =>
      opt.toLowerCase().includes(value.toLowerCase())
    );
    this.selectedIndex = -1;
    this.renderDropdown();
    this.open();
  }

  handleKeydown(e) {
    if (!this.isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.open();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredOptions.length - 1);
        this.highlightOption();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.highlightOption();
        break;
      case 'Enter':
        e.preventDefault();
        if (this.selectedIndex >= 0) {
          this.selectOption(this.filteredOptions[this.selectedIndex]);
        } else {
          // Create new tag from input
          const value = this.input.value.trim();
          if (value && !this.selectedValues.includes(value)) {
            this.addValue(value);
            this.input.value = '';
            this.filteredOptions = [...this.options];
            this.renderDropdown();
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        this.close();
        break;
      case 'Backspace':
        if (this.input.value === '' && this.selectedValues.length > 0) {
          e.preventDefault();
          this.removeValue(this.selectedValues[this.selectedValues.length - 1]);
        }
        break;
      case 'Tab':
        if (this.selectedIndex >= 0) {
          e.preventDefault();
          this.selectOption(this.filteredOptions[this.selectedIndex]);
        } else {
          this.close();
        }
        break;
    }
  }

  handleBlur() {
    // Delay closing to allow click events on dropdown items
    setTimeout(() => this.close(), 150);
  }

  open() {
    this.isOpen = true;
    this.dropdown.classList.add('open');
    this.renderDropdown();
  }

  close() {
    this.isOpen = false;
    this.dropdown.classList.remove('open');
  }

  selectOption(option) {
    if (!this.selectedValues.includes(option)) {
      this.addValue(option);
    }
    this.input.value = '';
    this.filteredOptions = [...this.options];
    this.selectedIndex = -1;
    this.renderDropdown();
    this.input.focus();
  }

  addValue(value) {
    if (!this.selectedValues.includes(value)) {
      this.selectedValues.push(value);
      this.renderPills();
      this.input.value = '';
      this.open();
      this.input.focus();

      // Trigger input event to notify listeners
      const event = new Event('input', { bubbles: true });
      this.input.dispatchEvent(event);
    }
  }

  removeValue(value) {
    this.selectedValues = this.selectedValues.filter(v => v !== value);
    this.renderPills();
    this.open();

    // Trigger input event to notify listeners
    const event = new Event('input', { bubbles: true });
    this.input.dispatchEvent(event);
  }

  highlightOption() {
    const options = this.dropdown.querySelectorAll('.multi-select-option');
    options.forEach((opt, index) => {
      if (index === this.selectedIndex) {
        opt.classList.add('highlighted');
        opt.scrollIntoView({ block: 'nearest' });
      } else {
        opt.classList.remove('highlighted');
      }
    });
  }

  renderPills() {
    this.pillsContainer.innerHTML = '';
    this.selectedValues.forEach(value => {
      const pill = document.createElement('span');
      pill.className = 'multi-select-pill';
      pill.innerHTML = `
        ${window.helpers.escapeHtml(value)}
        <button class="multi-select-pill-remove" data-value="${window.helpers.escapeHtml(value)}" type="button">&times;</button>
      `;
      this.pillsContainer.appendChild(pill);

      // Add click handler for remove button
      const removeBtn = pill.querySelector('.multi-select-pill-remove');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeValue(value);
        this.input.focus();
      });
    });
  }

  renderDropdown() {
    this.dropdown.innerHTML = '';

    // Filter out already selected values
    const availableOptions = this.filteredOptions.filter(opt => !this.selectedValues.includes(opt));

    if (availableOptions.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'multi-select-empty';
      if (this.input.value.trim()) {
        empty.textContent = `Press Enter to create "${this.input.value.trim()}"`;
      } else {
        empty.textContent = 'No matching tags';
      }
      this.dropdown.appendChild(empty);
      return;
    }

    availableOptions.forEach((option, index) => {
      const optionEl = document.createElement('div');
      optionEl.className = 'multi-select-option';
      if (index === this.selectedIndex) {
        optionEl.classList.add('highlighted');
      }
      optionEl.textContent = option;
      optionEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectOption(option);
      });
      this.dropdown.appendChild(optionEl);
    });
  }

  getValues() {
    return [...this.selectedValues];
  }

  setValues(values) {
    this.selectedValues = values || [];
    this.renderPills();
  }

  clear() {
    this.selectedValues = [];
    this.renderPills();
    this.input.value = '';
  }
}

// Export to window for dynamic initialization
window.MultiSelect = MultiSelect;