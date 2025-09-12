import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Kanban } from './kanban';

/**
 * VS Code extension activation function.
 * Called when the extension is activated.
 * @param context - VS Code extension context
 */
export function activate(context: vscode.ExtensionContext) {
	const workspaceFolders = vscode.workspace.workspaceFolders;

	// Register command to open the default workspace Kanban board (tasks.md)
	const openBoardCommand = vscode.commands.registerCommand('cursor-kanban.openBoard', async () => {
		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showErrorMessage('Please open a folder to use the Kanban board.');
			return;
		}

		const workspaceFolder = workspaceFolders[0];
		const workspaceName = workspaceFolder.name;
		const filePath = path.join(workspaceFolder.uri.fsPath, 'tasks.md');

		// Default columns for Kanban board
		const defaultColumns = ['Todo', 'In Progress', 'Done'];

		// Ensure tasks.md file exists with required columns
		initializeTasksFile(filePath, defaultColumns);

		// Open panel for this file
		openKanbanPanel(filePath, `${workspaceName} - Kanban Board`);
	});

	// Register command to open a Kanban board from any Markdown file in the current workspace via Quick Pick
	const openBoardFromFileCommand = vscode.commands.registerCommand(
		'cursor-kanban.openBoardFromFile',
		async () => {
			if (!workspaceFolders || workspaceFolders.length === 0) {
				vscode.window.showErrorMessage('Please open a folder to use the Kanban board.');
				return;
			}

			// Gather markdown files in the workspace (exclude common folders)
			const mdUris = await vscode.workspace.findFiles(
				'**/*.md',
				'{**/node_modules/**,**/.git/**,**/out/**}',
				2000,
			);

			if (mdUris.length === 0) {
				vscode.window.showInformationMessage('No Markdown files found in the current workspace.');
				return;
			}

			const items = mdUris.map((uri) => ({
				label: vscode.workspace.asRelativePath(uri),
				description: uri.fsPath,
				uri,
			}));

			const picked = await vscode.window.showQuickPick(items, {
				placeHolder: 'Select a Markdown file to open as a Kanban board',
				matchOnDescription: true,
			});

			if (!picked) {
				return;
			}

			const title = `${path.basename(picked.uri.fsPath)} - Kanban Board`;
			openKanbanPanel(picked.uri.fsPath, title);
		},
	);

	context.subscriptions.push(openBoardCommand, openBoardFromFileCommand);
}

/**
 * Ensures the tasks.md file exists and contains the default columns.
 * @param filePath - Full path to tasks.md
 * @param defaultColumns - List of default columns
 */
function initializeTasksFile(filePath: string, defaultColumns: string[]) {
	if (!fs.existsSync(filePath)) {
		// Create new file with default columns
		const initialContent = defaultColumns.map((col) => `## ${col}\n\n`).join('');
		fs.writeFileSync(filePath, initialContent, 'utf-8');
	} else {
		// Ensure "Done" column exists in existing file
		const content = fs.readFileSync(filePath, 'utf-8');
		if (!/^##\s*Done\b/m.test(content)) {
			fs.appendFileSync(filePath, `## Done\n\n`, 'utf-8');
		}
	}
}

/**
 * Opens the Kanban webview panel and sets up message handling.
 * Each panel maintains its own Kanban instance, allowing multiple boards.
 * @param filePath - Path to the markdown task file
 * @param title - Panel title
 */
function openKanbanPanel(filePath: string, title: string) {
	let kanban = new Kanban(filePath);

	// Ensure "Done" column exists
	if (!kanban.getTasks()['Done']) {
		kanban.addColumn('Done');
	}

	// Create the webview panel
	const panel = vscode.window.createWebviewPanel(
		'kanban', // internal identifier
		title, // panel title
		vscode.ViewColumn.One,
		{ enableScripts: true }, // allow JS execution
	);

	// Set the initial HTML content
	panel.webview.html = getWebviewContent(panel, title);

	// Update tasks when the panel becomes visible
	panel.onDidChangeViewState(() => {
		if (panel.visible) {
			// Re-initialize Kanban to reflect external changes
			kanban = new Kanban(filePath);
			if (!kanban.getTasks()['Done']) {
				kanban.addColumn('Done');
			}

			// Send updated tasks to the webview
			panel.webview.postMessage({ command: 'update', tasks: kanban.getTasks() });
		}
	});

	// Handle messages from the webview (panel-scoped Kanban instance)
	panel.webview.onDidReceiveMessage((message) => {
		switch (message.command) {
			case 'toggle':
				kanban.toggleDone(message.column, message.index);
				break;

			case 'move':
				// Adjust index if moving within the same column downward
				let finalIndex = message.toIndex;
				if (message.fromColumn === message.toColumn && message.fromIndex < message.toIndex) {
					finalIndex = message.toIndex - 1;
				}
				kanban.moveTask(message.fromColumn, message.toColumn, message.fromIndex, finalIndex);
				// Correctly set Done/NotDone based on column
				if ((message.toColumn as string).toLowerCase() === 'done') {
					kanban.setDone(message.toColumn, finalIndex);
				} else {
					kanban.setNotDone(message.toColumn, finalIndex);
				}
				break;

			case 'add':
				if (message.column && message.text) {
					kanban.addTask(message.column, message.text, message.priority || 'Medium', message.notes);
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

			case 'moveColumn':
				if (message.columnName !== undefined && message.newIndex !== undefined) {
					kanban.moveColumn(message.columnName, message.newIndex);
				}
				break;

			case 'addComment':
				if (message.column !== undefined && message.index !== undefined && message.comment) {
					kanban.addTaskComment(message.column, message.index, message.comment);
				}
				break;

			case 'updateComment':
				if (
					message.column !== undefined &&
					message.index !== undefined &&
					message.commentIndex !== undefined &&
					message.comment
				) {
					kanban.updateTaskComment(
						message.column,
						message.index,
						message.commentIndex,
						message.comment,
					);
				}
				break;

			case 'removeComment':
				if (
					message.column !== undefined &&
					message.index !== undefined &&
					message.commentIndex !== undefined
				) {
					kanban.removeTaskComment(message.column, message.index, message.commentIndex);
				}
				break;
		}

		// Send updated tasks back to the webview
		panel.webview.postMessage({ command: 'update', tasks: kanban.getTasks() });
	});

	// Initial task update
	panel.webview.postMessage({ command: 'update', tasks: kanban.getTasks() });
}

/**
 * Reads the Kanban HTML template and injects the workspace/file name.
 * @param panel - VS Code webview panel
 * @param title - Panel title (shown in the webview)
 * @returns HTML string for the webview
 */
function getWebviewContent(panel: vscode.WebviewPanel, title: string): string {
	const htmlPath = vscode.Uri.file(path.join(__dirname, '..', 'ui', 'kanban.html'));
	let html = fs.readFileSync(htmlPath.fsPath, 'utf-8');

	// Inject title as a JS variable in the HTML
	html = html.replace(
		'</head>',
		`<script>const workspaceName = "${title.replace(/"/g, '\\"')}";</script></head>`,
	);

	return html;
}

/**
 * VS Code extension deactivation function.
 * Called when the extension is deactivated.
 */
export function deactivate() {}
