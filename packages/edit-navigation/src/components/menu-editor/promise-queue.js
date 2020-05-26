export default class PromiseQueue {
	constructor( concurrency = 1 ) {
		this.concurrency = concurrency;
		this.queue = [];
		this.active = [];
		this.listeners = [];
	}

	schedule( action ) {
		this.queue.push( action );
		this.run();
	}

	run() {
		while ( this.queue.length && this.active.length <= this.concurrency ) {
			const action = this.queue.pop();
			const promise = action().then( () =>
				this.onActionFinished( promise )
			);
			this.active.push( promise );
		}
	}

	onActionFinished( promise ) {
		this.active.splice( this.active.indexOf( promise ), 1 );
		if ( this.active.length === 0 && this.queue.length === 0 ) {
			for ( const l of this.listeners ) {
				l();
			}
			this.listeners = [];
		}
	}

	then( callback ) {
		if ( this.active.length ) {
			this.listeners.push( callback );
		} else {
			callback();
		}
	}
}
