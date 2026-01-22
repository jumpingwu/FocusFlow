# Product Requirements Document: "FocusFlow" Personal Productivity System

## 1\. Project Overview

FocusFlow is a local-first, Node.js-based productivity tool designed for high-speed capture of **Tasks** (actionable) and **Ideas** (reference). The system focuses on maintaining a "System of Record" through automated audit logging, a sophisticated state machine, and a daily review mechanism to prevent "task debt" accumulation.

## 2\. Technical Stack & Environment

-   **Backend:** Node.js (Express.js).
    
-   **Persistence:** A single `data.json` file storage.
    
-   **File Handling:** A local `/uploads` directory. Images from clipboard (`Ctrl+V`) or dragged files must be saved here and referenced by filename in the data.
    
-   **Access:** Localhost web application accessible via browser.
    

## 3\. Data Schema

```
type Status = 'Todo' | 'In-progress' | 'Pending' | 'Completed' | 'Cancelled';
// Note: 'Pending' specifically means blocked/waiting on external factors.

type Priority = 'Critical' | 'High' | 'Medium' | 'Low' | 'Undefined';
type Urgency = 'Burning' | 'Today' | 'Later' | 'Undefined';

interface LogEntry {
  timestamp: string; // ISO String
  type: 'manual' | 'system';
  msg: string;
  previousValue?: any; // MANDATORY: Store entire previous string for 'Notes' changes.
}

interface Item {
  id: string; // UUID
  type: 'Task' | 'Idea';
  title: string;
  notes: string; // Rich Text (Markdown/HTML). Must support URLs, embedded images, and formatting.
  category: string;
  status: Status; // Default: 'Todo'
  priority: Priority;
  urgency: Urgency;
  targetDate: string; // YYYY-MM-DD
  createdAt: string;
  attachments: string[]; // Paths to files in /uploads
  logs: LogEntry[];
}

interface ArchivedItem {
  id: string; // UUID (same as original item)
  item: Item; // Complete snapshot of item at time of archiving
  archivedAt: string; // ISO timestamp of when item was archived
  archivedBy: 'manual' | 'morning_reset'; // How the item was archived
}
```

## 4\. Functional Requirements

### 4.1. The "Quick Capture" & Dynamic Categories

-   **Inbox Priority:** A fixed input bar at the top for the `Title`. New items default to `Status: Todo`.
    
-   **Type Distinction:** Users toggle between "Task" and "Idea".
    
    -   **Ideas** bypass Priority/Urgency/TargetDate requirements. In the database, these fields should be set to `Undefined`.
        
-   **Dynamic Discovery & Real-time Updates:** \* On startup, the system scans `data.json` to compile a unique list of categories.
    
    -   **Crucial:** Whenever a user creates a new category (by typing and pressing Enter in the select box), this new category must be added to the global application state immediately. It must appear in the dropdown list for all subsequent task entries without requiring a page refresh.
        
-   **Creatable Select:** The UI dropdown allows selecting existing categories or typing a new one. Pressing "Enter" on a new string assigns it and adds it to the global pool.
    

### 4.2. Automated Audit Logging & Versioning

-   **Debounced Saving:** Log entries are generated only when a user finishes an edit session (e.g., closing the detail panel).
    
-   **Note Versioning:** If the `Notes` field is modified, the `previousValue` field in the `LogEntry` **must** contain the full text of the note before the change.
    
-   **Attribute Tracking:** Any change to `Status`, `Priority`, `Urgency`, or `Target Date` must trigger a system log: _"Status changed from X to Y"_, _"Priority changed from X to Y"_, _"Urgency changed from X to Y"_, or _"Target date changed from X to Y"_.
    
-   **Auto-Set Target Date:** When `Urgency` is set to "Today" or "Burning", the `targetDate` field is automatically set to today's date if:
    - `targetDate` is not set (empty), OR
    - `targetDate` is later than today
    
    This ensures that urgent items are properly scheduled for the current day.
    

### 4.3. Daily Review & Task Management

-   **Overdue Logic:** Defined as `status != Completed/Cancelled` AND `targetDate < Today`.
    
-   **The Modal:** On the first launch of the day (based on system date change), if overdue tasks exist, a mandatory "Review Modal" appears. Users must choose to **Renew** (set to Today), **Deprioritize**, or **Archive** each item.
    
