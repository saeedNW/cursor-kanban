import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Kanban } from './kanban';

let kanban: Kanban;

/**
 * VS Code extension activation function.
 * Called when the extension is activated.
 * @param context - VS Code extension context
 */
export function activate(context: vscode.ExtensionContext) {
	const workspaceFolders = vscode.workspace.workspaceFolders;

	// Ensure a folder is open
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

	// Initialize Kanban instance
	kanban = new Kanban(filePath);

	// Register command to open Kanban board panel
	const openBoardCommand = vscode.commands.registerCommand('cursor-kanban.openBoard', () => {
		openKanbanPanel(filePath, workspaceName);
	});

	context.subscriptions.push(openBoardCommand);
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
 * @param filePath - Path to tasks.md
 * @param workspaceName - Current workspace name
 */
function openKanbanPanel(filePath: string, workspaceName: string) {
	// Ensure "Done" column exists
	if (!kanban.getTasks()['Done']) {
		kanban.addColumn('Done');
	}

	// Create the webview panel
	const panel = vscode.window.createWebviewPanel(
		'kanban', // internal identifier
		`${workspaceName} - Kanban Board`, // panel title
		vscode.ViewColumn.One,
		{ enableScripts: true }, // allow JS execution
	);

	// Set the initial HTML content
	panel.webview.html = getWebviewContent(panel, workspaceName);

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

	// Handle messages from the webview
	panel.webview.onDidReceiveMessage((message) => handleWebviewMessage(message, panel));

	// Initial task update
	panel.webview.postMessage({ command: 'update', tasks: kanban.getTasks() });
}

/**
 * Handles incoming messages from the Kanban webview.
 * Updates the Kanban data and pushes changes back to the panel.
 * @param message - Message object from webview
 * @param panel - Webview panel to send updates to
 */
function handleWebviewMessage(message: any, panel: vscode.WebviewPanel) {
	switch (message.command) {
		case 'toggle':
			// Toggle Done status of a task
			kanban.toggleDone(message.column, message.index);
			break;

		case 'move':
			// Adjust index if moving within the same column downward
			let finalIndex = message.toIndex;
			if (message.fromColumn === message.toColumn && message.fromIndex < message.toIndex) {
				finalIndex = message.toIndex - 1;
			}

			// Move task to specific position
			kanban.moveTask(message.fromColumn, message.toColumn, message.fromIndex, finalIndex);

			// Correctly set Done/NotDone based on column
			if (message.toColumn.toLowerCase() === 'done') {
				kanban.setDone(message.toColumn, finalIndex);
			} else {
				kanban.setNotDone(message.toColumn, finalIndex);
			}
			break;

		case 'add':
			// Add a new task
			if (message.column && message.text) {
				kanban.addTask(message.column, message.text, message.priority || 'Medium', message.notes);
			}
			break;

		case 'remove':
			// Remove a task
			if (message.column !== undefined && message.index !== undefined) {
				kanban.removeTask(message.column, message.index);
			}
			break;

		case 'addColumn':
			// Add a new column
			if (message.name) {
				kanban.addColumn(message.name);
			}
			break;

		case 'removeColumn':
			// Remove a column
			if (message.name) {
				kanban.removeColumn(message.name);
			}
			break;

		case 'moveColumn':
			// Move a column to a new position
			if (message.columnName !== undefined && message.newIndex !== undefined) {
				kanban.moveColumn(message.columnName, message.newIndex);
			}
			break;

		case 'addComment':
			// Add a comment to a task
			if (message.column !== undefined && message.index !== undefined && message.comment) {
				kanban.addTaskComment(message.column, message.index, message.comment);
			}
			break;

		case 'updateComment':
			// Update a specific comment
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
			// Remove a specific comment
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
}

/**
 * Reads the Kanban HTML template and injects the workspace name.
 * @param panel - VS Code webview panel
 * @param workspaceName - Current workspace name
 * @returns HTML string for the webview
 */
function getWebviewContent(panel: vscode.WebviewPanel, workspaceName: string): string {
	const htmlPath = vscode.Uri.file(path.join(__dirname, '..', 'ui', 'kanban.html'));
	let html = fs.readFileSync(htmlPath.fsPath, 'utf-8');

	// Inject workspace name as a JS variable in the HTML
	html = html.replace(
		'</head>',
		`<script>const workspaceName = "${workspaceName.replace(/"/g, '\\"')}";</script></head>`,
	);

	return html;
}

/**
 * VS Code extension deactivation function.
 * Called when the extension is deactivated.
 */
export function deactivate() {}
