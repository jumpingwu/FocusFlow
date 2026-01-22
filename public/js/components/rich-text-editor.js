/**
 * Rich Text Editor Component
 * Supports markdown, auto-links, and image pasting
 */
class RichTextEditor {
  constructor(textareaId) {
    this.textarea = document.getElementById(textareaId);
    if (!this.textarea) return;

    this.init();
  }

  init() {
    // Enable paste for images
    this.textarea.addEventListener('paste', this.handlePaste.bind(this));

    // Enable drag and drop for files
    this.textarea.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    this.textarea.addEventListener('drop', this.handleDrop.bind(this));

    // Auto-link on blur
    this.textarea.addEventListener('blur', this.handleAutoLink.bind(this));
  }

  async handlePaste(e) {
    const items = e.clipboardData.items;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Check if it's an image
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();

        const file = item.getAsFile();

        try {
          const result = await window.api.upload.uploadFile(file);

          // Insert image markdown at cursor position
          this.insertAtCursor(`\n![Image](/uploads/${result.filename})\n`);
        } catch (error) {
          console.error('Error pasting image:', error);
          alert('Failed to paste image: ' + error.message);
        }

        break;
      }
    }
  }

  async handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check if it's an image
      if (file.type.indexOf('image') !== -1) {
        try {
          const result = await window.api.upload.uploadFile(file);

          // Insert image markdown at cursor position
          this.insertAtCursor(`\n![Image](/uploads/${result.filename})\n`);
        } catch (error) {
          console.error('Error dropping image:', error);
          alert('Failed to drop image: ' + error.message);
        }
      }
    }
  }

  handleAutoLink() {
    const text = this.textarea.value;

    // Convert URLs to markdown links
    const linkedText = window.helpers.linkify(text);

    if (linkedText !== text) {
      this.textarea.value = linkedText;

      // Trigger input event
      const event = new Event('input', { bubbles: true });
      this.textarea.dispatchEvent(event);
    }
  }

  insertAtCursor(text) {
    const start = this.textarea.selectionStart;
    const end = this.textarea.selectionEnd;
    const value = this.textarea.value;

    this.textarea.value = value.substring(0, start) + text + value.substring(end);

    // Move cursor to end of inserted text
    this.textarea.selectionStart = this.textarea.selectionEnd = start + text.length;

    // Focus textarea
    this.textarea.focus();

    // Trigger input event
    const event = new Event('input', { bubbles: true });
    this.textarea.dispatchEvent(event);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize rich text editors for existing textareas
  const textareas = document.querySelectorAll('.form-textarea');
  textareas.forEach(textarea => {
    new RichTextEditor(textarea.id);
  });
});

// Export to window for dynamic initialization (outside DOMContentLoaded)
window.RichTextEditor = RichTextEditor;