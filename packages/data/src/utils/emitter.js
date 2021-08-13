/**
 * Create an event emitter.
 *
 * @return {import("../types").WPDataEmitter} Emitter.
 */
export function createEmitter() {
	let isPaused = false;
	let isPending = false;
	const listeners = new Set();
	const notifyListeners = () =>
		Array.from( listeners ).forEach( ( listener ) => listener() );

	return {
		get isPaused() {
			return isPaused;
		},

		subscribe( listener ) {
			listeners.add( listener );
			return () => listeners.delete( listener );
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
				return;
			}
			notifyListeners();
		},
	};
}
