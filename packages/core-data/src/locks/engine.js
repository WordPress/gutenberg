/**
 * Internal dependencies
 */
import reducer from './reducer';
import { isLockAvailable, getPendingLockRequests } from './selectors';

export default function createLocks() {
	let state = reducer( undefined, { type: '@@INIT' } );

	function processPendingLockRequests() {
		for ( const request of getPendingLockRequests( state ) ) {
			const { store, path, exclusive, notifyAcquired } = request;
			if ( isLockAvailable( state, store, path, { exclusive } ) ) {
				const lock = { store, path, exclusive };
				state = reducer( state, {
					type: 'GRANT_LOCK_REQUEST',
					lock,
					request,
				} );
				notifyAcquired( lock );
			}
		}
	}

	function acquire( store, path, exclusive ) {
		return new SyncPromise( ( resolve ) => {
			state = reducer( state, {
				type: 'ENQUEUE_LOCK_REQUEST',
				request: { store, path, exclusive, notifyAcquired: resolve },
			} );
			processPendingLockRequests();
		} );
	}
	function release( lock ) {
		state = reducer( state, {
			type: 'RELEASE_LOCK',
			lock,
		} );
		processPendingLockRequests();
	}

	return { acquire, release };
}

const STATE = {
	PENDING: 'PENDING',
	FULFILLED: 'FULFILLED',
	REJECTED: 'REJECTED',
};

function isThenable( val ) {
	return val instanceof SyncPromise;
}

// Adapted from https://codepen.io/mayank_shubham/pen/abpEVJK.
class SyncPromise {
	constructor( callback ) {
		this.async = false;
		this.state = STATE.PENDING;
		this.value = undefined;
		this.handlers = [];
		setTimeout( () => {
			this.async = true;
		}, 0 );
		try {
			callback( this._resolve, this._reject );
		} catch ( err ) {
			this._reject( err );
		}
	}

	_resolve = ( value ) => {
		this.updateResult( value, STATE.FULFILLED );
	};

	_reject = ( error ) => {
		this.updateResult( error, STATE.REJECTED );
	};

	updateResult( value, state ) {
		const callback = () => {
			// process the promise if it is still in pending state
			if ( this.state !== STATE.PENDING ) {
				return;
			}

			// check is value is also a promise
			if ( isThenable( value ) ) {
				return value.then( this._resolve, this._reject );
			}

			this.value = value;
			this.state = state;

			// execute handlers if already attached
			this.executeHandlers();
		};

		if ( this.async ) {
			setTimeout( callback, 0 );
		} else {
			callback();
		}
	}

	addHandlers( handlers ) {
		this.handlers.push( handlers );
		this.executeHandlers();
	}

	executeHandlers() {
		// Don't execute handlers if promise is not yet fulfilled or rejected
		if ( this.state === STATE.PENDING ) {
			return null;
		}

		// We have multiple handlers because add them for .finally block too
		this.handlers.forEach( ( handler ) => {
			if ( this.state === STATE.FULFILLED ) {
				return handler.onSuccess( this.value );
			}
			return handler.onFail( this.value );
		} );
		// After processing all handlers, we reset it to empty.
		this.handlers = [];
	}

	then( onSuccess, onFail ) {
		return new SyncPromise( ( res, rej ) => {
			this.addHandlers( {
				onSuccess( value ) {
					// if no onSuccess provided, resolve the value for the next promise chain
					if ( ! onSuccess ) {
						return res( value );
					}
					try {
						return res( onSuccess( value ) );
					} catch ( err ) {
						return rej( err );
					}
				},
				onFail( value ) {
					// if no onFail provided, reject the value for the next promise chain
					if ( ! onFail ) {
						return rej( value );
					}
					try {
						return res( onFail( value ) );
					} catch ( err ) {
						return rej( err );
					}
				},
			} );
		} );
	}

	// Since then method take the second function as onFail, we can leverage it while implementing catch
	catch( onFail ) {
		return this.then( null, onFail );
	}

	// Finally block returns a promise which fails or succeedes with the previous promise resove value
	finally( callback ) {
		return new SyncPromise( ( res, rej ) => {
			let val;
			let wasRejected;
			this.then(
				( value ) => {
					wasRejected = false;
					val = value;
					return callback();
				},
				( err ) => {
					wasRejected = true;
					val = err;
					return callback();
				}
			).then( () => {
				// If the callback didn't have any error we resolve/reject the promise based on promise state
				if ( ! wasRejected ) {
					return res( val );
				}
				return rej( val );
			} );
		} );
	}
}
