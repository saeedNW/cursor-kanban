import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Kanban } from '../kanban';
import { readTasks } from '../md-parser';

suite('Kanban', () => {
	function makeInitialFile(): string {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cursor-kanban-'));
		const filePath = path.join(tempDir, 'tasks.md');
		const initial = ['## Todo', '', '## In Progress', '', '## Done', ''].join('\n');
		fs.writeFileSync(filePath, initial, 'utf-8');
		return filePath;
	}

	test('addTask, toggleDone, setDone/NotDone, removeTask', () => {
		const filePath = makeInitialFile();
		const kb = new Kanban(filePath);

		kb.addTask('Todo', 'write tests');
		kb.addTask('Todo', 'refactor');

		let tasks = kb.getTasks();
		assert.strictEqual(tasks['Todo'].length, 2);
		assert.deepStrictEqual(tasks['Todo'][0], {
			text: 'write tests',
			done: false,
			priority: 'Medium',
			notes: undefined,
		});

		kb.toggleDone('Todo', 0);
		assert.strictEqual(kb.getTasks()['Todo'][0].done, true);

		kb.setNotDone('Todo', 0);
		assert.strictEqual(kb.getTasks()['Todo'][0].done, false);

		kb.setDone('Todo', 1);
		assert.strictEqual(kb.getTasks()['Todo'][1].done, true);

		kb.removeTask('Todo', 0);
		tasks = kb.getTasks();
		assert.strictEqual(tasks['Todo'].length, 1);
		assert.deepStrictEqual(tasks['Todo'][0], {
			text: 'refactor',
			done: true,
			priority: 'Medium',
			notes: undefined,
		});

		// persisted
		const persisted = readTasks(filePath);
		assert.deepStrictEqual(persisted['Todo'][0], {
			text: 'refactor',
			done: true,
			priority: 'Medium',
		});
	});

	test('moveTask between columns persists correctly', () => {
		const filePath = makeInitialFile();
		const kb = new Kanban(filePath);

		kb.addTask('Todo', 'task 1');
		kb.addTask('Todo', 'task 2');

		kb.moveTask('Todo', 'In Progress', 0);
		let tasks = kb.getTasks();
		assert.strictEqual(tasks['Todo'].length, 1);
		assert.strictEqual(tasks['In Progress'].length, 1);
		assert.deepStrictEqual(tasks['In Progress'][0], {
			text: 'task 1',
			done: false,
			priority: 'Medium',
			notes: undefined,
		});

		// persisted
		const persisted = readTasks(filePath);
		assert.strictEqual(persisted['In Progress'].length, 1);
		assert.deepStrictEqual(persisted['In Progress'][0], {
			text: 'task 1',
			done: false,
			priority: 'Medium',
		});
	});

	test('addColumn and removeColumn update file', () => {
		const filePath = makeInitialFile();
		const kb = new Kanban(filePath);

		kb.addColumn('Backlog');
		let tasks = kb.getTasks();
		assert.ok(Array.isArray(tasks['Backlog']));

		kb.addTask('Backlog', 'idea');
		assert.strictEqual(kb.getTasks()['Backlog'].length, 1);

		// ensure persisted
		let persisted = readTasks(filePath);
		assert.strictEqual(persisted['Backlog'].length, 1);

		kb.removeColumn('Backlog');
		tasks = kb.getTasks();
		assert.strictEqual(tasks['Backlog'], undefined);

		persisted = readTasks(filePath);
		assert.strictEqual(persisted['Backlog'], undefined);
	});

	test('moveColumn reorders columns correctly', () => {
		const filePath = makeInitialFile();
		const kb = new Kanban(filePath);

		// Add some tasks to different columns
		kb.addTask('Todo', 'task 1');
		kb.addTask('In Progress', 'task 2');
		kb.addTask('Done', 'task 3');

		// Get initial column order
		let tasks = kb.getTasks();
		let columnNames = Object.keys(tasks);
		assert.deepStrictEqual(columnNames, ['Todo', 'In Progress', 'Done']);

		// Move 'Done' column to the beginning (index 0)
		kb.moveColumn('Done', 0);
		tasks = kb.getTasks();
		columnNames = Object.keys(tasks);
		assert.deepStrictEqual(columnNames, ['Done', 'Todo', 'In Progress']);

		// Move 'Todo' column to the end (index 2)
		kb.moveColumn('Todo', 2);
		tasks = kb.getTasks();
		columnNames = Object.keys(tasks);
		assert.deepStrictEqual(columnNames, ['Done', 'In Progress', 'Todo']);

		// Verify tasks are still in their respective columns
		assert.strictEqual(tasks['Done'].length, 1);
		assert.strictEqual(tasks['In Progress'].length, 1);
		assert.strictEqual(tasks['Todo'].length, 1);
		assert.strictEqual(tasks['Done'][0].text, 'task 3');
		assert.strictEqual(tasks['In Progress'][0].text, 'task 2');
		assert.strictEqual(tasks['Todo'][0].text, 'task 1');

		// Verify persistence
		const persisted = readTasks(filePath);
		const persistedColumnNames = Object.keys(persisted);
		assert.deepStrictEqual(persistedColumnNames, ['Done', 'In Progress', 'Todo']);
	});

	test('addTaskComment, updateTaskComment, and removeTaskComment', () => {
		const filePath = makeInitialFile();
		const kb = new Kanban(filePath);

		// Add task without comments
		kb.addTask('Todo', 'task with comments', 'High', 'Some notes');
		let tasks = kb.getTasks();
		assert.deepStrictEqual(tasks['Todo'][0], {
			text: 'task with comments',
			done: false,
			priority: 'High',
			notes: 'Some notes',
		});

		// Add first comment
		kb.addTaskComment('Todo', 0, 'First comment');
		tasks = kb.getTasks();
		assert.deepStrictEqual(tasks['Todo'][0].comments, ['First comment']);

		// Add second comment
		kb.addTaskComment('Todo', 0, 'Second comment');
		tasks = kb.getTasks();
		assert.deepStrictEqual(tasks['Todo'][0].comments, ['First comment', 'Second comment']);

		// Update first comment
		kb.updateTaskComment('Todo', 0, 0, 'Updated first comment');
		tasks = kb.getTasks();
		assert.deepStrictEqual(tasks['Todo'][0].comments, ['Updated first comment', 'Second comment']);

		// Remove second comment
		kb.removeTaskComment('Todo', 0, 1);
		tasks = kb.getTasks();
		assert.deepStrictEqual(tasks['Todo'][0].comments, ['Updated first comment']);

		// Remove last comment (should clear comments array)
		kb.removeTaskComment('Todo', 0, 0);
		tasks = kb.getTasks();
		assert.strictEqual(tasks['Todo'][0].comments, undefined);

		// persisted
		const persisted = readTasks(filePath);
		assert.strictEqual(persisted['Todo'][0].comments, undefined);
	});

	test('multiple files are independent', () => {
		const filePath1 = makeInitialFile();
		const filePath2 = makeInitialFile();

		const kb1 = new Kanban(filePath1);
		const kb2 = new Kanban(filePath2);

		kb1.addTask('Todo', 'task A1');
		kb2.addTask('Todo', 'task B1');

		// Modify each independently
		kb1.moveTask('Todo', 'In Progress', 0);
		kb2.setDone('Todo', 0);

		// In-memory isolation
		const t1 = kb1.getTasks();
		const t2 = kb2.getTasks();
		assert.strictEqual(t1['In Progress'].length, 1);
		assert.strictEqual(t1['Todo'].length, 0);
		assert.strictEqual(t2['Todo'].length, 1);
		assert.strictEqual(t2['Todo'][0].done, true);

		// Persistence isolation
		const p1 = readTasks(filePath1);
		const p2 = readTasks(filePath2);
		assert.strictEqual(p1['In Progress'].length, 1);
		assert.strictEqual(p1['Todo']?.length ?? 0, 0);
		assert.strictEqual(p2['Todo'].length, 1);
		assert.strictEqual(p2['Todo'][0].done, true);
	});
});
