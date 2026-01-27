# FocusFlow

A personal productivity system with task and idea management.

## Features

- Quick capture of Tasks and Ideas
- Dynamic category management
- Automated audit logging with versioning
- Daily review mechanism for overdue tasks
- Rich text editor with markdown support
- Rich text pasting (HTML to markdown conversion)
- Image support (paste, drag-drop, upload)
- File attachments (drag-drop and paste)
- Search and filtering
- Keyboard shortcuts
- Archive system for completed/cancelled items

## Getting Started

### Prerequisites

- Node.js (v14 or higher)

### Installation

```bash
npm install
```

### Running the Application

```bash
npm start
```

Then open your browser and navigate to `http://localhost:3000`

## Project Structure

```
FocusFlow/
├── server.js                 # Express server entry point
├── data.json                 # Main data storage
├── data.json.bak             # Data backup file
├── data_archive.json         # Archived items storage (git-ignored)
├── package.json              # Dependencies
├── server/                   # Backend logic
│   ├── data-manager.js       # Data layer
│   ├── validators.js         # Data validation
│   └── routes/               # API routes
│       ├── items.js          # Item CRUD, archive, filter operations
│       ├── upload.js         # File upload handling
│       ├── categories.js     # Category CRUD operations
│       ├── tags.js           # Tag management operations
│       └── review.js         # Daily review endpoints
├── public/                   # Frontend assets
│   ├── index.html            # Main page
│   ├── css/                  # Stylesheets
│   │   ├── variables.css     # CSS variables
│   │   ├── layout.css        # Layout styles
│   │   ├── components.css    # Component styles
│   │   └── animations.css    # Animation styles
│   ├── js/                   # JavaScript
│   │   ├── app.js            # Main application logic
│   │   ├── components/       # UI components
│   │   │   ├── task-list.js  # Task list component
│   │   │   ├── detail-panel.js    # Item detail panel
│   │   │   ├── rich-text-editor.js # Rich text editor
│   │   │   ├── attachments-gallery.js # File attachments
│   │   │   ├── log-history.js # Progress log history
│   │   │   ├── daily-review-modal.js # Daily review modal
│   │   │   ├── sidebar.js    # Category sidebar
│   │   │   ├── ghost-bar.js  # Search/capture bar
│   │   │   ├── creatable-select.js # Select component
│   │   │   └── multi-select.js     # Multi-select component for tags
│   │   └── utils/            # Utility functions
│   │       ├── api.js        # API client
│   │       ├── helpers.js    # Helper functions (markdown parsing)
│   │       ├── shortcuts.js  # Keyboard shortcuts
│   │       └── storage.js    # Local storage utilities
│   └── modals/               # Modal templates (empty, uses JS-generated modals)
├── uploads/                  # File uploads directory
├── requirements/             # Documentation
│   └── PRD.md                # Product requirements document
└── designs/                  # Design documentation
    ├── UI_UX_design.md       # UI/UX design specifications
    └── archiving_design.md   # Archive system design
```

## Keyboard Shortcuts

### macOS
- `Ctrl + Shift + F/N` - Focus the Ghost Bar (Search/Capture)
- `Ctrl + Shift + Enter` - Create new task or Save and Close Detail Panel
- `Ctrl + Shift + Up/Down` - Navigate through item list (when search bar focused or item selected)
- `Ctrl + Shift + 1/2/3/4/5` - Set Status (Todo / In-progress / Pending / Completed / Cancelled) - only when Detail Panel is open
- `Esc` - Clear search or Close current panel/modal

### Windows / Linux
- `Alt + F/N` - Focus the Ghost Bar (Search/Capture)
- `Alt + Enter` - Create new task or Save and Close Detail Panel
- `Alt + Up/Down` - Navigate through item list (when search bar focused or item selected)
- `Alt + 1/2/3/4/5` - Set Status (Todo / In-progress / Pending / Completed / Cancelled) - only when Detail Panel is open
- `Esc` - Clear search or Close current panel/modal

## Usage Tips

### Rich Text Editor

The Notes and Progress Update fields support markdown rendering. Toggle between **Edit** and **View** modes using the button next to the field label.

**Markdown Features:**
- **Bold**: `**text**`
- **Italic**: `*text*`
- **Links**: `[text](url)`
- **Images**: `![alt](url)`
- **Code**: `` `code` `` (inline) or ``` ```code``` ``` (block)
- **Headers**: `# Heading 1`, `## Heading 2`, etc.
- **Lists**: `- item` (unordered) or `1. item` (ordered)
- **Tables**: Use pipe syntax `| Header | Header |`

### Rich Text Pasting

When in edit mode, use the "Paste rich text" toggle to enable HTML-to-markdown conversion:

- **Toggle OFF (gray)**: Plain text pasting (default)
- **Toggle ON (blue)**: Rich text pasting - converts HTML from web pages to markdown

Supported conversions:
- Links (preserves URLs)
- Tables
- Lists (ordered and unordered)
- Headers
- Bold and italic text
- Images

### Daily Review

Use the Daily Review feature to manage overdue tasks:
- Click the review icon in the sidebar
- Review each overdue item and take action (Complete, Archive, or Keep)
- The system tracks your last review date

### Archiving

Archived items are stored separately in `data_archive.json`:
- Archive items via the Detail Panel or Daily Review
- Archived items are removed from the main list
- Archive data is not tracked by git

### Attachments

- Drag and drop files onto the Detail Panel
- Paste images directly into Notes or Progress Update fields
- Supported formats: PNG, JPG, GIF, WEBP, SVG, BMP

### Categories

- Create categories dynamically when adding/editing items
- Filter items by category from the sidebar
- Categories are automatically managed

## License

MIT