/**
 * Per-block serial queue for inline suggestion writes.
 *
 * The content reconciler (`suggestion-content-reconciler.js`) and the format
 * keyboard (`suggestion-format-keyboard.js`) share an async shape: open one or
 * more suggestion notes over REST, then write markers into the block's
 * `content`. Two of those flights interleaving on the same block clobber each
 * other — each writes content computed from its own pre-flight snapshot — and
 * the two components used to keep separate in-flight guards, so one of each
 * could always be in flight on one block simultaneously. This queue is the
 * single shared ordering point: tasks for the same block run strictly one
 * after another (each re-validates against live content when its turn comes),
 * while tasks for different blocks stay independent.
 */

/**
 * Create a write queue keyed by block client id.
 *
 * @return {{enqueue: Function, hasPending: Function}} Queue API.
 */
export function createSuggestionWriteQueue() {
	const chains = new Map();

	return {
		/**
		 * Run `task` after every previously enqueued task for the same
		 * block has settled. A rejected task never poisons later tasks —
		 * the stored chain always resolves.
		 *
		 * @param {string}   clientId Block client id the write targets.
		 * @param {Function} task     Async task to run.
		 * @return {Promise<*>} The task's own settlement (observable by the
		 * caller, including rejection).
		 */
		enqueue( clientId, task ) {
			const previous = chains.get( clientId ) ?? Promise.resolve();
			const run = previous.then( () => task() );
			const settled = run.then(
				() => {},
				() => {}
			);
			chains.set( clientId, settled );
			settled.then( () => {
				// Drop the chain entry once it drains so the map doesn't
				// grow with every block ever edited.
				if ( chains.get( clientId ) === settled ) {
					chains.delete( clientId );
				}
			} );
			return run;
		},

		/**
		 * Whether a task is queued or in flight for the block.
		 *
		 * @param {string} clientId Block client id.
		 * @return {boolean} True when the block has pending writes.
		 */
		hasPending( clientId ) {
			return chains.has( clientId );
		},
	};
}
