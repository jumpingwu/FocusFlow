# UI/UX Design Specification: FocusFlow

## 1\. Design Philosophy: "Calm Clarity"

Based on the "Zen Writer" aesthetic, the interface prioritizes whitespace, typography, and reduced visual noise. The design follows a **Local-First / Offline-Luxury** feel—using system fonts and soft transitions to ensure the tool feels like a part of the OS, not a cluttered web app.

-   **Keyboard First:** Core actions (Capture, Save, Status Change, Search) use macOS/Windows standard shortcuts.
    
-   **Information Density:** Comfort-focused list view (2B) with active whitespace.
    
-   **Context Preservation:** Side-panel editing (3A) prevents "Page-Switching Fatigue."
    
-   **The Reward Cycle:** Completion actions are visually celebrated before being organized into the daily archive.
    

## 2\. Visual System

### 2.1. Color Palette (Zen/Subtle 4B)

-   **App Canvas:** `#F9F9F9` (Off-White) / `#1C1C1E` (Soft Dark).
    
-   **Active Panel:** `#FFFFFF` (Pure White) / `#2C2C2E` (Dark).
    
-   **Border/Separator:** `#F2F2F2` (Extremely faint).
    
-   **Accents (Semantic Dots):**
    
    -   _Urgency - Burning:_ `#EF4444` (Red dot)
        
    -   _Urgency - Today:_ `#F59E0B` (Amber dot)
        
    -   _Urgency - Later:_ `#10B981` (Green dot)
        
    -   _Overdue Marker:_ Deep Red text (`#991B1B`) + Faint red tint background on the card.
        
    -   _Primary Action:_ `#57534E` (Stone-600) — Muted professional tone.
        

### 2.2. Typography

-   **Font:** `Inter` (Variable) or `System UI`.
    
-   **H1 (Task Title):** 24px, SemiBold, Tight Tracking (-0.02em).
    
-   **Body (Notes/Logs):** 16px, Regular, 1.6 Line-height (Optimized for long reading).
    
-   **Metadata:** 12px, Medium, Gray-500.
    

## 3\. Layout Structure

### 3.1. Navigation (Pane 1 - 250px)

-   **Smart Filters:** "Inbox", "Today", **"Overdue"** (with a red numerical badge), and **"Archived"** (with a count badge).
    
    -   **Today Filter:** Shows items where `targetDate == today` OR `urgency == 'Today'` OR `urgency == 'Burning'`. Items can have any status except archived.
    
    -   _Note:_ When the Today filter is active, items are still grouped by matrix quadrants. Items with "Burning" urgency will appear in the "Burning & Critical" section within the Today view.
    
    -   **Overdue Filter:** Shows items where `status != Completed/Cancelled` AND `targetDate < today`.
    
    -   **Archived Filter:** Shows all archived items from the separate archive collection. Items are displayed with their original status preserved (e.g., "Archived Completed", "Archived Cancelled").
    
-   **Category List:** Dynamic list. Active category uses a subtle stone-tinted pill.
    
-   **Interaction:** Categories should support "Drag-to-Reorder" for personal workflow sorting.
    

### 3.2. Task List (Pane 2 - Flexible)

-   **The "Ghost" Quick Capture & Search:** \* A floating bar at the top with a `30px` blur backdrop.
    
    -   **Dual Functionality:** When empty, it shows a subtle "Search or capture..." placeholder.
        
    -   **Search Trigger:** Typing filters the list below in real-time. A small "✕" appears to clear search.
        
    -   **Capture Trigger (Two-Step):** Pressing `Cmd/Ctrl + Enter` opens the Detail Panel in creation mode with the title pre-filled. Users can then add notes, set priority/urgency, target date, and category before finalizing. All fields except title are optional.
        
-   **Comfortable List (2B):** `56px` row height.
    
-   **Matrix Quadrant Grouping:** Pane 2 is divided into four sections: **1\. Critical/Burning**, **2\. High/Today**, **3\. Others**, **4\. Ideas**.
    
    -   Headers are All-Caps/11px/Gray-400 with wide tracking.
        
    -   _Note:_ This grouping persists even when a specific category is selected in Pane 1.
        
-   **Completion Animation (5C):** When checked, the task title strikes through and the row slides smoothly to the "Completed Today" bucket. At the next morning's Daily Review, these items transition to "Archived" status and vanish from this view.
    
-   **Row Metadata Display:** Each task row displays additional information on the right side:
    
    -   **Status Pill:** Colored pill showing current status (Todo, In-progress, Pending, Completed, Cancelled, Archived)
    
    -   **Relative Date:** Shows target date as relative time (e.g., "Today", "Tomorrow", "In 3 days", "Overdue by 2 days")
    
    -   **Placeholders:** Shows "Set date" when no target date is set
    
    -   **Overdue Styling:** Overdue dates are highlighted in red color
    
-   **Task Selection Highlighting:** The currently selected task is visually highlighted in the task list:
    
    -   **Visual Style:** Selected tasks display with a 4px left border accent in the primary color and a subtle background tint
    
    -   **Selection Triggers:** A task becomes selected when:
        - Clicked to open the detail panel
        - Created as a new task (automatically highlighted after creation)
        - Updated with changes (automatically highlighted after update)
    
    -   **Clear Selection:** Selection is cleared when the detail panel is closed
    

