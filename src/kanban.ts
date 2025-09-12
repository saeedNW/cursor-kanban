import { readTasks, Task, Tasks, writeTasks } from './md-parser';

/**
 * High-level manager for a Markdown-backed Kanban board.
 * All operations immediately persist changes to the underlying `tasks.md` file.
 */
export class Kanban {
	private tasks: Tasks;

	/**
	 * Create a Kanban manager for a given Markdown file.
	 * @param filePath Absolute path to the `tasks.md` file
	 */
	constructor(private filePath: string) {
		this.tasks = readTasks(filePath);
	}

	/**
	 * Add a new task to a column.
	 * If the column does not exist, it is created automatically.
	 * @param column Name of the column
	 * @param text Task description
	 * @param priority Task priority ('Low' | 'Medium' | 'High'), default 'Medium'
	 * @param notes Optional notes for the task
	 */
	addTask(column: string, text: string, priority: Task['priority'] = 'Medium', notes?: string) {
		if (!this.tasks[column]) {
			this.tasks[column] = [];
		}
		this.tasks[column].push({ text, priority, done: false, notes });
		this.save();
	}

	/**
	 * Insert a task at a specific index in a column.
	 * @param column Target column
	 * @param index Index to insert at
	 * @param task Task object
	 */
	insertTask(column: string, index: number, task: Task) {
		if (!this.tasks[column]) {
			this.tasks[column] = [];
		}
		this.tasks[column].splice(index, 0, task);
		this.save();
	}

	/**
	 * Remove a task at a specific index within a column.
	 * @param column Column name
	 * @param index Task index
	 */
	removeTask(column: string, index: number) {
		if (this.tasks[column]?.[index]) {
			this.tasks[column].splice(index, 1);
			this.save();
		}
	}

	/**
	 * Move a task from one column to another, preserving all task properties.
	 * If the target column does not exist, it will be created.
	 * @param fromColumn Source column
	 * @param toColumn Destination column
	 * @param fromIndex Task index in the source column
	 * @param toIndex Task index in the destination column
	 */
	moveTask(fromColumn: string, toColumn: string, fromIndex: number, toIndex?: number) {
		const task = this.tasks[fromColumn]?.[fromIndex];
		if (!task) {
			return;
		}

		// Remove task from source
		this.removeTask(fromColumn, fromIndex);

		// Ensure target column exists
		if (!this.tasks[toColumn]) {
			this.tasks[toColumn] = [];
		}

		// Insert at target index or push to end
		if (toIndex !== undefined && toIndex >= 0 && toIndex <= this.tasks[toColumn].length) {
			this.tasks[toColumn].splice(toIndex, 0, task);
		} else {
			this.tasks[toColumn].push(task);
		}

		this.save();
	}

	/**
	 * Toggle the 'done' status of a task.
	 * @param column Column name
	 * @param index Task index
	 */
	toggleDone(column: string, index: number) {
		const task = this.tasks[column]?.[index];
		if (!task) {
			return;
		}

		task.done = !task.done;
		this.save();
	}

	/**
	 * Mark a task as done.
	 * @param column Column name
	 * @param index Task index
	 */
	setDone(column: string, index: number) {
		const task = this.tasks[column]?.[index];
		if (!task) {
			return;
		}

		task.done = true;
		this.save();
	}

	/**
	 * Mark a task as not done.
	 * @param column Column name
	 * @param index Task index
	 */
	setNotDone(column: string, index: number) {
		const task = this.tasks[column]?.[index];
		if (!task) {
			return;
		}

		task.done = false;
		this.save();
	}

	/**
	 * Add a comment to a task.
	 * @param column Column name
	 * @param index Task index
	 * @param comment New comment to add
	 */
	addTaskComment(column: string, index: number, comment: string) {
		const task = this.tasks[column]?.[index];
		if (!task) {
			return;
		}

		if (!task.comments) {
			task.comments = [];
		}
		task.comments.push(comment);
		this.save();
	}

	/**
	 * Update a specific comment of a task.
	 * @param column Column name
	 * @param index Task index
	 * @param commentIndex Index of the comment to update
	 * @param comment New comment text
	 */
	updateTaskComment(column: string, index: number, commentIndex: number, comment: string) {
		const task = this.tasks[column]?.[index];
		if (!task || !task.comments || commentIndex < 0 || commentIndex >= task.comments.length) {
			return;
		}

		task.comments[commentIndex] = comment;
		this.save();
	}

	/**
	 * Remove a specific comment from a task.
	 * @param column Column name
	 * @param index Task index
	 * @param commentIndex Index of the comment to remove
	 */
	removeTaskComment(column: string, index: number, commentIndex: number) {
		const task = this.tasks[column]?.[index];
		if (!task || !task.comments || commentIndex < 0 || commentIndex >= task.comments.length) {
			return;
		}

		task.comments.splice(commentIndex, 1);
		if (task.comments.length === 0) {
			task.comments = undefined;
		}
		this.save();
	}

	/**
	 * Add a new column if it does not already exist.
	 * @param name Column name
	 */
	addColumn(name: string) {
		if (!this.tasks[name]) {
			this.tasks[name] = [];
			this.save();
		}
	}

	/**
	 * Remove a column and all its tasks.
	 * @param name Column name
	 */
	removeColumn(name: string) {
		if (this.tasks[name]) {
			delete this.tasks[name];
			this.save();
		}
	}

	/**
	 * Move a column to a new position in the column order.
	 * @param columnName Name of the column to move
	 * @param newIndex New index position for the column
	 */
	moveColumn(columnName: string, newIndex: number) {
		const columnNames = Object.keys(this.tasks);
		const currentIndex = columnNames.indexOf(columnName);

		if (currentIndex === -1 || newIndex < 0 || newIndex >= columnNames.length) {
			return;
		}

		// Remove the column from its current position
		columnNames.splice(currentIndex, 1);

		// Insert it at the new position
		columnNames.splice(newIndex, 0, columnName);

		// Rebuild the tasks object in the new order
		const reorderedTasks: Tasks = {};
		for (const name of columnNames) {
			reorderedTasks[name] = this.tasks[name];
		}

		this.tasks = reorderedTasks;
		this.save();
	}

	/**
	 * Get a snapshot of the current tasks in memory.
	 * @returns Tasks object mapping column names to task arrays
	 */
	getTasks(): Tasks {
		return this.tasks;
	}

	/**
	 * Persist the current in-memory tasks to the Markdown file.
	 * This is called automatically after any mutating operation.
	 */
	private save() {
		writeTasks(this.filePath, this.tasks);
	}
}
