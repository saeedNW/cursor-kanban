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
		assert.deepStrictEqual(tasks['Todo'][0], { text: 'write tests', done: false });

		kb.toggleDone('Todo', 0);
		assert.strictEqual(kb.getTasks()['Todo'][0].done, true);

		kb.setNotDone('Todo', 0);
		assert.strictEqual(kb.getTasks()['Todo'][0].done, false);

		kb.setDone('Todo', 1);
		assert.strictEqual(kb.getTasks()['Todo'][1].done, true);

		kb.removeTask('Todo', 0);
		tasks = kb.getTasks();
		assert.strictEqual(tasks['Todo'].length, 1);
		assert.deepStrictEqual(tasks['Todo'][0], { text: 'refactor', done: true });

		// persisted
		const persisted = readTasks(filePath);
		assert.deepStrictEqual(persisted['Todo'][0], { text: 'refactor', done: true });
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
		assert.deepStrictEqual(tasks['In Progress'][0], { text: 'task 1', done: false });

		// persisted
		const persisted = readTasks(filePath);
		assert.strictEqual(persisted['In Progress'].length, 1);
		assert.deepStrictEqual(persisted['In Progress'][0], { text: 'task 1', done: false });
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
});
