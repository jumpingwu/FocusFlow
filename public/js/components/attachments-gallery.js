/**
 * Attachments Gallery Component
 * Display and manage file attachments
 */
class AttachmentsGallery {
  constructor(galleryId, itemId) {
    this.gallery = document.getElementById(galleryId);
    this.itemId = itemId;
    this.attachments = [];

    this.init();
  }

  init() {
    if (!this.gallery) return;

    this.render();
  }

  setAttachments(attachments) {
    this.attachments = attachments;
    this.render();
  }

  render() {
    this.gallery.innerHTML = '';

    if (this.attachments.length === 0) {
      this.gallery.innerHTML = '<p class="empty-state" style="font-size: 12px;">No attachments</p>';
      return;
    }

    this.attachments.forEach(filename => {
      const card = this.createAttachmentCard(filename);
      this.gallery.appendChild(card);
    });
  }

  createAttachmentCard(filename) {
    const card = document.createElement('div');
    card.className = 'attachment-card';

    // Check if image
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);

    if (isImage) {
      const img = document.createElement('img');
      img.src = `/uploads/${filename}`;
      img.alt = 'Attachment';
      img.loading = 'lazy';

      // Click to view full size
      img.addEventListener('click', () => {
        this.viewImage(filename);
      });

      card.appendChild(img);
    } else {
      card.classList.add('file');

      const icon = document.createElement('div');
      icon.className = 'attachment-icon';
      icon.textContent = this.getFileIcon(filename);
      card.appendChild(icon);

      const name = document.createElement('div');
      name.className = 'attachment-name';
      name.textContent = filename;
      name.title = filename;
      card.appendChild(name);
    }

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'attachment-delete';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = 'Delete attachment';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteAttachment(filename);
    });
    card.appendChild(deleteBtn);

    return card;
  }

  getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();

    const iconMap = {
      'pdf': '📄',
      'txt': '📝',
      'doc': '📝',
      'docx': '📝',
      'xls': '📊',
      'xlsx': '📊',
      'zip': '📦',
      'rar': '📦',
    };

    return iconMap[ext] || '📎';
  }

  viewImage(filename) {
    // Open image in new tab
    window.open(`/uploads/${filename}`, '_blank');
  }

  async deleteAttachment(filename) {
    if (!confirm(`Delete "${filename}"?`)) {
      return;
    }

    try {
      // Delete file from server
      await window.api.upload.deleteFile(filename);

      // Remove from attachments array
      this.attachments = this.attachments.filter(f => f !== filename);

      // Update item on server
      if (this.itemId) {
        await window.api.items.update(this.itemId, {
          attachments: this.attachments
        });
      }

      // Re-render
      this.render();

      // Trigger event
      const event = new CustomEvent('attachments:deleted', {
        detail: { filename, itemId: this.itemId }
      });
      document.dispatchEvent(event);
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Failed to delete attachment: ' + error.message);
    }
  }
}

// Export for use in other components
window.AttachmentsGallery = AttachmentsGallery;