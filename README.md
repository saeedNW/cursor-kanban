# Cursor Kanban

Lightweight Kanban board for Markdown tasks inside VS Code and Cursor.

Cursor Kanban renders a clean, interactive Kanban view powered by a simple Markdown file. Each column is a Markdown heading and each task is a checklist item. Toggle tasks directly from the board and your Markdown stays perfectly in sync.

## Features

- **Instant Kanban from Markdown**: Columns map to `##` headings; tasks are `- [ ]` list items.
- **Two‑way sync**: Manage tasks on the board and the underlying `tasks.md` updates immediately.
- **Task Priority System**: 5-level priority system with color-coded badges (Highest, High, Medium, Low, Lowest).
- **Task Notes**: Add detailed descriptions and notes to your tasks.
- **Modern UI**: Clean, intuitive interface with drag-and-drop support.
- **Add/Remove Columns**: Create or delete columns directly from the board.
- **Task Info Modal**: Click a task title to view priority, status, and multi-line notes.
- **Auto Text Direction**: Detects RTL/LTR from the first character for titles and notes.
- **Input Auto‑Pairing**: Smart pairing for (), {}, [], quotes, and backticks in inputs.
- **Keyboard Shortcuts**: Enter to submit inputs; Esc to close modals.
- **Workspace Title**: Shows the current workspace name at the top of the board.
- **Quick Remove**: Remove tasks with a single click.
- **Zero learning curve**: Keep using your favorite Markdown workflows and tools.
- **Single command**: Open the board from the Command Palette.

## How it works

- On activation, the extension reads `tasks.md` from the workspace/extension folder.
- It parses sections split by `## <Column Name>` and checklist items under each section.
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
3. Drag tasks between columns. Click a task title to view details. Use the × button to remove a task. Changes are saved back to `tasks.md`.

## Task file format (tasks.md)

Create columns with level‑2 headings and tasks as Markdown checkboxes:

```md
## Todo

- [ ] Write parser
- [ ] Design webview [Priority: Medium]
      This is a critical component for the project

## In Progress

- [ ] Hook up toggle [Priority: Medium]

## Done

- [x] Initialize project [Priority: Low]
```

Notes:

- Columns are introduced by `##` (level‑2) headings.
- Tasks must be list items starting with `- [ ]` or `- [x]`.
- Priority and notes are automatically managed by the extension.
- The extension supports 5 priority levels: Highest, High, Medium, Low, Lowest.

## Commands

- `cursor-kanban.openBoard` — shown as "Cursor Kanban: Open Board" in the Command Palette.

## Requirements

- VS Code/Cursor `^1.103.0`.

## Settings

No user settings yet. The task file path is currently fixed to `tasks.md` in the workspace/extension folder.

## Known limitations

- Task file path is not yet configurable.
- On first activation, the extension will create a `tasks.md` with default columns if missing.

## Roadmap

- Configurable task file path
- Per‑column WIP limits and color accents
- Filtering and search

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
