/**
 * Daily Review Modal Component
 * Review and triage overdue tasks
 */
class DailyReviewModal {
  constructor() {
    this.modal = document.getElementById('daily-review-modal');
    this.modalBody = document.getElementById('review-modal-body');
    this.modalFooter = document.getElementById('review-modal-footer');
    this.skipBtn = document.getElementById('review-skip');
    this.completeBtn = document.getElementById('review-complete');

    this.overdueItems = [];
    this.currentIndex = 0;

    this.init();
  }

  init() {
    // Skip button
    this.skipBtn.addEventListener('click', () => {
      this.close();
    });

    // Complete button
    this.completeBtn.addEventListener('click', () => {
      this.completeReview();
    });

    // Check for review on load
    this.checkForReview();
  }

  async checkForReview() {
    try {
      const status = await window.api.review.getStatus();

      if (status.needsReview && status.overdueCount > 0) {
        // Load overdue items
        this.overdueItems = await window.api.review.getOverdue();

        if (this.overdueItems.length > 0) {
          this.show();
        }
      }
    } catch (error) {
      console.error('Error checking review status:', error);
    }
  }

  show() {
    this.currentIndex = 0;
    this.renderCurrentItem();
    this.modal.classList.add('active');
  }

  close() {
    this.modal.classList.remove('active');
    this.overdueItems = [];
    this.currentIndex = 0;
  }

  renderCurrentItem() {
    if (this.currentIndex >= this.overdueItems.length) {
      // All items reviewed
      this.showSuccess();
      return;
    }

    const item = this.overdueItems[this.currentIndex];

    const statusOptions = ['Todo', 'In-progress', 'Pending', 'Completed', 'Cancelled'];
    const priorityOptions = ['Critical', 'High', 'Medium', 'Low', 'Undefined'];
    const urgencyOptions = ['Burning', 'Today', 'Later', 'Undefined'];

    const optionHtml = (options, current) =>
      options.map(o => `<option value="${o}" ${o === current ? 'selected' : ''}>${o}</option>`).join('');

    this.modalBody.innerHTML = `
      <div class="review-item fade-in">
        <div class="review-item-header">
          <h3>${window.helpers.escapeHtml(item.title)}</h3>
          <span class="review-item-meta">
            Due: ${window.helpers.formatDateReadable(item.targetDate)}
          </span>
        </div>

        <div class="notes-rendered">
          ${item.notes ? window.helpers.parseMarkdown(item.notes) : '<p class="empty-state">No notes</p>'}
        </div>
      </div>
    `;

    // Render controls and actions in footer
    this.modalFooter.innerHTML = `
      <div class="review-footer-row">
        <div class="review-controls">
          <div class="review-control-group">
            <label class="review-control-label">Status</label>
            <select class="form-select review-select" data-field="status">
              ${optionHtml(statusOptions, item.status)}
            </select>
          </div>
          <div class="review-control-group">
            <label class="review-control-label">Priority</label>
            <select class="form-select review-select" data-field="priority">
              ${optionHtml(priorityOptions, item.priority)}
            </select>
          </div>
          <div class="review-control-group">
            <label class="review-control-label">Urgency</label>
            <select class="form-select review-select" data-field="urgency">
              ${optionHtml(urgencyOptions, item.urgency)}
            </select>
          </div>
          <div class="review-control-group">
            <label class="review-control-label">Target Date</label>
            <input type="date" class="form-input review-date-input" data-field="targetDate" value="${item.targetDate || ''}">
          </div>
        </div>
      </div>
      <div class="review-footer-row">
        <div class="review-progress">
          ${this.currentIndex + 1} of ${this.overdueItems.length}
        </div>
        <div class="review-actions">
          <button class="btn btn-secondary review-action-btn" data-action="archive">Archive</button>
          <button class="btn btn-primary review-confirm-btn">Confirm & Next</button>
        </div>
      </div>
    `;

    // Confirm button
    this.modalFooter.querySelector('.review-confirm-btn').addEventListener('click', () => {
      this.handleSave();
    });

    // Archive button
    this.modalFooter.querySelector('.review-action-btn').addEventListener('click', () => {
      this.handleAction('archive');
    });
  }

  async handleAction(action) {
    const item = this.overdueItems[this.currentIndex];

    try {
      switch (action) {
        case 'archive':
          await window.api.items.archive(item.id, 'manual');
          break;
      }

      this.currentIndex++;
      this.renderCurrentItem();
    } catch (error) {
      console.error('Error handling review action:', error);
      alert('Failed to update item: ' + error.message);
    }
  }

  async handleSave() {
    const item = this.overdueItems[this.currentIndex];

    const status = this.modalFooter.querySelector('[data-field="status"]').value;
    const priority = this.modalFooter.querySelector('[data-field="priority"]').value;
    const urgency = this.modalFooter.querySelector('[data-field="urgency"]').value;
    const targetDate = this.modalFooter.querySelector('[data-field="targetDate"]').value;

    try {
      await window.api.items.update(item.id, {
        status,
        priority,
        urgency,
        targetDate: targetDate || null
      });

      this.currentIndex++;
      this.renderCurrentItem();
    } catch (error) {
      console.error('Error saving review item:', error);
      alert('Failed to update item: ' + error.message);
    }
  }

  showSuccess() {
    this.modalBody.innerHTML = `
      <div class="review-success fade-in">
        <div class="success-icon">✓</div>
        <h3>Daily Review Complete!</h3>
        <p>All overdue items have been reviewed.</p>
      </div>
    `;

    // Clear footer controls
    this.modalFooter.innerHTML = '';

    // Auto-close after 2 seconds
    setTimeout(() => {
      this.completeReview();
    }, 2000);
  }

  async completeReview() {
    try {
      // Mark review as complete
      await window.api.review.complete();

      // Perform morning reset (move completed to archived)
      await window.api.review.morningReset();

      // Close modal
      this.close();

      // Trigger items updated event
      const event = new CustomEvent('items:updated');
      document.dispatchEvent(event);

      // Refresh task list
      if (window.taskList) {
        window.taskList.loadItems();
      }

      // Refresh sidebar
      if (window.sidebar) {
        window.sidebar.updateCounts();
      }
    } catch (error) {
      console.error('Error completing review:', error);
      alert('Failed to complete review: ' + error.message);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.dailyReviewModal = new DailyReviewModal();
});