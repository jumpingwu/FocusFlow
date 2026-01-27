/**
 * Rich Text Editor Component
 * Supports markdown, auto-links, image pasting, and HTML to markdown conversion
 */
class RichTextEditor {
  constructor(textareaId) {
    this.textarea = document.getElementById(textareaId);
    if (!this.textarea) return;

    this.pasteMode = 'plain'; // 'plain' or 'rich'
    this.init();
  }

  init() {
    // Enable paste for images and text
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

  setPasteMode(mode) {
    this.pasteMode = mode;
  }

  getPasteMode() {
    return this.pasteMode;
  }

  /**
   * Convert HTML to Markdown
   */
  htmlToMarkdown(html) {
    // Create a temporary div to parse HTML
    const div = document.createElement('div');
    div.innerHTML = html;

    let markdown = '';

    // Helper to get text content excluding SVG elements
    const getTextWithoutSvg = (node) => {
      let text = '';
      for (let child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          text += child.textContent;
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() !== 'svg') {
          text += getTextWithoutSvg(child);
        }
      }
      return text;
    };

    // Process nodes recursively
    const processNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return '';
      }

      const tagName = node.tagName.toLowerCase();
      let result = '';

      // Skip SVG elements entirely
      if (tagName === 'svg') {
        return '';
      }

      // For <a> tags, get text content without SVG
      if (tagName === 'a') {
        const href = node.getAttribute('href') || '';
        // Use textContent to get raw text without processing nested elements
        const linkText = node.textContent.trim();
        // Only include link if there's text content
        if (linkText) {
          result = `[${linkText}](${href})`;
        }
        return result;
      }

      // For <img> tags, get attributes directly
      if (tagName === 'img') {
        const src = node.getAttribute('src') || '';
        const alt = node.getAttribute('alt') || 'Image';
        result = `![${alt}](${src})`;
        return result;
      }

      // Process child nodes for other elements
      const children = Array.from(node.childNodes).map(processNode).join('');

      switch (tagName) {
        case 'b':
        case 'strong':
          result = `**${children}**`;
          break;
        case 'i':
        case 'em':
          result = `*${children}*`;
          break;
        case 'u':
          result = `<u>${children}</u>`;
          break;
        case 'code':
          result = `\`${children}\``;
          break;
        case 'pre':
          result = `\`\`\`\n${children}\n\`\`\``;
          break;
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          const level = parseInt(tagName.charAt(1));
          result = `${'#'.repeat(level)} ${children}\n`;
          break;
        case 'p':
          result = `${children}\n\n`;
          break;
        case 'br':
          result = '\n';
          break;
        case 'ul':
                  result = children.split('\n').filter(line => line.trim()).map(line => `- ${line}`).join('\n') + '\n';
                  break;
        case 'ol':
                  result = children.split('\n').filter(line => line.trim()).map((line, i) => `${i + 1}. ${line}`).join('\n') + '\n';
                  break;        case 'li':
          result = `${children}\n`;
          break;
        case 'blockquote':
          result = `> ${children.replace(/\n/g, '\n> ')}`;
          break;
        case 'table':
          // Simple table conversion
          const rows = Array.from(node.querySelectorAll('tr'));
          if (rows.length > 0) {
            const header = rows[0];
            const headers = Array.from(header.querySelectorAll('th, td')).map(th => th.textContent.trim()).join(' | ');
            const separator = Array.from(header.querySelectorAll('th, td')).map(() => '---').join(' | ');
            const body = rows.slice(1).map(row => {
              return Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim()).join(' | ');
            }).join('\n');
            // Add pipes at start and end of each line, and extra newline at end
            result = `| ${headers} |\n| ${separator} |\n${body.split('\n').map(line => `| ${line} |`).join('\n')}\n\n`;
          }
          break;
        case 'div':
        case 'span':
        case 'section':
        case 'article':
          result = children;
          break;
        default:
          result = children;
      }

      return result;
    };

    // Process all child nodes
    Array.from(div.childNodes).forEach(node => {
      markdown += processNode(node);
    });

    // Clean up extra whitespace
    markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

    return markdown;
  }

  async handlePaste(e) {
    const items = e.clipboardData.items;

    // Check for images first
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

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

        return;
      }
    }

    // Handle text paste
    if (this.pasteMode === 'rich') {
      // Try to get HTML from clipboard
      const htmlData = e.clipboardData.getData('text/html');
      if (htmlData) {
        e.preventDefault();
        const markdown = this.htmlToMarkdown(htmlData);
        this.insertAtCursor(markdown);
      }
    }
    // If plain text mode or no HTML data, let default paste behavior handle it
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