### 3.3. Contextual Detail Panel (Pane 3 - 420px)

-   **Slide-out Transition:** A `cubic-bezier(0.4, 0, 0.2, 1)` slide from the right.
    
-   **Dynamic Attributes:** If Type = "Idea", the Priority/Urgency grid is replaced by a "Created Date" label only.
    
-   **Auto-Set Target Date:** When Urgency is set to "Today" or "Burning", the Target Date is automatically set to today's date if:
    - Target Date is not set, OR
    - Target Date is later than today
    
    This ensures that urgent items are properly scheduled for the current day.
    
-   **Status Selection:** Custom pill-selector: `Todo`, `In-progress`, `Pending`, `Completed`, `Cancelled`, `Archived`.
    
    -   **Active State:** Selected status displays with solid background color, white text, and subtle shadow for clear visual distinction.
    
    -   **Inactive State:** Unselected statuses show light transparent background with colored text.
    
    -   **Validation:** If `Pending` or `Cancelled` is clicked, the "Progress Update" log field (Section 4.2) is automatically focused and highlighted in amber, requiring input before the panel can be closed.
        
-   **Attachments Gallery:** Files appear as "File Cards" with small icons (PDF, IMG, DOC) and a download/remove action.
    

## 4\. Specific Interaction Requirements

### 4.1. Creatable Category Selection

-   **UX Pattern:** The category field is a dropdown that allows both selection and creation:
    
    -   **Dropdown Display:** When focused, shows a list of existing categories
    -   **Filtering:** As you type, the list filters to show matching categories
    -   **Selection:** Click on a category or use arrow keys + Enter to select
    -   **Creation:** Type a new category name and press Enter or Tab to create it
    -   **Keyboard Navigation:** Arrow keys to navigate, Enter to select, Escape to close
    
-   **Visual:** Dropdown appears below the input field with a shadow. Selected/highlighted items have a background tint.
    

### 4.2. Progress Logging & History Filter

-   **The History Filter:** A small segmented control at the top of the history list: `[ All | Manual ]`.
    
-   **Log Section Bottom:** Reverse-chronological timeline.
    
-   **Note Versioning:** "Restore" icon appears only on system logs that track a `Notes` field modification.
    
-   **Rich Text Support:** Progress Update field supports full markdown syntax (same as Notes field) with View/Edit toggle for switching between edit and rendered modes.
    

### 4.3. Rich Content & Attachments

-   **Inline Rendering:** Pasted images show a thumbnail in the Notes editor, which expands to full size when clicked.
    
-   **Auto-linking:** Any text starting with `http`, `www`, or `localhost` must immediately turn into a clickable link style.
    

### 4.4. The Daily Review Modal

-   **Focus State:** The app background darkens to 80% opacity.
    
-   **One-at-a-time:** You triage overdue tasks sequentially. Once complete, a success state appears before the modal auto-closes.
    

### 4.5. Two-Step Task Creation

-   **Step 1 - Quick Capture:** User types title in Ghost Bar and toggles between Task/Idea. Pressing `Cmd/Ctrl + Enter` opens the Detail Panel in creation mode.
    
-   **Step 2 - Detailed Entry:** Detail Panel opens with pre-filled title. Users can optionally add:
    - Notes (rich text with full markdown support)
    - Category (creatable dropdown - select existing or type to create new)
    - Priority (Critical/High/Medium/Low/Undefined) - Task only
    - Urgency (Burning/Today/Later/Undefined) - Task only
    - Target Date (YYYY-MM-DD format) - Task only
    
    -   **Markdown Support:** The Notes and Progress Update fields support:
        - **Headers:** `# H1`, `## H2`, `### H3`, etc.
        - **Bold:** `**bold text**`
        - **Italic:** `*italic text*`
        - **Inline Code:** `` `code` ``
        - **Code Blocks:** ``` code block ```
        - **Links:** `[text](url)`
        - **Images:** `![alt text](url)`
        - **Auto-links:** URLs are automatically converted to clickable links
        - **Image Pasting:** `Ctrl+V` to paste images directly
        - **Drag & Drop:** Drag image files into the field
    
-   **Save vs Cancel:**
    - Press `Cmd/Ctrl + Enter` to create the item
    - Press `Esc` or click X to cancel (no item created)
    
-   **Idea Handling:** When Type = "Idea", Priority/Urgency/TargetDate fields are hidden (per PRD 4.1).
    
-   **Benefits:** Reuses existing Detail Panel UI, maintains consistency between creation and editing, allows users to create with just title or full details as needed.
    

## 5\. Implementation Shortcuts

-   **`Cmd + F` / `Cmd + N`:** Focus the Ghost Bar (Search/Capture).
    
-   **`Cmd + Enter` (Ghost Bar):** Open Detail Panel in creation mode with pre-filled title.
    
-   **`Cmd + Enter` (Detail Panel):** Save and close (creates new item in creation mode, updates existing in edit mode).
    
-   **`Ctrl + 1 / 2 / 3`:** Set Status (Todo / In-Progress / Pending).
    
-   **`Esc`:** Clear search or Close current panel/modal (cancels creation in creation mode).