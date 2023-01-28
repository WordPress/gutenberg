/**
 * Create an event emitter.
 *
 * @return {import("../types").DataEmitter} Emitter.
 */
let globalPause = false;

export function createEmitter() {
	let isPaused = false;
	let isPending = false;
	const listeners = new Set();
	const notifyListeners = () =>
		// We use Array.from to clone the listeners Set
		// This ensures that we don't run a listener
		// that was added as a response to another listener.
		Array.from( listeners ).forEach( ( listener ) => listener() );

	return {
		get isPaused() {
			return isPaused || globalPause;
		},

		subscribe( listener ) {
			listeners.add( listener );
			return () => listeners.delete( listener );
		},

		pause() {
			isPaused = true;
		},

		pauseGlobal() {
			globalPause = true;
		},

		resume() {
			isPaused = false;
			globalPause = false;
			if ( isPending ) {
				isPending = false;
				notifyListeners();
			}
		},

		emit() {
			if ( isPaused || globalPause ) {
				isPending = true;
				return;
			}
			notifyListeners();
		},
	};
}
