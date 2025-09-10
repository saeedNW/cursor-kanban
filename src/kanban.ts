import { readTasks, Tasks, writeTasks } from './md-parser';

/**
 * High-level manager for a Markdown-backed Kanban board.
 * All mutating operations immediately persist to the underlying `tasks.md` file.
 */

export class Kanban {
	private tasks: Tasks;

	/**
	 * @param filePath Absolute path to the `tasks.md` file.
	 */
	constructor(private filePath: string) {
		this.tasks = readTasks(filePath);
	}

	/** Add a new task to the given column. Creates the column if it does not exist. */
	addTask(column: string, text: string) {
		if (!this.tasks[column]) {
			this.tasks[column] = [];
		}
		this.tasks[column].push({ text, done: false });
		this.save();
	}

	/** Remove a task at the provided index within the column. */
	removeTask(column: string, index: number) {
		this.tasks[column]?.splice(index, 1);
		this.save();
	}

	/** Move a task from one column to another, preserving the task object. */
	moveTask(fromColumn: string, toColumn: string, index: number) {
		const task = this.tasks[fromColumn]?.[index];
		if (!task) {
			return;
		}
		this.removeTask(fromColumn, index);
		if (!this.tasks[toColumn]) {
			this.tasks[toColumn] = [];
		}
		this.tasks[toColumn].push(task);
		this.save();
	}

	/** Toggle the completion state of a task. */
	toggleDone(column: string, index: number) {
		const task = this.tasks[column]?.[index];
		if (!task) {
			return;
		}
		task.done = !task.done;
		this.save();
	}

	/** Mark a task as done. */
	setDone(column: string, index: number) {
		const task = this.tasks[column]?.[index];
		if (!task) {
			return;
		}
		task.done = true;
		this.save();
	}

	/** Mark a task as not done. */
	setNotDone(column: string, index: number) {
		const task = this.tasks[column]?.[index];
		if (!task) {
			return;
		}
		task.done = false;
		this.save();
	}

	/** Create a new column if it is not already present. */
	addColumn(name: string) {
		if (!this.tasks[name]) {
			this.tasks[name] = [];
			this.save();
		}
	}

	/** Remove a column and all of its tasks. */
	removeColumn(name: string) {
		if (this.tasks[name]) {
			delete this.tasks[name];
			this.save();
		}
	}

	/** Return an in-memory snapshot of all tasks. */
	getTasks(): Tasks {
		return this.tasks;
	}

	/** Persist the in-memory state to disk. */
	private save() {
		writeTasks(this.filePath, this.tasks);
	}
}
