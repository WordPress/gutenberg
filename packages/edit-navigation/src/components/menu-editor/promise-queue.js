/**
 * A concurrency primitive that runs at most `concurrency` async tasks at once.
 */
export default class PromiseQueue {
	constructor( concurrency = 1 ) {
		this.concurrency = concurrency;
		this.queue = [];
		this.active = [];
		this.listeners = [];
	}

	enqueue( action ) {
		this.queue.push( action );
		this.run();
	}

	run() {
		while ( this.queue.length && this.active.length <= this.concurrency ) {
			const action = this.queue.shift();
			const promise = action().then( () => {
				this.active.splice( this.active.indexOf( promise ), 1 );
				this.run();
				this.notifyIfEmpty();
			} );
			this.active.push( promise );
		}
	}

	notifyIfEmpty() {
		if ( this.active.length === 0 && this.queue.length === 0 ) {
			for ( const l of this.listeners ) {
				l();
			}
			this.listeners = [];
		}
	}

	/**
	 * Calls `callback` once all async actions in the queue are finished,
	 * or immediately if no actions are running.
	 *
	 * @param {Function} callback Callback to call
	 */
	then( callback ) {
		if ( this.active.length ) {
			this.listeners.push( callback );
		} else {
			callback();
		}
	}
}
