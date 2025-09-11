import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { readTasks, Tasks, writeTasks } from '../md-parser';

suite('md-parser', () => {
	function createTempTasksFile(initialContent: string): string {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cursor-kanban-md-'));
		const filePath = path.join(tempDir, 'tasks.md');
		fs.writeFileSync(filePath, initialContent, 'utf-8');
		return filePath;
	}

	test('readTasks parses sections and checkbox states', () => {
		const md = [
			'## Todo',
			'- [ ] task A',
			'- [x] task B',
			'',
			'## In Progress',
			'- [ ] working on it',
			'',
			'## Done',
			'- [x] finished',
			'',
		].join('\n');

		const filePath = createTempTasksFile(md);
		const tasks = readTasks(filePath);

		assert.deepStrictEqual(tasks['Todo'], [
			{ text: 'task A', done: false, priority: 'Medium' },
			{ text: 'task B', done: true, priority: 'Medium' },
		]);
		assert.deepStrictEqual(tasks['In Progress'], [
			{ text: 'working on it', done: false, priority: 'Medium' },
		]);
		assert.deepStrictEqual(tasks['Done'], [{ text: 'finished', done: true, priority: 'Medium' }]);
	});

	test('writeTasks writes expected markdown structure (order and roundtrip)', () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cursor-kanban-md-'));
		const filePath = path.join(tempDir, 'tasks.md');

		const tasks: Tasks = {
			Todo: [
				{ text: 'task A', done: false, priority: 'High' },
				{ text: 'task B', done: true, priority: 'Low' },
			],
			Done: [{ text: 'finished', done: true, priority: 'Medium' }],
		};

		writeTasks(filePath, tasks);

		const content = fs.readFileSync(filePath, 'utf-8');
		// Validate structure without depending on potential reporter noise
		assert.ok(content.includes('## Todo'));
		assert.ok(content.includes('- [ ] task A'));
		assert.ok(content.includes('- [x] task B'));
		assert.ok(content.includes('## Done'));
		assert.ok(content.includes('- [x] finished'));

		// Reading back should preserve structure
		const roundTripped = readTasks(filePath);
		assert.deepStrictEqual(roundTripped, tasks);
	});
});
