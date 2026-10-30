export interface DataEmitter {
	emit: VoidFunction;
	subscribe: ( listener: VoidFunction ) => VoidFunction;
	pause: VoidFunction;
	resume: VoidFunction;
	isPaused: boolean;
}

/**
 * Create an event emitter.
 *
 * @return The event emitter.
 */
export function createEmitter(): DataEmitter {
	let isPaused = false;
	let isPending = false;
	const listeners = new Set< VoidFunction >();
	// We use `Array.from` to clone the listeners `Set`. This ensures that we
	// don't run a listener that was added as a response to another listener.
	let clonedListeners: VoidFunction[] | null = null;

	const notifyListeners = () => {
		clonedListeners ??= Array.from( listeners );
		const currentListeners = clonedListeners;
		for ( let i = 0; i < currentListeners.length; i++ ) {
			currentListeners[ i ]();
		}
	};

	return {
		get isPaused() {
			return isPaused;
		},

		subscribe( listener ) {
			listeners.add( listener );
			clonedListeners = null;
			return () => {
				listeners.delete( listener );
				clonedListeners = null;
			};
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
