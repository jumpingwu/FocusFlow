# Archive System Technical Design

## Overview

The archive system provides a mechanism to preserve completed and cancelled items while keeping the main task list clean and focused. Items are moved to a separate collection (`data_archive.json`) with complete snapshot preservation, allowing for later restoration or permanent deletion.

## Architecture

### Design Principles

1. **Collection-Based Identification**: Archive status is determined by which collection an item resides in, not by a field value
   - Active items: `data.json`
   - Archived items: `data_archive.json`

2. **Complete Snapshot Preservation**: When archiving, the entire item state is captured including all attributes, logs, and attachments

3. **Original Status Preservation**: The status at the time of archiving is preserved (e.g., "Archived Completed", "Archived Cancelled")

4. **Audit Trail**: Every archive and restore action is logged in the item's log history

## Data Structure

### Active Item Schema (`data.json`)

```typescript
interface Item {
  id: string;
  type: Type;                    // 'Task' | 'Idea'
  title: string;
  notes: string;
  category: string;
  status: Status;                // 'Todo' | 'In-progress' | 'Pending' | 'Completed' | 'Cancelled'
  priority: Priority;            // 'Critical' | 'High' | 'Medium' | 'Low' | 'Undefined'
  urgency: Urgency;              // 'Burning' | 'Today' | 'Later' | 'Undefined'
  targetDate: string;            // YYYY-MM-DD format
  createdAt: string;              // ISO timestamp
  attachments: string[];          // Array of filenames
  logs: LogEntry[];              // Audit trail
}

type Status = 'Todo' | 'In-progress' | 'Pending' | 'Completed' | 'Cancelled';
type Priority = 'Critical' | 'High' | 'Medium' | 'Low' | 'Undefined';
type Urgency = 'Burning' | 'Today' | 'Later' | 'Undefined';
```

### Archive Collection Schema (`data_archive.json`)

```typescript
interface ArchiveData {
  archivedItems: ArchivedItem[];
}

interface ArchivedItem {
  item: Item;                    // Complete snapshot at archive time
  archivedAt: string;            // ISO timestamp when archived
  archivedBy: string;            // 'manual' | 'morning_reset'
}
```

### Log Entry Schema

```typescript
interface LogEntry {
  timestamp: string;             // ISO timestamp
  type: 'manual' | 'system';     // Entry type
  msg: string;                   // Message content
  previousValue?: string;        // Previous value (for notes changes)
}
```

## API Endpoints

### Archive Operations

#### POST `/api/items/:id/archive`
**Purpose**: Archive an item and move it to the archive collection

**Request Body**:
```json
{
  "archivedBy": "manual" | "morning_reset"
}
```

**Response**:
```json
{
  "item": { /* complete item snapshot */ },
  "archivedAt": "2026-01-22T10:30:00.000Z",
  "archivedBy": "manual"
}
```

**Behavior**:
1. Adds a system log entry: "Item archived (manual)" or "Item archived (morning_reset)"
2. Creates archive entry with complete item snapshot
3. Removes item from `data.json`
4. Returns archive entry

#### POST `/api/items/archived/:id/restore`
**Purpose**: Restore an archived item back to the main collection

**Response**:
```json
{
  /* restored item with original status */
}
```

**Behavior**:
1. Adds a system log entry: "Item restored from archive"
2. Removes item from `data_archive.json`
3. Adds item back to `data.json`
4. Returns restored item

#### DELETE `/api/items/archived/:id`
**Purpose**: Permanently delete an archived item

**Response**:
```json
{
  "success": true
}
```

**Behavior**:
1. Removes item from `data_archive.json`
2. Cannot be undone

### Query Operations

#### GET `/api/items/archived`
**Purpose**: Get all archived items

**Response**:
```json
[
  {
    "item": { /* complete item snapshot */ },
    "archivedAt": "2026-01-22T10:30:00.000Z",
    "archivedBy": "manual"
  }
]
```

#### GET `/api/items/:id`
**Purpose**: Get a single item by ID (searches both collections)

**Response**:
```json
{
  /* item from either data.json or data_archive.json */
}
```

**Behavior**:
1. First searches in `data.json`
2. If not found, searches in `data_archive.json`
3. Returns item with archive metadata if found in archive

## Frontend Components

### Detail Panel Menu

**Location**: Top right corner of detail panel (three dots button)

**Menu Items by State**:

**Active Items**:
- Save (💾)
- Archive Item (📦)

**Archived Items**:
- Restore Item (↩)
- Permanently Delete (🗑)

**Behavior**:
- Menu toggles on click
- Closes when clicking outside
- Closes when detail panel closes
- Items shown/hidden based on archived status

### Task List Integration

**Archive Filter**:
- Sidebar button with count badge
- Shows all archived items
- Items displayed with original status preserved
- Read-only (no checkbox, no status changes)

**Search Integration**:
- Archived items included in global search results
- Results marked with `archivedAt` and `archivedBy` metadata

**Filter Behavior**:
- When switching filters, if selected item is not in filtered results:
  - Detail panel closes
  - Unsaved changes are discarded
  - Selection is cleared

