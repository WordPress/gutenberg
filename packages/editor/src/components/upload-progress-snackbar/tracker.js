/**
 * WordPress dependencies
 */
import { useSyncExternalStore } from '@wordpress/element';

/**
 * A minimal in-memory tracker for in-flight media uploads that happen outside
 * the `@wordpress/upload-media` store (i.e. the traditional / non-CSM upload
 * path). The editor's `mediaUpload` wrapper writes to it; the
 * `UploadProgressSnackbar` reads from it.
 *
 * State shape: { total, completed, pending: string[] }
 * - `total`: total files registered in the current session.
 * - `completed`: files that have finished (succeeded OR errored).
 * - `pending`: remaining filenames in submission order.
 *
 * The tracker holds at most one "session" at a time — if a new batch starts
 * while one is in progress, its files are appended to the existing session.
 */

let state = null;
const listeners = new Set();

function notify() {
	listeners.forEach( ( listener ) => listener() );
}

/**
 * Registers a new batch of files that have started uploading.
 *
 * @param {string[]} filenames Filenames in submission order.
 */
export function addFiles( filenames ) {
	if ( ! filenames.length ) {
		return;
	}
	if ( ! state ) {
		state = { total: 0, completed: 0, pending: [] };
	}
	state = {
		total: state.total + filenames.length,
		completed: state.completed,
		pending: [ ...state.pending, ...filenames ],
	};
	notify();
}

/**
 * Advances the tracker by a number of finished files (success or error).
 *
 * @param {number} count Number of files that finished since the last call.
 */
export function advance( count ) {
	if ( ! state || count <= 0 ) {
		return;
	}
	const completed = Math.min( state.total, state.completed + count );
	const pending = state.pending.slice( count );
	if ( completed >= state.total ) {
		state = null;
	} else {
		state = { total: state.total, completed, pending };
	}
	notify();
}

/**
 * Resets the tracker to its empty state.
 *
 * Test-only helper: `state` is a module-level singleton, so tests call this in
 * `beforeEach` to isolate cases from one another. Not used in production -
 * `advance` clears the state on its own once every file in a batch finishes.
 */
export function reset() {
	if ( state === null ) {
		return;
	}
	state = null;
	notify();
}

/**
 * Returns the current tracker state, or `null` when idle.
 *
 * @return {?{total: number, completed: number, pending: string[]}} Tracker state.
 */
export function getState() {
	return state;
}

function subscribe( listener ) {
	listeners.add( listener );
	return () => {
		listeners.delete( listener );
	};
}

/**
 * React hook that subscribes to the tracker.
 *
 * @return {?{total: number, completed: number, pending: string[]}} Tracker state.
 */
export function useTracker() {
	return useSyncExternalStore( subscribe, getState, getState );
}
