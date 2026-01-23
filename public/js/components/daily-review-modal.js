/**
 * Daily Review Modal Component
 * Review and triage overdue tasks
 */
class DailyReviewModal {
  constructor() {
    this.modal = document.getElementById('daily-review-modal');
    this.modalBody = document.getElementById('review-modal-body');
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

    this.modalBody.innerHTML = `
      <div class="review-item fade-in">
        <div class="review-item-header">
          <h3>${window.helpers.escapeHtml(item.title)}</h3>
          <span class="review-item-meta">
            Due: ${window.helpers.formatDateReadable(item.targetDate)}
          </span>
        </div>

        <div class="review-item-notes">
          ${item.notes ? window.helpers.parseMarkdown(item.notes) : '<p class="empty-state">No notes</p>'}
        </div>

        <div class="review-actions">
          <button class="btn btn-secondary review-action-btn" data-action="renew">
            📅 Renew (Set to Today)
          </button>
          <button class="btn btn-secondary review-action-btn" data-action="deprioritize">
            ⬇️ Deprioritize
          </button>
          <button class="btn btn-secondary review-action-btn" data-action="archive">
            📦 Archive
          </button>
        </div>

        <div class="review-progress">
          ${this.currentIndex + 1} of ${this.overdueItems.length}
        </div>
      </div>
    `;

    // Add action button listeners
    const actionButtons = this.modalBody.querySelectorAll('.review-action-btn');
    actionButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.handleAction(btn.dataset.action);
      });
    });
  }

  async handleAction(action) {
    const item = this.overdueItems[this.currentIndex];

    try {
      switch (action) {
        case 'renew':
          // Set target date to today
          await window.api.items.update(item.id, {
            targetDate: window.helpers.getToday()
          });
          break;

        case 'deprioritize':
          // Lower priority and urgency
          const newPriority = this.lowerPriority(item.priority);
          const newUrgency = this.lowerUrgency(item.urgency);
          await window.api.items.update(item.id, {
            priority: newPriority,
            urgency: newUrgency
          });
          break;

        case 'archive':
          // Archive the item
          await window.api.items.archive(item.id, 'manual');
          break;
      }

      // Move to next item
      this.currentIndex++;
      this.renderCurrentItem();
    } catch (error) {
      console.error('Error handling review action:', error);
      alert('Failed to update item: ' + error.message);
    }
  }

  lowerPriority(priority) {
    const priorities = ['Critical', 'High', 'Medium', 'Low', 'Undefined'];
    const currentIndex = priorities.indexOf(priority);
    return priorities[Math.min(currentIndex + 1, priorities.length - 1)];
  }

  lowerUrgency(urgency) {
    const urgencies = ['Burning', 'Today', 'Later', 'Undefined'];
    const currentIndex = urgencies.indexOf(urgency);
    return urgencies[Math.min(currentIndex + 1, urgencies.length - 1)];
  }

  showSuccess() {
    this.modalBody.innerHTML = `
      <div class="review-success fade-in">
        <div class="success-icon">✓</div>
        <h3>Daily Review Complete!</h3>
        <p>All overdue items have been reviewed.</p>
      </div>
    `;

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