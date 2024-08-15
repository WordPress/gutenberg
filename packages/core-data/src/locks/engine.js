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
		return new Promise( ( resolve ) => {
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
