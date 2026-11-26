/**
 * A unit of work run by the upload queue. It is called with a `release`
 * callback, which it must call once its work has settled to free its slot for
 * the next task in the queue. A task that throws must release its slot first.
 */
export type UploadQueueTask = ( release: () => void ) => void;

/**
 * Creates a queue that runs tasks in the order they were added, with at most
 * `limit` of them in flight at once.
 *
 * A task added while a slot is free starts right away, during the call that
 * adds it. A task waiting for a slot starts in a microtask after a slot is
 * released, so it never starts in the middle of the code that released the
 * slot, such as another upload's callbacks. Calling a task's `release` more
 * than once has no effect.
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
	let isDrainScheduled = false;
	const pendingTasks: UploadQueueTask[] = [];

	function scheduleDrain() {
		if ( isDrainScheduled ) {
			return;
		}
		isDrainScheduled = true;
		queueMicrotask( () => {
			isDrainScheduled = false;
			drain();
		} );
	}

	function drain() {
		// A task can add another task while it is being started, for example
		// from a callback it runs synchronously. The loop below then picks the
		// new task up, which keeps the queue in order and the stack flat.
		if ( isDraining ) {
			return;
		}
		isDraining = true;
		const errors: unknown[] = [];
		try {
			while ( activeCount < limit ) {
				const task = pendingTasks.shift();
				if ( ! task ) {
					break;
				}
				let isReleased = false;
				activeCount++;
				try {
					task( () => {
						if ( isReleased ) {
							return;
						}
						isReleased = true;
						activeCount--;
						scheduleDrain();
					} );
				} catch ( error ) {
					// Keep starting the tasks behind it, so that one task's
					// error cannot stall the queue.
					errors.push( error );
				}
			}
		} finally {
			isDraining = false;
		}
		if ( errors.length ) {
			throw errors[ 0 ];
		}
	}

	return function enqueue( task: UploadQueueTask ) {
		pendingTasks.push( task );
		drain();
	};
}
