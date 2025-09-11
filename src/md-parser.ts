import * as fs from 'fs';

/**
 * Represents a single task in the Kanban board.
 */
export interface Task {
	text: string;
	done: boolean;
	priority: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';
	notes?: string;
	comments?: string[];
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
 * Comments are specified with [Comments: ...] syntax in the task line.
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
				let taskText = line.slice(6).trim(); // remove '- [ ] ' or '- [x] '

				// Extract priority and comments using a more robust approach
				let priority = 'Medium';
				let comments;

				// Look for [Priority: ...] pattern
				const priorityMatch = taskText.match(/(.*?)\s*\[Priority:\s*([^\]]+)\]/);
				if (priorityMatch) {
					priority = priorityMatch[2].trim();
					taskText = taskText.replace(/\s*\[Priority:\s*[^\]]+\]/, '').trim();
				}

				// Look for [Comments: ...] pattern
				const commentsMatch = taskText.match(/(.*?)\s*\[Comments:\s*([^\]]+)\]/);
				if (commentsMatch) {
					const commentsText = commentsMatch[2].trim();
					const commentArray = commentsText
						.split('|')
						.map((c) => c.trim())
						.filter((c) => c.length > 0);
					if (commentArray.length > 0) {
						comments = commentArray;
					}
					taskText = taskText.replace(/\s*\[Comments:\s*[^\]]+\]/, '').trim();
				}

				currentTask = {
					text: taskText,
					done,
					priority: priority as Task['priority'],
					...(comments && { comments }),
				};

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
 * Tasks are formatted as '- [ ] Task [Priority: Priority] [Comments: Comments]'.
 * Notes are written as indented lines under each task.
 * Comments are specified with [Comments: ...] syntax in the task line.
 * @param filePath Absolute path to write the markdown file
 * @param tasks Tasks to serialize into markdown
 */
export function writeTasks(filePath: string, tasks: Tasks): void {
	let content = '';

	for (const [column, taskList] of Object.entries(tasks)) {
		content += `## ${column}\n`;

		for (const task of taskList) {
			let taskLine = `- [${task.done ? 'x' : ' '}] ${task.text} [Priority: ${task.priority}]`;
			if (task.comments && task.comments.length > 0) {
				const commentsText = task.comments.join(' | ');
				taskLine += ` [Comments: ${commentsText}]`;
			}
			content += taskLine + '\n';

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
