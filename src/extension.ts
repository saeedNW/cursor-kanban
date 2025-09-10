import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Kanban } from './kanban';

let kanban: Kanban;

/**
 * Entry point called by VS Code/Cursor when the extension is activated.
 */
export function activate(context: vscode.ExtensionContext) {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders) {
		vscode.window.showErrorMessage('Please open a folder to use the Kanban board.');
		return;
	}

	const workspaceName = workspaceFolders[0].name;
	const filePath = path.join(workspaceFolders[0].uri.fsPath, 'tasks.md');

	// Default columns
	const defaultColumns = ['Todo', 'In Progress', 'Done'];

	// Create file if it doesn't exist or initialize missing columns
	if (!fs.existsSync(filePath)) {
		// Create file with default columns
		const initialContent = defaultColumns.map((col) => `## ${col}\n\n`).join('');
		fs.writeFileSync(filePath, initialContent, 'utf-8');
	} else {
		// File exists, ensure "Done" column exists
		const content = fs.readFileSync(filePath, 'utf-8');
		if (!/^##\s*Done\b/m.test(content)) {
			fs.appendFileSync(filePath, `## Done\n\n`, 'utf-8');
		}
	}

	// Initialize Kanban instance
	kanban = new Kanban(filePath);

	const panelCommand = vscode.commands.registerCommand('cursor-kanban.openBoard', () => {
		// Ensure Done column exists
		if (!kanban.getTasks()['Done']) {
			kanban.addColumn('Done');
		}

		const panel = vscode.window.createWebviewPanel(
			'kanban',
			`${workspaceName} - Kanban Board`,
			vscode.ViewColumn.One,
			{ enableScripts: true },
		);

		panel.webview.html = getWebviewContent(panel, workspaceName);

		panel.onDidChangeViewState(() => {
			if (panel.visible) {
				kanban = new Kanban(filePath);

				// Ensure Done column exists
				if (!kanban.getTasks()['Done']) {
					kanban.addColumn('Done');
				}

				panel.webview.postMessage({ command: 'update', tasks: kanban.getTasks() });
			}
		});

		panel.webview.onDidReceiveMessage((message) => {
			switch (message.command) {
				case 'toggle':
					kanban.toggleDone(message.column, message.index);
					break;

				case 'move':
					kanban.moveTask(message.fromColumn, message.toColumn, message.index);
					const tasks = kanban.getTasks();
					const lastIndex = tasks[message.toColumn].length - 1;
					if (message.toColumn.toLowerCase() === 'done') {
						kanban.setDone(message.toColumn, lastIndex);
					} else {
						kanban.setNotDone(message.toColumn, lastIndex);
					}
					break;

				case 'add':
					if (message.column && message.text) {
						kanban.addTask(message.column, message.text);
					}
					break;

				case 'remove':
					if (message.column !== undefined && message.index !== undefined) {
						kanban.removeTask(message.column, message.index);
					}
					break;

				case 'addColumn':
					if (message.name) {
						kanban.addColumn(message.name);
					}
					break;

				case 'removeColumn':
					if (message.name) {
						kanban.removeColumn(message.name);
					}
					break;
			}

			panel.webview.postMessage({ command: 'update', tasks: kanban.getTasks() });
		});

		panel.webview.postMessage({ command: 'update', tasks: kanban.getTasks() });
	});

	context.subscriptions.push(panelCommand);
}

/**
 * Build the Kanban webview HTML by injecting the current workspace name.
 */
function getWebviewContent(panel: vscode.WebviewPanel, workspaceName: string) {
	const htmlPath = vscode.Uri.file(path.join(__dirname, '..', 'ui', 'kanban.html'));
	let html = fs.readFileSync(htmlPath.fsPath, 'utf-8');
	html = html.replace(
		'</head>',
		`<script>const workspaceName = "${workspaceName.replace(/"/g, '\\"')}";</script></head>`,
	);
	return html;
}

/**
 * Called by the host when the extension is deactivated.
 */
export function deactivate() {}
