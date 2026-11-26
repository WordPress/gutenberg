/**
 * A unit of work run by the upload queue. It is called with a `release`
 * callback, which it must call once its work has settled to free its slot for
 * the next task in the queue.
 */
export type UploadQueueTask = ( release: () => void ) => void;

/**
 * Creates a queue that runs tasks in the order they were added, with at most
 * `limit` of them in flight at once.
 *
 * Calling a task's `release` more than once has no effect. A task must not
 * throw: the queue cannot tell whether a task that threw still holds its slot.
 *
 * @param limit Maximum number of tasks in flight at once.
 *
 * @return Adds a task to the queue, starting it right away if a slot is free.
 */
export function createUploadQueue(
	limit: number
): ( task: UploadQueueTask ) => void {
	let activeCount = 0;
	let isDraining = false;
	const pendingTasks: UploadQueueTask[] = [];

	function drain() {
		// A task can settle, and so release its slot, while it is being
		// started (for example when every file it was given is rejected up
		// front). Its release then lands here while the loop below is still
		// running, and the loop picks up the freed slot. That keeps the queue
		// in order and the stack flat however many tasks settle that way.
		if ( isDraining ) {
			return;
		}
		isDraining = true;
		try {
			while ( activeCount < limit && pendingTasks.length ) {
				const task = pendingTasks.shift() as UploadQueueTask;
				let isReleased = false;
				activeCount++;
				task( () => {
					if ( isReleased ) {
						return;
					}
					isReleased = true;
					activeCount--;
					drain();
				} );
			}
		} finally {
			isDraining = false;
		}
	}

	return function enqueue( task: UploadQueueTask ) {
		pendingTasks.push( task );
		drain();
	};
}
