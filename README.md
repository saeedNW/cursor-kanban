# Cursor Kanban

Lightweight Kanban board for Markdown tasks inside VS Code and Cursor.

Cursor Kanban renders a clean, interactive Kanban view powered by a simple Markdown file. Each column is a Markdown heading and each task is a checklist item. Toggle tasks directly from the board and your Markdown stays perfectly in sync.

## Features

- **Instant Kanban from Markdown**: Columns map to `##` headings; tasks are `- [ ]` list items.
- **Two‑way sync**: Toggle tasks on the board and the underlying `tasks.md` updates immediately.
- **Zero learning curve**: Keep using your favorite Markdown workflows and tools.
- **Single command**: Open the board from the Command Palette.

## How it works

- On activation, the extension reads `tasks.md` from the workspace/extension folder.
- It parses sections split by `## <Column Name>` and checklist items under each section.
- A webview displays the Kanban board; clicking a task toggles its done state and writes changes back to `tasks.md`.

## Installation

You can install the extension in two ways:

1. From VSIX

   - Download or build the `.vsix` file (e.g., `cursor-kanban-0.0.1.vsix`).
   - In VS Code/Cursor: Extensions panel → ••• menu → "Install from VSIX..." → select the file.

2. From source (development)

   - Clone the repo and run `npm install`.
   - Press F5 to launch the Extension Development Host.

## Quick start

1. Create a `tasks.md` at the project root (or extension folder) with columns and tasks.
2. Open the Command Palette and run: "Cursor Kanban: Open Board".
3. Click a task to toggle completion. Changes are saved back to `tasks.md`.

## Task file format (tasks.md)

Create columns with level‑2 headings and tasks as Markdown checkboxes:

```md
## Todo

- [ ] Write parser
- [ ] Design webview

## In Progress

- [ ] Hook up toggle

## Done

- [x] Initialize project
```

Notes:

- Columns are introduced by `##` (level‑2) headings.
- Tasks must be list items starting with `- [ ]` or `- [x]`.

## Commands

- `cursor-kanban.openBoard` — shown as "Cursor Kanban: Open Board" in the Command Palette.

## Requirements

- VS Code/Cursor `^1.103.0`.

## Settings

No user settings yet. The task file path is currently fixed to `tasks.md` in the workspace/extension folder.

## Known limitations

- Task file path is not yet configurable.
- Drag‑and‑drop between columns is not implemented.
- On first activation, the extension will create a `tasks.md` with default columns if missing.

## Roadmap

- Configurable task file path
- Drag‑and‑drop between columns
- Per‑column WIP limits and color accents
- Filtering and search

## Development

Scripts:

- `npm run compile` — build TypeScript
- `npm run watch` — build in watch mode
- `npm run lint` — run ESLint on `src`
- `npm test` — run VS Code extension tests

## Testing

Run the full test suite:

```bash
npm test
```

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
