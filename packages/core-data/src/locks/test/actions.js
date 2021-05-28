/**
 * Internal dependencies
 */
import {
	__unstableAcquireStoreLock,
	__unstableEnqueueLockRequest,
	__unstableReleaseStoreLock,
	__unstableProcessPendingLockRequests,
} from '../actions';

const store = 'test';
const path = [ 'blue', 'bird' ];

describe( '__unstableEnqueueLockRequest', () => {
	it( 'Enqueues a lock request', async () => {
		const fulfillment = __unstableEnqueueLockRequest( store, path, {
			exclusive: true,
		} );

		// Start
		expect( fulfillment.next().value ).toMatchObject( {
			type: 'ENQUEUE_LOCK_REQUEST',
			request: {
				store,
				path,
				exclusive: true,
				notifyAcquired: expect.any( Function ),
			},
		} );

		// Should return a promise
		expect( fulfillment.next() ).toMatchObject( {
			done: true,
			value: expect.any( Promise ),
		} );
	} );

	it( 'Returns a promise fulfilled only after calling notifyAcquired', async () => {
		const fulfillment = __unstableEnqueueLockRequest( store, path, {
			exclusive: true,
		} );
		const { request } = fulfillment.next().value;
		const promise = fulfillment.next().value;
		const fulfilled = jest.fn();
		promise.then( fulfilled );
		// Fulfilled should not be called until notifyAcquired is called
		await sleep( 1 );
		expect( fulfilled ).not.toBeCalled();
		const lock = {};
		request.notifyAcquired( lock );
		expect( fulfilled ).not.toBeCalled();

		// Promises are resolved only the next tick, so let's wait a little:
		await sleep( 1 );
		expect( fulfilled ).toBeCalledTimes( 1 );

		// Calling notifyAcquired again shouldn't have any effect:
		request.notifyAcquired( lock );
		await sleep( 1 );
		expect( fulfilled ).toBeCalledTimes( 1 );
	} );
} );

describe( '__unstableProcessPendingLockRequests', () => {
	const exclusive = true;
	const lock = { store, path, exclusive };

	let notifyAcquired;
	let request;

	beforeEach( () => {
		notifyAcquired = jest.fn();
		request = { store, path, exclusive, notifyAcquired };
	} );

	it( 'Grants a lock request that may be granted', async () => {
		const fulfillment = __unstableProcessPendingLockRequests();

		// Start
		expect( fulfillment.next().value.type ).toBe(
			'PROCESS_PENDING_LOCK_REQUESTS'
		);

		// Get pending lock requests
		expect( fulfillment.next().value.type ).toBe( '@@data/SELECT' );

		// Find one and check if the request may be granted
		expect( fulfillment.next( [ request ] ).value.type ).toBe(
			'@@data/SELECT'
		);

		// It may, grant it
		expect( fulfillment.next( true ).value.type ).toBe(
			'GRANT_LOCK_REQUEST'
		);

		// Ensure the promise isn't fulfilled until after GRANT_LOCK_REQUEST finishes
		expect( notifyAcquired ).not.toBeCalled();

		// All requests processed, return
		expect( fulfillment.next() ).toMatchObject( {
			done: true,
			value: undefined,
		} );

		// Ensure the promise is fulfilled once GRANT_LOCK_REQUEST finishes
		expect( notifyAcquired ).toBeCalledWith( lock );
		expect( notifyAcquired ).toBeCalledTimes( 1 );

		// All requests processed, return
		expect( fulfillment.next() ).toMatchObject( {
			done: true,
			value: undefined,
		} );
	} );

	it( 'Does not grants a lock request that may not be granted', async () => {
		const fulfillment = __unstableProcessPendingLockRequests();

		// Start
		expect( fulfillment.next().value.type ).toBe(
			'PROCESS_PENDING_LOCK_REQUESTS'
		);

		// Get pending lock requests
		expect( fulfillment.next().value.type ).toBe( '@@data/SELECT' );

		// Find one and check if the request may be granted
		expect( fulfillment.next( [ request ] ).value.type ).toBe(
			'@@data/SELECT'
		);

		// It may not, let's finish
		expect( fulfillment.next( false ) ).toMatchObject( {
			done: true,
			value: undefined,
		} );
	} );

	it( 'Handles multiple lock requests', async () => {
		const fulfillment = __unstableProcessPendingLockRequests();

		// Start
		expect( fulfillment.next().value.type ).toBe(
			'PROCESS_PENDING_LOCK_REQUESTS'
		);

		// Get pending lock requests
		expect( fulfillment.next().value.type ).toBe( '@@data/SELECT' );

		// Find one and check if the request may be granted
		expect( fulfillment.next( [ request, request ] ).value.type ).toBe(
			'@@data/SELECT'
		);

		// It may not, continue - check if the next one may be granted
		expect( fulfillment.next( false ).value.type ).toBe( '@@data/SELECT' );
		// It may, grant it
		expect( fulfillment.next( true ).value.type ).toBe(
			'GRANT_LOCK_REQUEST'
		);

		// Ensure the promise isn't fulfilled until after GRANT_LOCK_REQUEST finishes
		expect( notifyAcquired ).not.toBeCalled();

		// All requests processed, return
		expect( fulfillment.next() ).toMatchObject( {
			done: true,
			value: undefined,
		} );

		// Ensure the promise is fulfilled once GRANT_LOCK_REQUEST finishes
		expect( notifyAcquired ).toBeCalledWith( lock );
		expect( notifyAcquired ).toBeCalledTimes( 1 );

		// All requests processed, return
		expect( fulfillment.next() ).toMatchObject( {
			done: true,
			value: undefined,
		} );
	} );
} );

