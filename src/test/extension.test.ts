import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { activate } from '../extension';

suite('Extension behavior', () => {
	let root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
	let tasksPath = path.join(root, 'tasks.md');

	function setTempWorkspace(): vscode.Uri {
		const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cursor-kanban-ext-'));
		const uri = vscode.Uri.file(tmpRoot);
		const prevLen = vscode.workspace.workspaceFolders?.length ?? 0;
		vscode.workspace.updateWorkspaceFolders(0, prevLen, { uri });
		root = uri.fsPath;
		tasksPath = path.join(root, 'tasks.md');
		return uri;
	}

	suiteSetup(async () => {
		setTempWorkspace();
		await activate({ subscriptions: [] } as unknown as vscode.ExtensionContext);
	});

	test('creates tasks.md with default columns on activation', async () => {
		assert.ok(fs.existsSync(tasksPath));
		const content = fs.readFileSync(tasksPath, 'utf-8');
		assert.ok(/##\s*Todo/m.test(content));
		assert.ok(/##\s*In Progress/m.test(content));
		assert.ok(/##\s*Done/m.test(content));
	});
});
