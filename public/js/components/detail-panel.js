/**
 * Detail Panel Component - Item Details & Editing
 */
class DetailPanel {
  constructor() {
    this.panel = document.getElementById('detail-panel');
    this.titleEl = document.getElementById('detail-title');
    this.bodyEl = document.getElementById('detail-body');
    this.closeBtn = document.getElementById('close-detail');

    this.currentItem = null;
    this.isDirty = false;
    this.pendingLogRequired = false;

    // Add creation mode support
    this.mode = 'edit'; // 'edit' or 'create'
    this.tempItemData = {}; // Stores temporary data during creation

    // Store rich text editor instances
    this.notesEditor = null;
    this.logEditor = null;

    this.init();
  }

  init() {
    // Close button
    this.closeBtn.addEventListener('click', () => {
      this.close();
    });

    // Menu button
    const menuBtn = document.getElementById('detail-menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMenu();
      });
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      const menuDropdown = document.getElementById('detail-menu-dropdown');
      const menuBtn = document.getElementById('detail-menu-btn');
      if (menuDropdown && menuBtn && 
          !e.target.closest('.menu-dropdown') && 
          !e.target.closest('.menu-btn')) {
        this.closeMenu();
      }
    });

    // Menu items
    const saveMenuItem = document.getElementById('menu-save');
    if (saveMenuItem) {
      saveMenuItem.addEventListener('click', () => {
        this.save();
        this.closeMenu();
      });
    }

    const archiveMenuItem = document.getElementById('menu-archive');
    if (archiveMenuItem) {
      archiveMenuItem.addEventListener('click', () => {
        this.archiveItem();
        this.closeMenu();
      });
    }

    const restoreMenuItem = document.getElementById('menu-restore');
    if (restoreMenuItem) {
      restoreMenuItem.addEventListener('click', () => {
        this.restoreItem();
        this.closeMenu();
      });
    }

    const permanentDeleteMenuItem = document.getElementById('menu-permanent-delete');
    if (permanentDeleteMenuItem) {
      permanentDeleteMenuItem.addEventListener('click', () => {
        this.permanentlyDeleteItem();
        this.closeMenu();
      });
    }

    // Listen for open detail event (edit mode)
    document.addEventListener('tasklist:opendetail', async (e) => {
      await this.open(e.detail.id);
    });

    // Listen for ghostbar opencreate event (creation mode)
    document.addEventListener('ghostbar:opencreate', async (e) => {
      await this.openForCreation(e.detail);
    });

    // Listen for close detail event from task list
    document.addEventListener('tasklist:closedetail', () => {
      this.close();
    });

    // Listen for keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.panel.classList.contains('open')) {
        this.close();
        this.closeMenu();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && this.panel.classList.contains('open')) {
        // Don't save if item is archived
        if (this.currentItem && (this.currentItem.archivedAt || this.currentItem.archivedBy)) {
          return;
        }
        e.preventDefault();
        this.save();
      }
    });
  }

  async open(id) {
    try {
      const item = await window.api.items.getById(id);
      this.currentItem = item;
      this.mode = 'edit';
      this.isDirty = false;
      this.pendingLogRequired = false;

      // Update title
      this.titleEl.textContent = item.title;

      // Render body
      this.renderBody(item);

      // Open panel
      this.panel.classList.add('open');
      
      // Reload categories for creatable select
      await this.reloadCategories();
    } catch (error) {
      console.error('Error opening detail:', error);
      alert('Failed to load item details: ' + error.message);
    }
  }

  async openForCreation(data) {
    try {
      // Set mode and store temporary data
      this.mode = 'create';
      this.tempItemData = {
        type: data.type || 'Task',
        title: data.title || '',
        category: data.category || '',
        status: 'Todo',
        priority: 'Undefined',
        urgency: 'Undefined',
        targetDate: '',
        notes: ''
      };

      // Create a temporary item object for rendering
      this.currentItem = {
        ...this.tempItemData,
        id: null, // No ID yet
        createdAt: new Date().toISOString(),
        attachments: [],
        logs: []
      };

      this.isDirty = true; // Always dirty in creation mode
      this.pendingLogRequired = false;

      // Update title
      this.titleEl.textContent = this.currentItem.title || 'New Item';

      // Render body
      this.renderBody(this.currentItem);

      // Open panel
      this.panel.classList.add('open');
      
      // Reload categories for creatable select
      await this.reloadCategories();
    } catch (error) {
      console.error('Error opening creation panel:', error);
      alert('Failed to open creation panel: ' + error.message);
    }
  }

  async reloadCategories() {
    try {
      const categories = await window.api.categories.getAll();
      if (this.categorySelect) {
        this.categorySelect.setOptions(categories);
      }
    } catch (error) {
      console.error('Error reloading categories:', error);
    }
  }

  renderBody(item) {
    this.bodyEl.innerHTML = '';

    // Check if item is archived
    const isArchived = item.archivedAt || item.archivedBy;

    // Archived date (only for archived items)
    if (isArchived) {
      const archivedDateGroup = document.createElement('div');
      archivedDateGroup.className = 'form-group';
      archivedDateGroup.innerHTML = `
        <div style="color: var(--color-text-secondary); font-size: var(--font-size-sm);">
          Archived on ${window.helpers.formatDateTime(item.archivedAt)}
        </div>
      `;
      this.bodyEl.appendChild(archivedDateGroup);
    }

    // Type indicator
    const typeBadge = document.createElement('div');
    typeBadge.className = 'form-group';
    typeBadge.innerHTML = `
      <label class="form-label">Type</label>
      <div style="font-weight: 500;">${item.type}</div>
    `;
    this.bodyEl.appendChild(typeBadge);

    // Title input
    const titleGroup = document.createElement('div');
    titleGroup.className = 'form-group';
    titleGroup.innerHTML = `
      <label class="form-label" for="detail-title-input">Title</label>
      <input type="text" class="form-input" id="detail-title-input" value="${window.helpers.escapeHtml(item.title)}" ${isArchived ? 'disabled' : ''}>
    `;
    this.bodyEl.appendChild(titleGroup);

    // Category input (creatable select)
    const categoryGroup = document.createElement('div');
    categoryGroup.className = 'form-group';
    categoryGroup.innerHTML = `
      <label class="form-label" for="detail-category-input">Category</label>
      <input type="text" class="form-input" id="detail-category-input" value="${window.helpers.escapeHtml(item.category)}" ${isArchived ? 'disabled' : ''}>
    `;
    this.bodyEl.appendChild(categoryGroup);

    // Status selector
    const statusGroup = document.createElement('div');
    statusGroup.className = 'form-group';
    statusGroup.innerHTML = `
      <label class="form-label">Status</label>
      <div class="status-selector" id="status-selector" ${isArchived ? 'style="pointer-events: none; opacity: 0.6;"' : ''}>
        ${this.renderStatusPills(item.status, isArchived)}
      </div>
    `;
    this.bodyEl.appendChild(statusGroup);

    // Dynamic attributes for Tasks
    if (item.type === 'Task') {
      const attrGroup = document.createElement('div');
      attrGroup.className = 'attribute-grid';

      // Priority
      attrGroup.innerHTML += `
        <div class="form-group">
          <label class="form-label" for="detail-priority">Priority</label>
          <select class="form-select" id="detail-priority" ${isArchived ? 'disabled' : ''}>
            ${this.renderPriorityOptions(item.priority)}
          </select>
        </div>
      `;

      // Urgency
      attrGroup.innerHTML += `
        <div class="form-group">
          <label class="form-label" for="detail-urgency">Urgency</label>
          <select class="form-select" id="detail-urgency" ${isArchived ? 'disabled' : ''}>
            ${this.renderUrgencyOptions(item.urgency)}
          </select>
        </div>
      `;

      // Target date
      attrGroup.innerHTML += `
        <div class="form-group" style="grid-column: span 2;">
          <label class="form-label" for="detail-target-date">Target Date</label>
          <input type="date" class="form-input" id="detail-target-date" value="${item.targetDate}" ${isArchived ? 'disabled' : ''}>
        </div>
      `;

      this.bodyEl.appendChild(attrGroup);
    }

    // Created date
    const createdGroup = document.createElement('div');
    createdGroup.className = 'form-group';
    createdGroup.innerHTML = `
      <label class="form-label">Created</label>
      <div style="color: var(--color-text-secondary);">${window.helpers.formatDateTime(item.createdAt)}</div>
    `;
    this.bodyEl.appendChild(createdGroup);

    // Notes (rich text editor)
    const notesGroup = document.createElement('div');
    notesGroup.className = 'form-group';
    if (isArchived) {
      // For archived items, show notes in view mode only
      notesGroup.innerHTML = `
        <label class="form-label">Notes</label>
        <div class="notes-content" style="padding: var(--spacing-sm); background-color: var(--color-bg-secondary); border-radius: var(--radius-md);">
          ${item.notes ? window.helpers.parseMarkdown(item.notes) : '<em style="color: var(--color-text-muted);">No notes</em>'}
        </div>
      `;
    } else {
      // For active items, show editable notes with toggle
      notesGroup.innerHTML = `
        <label class="form-label" for="detail-notes">Notes</label>
        <div class="notes-header">
          <button class="btn btn-secondary btn-sm" id="notes-toggle" title="Toggle edit/view" aria-label="Toggle notes view/edit mode">View</button>
          <div class="paste-mode-toggle" id="notes-paste-mode-container">
            <div class="paste-mode-switch" id="notes-paste-mode-switch" title="Toggle rich text paste"></div>
            <span class="paste-mode-label">Paste rich text</span>
          </div>
        </div>
        <div class="notes-content">
          <textarea class="form-textarea" id="detail-notes" rows="8" placeholder="Add notes...">${window.helpers.escapeHtml(item.notes)}</textarea>
          <div class="notes-rendered" id="detail-notes-rendered" style="display: none;" role="region" aria-live="polite"></div>
        </div>
      `;
    }
    this.bodyEl.appendChild(notesGroup);

    // Attachments
    const attachmentsGroup = document.createElement('div');
    attachmentsGroup.className = 'form-group';
    attachmentsGroup.innerHTML = `
      <label class="form-label">Attachments</label>
      <div class="attachments-gallery" id="attachments-gallery" role="list" aria-label="Attachments"></div>
      ${!isArchived ? '<button class="btn btn-secondary btn-sm" id="add-attachment-btn" style="margin-top: 8px;" aria-label="Add attachment">+ Add Attachment</button>' : ''}
    `;
    this.bodyEl.appendChild(attachmentsGroup);

    // Manual log entry (only for active items)
    if (!isArchived) {
      const logGroup = document.createElement('div');
      logGroup.className = 'form-group';
      logGroup.innerHTML = `
        <label class="form-label" for="detail-log">Progress Update</label>
        <div class="notes-header">
          <button class="btn btn-secondary btn-sm" id="log-toggle" title="Toggle edit/view" aria-label="Toggle progress update view/edit mode">View</button>
          <div class="paste-mode-toggle" id="log-paste-mode-container">
            <div class="paste-mode-switch" id="log-paste-mode-switch" title="Toggle rich text paste"></div>
            <span class="paste-mode-label">Paste rich text</span>
          </div>
        </div>
        <div class="notes-content">
          <textarea class="form-textarea" id="detail-log" rows="3" placeholder="Add a progress update..."></textarea>
          <div class="notes-rendered" id="detail-log-rendered" style="display: none;" role="region" aria-live="polite"></div>
        </div>
        <button class="btn btn-secondary btn-sm" id="add-log-btn" style="margin-top: 8px;" aria-label="Add progress update">+ Add Update</button>
      `;
      this.bodyEl.appendChild(logGroup);
    }

    // Log history
    const historyGroup = document.createElement('div');
    historyGroup.className = 'log-history';
    historyGroup.innerHTML = `
      <label class="form-label">History</label>
      <div class="log-filter" id="log-filter" role="group" aria-label="History filter">
        <button class="log-filter-btn active" data-filter="all" aria-label="Show all history entries">All</button>
        <button class="log-filter-btn" data-filter="manual" aria-label="Show manual history entries only">Manual</button>
      </div>
      <div id="log-entries" role="list" aria-label="History entries"></div>
    `;
    this.bodyEl.appendChild(historyGroup);

    // Setup event listeners
    this.setupEventListeners(isArchived);

    // Update menu items visibility based on archived status
    this.updateMenuVisibility(isArchived);

    // Initialize sub-components
    this.initializeAttachments(item.attachments, isArchived);
    this.initializeLogHistory(item.logs);
  }

  renderStatusPills(currentStatus, isArchived = false) {
    const statuses = ['Todo', 'In-progress', 'Pending', 'Completed', 'Cancelled'];
    return statuses.map(status => `
      <span class="status-pill ${window.helpers.getStatusColorClass(status)} ${status === currentStatus ? 'active' : ''}" data-status="${status}" ${isArchived ? 'style="pointer-events: none; cursor: default;"' : ''}>
        ${status}
      </span>
    `).join('');
  }

  renderPriorityOptions(currentPriority) {
    const priorities = ['Critical', 'High', 'Medium', 'Low', 'Undefined'];
    return priorities.map(p => `
      <option value="${p}" ${p === currentPriority ? 'selected' : ''}>${p}</option>
    `).join('');
  }

  renderUrgencyOptions(currentUrgency) {
    const urgencies = ['Burning', 'Today', 'Later', 'Undefined'];
    return urgencies.map(u => `
      <option value="${u}" ${u === currentUrgency ? 'selected' : ''}>${u}</option>
    `).join('');
  }

  setupEventListeners(isArchived = false) {
      // Skip all event listeners for archived items
      if (isArchived) {
        // Log filter buttons
        const logFilterBtns = document.querySelectorAll('.log-filter-btn');
        logFilterBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            logFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.filterLogs(btn.dataset.filter);
          });
        });
  
        return;
      }
  
      // Title input
      const titleInput = document.getElementById('detail-title-input');
      titleInput.addEventListener('input', () => {
        this.isDirty = true;
      });
  
      // Category input - initialize creatable select
      const categoryInput = document.getElementById('detail-category-input');
      if (categoryInput) {
        // Load categories and initialize creatable select
        window.api.categories.getAll().then(categories => {
          if (window.CreatableSelect) {
            this.categorySelect = new window.CreatableSelect('detail-category-input', categories);
            categoryInput.addEventListener('input', () => {
              this.isDirty = true;
            });
          }
        }).catch(error => {
          console.error('Error loading categories:', error);
        });
      }
  
      // Status pills
      const statusPills = document.querySelectorAll('#status-selector .status-pill');
      statusPills.forEach(pill => {
        pill.addEventListener('click', () => {
          const newStatus = pill.dataset.status;
          this.handleStatusChange(newStatus);
        });
      });
  
      // Priority and urgency selects
      const prioritySelect = document.getElementById('detail-priority');
      if (prioritySelect) {
        prioritySelect.addEventListener('change', () => {
          this.isDirty = true;
        });
      }
  
      const urgencySelect = document.getElementById('detail-urgency');
      if (urgencySelect) {
        urgencySelect.addEventListener('change', () => {
          this.isDirty = true;
  
          // Auto-set target date to today if urgency is Today or Burning
          const targetDateInput = document.getElementById('detail-target-date');
          if (targetDateInput) {
            const newUrgency = urgencySelect.value;
            const currentTargetDate = targetDateInput.value;
            const today = window.helpers.getToday();
  
            // Set target date to today if:
            // 1. Urgency is Today or Burning
            // 2. Target date is not set OR target date is later than today
            if ((newUrgency === 'Today' || newUrgency === 'Burning') &&
                (!currentTargetDate || currentTargetDate > today)) {
              targetDateInput.value = today;
              this.isDirty = true;
            }
          }
        });
      }
  
      const targetDateInput = document.getElementById('detail-target-date');
      if (targetDateInput) {
        targetDateInput.addEventListener('change', () => {
          this.isDirty = true;
        });
      }
  
      // Notes textarea (only for active items)
          const notesTextarea = document.getElementById('detail-notes');
          const notesRendered = document.getElementById('detail-notes-rendered');
          const notesToggle = document.getElementById('notes-toggle');

          if (notesTextarea) {
            notesTextarea.addEventListener('input', () => {
              this.isDirty = true;
            });

            // Set initial mode based on whether we're creating or editing
            let isEditMode = this.mode === 'create'; // Edit mode for create, view mode for edit

            // Set initial display state
            if (isEditMode) {
              notesTextarea.style.display = 'block';
              notesRendered.style.display = 'none';
              if (notesToggle) notesToggle.textContent = 'View';
            } else {
              // Render the notes in view mode
              const notesContent = notesTextarea.value;
            notesRendered.innerHTML = window.helpers.parseMarkdown(notesContent);
            notesTextarea.style.display = 'none';
            notesRendered.style.display = 'block';
            if (notesToggle) notesToggle.textContent = 'Edit';
          }
      
          // Toggle between edit and view modes
          if (notesToggle) {
            notesToggle.addEventListener('click', () => {
              isEditMode = !isEditMode;
      
              if (isEditMode) {
                // Switch to edit mode
                notesTextarea.style.display = 'block';
                notesRendered.style.display = 'none';
                notesToggle.textContent = 'View';
                // Show paste mode toggle
                const notesPasteModeContainer = document.getElementById('notes-paste-mode-container');
                if (notesPasteModeContainer) {
                  notesPasteModeContainer.style.display = 'flex';
                }
              } else {
                // Switch to view mode - render markdown
                const notesContent = notesTextarea.value;
                notesRendered.innerHTML = window.helpers.parseMarkdown(notesContent);
                notesTextarea.style.display = 'none';
                notesRendered.style.display = 'block';
                notesToggle.textContent = 'Edit';
                // Hide paste mode toggle
                const notesPasteModeContainer = document.getElementById('notes-paste-mode-container');
                if (notesPasteModeContainer) {
                  notesPasteModeContainer.style.display = 'none';
                }
              }
            });
          }
      
          // Initialize rich text editor for notes (must be done after textarea is created)
          if (window.RichTextEditor) {
            this.notesEditor = new window.RichTextEditor('detail-notes');
          }

          // Wire up paste mode toggle switch for notes
          const notesPasteModeSwitch = document.getElementById('notes-paste-mode-switch');
          if (notesPasteModeSwitch && this.notesEditor) {
            // Set initial state (plain text = off, rich text = on)
            const initialMode = this.notesEditor.getPasteMode();
            if (initialMode === 'rich') {
              notesPasteModeSwitch.classList.add('active');
            }

            notesPasteModeSwitch.addEventListener('click', () => {
              const currentMode = this.notesEditor.getPasteMode();
              const newMode = currentMode === 'plain' ? 'rich' : 'plain';
              this.notesEditor.setPasteMode(newMode);
              
              // Update visual state
              if (newMode === 'rich') {
                notesPasteModeSwitch.classList.add('active');
              } else {
                notesPasteModeSwitch.classList.remove('active');
              }
            });
          }

          // Set initial paste mode toggle visibility based on edit mode
          const notesPasteModeContainer = document.getElementById('notes-paste-mode-container');
          if (notesPasteModeContainer) {
            notesPasteModeContainer.style.display = isEditMode ? 'flex' : 'none';
          }

          // Progress update toggle (view/edit mode) - only for active items
          const logTextarea = document.getElementById('detail-log');
          const logRendered = document.getElementById('detail-log-rendered');
          const logToggle = document.getElementById('log-toggle');

          if (logTextarea) {
            let isLogEditMode = true;

            // Set initial display state
            logTextarea.style.display = 'block';
            logRendered.style.display = 'none';
            if (logToggle) logToggle.textContent = 'View';

            // Toggle between edit and view modes for progress update
            if (logToggle) {
              logToggle.addEventListener('click', () => {
                isLogEditMode = !isLogEditMode;

                if (isLogEditMode) {
                  // Switch to edit mode
                  logTextarea.style.display = 'block';
                  logRendered.style.display = 'none';
                  logToggle.textContent = 'View';
                  // Show paste mode toggle
                  const logPasteModeContainer = document.getElementById('log-paste-mode-container');
                  if (logPasteModeContainer) {
                    logPasteModeContainer.style.display = 'flex';
                  }
                } else {
                  // Switch to view mode - render markdown
                  const logContent = logTextarea.value;
                  logRendered.innerHTML = window.helpers.parseMarkdown(logContent);
                  logTextarea.style.display = 'none';
                  logRendered.style.display = 'block';
                  logToggle.textContent = 'Edit';
                  // Hide paste mode toggle
                  const logPasteModeContainer = document.getElementById('log-paste-mode-container');
                  if (logPasteModeContainer) {
                    logPasteModeContainer.style.display = 'none';
                  }
                }
              });
            }

            // Initialize rich text editor for progress update
            if (window.RichTextEditor) {
              this.logEditor = new window.RichTextEditor('detail-log');
            }

            // Wire up paste mode toggle switch for progress update
            const logPasteModeSwitch = document.getElementById('log-paste-mode-switch');
            if (logPasteModeSwitch && this.logEditor) {
              // Set initial state (plain text = off, rich text = on)
              const initialMode = this.logEditor.getPasteMode();
              if (initialMode === 'rich') {
                logPasteModeSwitch.classList.add('active');
              }

              logPasteModeSwitch.addEventListener('click', () => {
                const currentMode = this.logEditor.getPasteMode();
                const newMode = currentMode === 'plain' ? 'rich' : 'plain';
                this.logEditor.setPasteMode(newMode);
                
                // Update visual state
                if (newMode === 'rich') {
                  logPasteModeSwitch.classList.add('active');
                } else {
                  logPasteModeSwitch.classList.remove('active');
                }
              });
            }

            // Set initial paste mode toggle visibility based on edit mode
            const logPasteModeContainer = document.getElementById('log-paste-mode-container');
            if (logPasteModeContainer) {
              logPasteModeContainer.style.display = isLogEditMode ? 'flex' : 'none';
            }
          }

      // Add attachment button
      const addAttachmentBtn = document.getElementById('add-attachment-btn');
      if (addAttachmentBtn) {
        addAttachmentBtn.addEventListener('click', () => {
          this.addAttachment();
        });
      }

      // Add log button
      const addLogBtn = document.getElementById('add-log-btn');
      if (addLogBtn) {
        addLogBtn.addEventListener('click', () => {
          this.addProgressUpdate();
        });
      }
  
      // Log filter buttons
      const logFilterBtns = document.querySelectorAll('.log-filter-btn');
      logFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          logFilterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.filterLogs(btn.dataset.filter);
        });
      });
    }
  }

  handleStatusChange(newStatus) {
    // Update UI
    const statusPills = document.querySelectorAll('#status-selector .status-pill');
    statusPills.forEach(pill => {
      if (pill.dataset.status === newStatus) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    // Check if pending or cancelled status requires log
    if (newStatus === 'Pending' || newStatus === 'Cancelled') {
      this.pendingLogRequired = true;
      const logTextarea = document.getElementById('detail-log');
      logTextarea.focus();
      logTextarea.style.borderColor = 'var(--color-urgency-burning)';
      logTextarea.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
    } else {
      this.pendingLogRequired = false;
      const logTextarea = document.getElementById('detail-log');
      logTextarea.style.borderColor = '';
      logTextarea.style.boxShadow = '';
    }

    this.isDirty = true;
  }

  async save() {
    if (!this.currentItem) {
      this.close();
      return;
    }

    // Don't save if item is archived
    if (this.currentItem.archivedAt || this.currentItem.archivedBy) {
      this.close();
      return;
    }

    // Check if pending log is required
    if (this.pendingLogRequired) {
      const logTextarea = document.getElementById('detail-log');
      const logMessage = logTextarea.value.trim();

      if (!logMessage) {
        alert('Please provide a reason for the Pending status in the Progress Update field.');
        logTextarea.focus();
        return;
      }
    }

    try {
      // Gather data from form
      const itemData = {
        type: this.currentItem.type,
        title: document.getElementById('detail-title-input').value.trim(),
        category: this.categorySelect ? this.categorySelect.getValue() : document.getElementById('detail-category-input').value.trim(),
        status: document.querySelector('#status-selector .status-pill.active').dataset.status,
        notes: document.getElementById('detail-notes').value,
      };

      // Add task-specific attributes
      if (this.currentItem.type === 'Task') {
        itemData.priority = document.getElementById('detail-priority').value;
        itemData.urgency = document.getElementById('detail-urgency').value;
        itemData.targetDate = document.getElementById('detail-target-date').value;
      }

      if (this.mode === 'create') {
        // Create new item
        const newItem = await window.api.items.create(itemData);

        // Add manual log if provided
        const logTextarea = document.getElementById('detail-log');
        const logMessage = logTextarea.value.trim();

        if (logMessage) {
          await window.api.items.addLog(newItem.id, logMessage);
        }

        // Trigger task created event
        const event = new CustomEvent('ghostbar:taskcreated', { detail: { item: newItem } });
        document.dispatchEvent(event);
      } else {
        // Update existing item
        if (!this.isDirty) {
          this.close();
          return;
        }

        // Update item
        await window.api.items.update(this.currentItem.id, itemData);

        // Add manual log if provided
        const logTextarea = document.getElementById('detail-log');
        const logMessage = logTextarea.value.trim();

        if (logMessage) {
          await window.api.items.addLog(this.currentItem.id, logMessage);
        }
      }

      // Trigger items updated event
      const event = new CustomEvent('items:updated', { detail: { item: this.currentItem } });
      document.dispatchEvent(event);

      // Close panel
      this.close();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item: ' + error.message);
    }
  }

  close() {
    this.panel.classList.remove('open');
    this.closeMenu();

    // If in creation mode, just cancel (no item created)
    if (this.mode === 'create') {
      this.mode = 'edit';
      this.tempItemData = {};
    }

    this.currentItem = null;
    this.isDirty = false;
    this.pendingLogRequired = false;
  }

  async addProgressUpdate() {
    if (!this.currentItem) {
      return;
    }

    const logTextarea = document.getElementById('detail-log');
    const logMessage = logTextarea.value.trim();

    if (!logMessage) {
      alert('Please enter a progress update message.');
      return;
    }

    try {
      await window.api.items.addLog(this.currentItem.id, logMessage);

      // Clear the textarea
      logTextarea.value = '';

      // Reload item to get updated logs
      await this.open(this.currentItem.id);

      // Trigger items updated event
      const event = new CustomEvent('items:updated', { detail: { item: this.currentItem } });
      document.dispatchEvent(event);
    } catch (error) {
      console.error('Error adding progress update:', error);
      alert('Failed to add progress update: ' + error.message);
    }
  }

  initializeAttachments(attachments, isArchived = false) {
    const gallery = document.getElementById('attachments-gallery');
    if (!gallery) return;

    gallery.innerHTML = '';

    attachments.forEach(filename => {
      const card = document.createElement('div');
      card.className = 'attachment-card';

      // Check if image
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);

      if (isImage) {
        const img = document.createElement('img');
        img.src = `/uploads/${filename}`;
        img.alt = 'Attachment';
        img.addEventListener('click', () => {
          window.open(`/uploads/${filename}`, '_blank');
        });
        card.appendChild(img);
      } else {
        card.classList.add('file');
        card.innerHTML = `
          <div class="attachment-icon">📎</div>
          <div class="attachment-name">${filename}</div>
        `;
      }

      // Delete button (only for active items)
      if (!isArchived) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'attachment-delete';
        deleteBtn.innerHTML = '×';
        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm('Delete this attachment?')) {
            await this.deleteAttachment(filename);
          }
        });
        card.appendChild(deleteBtn);
      }

      gallery.appendChild(card);
    });
  }

  async addAttachment() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf,.txt,.doc,.docx';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const result = await window.api.upload.uploadFile(file);

        // Update item
        const updatedAttachments = [...this.currentItem.attachments, result.filename];
        await window.api.items.update(this.currentItem.id, {
          attachments: updatedAttachments
        });

        // Reload item
        await this.open(this.currentItem.id);

        // Trigger items updated event
        const event = new CustomEvent('items:updated', { detail: { item: this.currentItem } });
        document.dispatchEvent(event);
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Failed to upload file: ' + error.message);
      }
    };

    input.click();
  }

  async deleteAttachment(filename) {
    try {
      // Delete file
      await window.api.upload.deleteFile(filename);

      // Update item
      const updatedAttachments = this.currentItem.attachments.filter(f => f !== filename);
      await window.api.items.update(this.currentItem.id, {
        attachments: updatedAttachments
      });

      // Reload item
      await this.open(this.currentItem.id);

      // Trigger items updated event
      const event = new CustomEvent('items:updated', { detail: { item: this.currentItem } });
      document.dispatchEvent(event);
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Failed to delete attachment: ' + error.message);
    }
  }

  initializeLogHistory(logs) {
    const container = document.getElementById('log-entries');
    if (!container) return;

    this.renderLogs(logs, 'all');
  }

  renderLogs(logs, filter) {
    const container = document.getElementById('log-entries');
    if (!container) return;

    container.innerHTML = '';

    const filteredLogs = logs.filter(log => {
      if (filter === 'manual') {
        return log.type === 'manual';
      }
      return true;
    });

    // Reverse chronological order
    const reversedLogs = [...filteredLogs].reverse();

    reversedLogs.forEach(log => {
      const entry = document.createElement('div');
      entry.className = `log-entry ${log.type}`;

      const timestamp = document.createElement('div');
      timestamp.className = 'log-timestamp';
      timestamp.textContent = window.helpers.formatDateTime(log.timestamp);
      entry.appendChild(timestamp);

      const message = document.createElement('div');
      message.className = 'log-message';
      message.innerHTML = window.helpers.parseMarkdown(log.msg);
      entry.appendChild(message);

      // Restore button for notes changes
      if (log.previousValue) {
        const restoreBtn = document.createElement('button');
        restoreBtn.className = 'log-restore-btn';
        restoreBtn.innerHTML = '↩ Restore';
        restoreBtn.addEventListener('click', () => {
          if (confirm('Restore this version of the notes?')) {
            this.restoreNotes(log.previousValue);
          }
        });
        entry.appendChild(restoreBtn);
      }

      container.appendChild(entry);
    });
  }

  filterLogs(filter) {
    if (!this.currentItem) return;
    this.renderLogs(this.currentItem.logs, filter);
  }

  async restoreNotes(previousValue) {
    try {
      await window.api.items.update(this.currentItem.id, {
        notes: previousValue
      });

      // Reload item
      await this.open(this.currentItem.id);

      // Trigger items updated event
      const event = new CustomEvent('items:updated', { detail: { item: this.currentItem } });
      document.dispatchEvent(event);
    } catch (error) {
      console.error('Error restoring notes:', error);
      alert('Failed to restore notes: ' + error.message);
    }
  }

  async archiveItem() {
    if (!this.currentItem || !this.currentItem.id) {
      return;
    }

    if (!confirm('Are you sure you want to archive this item?')) {
      return;
    }

    try {
      // Add fade-out animation
      this.panel.classList.add('fade-out');

      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 300));

      // Archive the item
      await window.api.items.archive(this.currentItem.id);

      // Trigger items updated event
      const event = new CustomEvent('items:updated', { detail: { item: this.currentItem } });
      document.dispatchEvent(event);

      // Close panel
      this.close();

      // Remove fade-out class for next time
      this.panel.classList.remove('fade-out');
    } catch (error) {
      console.error('Error archiving item:', error);
      alert('Failed to archive item: ' + error.message);
      this.panel.classList.remove('fade-out');
    }
  }

  async restoreItem() {
    if (!this.currentItem || !this.currentItem.id) {
      return;
    }

    if (!confirm('Are you sure you want to restore this item? It will be moved back to the main list with its original status.')) {
      return;
    }

    try {
      await window.api.items.restore(this.currentItem.id);

      // Trigger items updated event
      const event = new CustomEvent('items:updated', { detail: { item: this.currentItem } });
      document.dispatchEvent(event);

      // Close panel
      this.close();

      alert('Item restored successfully!');
    } catch (error) {
      console.error('Error restoring item:', error);
      alert('Failed to restore item: ' + error.message);
    }
  }

  async permanentlyDeleteItem() {
    if (!this.currentItem || !this.currentItem.id) {
      return;
    }

    if (!confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      await window.api.items.permanentDelete(this.currentItem.id);

      // Trigger items updated event
      const event = new CustomEvent('items:updated');
      document.dispatchEvent(event);

      // Close panel
      this.close();

      alert('Item permanently deleted!');
    } catch (error) {
      console.error('Error permanently deleting item:', error);
      alert('Failed to delete item: ' + error.message);
    }
  }

  toggleMenu() {
    const dropdown = document.getElementById('detail-menu-dropdown');
    if (dropdown) {
      const isHidden = dropdown.style.display === 'none';
      dropdown.style.display = isHidden ? 'block' : 'none';
    }
  }

  closeMenu() {
    const dropdown = document.getElementById('detail-menu-dropdown');
    if (dropdown) {
      dropdown.style.display = 'none';
    }
  }

  updateMenuVisibility(isArchived) {
    const saveMenuItem = document.getElementById('menu-save');
    const archiveMenuItem = document.getElementById('menu-archive');
    const restoreMenuItem = document.getElementById('menu-restore');
    const permanentDeleteMenuItem = document.getElementById('menu-permanent-delete');

    if (isArchived) {
      // Show restore and permanent delete for archived items
      if (saveMenuItem) saveMenuItem.style.display = 'none';
      if (archiveMenuItem) archiveMenuItem.style.display = 'none';
      if (restoreMenuItem) restoreMenuItem.style.display = 'flex';
      if (permanentDeleteMenuItem) permanentDeleteMenuItem.style.display = 'flex';
    } else {
      // Show save and archive for active items
      if (saveMenuItem) saveMenuItem.style.display = 'flex';
      if (archiveMenuItem) archiveMenuItem.style.display = 'flex';
      if (restoreMenuItem) restoreMenuItem.style.display = 'none';
      if (permanentDeleteMenuItem) permanentDeleteMenuItem.style.display = 'none';
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.detailPanel = new DetailPanel();
});