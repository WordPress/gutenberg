/**
 * Internal dependencies
 */
import requestIdleCallback from './request-idle-callback';

/**
 * Enqueued callback to invoke once idle time permits.
 *
 * @typedef {()=>void} WPPriorityQueueCallback
 */

/**
 * An object used to associate callbacks in a particular context grouping.
 *
 * @typedef {{}} WPPriorityQueueContext
 */

/**
 * Function to add callback to priority queue.
 *
 * @typedef {(element:WPPriorityQueueContext,item:WPPriorityQueueCallback)=>void} WPPriorityQueueAdd
 */

/**
 * Function to flush callbacks from priority queue.
 *
 * @typedef {(element:WPPriorityQueueContext)=>boolean} WPPriorityQueueFlush
 */

/**
 * Reset the queue.
 *
 * @typedef {()=>void} WPPriorityQueueReset
 */

/**
 * Priority queue instance.
 *
 * @typedef {Object} WPPriorityQueue
 *
 * @property {WPPriorityQueueAdd}   add    Add callback to queue for context.
 * @property {WPPriorityQueueFlush} flush  Flush queue for context.
 * @property {WPPriorityQueueFlush} cancel Clear queue for context.
 * @property {WPPriorityQueueReset} reset  Reset queue.
 */

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
 * @return {WPPriorityQueue} Queue object with `add`, `flush` and `reset` methods.
 */
export const createQueue = () => {
	/** @type {Map<WPPriorityQueueContext, WPPriorityQueueCallback>} */
	const waitingList = new Map();
	let isRunning = false;

	/**
	 * Callback to process as much queue as time permits.
	 *
	 * Map Iteration follows the original insertion order. This means that here
	 * we can iterate the queue and know that the first contexts which were
	 * added will be run first. On the other hand, if anyone adds a new callback
	 * for an existing context it will supplant the previously-set callback for
	 * that context because we reassigned that map key's value.
	 *
	 * In the case that a callback adds a new callback to its own context then
	 * the callback it adds will appear at the end of the iteration and will be
	 * run only after all other existing contexts have finished executing.
	 *
	 * @param {IdleDeadline|number} deadline Idle callback deadline object, or
	 *                                       animation frame timestamp.
	 */
	const runWaitingList = ( deadline ) => {
		for ( const [ nextElement, callback ] of waitingList ) {
			waitingList.delete( nextElement );
			callback();

			if (
				'number' === typeof deadline ||
				deadline.timeRemaining() <= 0
			) {
				break;
			}
		}

		if ( waitingList.size === 0 ) {
			isRunning = false;
			return;
		}

		requestIdleCallback( runWaitingList );
	};

	/**
	 * Add a callback to the queue for a given context.
	 *
	 * If errors with undefined callbacks are encountered double check that
	 * all of your useSelect calls have the right dependencies set correctly
	 * in their second parameter. Missing dependencies can cause unexpected
	 * loops and race conditions in the queue.
	 *
	 * @type {WPPriorityQueueAdd}
	 *
	 * @param {WPPriorityQueueContext}  element Context object.
	 * @param {WPPriorityQueueCallback} item    Callback function.
	 */
	const add = ( element, item ) => {
		waitingList.set( element, item );
		if ( ! isRunning ) {
			isRunning = true;
			requestIdleCallback( runWaitingList );
		}
	};

	/**
	 * Flushes queue for a given context, returning true if the flush was
	 * performed, or false if there is no queue for the given context.
	 *
	 * @type {WPPriorityQueueFlush}
	 *
	 * @param {WPPriorityQueueContext} element Context object.
	 *
	 * @return {boolean} Whether flush was performed.
	 */
	const flush = ( element ) => {
		const callback = waitingList.get( element );
		if ( undefined === callback ) {
			return false;
		}

		waitingList.delete( element );
		callback();

		return true;
	};

	/**
	 * Clears the queue for a given context, cancelling the callbacks without
	 * executing them. Returns `true` if there were scheduled callbacks to cancel,
	 * or `false` if there was is no queue for the given context.
	 *
	 * @type {WPPriorityQueueFlush}
	 *
	 * @param {WPPriorityQueueContext} element Context object.
	 *
	 * @return {boolean} Whether any callbacks got cancelled.
	 */
	const cancel = ( element ) => {
		return waitingList.delete( element );
	};

	/**
	 * Reset the queue without running the pending callbacks.
	 *
	 * @type {WPPriorityQueueReset}
	 */
	const reset = () => {
		waitingList.clear();
		isRunning = false;
	};

	return {
		add,
		flush,
		cancel,
		reset,
	};
};
