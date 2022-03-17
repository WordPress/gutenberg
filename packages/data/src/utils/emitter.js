/**
 * Create an event emitter.
 *
 * @return {import("../types").DataEmitter} Emitter.
 */
export function createEmitter() {
	let isPending = false;
	const listeners = new Set();
	const notifyListeners = () => {
		// We use Array.from to clone the listeners Set
		// This ensures that we don't run a listener
		// that was added as a response to another listener.
		Array.from( listeners ).forEach( ( listener ) => listener() );
		isPending = false;
	};

	return {
		subscribe( listener ) {
			listeners.add( listener );
			return () => listeners.delete( listener );
		},

		emit() {
			if ( ! isPending ) {
				isPending = true;
				queueMicrotask( () => notifyListeners() );
			}
		},
	};
}
