# Change Log

All notable changes to the "cursor-kanban" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.2.0] - 2025-10-01

### Added

- Task comments: Add, update, and remove per‑task comments; comments appear in the Task Info modal and serialize into markdown using `[Comments: ...]`
- Unique Task IDs: Each task persists a stable `[id: ...]` used for reliable cross‑board moves and round‑trip parsing
- Cross‑board drag & drop: Move tasks between different Kanban boards (different `tasks.md` files/panels)
- Column reordering: Drag column handles to reorder columns; order is persisted to `tasks.md`
- Theme toggle: Light/Dark theme with persistence via `localStorage`
- Find in tasks: Built‑in find (Ctrl/Cmd+F) with highlighting and next/prev navigation
- Keyboard chord: Ctrl/Cmd+G then Ctrl/Cmd+T opens the New Task modal
- Command to open from any markdown: `cursor-kanban.openBoardFromFile` lets you pick a `.md` file to open as a board

### Changed

- Markdown format: Tasks now include `[id: ...]` and optional `[Comments: ...]`; existing files without IDs are automatically assigned IDs on read and written back
- Drag and Drop: Improved placeholder and robustness, including edge cases and cross‑panel drops
- File watching: Panels auto‑refresh with debounced updates when the underlying file changes
- Documentation: README updated with new features, commands, and task file format details

### Fixed

- Ensured column order persistence when reordering columns
- Robust handling of multi‑line notes and comment round‑trips
- Safer drag state cleanup when dropping across panels

## [0.1.0] - 2025-09-11

### Added

- **Task Priority System**: Added 5-level priority system (Highest, High, Medium, Low, Lowest) with color-coded badges
- **Task Notes**: Support for detailed task descriptions and notes
- **Enhanced UI**: Completely redesigned Kanban board with modern styling and improved user experience
- **Better Task Management**: Improved task creation, editing, and deletion workflows
- **Drag and Drop**: Enhanced drag and drop functionality for task management
- **Improved Error Handling**: Better error messages and validation
- **Enhanced Documentation**: Comprehensive code documentation and improved comments
- **Add/Remove Columns**: Create new columns and remove existing ones directly from the board
- **Task Info Modal**: View task title, priority, status, and multi-line notes in a modal
- **Auto Text Direction**: Detects RTL/LTR from the first character for titles and notes
- **Input Auto‑Pairing**: Smart pairing for (), {}, [], quotes, and backticks in inputs
- **Keyboard Shortcuts**: Enter to submit inputs; Esc to close modals
- **Workspace Title**: Shows current workspace name at the top of the board
- **Task Removal**: Quick remove button on each task

### Changed

- **Task Data Structure**: Extended task interface to include priority and notes fields
- **UI/UX Improvements**: Modern card-based design with better visual hierarchy
- **Code Quality**: Refactored codebase with better separation of concerns and improved maintainability
- **Testing**: Enhanced test coverage for new features
- **Drag-and-Drop Precision**: Uses live placeholder and correct reordering when moving within a column
- **Done State Logic**: Moving a task to `Done` marks it completed; moving out clears completion

### Fixed

- Improved file initialization and column management
- Better handling of edge cases in task parsing
- Enhanced workspace folder validation
- Ensure `tasks.md` always contains a `Done` column if missing
- Preserve multi-line notes read/write formatting

## [0.0.1] - 2025-09-10

### Added

- Initial release of Cursor Kanban
- Command: "Cursor Kanban: Open Board" (`cursor-kanban.openBoard`)
- Kanban webview that reads/writes `tasks.md`
- Parsing of `##` headings as columns
- Markdown checkboxes (`- [ ]` / `- [x]`) as tasks with toggle support
