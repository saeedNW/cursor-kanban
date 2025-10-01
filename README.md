# Cursor Kanban

Lightweight Kanban board for Markdown tasks inside VS Code and Cursor.

Cursor Kanban renders a clean, interactive Kanban view powered by a simple Markdown file. Each column is a Markdown heading and each task is a checklist item. Toggle tasks directly from the board and your Markdown stays perfectly in sync.

## Features

- **Instant Kanban from Markdown**: Columns map to `##` headings; tasks are `- [ ]` list items.
- **Two‑way sync**: Manage tasks on the board and the underlying `tasks.md` updates immediately.
- **Task Priority System**: 5-level priority system with color-coded badges (Highest, High, Medium, Low, Lowest).
- **Task Notes**: Add detailed descriptions and notes to your tasks.
- **Modern UI**: Clean, intuitive interface with drag-and-drop support.
- **Task Comments**: Add, edit, and remove comments per task; serialized in task lines.
- **Column Reordering**: Drag column handles to reorder columns; order persists to markdown.
- **Cross‑board Drag & Drop**: Move tasks between different boards (different `.md` files/panels).
- **Dark/Light Theme Toggle**: Switch themes from the board; preference is remembered.
- **Find in Tasks**: Press Ctrl/Cmd+F to search task titles with next/prev navigation.
- **Keyboard Chord**: Ctrl/Cmd+G then Ctrl/Cmd+T opens the New Task modal.
- **Add/Remove Columns**: Create or delete columns directly from the board.
- **Task Info Modal**: Click a task title to view priority, status, multi-line notes, and comments.
- **Auto Text Direction**: Detects RTL/LTR from the first character for titles and notes.
- **Input Auto‑Pairing**: Smart pairing for (), {}, [], quotes, and backticks in inputs.
- **Keyboard Shortcuts**: Enter to submit inputs; Esc to close modals.
- **Workspace Title**: Shows the current workspace name at the top of the board.
- **Quick Remove**: Remove tasks with a single click.
- **Single command**: Open the board from the Command Palette.

## How it works

- On activation, the extension reads `tasks.md` from the workspace/extension folder.
- It parses sections split by `## <Column Name>` and checklist items under each section.
- Each task includes a stable `[id: ...]` used for persistence and cross‑board moves. Files without IDs are automatically assigned IDs on read and written back.
- Optional comments are serialized into the task line using `[Comments: ...]`. Notes are written as 4-space indented lines below the task.
- A webview displays the Kanban board. Dragging a task to the `Done` column marks it completed; moving it out clears completion. All changes are written back to `tasks.md`.

## Installation

You can install the extension in two ways:

1. From VSIX

   - Download or build the `.vsix` file.
   - In VS Code/Cursor: Extensions panel → ••• menu → "Install from VSIX..." → select the file.

2. From source (development)

   - Clone the repo and run `npm install`.
   - Press F5 to launch the Extension Development Host.

## Quick start

1. Create a `tasks.md` at the project root (or extension folder) with columns and tasks.
2. Open the Command Palette and run: "Cursor Kanban: Open Board".
3. Drag tasks between columns or between boards. Click a task title to view details and comments. Use the × button to remove a task. Changes are saved back to `tasks.md`.

## Task file format (tasks.md)

Create columns with level‑2 headings and tasks as Markdown checkboxes:

```md
## Todo

- [ ] Design webview [id: 7a1f...aa2b] [Priority: Medium] [Comments: First comment | Second comment]
      This is a critical component for the project
  - This is a level one note
    - This is a level two note

## In Progress

- [ ] Hook up toggle [id: e3f2...9cd0] [Priority: Medium]

## Done

- [x] Initialize project [id: 2b4c...1f90] [Priority: Low]
```

Notes:

- **Columns** are introduced by `##` (level‑2) headings.
- **Tasks** must be list items starting with `- [ ]` or `- [x]`.
- **Priority** and **notes** are automatically managed by the extension.
- **IDs** are automatically generated if missing and persisted back to the file.
- **Comments** are written in the task line using `[Comments: ...]` and round‑trip correctly.
- The extension supports 5 priority levels: Highest, High, Medium, Low, Lowest.

## Commands

- `cursor-kanban.openBoard` — "Cursor Kanban: Open Board"
- `cursor-kanban.openBoardFromFile` — "Cursor Kanban: Open Board From File"

## Requirements

- VS Code/Cursor `^1.99.3`.

## Settings

No user settings yet. The task file path is currently fixed to `tasks.md` in the workspace/extension folder.

## Known limitations

- Task file path is not yet configurable.
- On first activation, the extension will create a `tasks.md` with default columns if missing.

## Roadmap

- Configurable task file path
- Per‑column WIP limits and color accents

## Development

Scripts:

- `npm run compile` — build TypeScript
- `npm run watch` — build in watch mode
- `npm run lint` — run ESLint on `src`
- `npm test` — run VS Code extension tests

Note: `pretest` compiles the project and runs ESLint before executing tests.

Local run:

1. `npm install`
2. Press F5 to launch the Extension Development Host
3. In the host window, run "Cursor Kanban: Open Board"

## Contributing

Issues and PRs are welcome. Please open an issue to discuss significant changes before submitting a PR.

## License

This project is licensed under the MIT License. See `LICENSE` for details.

## Changelog

See `CHANGELOG.md` for release notes.
