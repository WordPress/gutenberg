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
 * @property {WPPriorityQueueAdd}   add   Add callback to queue for context.
 * @property {WPPriorityQueueFlush} flush Flush queue for context.
 * @property {WPPriorityQueueReset} reset Reset queue.
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
	/** @type {WPPriorityQueueContext[]} */
	let waitingList = [];

	/** @type {WeakMap<WPPriorityQueueContext,WPPriorityQueueCallback>} */
	let elementsMap = new WeakMap();

	let isRunning = false;

	let count = 0;

	/**
	 * Callback to process as much queue as time permits.
	 *
	 * @param {IdleDeadline|number} deadline Idle callback deadline object, or
	 *                                       animation frame timestamp.
	 */
	const runWaitingList = ( deadline ) => {
		const hasTimeRemaining =
			typeof deadline === 'number'
				? () => false
				: () => deadline.timeRemaining() > 0;

		do {
			if ( waitingList.length === 0 ) {
				isRunning = false;
				return;
			}

			const nextElement = /** @type {WPPriorityQueueContext} */ ( waitingList.shift() );
			console.log( 'looking for ' + nextElement.id );
			const callback = /** @type {WPPriorityQueueCallback} */ ( elementsMap.get(
				nextElement
			) );
			console.log( 'run', nextElement.id );
			callback();
			console.log( 'deleting from elementMap ' + nextElement.id );
			elementsMap.delete( nextElement );
		} while ( hasTimeRemaining() );

		requestIdleCallback( runWaitingList );
	};

	/**
	 * Add a callback to the queue for a given context.
	 *
	 * @type {WPPriorityQueueAdd}
	 *
	 * @param {WPPriorityQueueContext}  element Context object.
	 * @param {WPPriorityQueueCallback} item    Callback function.
	 */
	const add = ( element, item ) => {
		element.id = count;
		count++;

		if ( ! elementsMap.has( element ) ) {
			console.log( 'adding ' + element.id + ' to waiting list' );
			waitingList.push( element );
		}

		console.log( 'adding ' + element.id + ' to elementMap' );
		elementsMap.set( element, item );
		const testAdd = elementsMap.get( element );

		if ( ! testAdd ) {
			console.log( 'add failed for ' + element.id );
		} else {
			console.log( 'add succeeded for ' + element.id );
		}

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
		if ( ! elementsMap.has( element ) ) {
			return false;
		}
		console.log( 'flushing ' + element.id );
		const index = waitingList.indexOf( element );
		waitingList.splice( index, 1 );
		const callback = /** @type {WPPriorityQueueCallback} */ ( elementsMap.get(
			element
		) );
		elementsMap.delete( element );
		callback();

		return true;
	};

	/**
	 * Reset the queue without running the pending callbacks.
	 *
	 * @type {WPPriorityQueueReset}
	 */
	const reset = () => {
		waitingList = [];
		elementsMap = new WeakMap();
		isRunning = false;
	};

	return {
		add,
		flush,
		reset,
	};
};
