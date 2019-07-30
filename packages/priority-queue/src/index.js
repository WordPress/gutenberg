const requestIdleCallback = window.requestIdleCallback ? window.requestIdleCallback : window.requestAnimationFrame;

/**
 * Creates a context-aware queue that only executes
 * the last task of a given context.
 *
 * @example
 *```js
 * import { createQueue } from '@wordpress/priority-queue';
 *
 * const queue = createQueue();
 *
 * // Context objects.
 * const ctx1 = {};
 * const ctx2 = {};
 *
 * // For a given context in the queue, only the last callback is executed.
 * queue.add( ctx1, () => console.log( 'This will be printed first' ) );
 * queue.add( ctx2, () => console.log( 'This won\'t be printed' ) );
 * queue.add( ctx2, () => console.log( 'This will be printed second' ) );
 *```
 *
 * @return {Object} Queue object with `add` and `flush` methods.
 */
export const createQueue = () => {
	const waitingList = [];
	const elementsMap = new WeakMap();
	let isRunning = false;

	const runWaitingList = ( deadline ) => {
		do {
			if ( waitingList.length === 0 ) {
				isRunning = false;
				return;
			}

			const nextElement = waitingList.shift();
			elementsMap.get( nextElement )();
			elementsMap.delete( nextElement );
		} while ( deadline && deadline.timeRemaining && deadline.timeRemaining() > 0 );

		requestIdleCallback( runWaitingList );
	};

	const add = ( element, item ) => {
		if ( ! elementsMap.has( element ) ) {
			waitingList.push( element );
		}
		elementsMap.set( element, item );
		if ( ! isRunning ) {
			isRunning = true;
			requestIdleCallback( runWaitingList );
		}
	};

	const flush = ( element ) => {
		if ( ! elementsMap.has( element ) ) {
			return false;
		}

		elementsMap.delete( element );
		const index = waitingList.indexOf( element );
		waitingList.splice( index, 1 );

		return true;
	};

	return {
		add,
		flush,
	};
};
