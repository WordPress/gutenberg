/**
 * WordPress dependencies
 */
import { awaitPromise } from '@wordpress/data-controls';
import { controls } from '@wordpress/data';

export function* acquireStoreLock( store, path, { exclusive } ) {
	const promise = yield* enqueueLockRequest( store, path, { exclusive } );
	yield* processPendingLockRequests();
	return yield awaitPromise( promise );
}

export function* enqueueLockRequest( store, path, { exclusive } ) {
	let notifyAcquired;
	const promise = new Promise( ( resolve ) => {
		notifyAcquired = resolve;
	} );
	yield {
		type: 'ENQUEUE_LOCK_REQUEST',
		request: { store, path: [ store, ...path ], exclusive, notifyAcquired },
	};
	return promise;
}

export function* releaseStoreLock( lock ) {
	yield {
		type: 'RELEASE_LOCK',
		lock,
	};
	yield* processPendingLockRequests();
}

export function* processPendingLockRequests() {
	yield {
		type: 'PROCESS_PENDING_LOCK_REQUESTS',
	};
	const lockRequests = yield controls.select(
		'core',
		'getPendingLockRequests'
	);
	for ( const request of lockRequests ) {
		const { store, path, exclusive, notifyAcquired } = request;
		const isAvailable = yield controls.select(
			'core',
			'isLockAvailable',
			store,
			path,
			{
				exclusive,
			}
		);
		if ( isAvailable ) {
			const lock = { path, exclusive };
			yield {
				type: 'GRANT_LOCK_REQUEST',
				lock,
				request,
			};
			notifyAcquired( lock );
		}
	}
}