describe( '__unstableAcquireStoreLock', () => {
	const exclusive = true;
	const lock = { store, path, exclusive };

	let notifyAcquired;
	let request;

	beforeEach( () => {
		notifyAcquired = jest.fn();
		request = { store, path, exclusive, notifyAcquired };
	} );

	it( 'Enqueues a lock request and attempts to fulfill it', async () => {
		const fulfillment = __unstableAcquireStoreLock( store, path, {
			exclusive,
		} );

		// Start
		expect( fulfillment.next().value.type ).toBe( 'ENQUEUE_LOCK_REQUEST' );

		// Get pending lock requests
		expect( fulfillment.next().value.type ).toBe(
			'PROCESS_PENDING_LOCK_REQUESTS'
		);
		expect( fulfillment.next().value.type ).toBe( '@@data/SELECT' );

		// Check if lock may be granted
		expect( fulfillment.next( [ request ] ).value.type ).toBe(
			'@@data/SELECT'
		);

		// Grant lock request
		expect( fulfillment.next( true ).value.type ).toBe(
			'GRANT_LOCK_REQUEST'
		);

		// Ensure the promise isn't fulfilled until after GRANT_LOCK_REQUEST finishes
		expect( notifyAcquired ).not.toBeCalled();

		// Await for lock promise fulfillment
		expect( fulfillment.next( 'promise' ).value.type ).toBe(
			'AWAIT_PROMISE'
		);

		// Ensure the promise is fulfilled once GRANT_LOCK_REQUEST finishes
		expect( notifyAcquired ).toBeCalledWith( lock );

		// Return lock
		expect( fulfillment.next( lock ) ).toMatchObject( {
			done: true,
			value: lock,
		} );
	} );

	it( 'Enqueues a lock request and waits until fultillment it when not available', async () => {
		const fulfillment = __unstableAcquireStoreLock( store, path, {
			exclusive,
		} );

		// Start
		expect( fulfillment.next().value.type ).toBe( 'ENQUEUE_LOCK_REQUEST' );

		// Get pending lock requests
		expect( fulfillment.next().value.type ).toBe(
			'PROCESS_PENDING_LOCK_REQUESTS'
		);
		expect( fulfillment.next().value.type ).toBe( '@@data/SELECT' );

		// Check if lock may be granted
		expect( fulfillment.next( [ request ] ).value.type ).toBe(
			'@@data/SELECT'
		);

		// Await until lock request is granted
		expect( fulfillment.next( false ).value.type ).toBe( 'AWAIT_PROMISE' );

		// Ensure the promise isn't fulfilled at this point...
		expect( notifyAcquired ).not.toBeCalled();

		await sleep( 1000 );

		// ...or even a second lateer
		expect( notifyAcquired ).not.toBeCalled();

		// Let's assume the promise was fulfilled in the end, the action should return
		// the lock once that happens.
		expect( fulfillment.next( lock ) ).toMatchObject( {
			done: true,
			value: lock,
		} );
	} );
} );

describe( '__unstableReleaseStoreLock', () => {
	const lock = { store, path, exclusive: true };

	it( 'Releases a lock request and attempts to fulfill pending lock requests', async () => {
		const fulfillment = __unstableReleaseStoreLock( lock );

		// Start
		expect( fulfillment.next().value ).toMatchObject( {
			type: 'RELEASE_LOCK',
			lock,
		} );

		// Attempt to grant any pending lock requests, find none, return
		expect( fulfillment.next().value.type ).toBe(
			'PROCESS_PENDING_LOCK_REQUESTS'
		);
		expect( fulfillment.next().value.type ).toBe( '@@data/SELECT' );

		// Short-circuit with no results and return
		expect( fulfillment.next( [] ) ).toMatchObject( {
			done: true,
			value: undefined,
		} );
	} );
} );

const sleep = ( ms ) => {
	const promise = new Promise( ( resolve ) => setTimeout( resolve, ms ) );
	jest.advanceTimersByTime( ms + 1 );
	return promise;
};
