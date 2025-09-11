import * as fs from 'fs';

/**
 * Represents a single task in the Kanban board.
 */
export interface Task {
	text: string;
	done: boolean;
	priority: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';
	notes?: string;
}

/**
 * Collection of tasks grouped by column name.
 */
export interface Tasks {
	[column: string]: Task[];
}

/**
 * Read tasks from a markdown file.
 * Columns are defined by '## ColumnName' headers.
 * Tasks start with '- [ ]' or '- [x]'.
 * Notes are indented 4 spaces under the task.
 * @param filePath Absolute path to the markdown file
 * @returns Parsed tasks grouped by column
 */
export function readTasks(filePath: string): Tasks {
	const content = fs.readFileSync(filePath, 'utf-8');
	const sections = content.split(/^##\s+/gm).filter(Boolean);
	const tasks: Tasks = {};

	for (const section of sections) {
		const lines = section.split('\n').filter(Boolean);
		const columnName = lines[0].trim();
		tasks[columnName] = [];

		let currentTask: Task | null = null;

		for (let i = 1; i < lines.length; i++) {
			const line = lines[i];

			if (line.startsWith('- [')) {
				// Parse a new task line
				const done = line.startsWith('- [x]');
				const taskTextMatch = line
					.slice(6) // remove '- [ ] ' or '- [x] '
					.trim()
					.match(/(.*?)\s*\[Priority:\s*(.*?)\]$/);

				if (taskTextMatch) {
					currentTask = {
						text: taskTextMatch[1].trim(),
						done,
						priority: taskTextMatch[2] as Task['priority'],
					};
				} else {
					currentTask = {
						text: line.slice(6).trim(),
						done,
						priority: 'Medium',
					};
				}

				tasks[columnName].push(currentTask);
			} else if (currentTask && line.match(/^\s{4}/)) {
				// Parse indented note lines
				const noteLine = line.replace(/^\s{4}/, '');
				if (noteLine) {
					currentTask.notes = currentTask.notes ? `${currentTask.notes}\n${noteLine}` : noteLine;
				}
			}
		}
	}

	return tasks;
}

/**
 * Write tasks to a markdown file.
 * Columns become '## ColumnName' headers.
 * Tasks are formatted as '- [ ] Task [Priority: Priority]'.
 * Notes are written as indented lines under each task.
 * @param filePath Absolute path to write the markdown file
 * @param tasks Tasks to serialize into markdown
 */
export function writeTasks(filePath: string, tasks: Tasks): void {
	let content = '';

	for (const [column, taskList] of Object.entries(tasks)) {
		content += `## ${column}\n`;

		for (const task of taskList) {
			content += `- [${task.done ? 'x' : ' '}] ${task.text} [Priority: ${task.priority}]\n`;

			if (task.notes) {
				for (const noteLine of task.notes.split('\n')) {
					content += `    ${noteLine}\n`; // 4-space indent for notes
				}
			}
		}

		content += '\n';
	}

	fs.writeFileSync(filePath, content, 'utf-8');
}
