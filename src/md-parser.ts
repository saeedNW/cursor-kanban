import * as fs from 'fs';

/**
 * Single task item represented in Markdown as a checklist line, e.g. "- [ ] Do thing".
 */
export interface Task {
	text: string;
	done: boolean;
}

/**
 * Mapping of column titles (from level-2 Markdown headings) to their list of tasks.
 */
export interface Tasks {
	[column: string]: Task[];
}

/**
 * Reads and parses a Kanban task file from disk.
 *
 * Assumes the following structure:
 *  - Columns are introduced by level-2 headings: `## <Column Name>`
 *  - Tasks are Markdown checklist items under the heading: `- [ ] text` or `- [x] text`
 *
 * Only lines that start with a checklist prefix are interpreted; other lines are ignored.
 *
 * @param filePath Absolute path to the `tasks.md` file.
 * @returns Parsed `Tasks` object mapping columns to their task lists.
 */
export function readTasks(filePath: string): Tasks {
	const content = fs.readFileSync(filePath, 'utf-8');
	const sections = content.split(/^##\s+/gm).filter(Boolean);
	const tasks: Tasks = {};

	sections.forEach((section) => {
		const lines = section.split('\n');
		const title = lines[0].trim();
		tasks[title] = lines
			.slice(1)
			.filter((line) => line.startsWith('- ['))
			.map((line) => ({
				done: line.startsWith('- [x]'),
				text: line.slice(6).trim(),
			}));
	});

	return tasks;
}

/**
 * Serializes the provided `Tasks` structure into Markdown and writes it to disk.
 * Columns are emitted in the iteration order of `Object.entries(tasks)`.
 *
 * @param filePath Absolute path to write the Markdown to.
 * @param tasks Tasks grouped by column title.
 */
export function writeTasks(filePath: string, tasks: Tasks) {
	let content = '';
	for (const [column, taskList] of Object.entries(tasks)) {
		content += `## ${column}\n`;
		taskList.forEach((task) => {
			content += `- [${task.done ? 'x' : ' '}] ${task.text}\n`;
		});
		content += '\n';
	}
	fs.writeFileSync(filePath, content, 'utf-8');
}