## Data Manager Functions

### `archiveItem(id, archivedBy)`

**Purpose**: Archive an item with log entry

**Process**:
1. Find item in `data.json`
2. Add log entry: `Item archived (archivedBy)`
3. Create archive entry with complete snapshot
4. Write to `data_archive.json`
5. Remove from `data.json`
6. Return archive entry

### `restoreItem(id)`

**Purpose**: Restore an archived item with log entry

**Process**:
1. Find item in `data_archive.json`
2. Add log entry: `Item restored from archive`
3. Remove from `data_archive.json`
4. Add to `data.json`
5. Return restored item

### `permanentDeleteArchivedItem(id)`

**Purpose**: Permanently delete an archived item

**Process**:
1. Find item in `data_archive.json`
2. Remove from `data_archive.json`
3. Return success

### `getArchivedItems()`

**Purpose**: Get all archived items

**Process**:
1. Read `data_archive.json`
2. Return archived items array

## Business Logic

### Archive Triggers

**Manual Archive**:
- User clicks "Archive Item" in detail panel menu
- User confirms action
- Item archived with `archivedBy: 'manual'`

**Auto-Archive (Morning Reset)**:
- Runs automatically during morning reset
- All items with `status === 'Completed'` are archived
- Archived with `archivedBy: 'morning_reset'`

### Archive Identification

In frontend code, archived items are identified by metadata:

```javascript
// Check if item is archived
const isArchived = item.archivedAt || item.archivedBy;

// In search results, archived items have metadata
const itemWithArchiveMetadata = {
  ...archived.item,
  archivedAt: archived.archivedAt,
  archivedBy: archived.archivedBy
};
```

### Overdue Logic

Archived items are never considered overdue:

```javascript
function isOverdue(targetDate, status) {
  if (!targetDate || status === 'Completed' || status === 'Cancelled') {
    return false;
  }
  const today = getToday();
  return targetDate < today;
}
```

Note: Archived items are filtered out before this check, so they're never passed to `isOverdue()`.

### Search Integration

Search includes archived items by:

1. Searching in `data.json` (active items)
2. Searching in `data_archive.json` (archived items)
3. Merging results with archive metadata
4. Frontend filters out archived items from main list view
5. Archived items only visible in Archive filter or search results

## UI/UX Considerations

### Read-Only Archive View

Archived items in detail panel:
- All form fields disabled
- No save functionality
- No edit capabilities
- Only Restore and Permanently Delete actions available
- Notes displayed in view mode only
- Progress Update section hidden

### Visual Feedback

**Archive Action**:
- Confirmation dialog before archiving
- Detail panel fades out with animation
- Item removed from list
- Sidebar badge count updates

**Restore Action**:
- Confirmation dialog before restoring
- Item appears back in main list
- Original status preserved
- Sidebar badge count updates

**Permanent Delete**:
- Confirmation dialog with warning
- Item permanently removed
- Cannot be undone
- Sidebar badge count updates

### Menu Styling

- Menu icons: Colored (not grayscale)
- Permanently Delete: Red color (danger)
- Background: `var(--color-panel)` (opaque, not transparent)
- Hover effects on menu items

## Error Handling

### Common Errors

**Item Not Found** (404):
- Item doesn't exist in either collection
- Returned when trying to archive/restore/non-existent item

**Archived Item Not Found** (404):
- Item doesn't exist in archive collection
- Returned when trying to restore/permanently delete non-existent archived item

### Validation

All items are validated before operations:
- Status must be one of: `['Todo', 'In-progress', 'Pending', 'Completed', 'Cancelled']`
- Priority must be valid
- Urgency must be valid
- Target date must be valid YYYY-MM-DD format

## File Operations

### Backup Strategy

When writing to `data.json`:
1. Copy existing file to `data.json.bak`
2. Write new content to `data.json`

This provides a backup in case of write failure.

### Archive File Creation

`data_archive.json` is created automatically on first archive if it doesn't exist.

## Security Considerations

### Archive Metadata

The `archivedBy` field is validated to be either:
- `'manual'` - User-initiated archive
- `'morning_reset'` - System-initiated archive

This prevents injection of arbitrary values.

### Log Integrity

System logs are added with proper timestamps and cannot be modified through the API.

## Performance

### Search Performance

- Active items search: O(n) where n = active items
- Archive search: O(m) where m = archived items
- Combined: O(n + m)

For typical usage (hundreds of items), this is performant.

### File I/O

- Archive operations: 2 file writes (archive.json, data.json.bak + data.json)
- Restore operations: 2 file writes (data_archive.json, data.json.bak + data.json)

## Testing Considerations

### Test Scenarios

1. Archive active item → item moves to archive, log entry added
2. Restore archived item → item returns to main list, log entry added
3. Permanent delete archived item → item removed permanently
4. Morning reset → all completed items archived
5. Search with archived items → results include both collections
6. Filter switch with selected item not in results → panel closes
7. Archive item, try to edit → all fields disabled
8. Archive item, try to delete from main list → not found (in archive)
9. Restore item → original status preserved
10. Multiple archives/restores → proper log history maintained