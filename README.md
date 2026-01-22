# FocusFlow

A personal productivity system with task and idea management.

## Features

- Quick capture of Tasks and Ideas
- Dynamic category management
- Automated audit logging with versioning
- Daily review mechanism for overdue tasks
- Rich text editor with image support
- File attachments (drag-drop and paste)
- Search and filtering
- Keyboard shortcuts

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
focusflow/
├── server.js                 # Express server entry point
├── data.json                 # Data storage
├── package.json              # Dependencies
├── server/                   # Backend logic
│   ├── data-manager.js       # Data layer
│   ├── validators.js         # Data validation
│   ├── audit-logger.js       # Audit logging
│   ├── daily-review.js       # Daily review logic
│   └── routes/               # API routes
│       ├── items.js
│       ├── upload.js
│       └── categories.js
├── public/                   # Frontend assets
│   ├── index.html            # Main page
│   ├── css/                  # Stylesheets
│   ├── js/                   # JavaScript
│   │   ├── components/       # UI components
│   │   └── utils/            # Utilities
│   └── modals/               # Modal templates
└── uploads/                  # File uploads directory
```

## Keyboard Shortcuts

- `Cmd/Ctrl + F/N` - Focus the Ghost Bar (Search/Capture)
- `Cmd/Ctrl + Enter` - Create new task or Save and Close Detail Panel
- `Ctrl + 1/2/3` - Set Status (Todo / In-Progress / Pending)
- `Esc` - Clear search or Close current panel/modal

## License

MIT