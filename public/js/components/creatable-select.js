/**
 * Creatable Select Component - Dropdown with text input for creating new options
 */
class CreatableSelect {
  constructor(inputId, options = []) {
    this.input = document.getElementById(inputId);
    if (!this.input) return;

    this.options = options;
    this.filteredOptions = [...options];
    this.isOpen = false;
    this.selectedIndex = -1;

    this.init();
  }

  init() {
    // Create dropdown container
    this.container = document.createElement('div');
    this.container.className = 'creatable-select-container';
    this.input.parentNode.insertBefore(this.container, this.input);
    this.container.appendChild(this.input);

    // Add styling class to input
    this.input.classList.add('creatable-select-input');

    // Create dropdown list
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'creatable-select-dropdown';
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
          // Create new category
          this.close();
        }
        break;
      case 'Escape':
        e.preventDefault();
        this.close();
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
    this.input.value = option;
    this.close();
    this.input.focus();
    
    // Trigger input event to notify listeners
    const event = new Event('input', { bubbles: true });
    this.input.dispatchEvent(event);
  }

  highlightOption() {
    const options = this.dropdown.querySelectorAll('.creatable-select-option');
    options.forEach((opt, index) => {
      if (index === this.selectedIndex) {
        opt.classList.add('highlighted');
        opt.scrollIntoView({ block: 'nearest' });
      } else {
        opt.classList.remove('highlighted');
      }
    });
  }

  renderDropdown() {
    this.dropdown.innerHTML = '';

    if (this.filteredOptions.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'creatable-select-empty';
      empty.textContent = 'No matching categories';
      this.dropdown.appendChild(empty);
      return;
    }

    this.filteredOptions.forEach((option, index) => {
      const optionEl = document.createElement('div');
      optionEl.className = 'creatable-select-option';
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

  getValue() {
    return this.input.value.trim();
  }

  setValue(value) {
    this.input.value = value;
  }
}

// Export to window for dynamic initialization
window.CreatableSelect = CreatableSelect;