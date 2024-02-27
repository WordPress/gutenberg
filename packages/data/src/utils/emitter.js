/**
 * Create an event emitter.
 *
 * @return {import("../types").DataEmitter} Emitter.
 */
export function createEmitter() {
	let isPaused = false;
	let isPending = false;
	const listeners = new Set();
	const deletedListeners = new Set();
	const existingEndToken = () => {};

	const notifyListeners = () => {
		// Drop everything that's already been removed from the queue.
		for ( const deletedListener of deletedListeners ) {
			listeners.delete( deletedListener );
		}
		deletedListeners.clear();

		// Some listeners might add new listeners while we're
		// iterating; we want to avoid calling them now though.
		// Since Set iteration occurs in insertion order we can
		// add a unique symbol to indicate the last existing
		// listener and stop iterating once we find it. All
		// listeners added after the symbol _must_ have been
		// added while iterating, and we can skip them until
		// the next time this is called.
		// Add this, but make sure it's the last item in the set.
		listeners.delete( existingEndToken );
		listeners.add( existingEndToken );
		for ( const listener of listeners ) {
			if ( existingEndToken === listener ) {
				break;
			}

			listener();

			// Listeners deleted on this go-around are run one
			// final time and then removed from future queues.
			if ( deletedListeners.has( listener ) ) {
				deletedListeners.delete( listener );
				listeners.delete( listener );
			}
		}
		listeners.delete( existingEndToken );
	};

	return {
		get isPaused() {
			return isPaused;
		},

		subscribe( listener ) {
			listeners.add( listener );

			// Because we call listeners that have been removed during
			// the process of notifying existing listeners, we enqueue
			// them for removal instead of directly removing them.
			return () => deletedListeners.add( listener );
		},

		pause() {
			isPaused = true;
		},

		resume() {
			isPaused = false;
			if ( isPending ) {
				isPending = false;
				notifyListeners();
			}
		},

		emit() {
			if ( isPaused ) {
				isPending = true;
				return;
			}
			notifyListeners();
		},
	};
}
