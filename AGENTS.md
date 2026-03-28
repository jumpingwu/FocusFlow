# CODEBUDDY.md This file provides guidance to CodeBuddy when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies (Node.js v14+)
npm start            # Start production server (http://localhost:3000)
npm run dev          # Dev mode with nodemon auto-restart
```

No lint, test, or build commands. No automated tests exist.

## Architecture Overview

FocusFlow is a local-first SPA with a Node.js + Express backend and vanilla JavaScript frontend (no framework). Data is stored in JSON files — no external database.

### Data Flow

All data operations follow a **read-modify-write** pattern: each API request reads `data.json` (or `data_archive.json`), modifies the in-memory data, then writes it back. A `data.json.bak` backup is auto-created before every write. There are no database indexes — all filtering/searching operates on in-memory arrays on the backend.

### Frontend-Backend Communication

The frontend communicates with the backend via the global `window.api` object (defined in `public/js/utils/api.js`). The API client wraps `fetch` calls under namespaces: `window.api.items`, `window.api.tags`, `window.api.upload`, etc. File uploads use `FormData` directly with `fetch`, bypassing JSON serialization.

### Component Communication

Frontend components communicate via **CustomEvents** dispatched on `document` — no framework state management. Key events:
- `ghostbar:taskcreated` — fired after task creation (app.js listens to refresh categories)
- `categories:updated` — category change notification
- `items:updated` — item list change notification
- `item:selected` — item selection notification
- `item:closed` — detail panel close notification

### Three-Pane Layout

```
┌─────────────────────────────────────────────────┐
│ Sidebar (250px) │  Ghost Bar (spans center+right) │
├─────────────────┼──────────────────┬──────────────┤
│ Sidebar         │  Task List       │  Detail Panel │
│ (.pane-left)    │  (.pane-center)  │  (.pane-right)│
└─────────────────┴──────────────────┴──────────────┘
```

CSS variables defined in `public/css/variables.css`: `--color-primary: #60A5FA` (blue, active state), `--color-secondary: #57534E` (gray, inactive state).

### Backend Layers

- `server.js` — Express entry point, mounts middleware (CSP, body-parser, static) and routes
- `server/routes/` — API routes split by resource (items, upload, categories, tags, review)
- `server/data-manager.js` — Data layer, single entry point for all CRUD and archive operations
- `server/validators.js` — Data validation/sanitization, defines enum constants (VALID_STATUSES, etc.)

### Frontend Structure

- `public/js/app.js` — Entry point, initializes storage and event listeners
- `public/js/components/` — UI components (one per file, exported to window via class or function)
- `public/js/utils/` — Utility modules: api (HTTP client), helpers (Markdown parsing), shortcuts (keyboard shortcuts), storage (localStorage)
- `public/index.html` — Main page, loads all JS via `<script>` tags

## Data Model

### Item

```javascript
{
  id: string,                    // UUID
  type: 'Task' | 'Idea',
  title: string,
  notes: string,                 // Markdown rich text
  category: string,
  status: 'Todo' | 'In-progress' | 'Pending' | 'Completed' | 'Cancelled',
  priority: 'Critical' | 'High' | 'Medium' | 'Low' | 'Undefined',
  urgency: 'Burning' | 'Today' | 'Later' | 'Undefined',
  targetDate: string,            // YYYY-MM-DD
  createdAt: string,             // ISO timestamp
  attachments: string[],         // Uploaded file paths
  tags: string[],
  logs: LogEntry[]
}
```

Idea type auto-sets priority/urgency to Undefined and clears targetDate.

### data.json Structure

```javascript
{ items: [], categories: [], tags: [], lastReviewDate: null }
```

Archived data is stored in a separate `data_archive.json` (`{ archivedItems: [ArchivedItem] }`). Archive is a storage location, not a status.

### LogEntry

```javascript
{ timestamp: string, type: 'manual' | 'system', msg: string, previousValue?: any }
```

On Notes change, `previousValue` stores the complete old value. Tags change format: `Tags changed: +tag1, +tag2, -tag3`.

## Development Conventions

### Data Validation

All data operations must go through `validators.js`: `sanitizeItem()` cleans and sets defaults, `validateItem()` validates integrity. Adding new fields requires updating both functions.

### Audit Logging

Field changes (Status, Priority, Urgency, TargetDate, Tags) auto-generate `type: 'system'` logs in `data-manager.js`'s `updateItem()`. Manual logs are added via `addManualLog()`.

### Tag System

Global tag pool stored in `data.json`'s `tags` array. New tags are auto-added when creating/updating items. Usage counts are computed dynamically by iterating all items (not persisted). Frontend uses the `MultiSelect` component (`new MultiSelect(inputId, options)`).

### Keyboard Shortcuts

macOS uses `Ctrl + Shift` modifier, Windows/Linux uses `Alt`. Registered in `public/js/utils/shortcuts.js`. Key shortcuts: `Ctrl+Shift+Enter` create/save, `Ctrl+Shift+1-5` set status, `Esc` close panel.

### Filtering and Matrix Grouping

Search matches Title, Category, Notes, Tags, and manual log content. The list is always grouped into four quadrants: Burning & Critical, Today & High, Other Tasks, Ideas.

### CSP Constraints

Server sets CSP headers restricting script-src, style-src, img-src, etc. img-src allows `data:` and `blob:` (for paste/drag-drop images), connect-src allows `localhost`.

### File Upload

Multer handles uploads, files are saved to `/uploads`, paths stored in item's `attachments` array. Supports drag-drop and paste.

## Important Notes

- `data.json`, `data.json.bak`, `data_archive.json`, `uploads/` are all in `.gitignore`
- No build step — frontend JS/CSS served as static files directly
- SPA routing: all non-API requests fall back to `index.html`
- New feature dev order: `server/routes/` → `server/data-manager.js` → `public/js/components/` → CSS