-   **Morning Reset:** Items marked as `Completed` are archived automatically during the Morning Review. This action removes them from the primary "Completed Today" view and stores them in a separate archive collection.
    

### 4.4. Progress Logging & History Filtering

-   **Manual Logs:** Each item detail view includes a text area for manual progress updates.
    
    -   **Pending/Cancelled Rule:** If a user changes status to `Pending` or `Cancelled`, the UI must require a manual log entry. The status change is not saved until a reason is provided.
        
-   **History View Filtering:** The log history section in the detail panel must include a toggle to allow users to switch between:
    
    1.  **Full History:** Shows both `system` and `manual` logs.
        
    2.  **Manual Only:** Hides all system-generated logs.
        
-   **Restoration:** If a versioned note is found in a log, a "Restore" button must be available.
    

### 4.5. Filtering, Search & Matrix

-   **Global Text Search:** A real-time filter for Pane 2.
    
    -   **Scope:** Matches `Title`, `Category`, and `Notes`.
        
    -   **Note on Logs:** Search should check `Manual Logs` content. If a match is found in the logs but not the title, the item should still appear in the filtered list.
        
-   **Overdue Filter:** A dedicated sidebar toggle to show only overdue items.
    
-   **Today Filter:** A dedicated sidebar toggle to show items scheduled for today. Shows items where `targetDate == today` OR `urgency == 'Today'` OR `urgency == 'Burning'`. Items can have any status except 'Archived'.
    
    -   _Note:_ When the Today filter is active, items are still grouped by matrix quadrants. Items with "Burning" urgency will appear in the "Burning & Critical" section within the Today view.
    
-   **The Matrix:** Pane 2 always maintains four sections: (1) Burning & Critical, (2) Today & High, (3) Other Tasks, (4) Ideas. This structure persists even when filtered by Category.
    

### 4.6. Archive System

-   **Archive as Separate Attribute:** Archive is NOT a status. Items are identified as archived by which collection they're stored in:
  - Active items are stored in `data.json`
  - Archived items are stored in `data_archive.json`
  - The original status (Todo, In-progress, Pending, Completed, Cancelled) is preserved at the time of archiving.
    
-   **Archive Storage:** Archived items are stored in a separate collection (`data_archive.json`) with the following structure:
    ```typescript
    {
      item: Item,             // Complete snapshot of the item data (includes id)
      archivedAt: string,     // ISO timestamp when archived
      archivedBy: string      // 'manual', 'morning_reset', etc.
    }
    ```
    
-   **Archive Actions:**
    - **Manual Archive:** User can archive an item from the detail panel
    - **Auto-Archive:** Items with `status = 'Completed'` are automatically archived during Morning Reset
    - **Restore:** Archived items can be restored to their original status
    - **Permanent Delete:** Archived items can be permanently deleted (cannot be undone)
    
-   **Archive Filter:** A dedicated sidebar toggle to show only archived items with a count badge.
    
-   **Archive Search:** Archived items are included in global search results.
    
-   **Archive Metadata Display:** When viewing an archived item, the detail panel shows:
    - Archive timestamp (when it was archived)
    - Archive reason (how it was archived)
    - Original status at time of archiving
    - Restore and Permanently Delete buttons
    

## 5\. UI/UX Core Requirements

-   **Layout:** 3-pane layout (Filters/Categories | Task List | Detail & Log Panel).
    
-   **Rich Text Editor:** Supports Auto-links, Formatting, and Image Rendering from the `/uploads` reference.
    
    -   **Markdown Support:** The Notes and Progress Update fields support the following markdown syntax:
        - **Headers:** `# H1`, `## H2`, `### H3`, etc.
        - **Bold:** `**bold text**`
        - **Italic:** `*italic text*`
        - **Inline Code:** `` `code` ``
        - **Code Blocks:** ``` code block ```
        - **Links:** `[text](url)`
        - **Images:** `![alt text](url)`
        - **Auto-links:** URLs are automatically converted to clickable links
    
-   **Interactions:** Support `Ctrl+V` for image pasting and Drag-and-Drop for file attachments to the `/uploads` folder.