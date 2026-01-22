/**
 * Log History Component
 * Display and filter item logs
 */
class LogHistory {
  constructor(containerId, logs = []) {
    this.container = document.getElementById(containerId);
    this.logs = logs;
    this.currentFilter = 'all';

    this.init();
  }

  init() {
    if (!this.container) return;

    this.render();
  }

  setLogs(logs) {
    this.logs = logs;
    this.render();
  }

  render() {
    const filterDiv = document.createElement('div');
    filterDiv.className = 'log-filter';
    filterDiv.innerHTML = `
      <button class="log-filter-btn ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
      <button class="log-filter-btn ${this.currentFilter === 'manual' ? 'active' : ''}" data-filter="manual">Manual</button>
    `;

    // Filter button click handlers
    filterDiv.querySelectorAll('.log-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentFilter = btn.dataset.filter;
        this.render();
      });
    });

    // Clear container
    this.container.innerHTML = '';
    this.container.appendChild(filterDiv);

    // Render log entries
    const entriesDiv = document.createElement('div');
    entriesDiv.id = 'log-entries';

    const filteredLogs = this.logs.filter(log => {
      if (this.currentFilter === 'manual') {
        return log.type === 'manual';
      }
      return true;
    });

    // Reverse chronological order
    const reversedLogs = [...filteredLogs].reverse();

    reversedLogs.forEach(log => {
      const entry = this.createLogEntry(log);
      entriesDiv.appendChild(entry);
    });

    this.container.appendChild(entriesDiv);
  }

  createLogEntry(log) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${log.type}`;

    // Timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'log-timestamp';
    timestamp.textContent = window.helpers.formatDateTime(log.timestamp);
    entry.appendChild(timestamp);

    // Message
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
        this.onRestore(log.previousValue);
      });
      entry.appendChild(restoreBtn);
    }

    return entry;
  }

  onRestore(previousValue) {
    // Dispatch restore event
    const event = new CustomEvent('log:restore', { detail: { previousValue } });
    document.dispatchEvent(event);
  }
}

// Export for use in other components
window.LogHistory = LogHistory;