/**
 * External dependencies
 */
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from '@jest/globals';
import { SyncUpdateType, type SyncResponse, type SyncUpdate } from '../types';

// Mock all external dependencies before imports.
jest.mock( 'yjs', () => ( {
	mergeUpdatesV2: jest.fn( () => new Uint8Array() ),
	applyUpdateV2: jest.fn(),
	encodeStateAsUpdateV2: jest.fn( () => new Uint8Array() ),
} ) );

jest.mock( 'lib0/encoding', () => ( {
	createEncoder: jest.fn( () => ( {} ) ),
	toUint8Array: jest.fn( () => new Uint8Array( [ 0 ] ) ),
} ) );

jest.mock( 'lib0/decoding', () => ( {
	createDecoder: jest.fn( () => ( {} ) ),
} ) );

jest.mock( 'y-protocols/sync', () => ( {
	writeSyncStep1: jest.fn(),
	readSyncMessage: jest.fn(),
} ) );

jest.mock( 'y-protocols/awareness', () => ( {
	removeAwarenessStates: jest.fn(),
} ) );

jest.mock( '../config', () => ( {
	...( jest.requireActual( '../config' ) as object ),
	MAX_PROVIDER_SIZE_BYTES: 10,
} ) );

jest.mock( '../utils', () => ( {
	base64ToUint8Array: jest.fn( () => new Uint8Array() ),
	createSyncUpdate: jest.fn( ( _data: unknown, type: string ) => ( {
		data: '',
		type,
	} ) ),
	createUpdateQueue: jest.fn( () => ( {
		add: jest.fn(),
		addBulk: jest.fn(),
		clear: jest.fn(),
		get: jest.fn( () => [] ),
		pause: jest.fn(),
		restore: jest.fn(),
		resume: jest.fn(),
		size: jest.fn( () => 0 ),
	} ) ),
	postSyncUpdate: jest.fn(),
	postSyncUpdateNonBlocking: jest.fn(),
} ) );

interface PollingManager {
	registerRoom: ( options: {
		room: string;
		doc: unknown;
		awareness: unknown;
		log: () => void;
		onStatusChange: () => void;
		onSync: () => void;
	} ) => void;
	unregisterRoom: ( room: string ) => void;
}

function createDeferred< T >() {
	let resolve!: ( value: T ) => void;
	const promise = new Promise< T >( ( res ) => {
		resolve = res;
	} );
	return { promise, resolve };
}

function createMockDoc( clientID = 1 ) {
	return { clientID, on: jest.fn(), off: jest.fn() };
}

function createMockAwareness() {
	return {
		clientID: 1,
		getLocalState: jest.fn( () => ( {} ) ),
		getStates: jest.fn( () => new Map() ),
		on: jest.fn(),
		off: jest.fn(),
		emit: jest.fn(),
	};
}

function createMockQueue( getOverride?: () => SyncUpdate[] ) {
	return {
		add: jest.fn(),
		addBulk: jest.fn(),
		clear: jest.fn(),
		get: jest.fn( getOverride ?? ( () => [] ) ),
		pause: jest.fn(),
		restore: jest.fn(),
		resume: jest.fn(),
		size: jest.fn( () => 0 ),
	};
}

function createAwarenessState( enteredAt: number ) {
	return { collaboratorInfo: { enteredAt } };
}

function simulateVisibilityChange( state: string ) {
	Object.defineProperty( document, 'visibilityState', {
		configurable: true,
		get: () => state,
	} );
	document.dispatchEvent( new Event( 'visibilitychange' ) );
}

const syncResponse = {
	rooms: [
		{
			room: 'test-room',
			end_cursor: 1,
			awareness: {},
			updates: [],
		},
	],
};

describe( 'polling-manager', () => {
	let pollingManager: PollingManager;
	let mockPostSyncUpdate: jest.Mock<
		typeof import('../utils').postSyncUpdate
	>;
	let mockCreateUpdateQueue: jest.Mock<
		typeof import('../utils').createUpdateQueue
	>;

	beforeEach( () => {
		jest.useFakeTimers();

		// Use isolateModules so each test gets fresh module-level state
		// (isPolling, pollingTimeoutId, roomStates, etc.).
		jest.isolateModules( () => {
			pollingManager = require( '../polling-manager' ).pollingManager;
			mockPostSyncUpdate = require( '../utils' ).postSyncUpdate;
			mockCreateUpdateQueue = require( '../utils' ).createUpdateQueue;
		} );
	} );

	afterEach( () => {
		jest.clearAllTimers();
		jest.useRealTimers();
		Object.defineProperty( document, 'visibilityState', {
			configurable: true,
			get: () => 'visible',
		} );
	} );

	describe( 'provider size limit', () => {
		// Exceeds mocked MAX_PROVIDER_SIZE_BYTES (10 bytes).
		const oversizedData = 'x'.repeat( 11 );
		const oversizedUpdates: SyncUpdate[] = [
			{ data: oversizedData, type: SyncUpdateType.UPDATE },
		];

		it( 'sends the request with empty updates when payload exceeds the size limit', async () => {
			mockCreateUpdateQueue.mockReturnValue(
				createMockQueue( () => oversizedUpdates )
			);
			mockPostSyncUpdate.mockResolvedValue( syncResponse );

			const onStatusChange = jest.fn();
			const awareness = createMockAwareness();
			// Two peers: clientID 1 (ours, entered first) and 2.
			awareness.getStates.mockReturnValue(
				new Map( [
					[ 1, createAwarenessState( 1000 ) ],
					[ 2, createAwarenessState( 2000 ) ],
				] )
			);

			pollingManager.registerRoom( {
				room: 'test-room',
				doc: createMockDoc( 1 ),
				awareness,
				log: jest.fn(),
				onStatusChange,
				onSync: jest.fn(),
			} );

			await jest.advanceTimersByTimeAsync( 0 );

			// The request should be sent with empty updates (awareness still flows).
			expect( mockPostSyncUpdate ).toHaveBeenCalledWith(
				expect.objectContaining( {
					rooms: expect.arrayContaining( [
						expect.objectContaining( { updates: [] } ),
					] ),
				} )
			);
		} );

		it( 'emits provider-limit-exceeded status when payload exceeds size limit', async () => {
			mockCreateUpdateQueue.mockReturnValue(
				createMockQueue( () => oversizedUpdates )
			);

			const onStatusChange = jest.fn();
			const awareness = createMockAwareness();
			awareness.getStates.mockReturnValue(
				new Map( [
					[ 1, createAwarenessState( 1000 ) ],
					[ 2, createAwarenessState( 2000 ) ],
				] )
			);

			pollingManager.registerRoom( {
				room: 'test-room',
				doc: createMockDoc( 1 ),
				awareness,
				log: jest.fn(),
				onStatusChange,
				onSync: jest.fn(),
			} );

			await jest.advanceTimersByTimeAsync( 0 );

			expect( onStatusChange ).toHaveBeenCalledWith(
				expect.objectContaining( {
					status: 'provider-limit-exceeded',
					error: expect.objectContaining( {
						code: 'provider-limit-exceeded',
					} ),
				} )
			);
		} );

		it( 'pauses the queue when payload exceeds size limit', async () => {
			const mockQueue = createMockQueue( () => oversizedUpdates );
			mockCreateUpdateQueue.mockReturnValue( mockQueue );
			mockPostSyncUpdate.mockResolvedValue( syncResponse );

			const onStatusChange = jest.fn();
			const awareness = createMockAwareness();
			awareness.getStates.mockReturnValue(
				new Map( [
					[ 1, createAwarenessState( 1000 ) ],
					[ 2, createAwarenessState( 2000 ) ],
				] )
			);

			pollingManager.registerRoom( {
				room: 'test-room',
				doc: createMockDoc( 1 ),
				awareness,
				log: jest.fn(),
				onStatusChange,
				onSync: jest.fn(),
			} );

			await jest.advanceTimersByTimeAsync( 0 );

			// Should pause, not disconnect.
			expect( mockQueue.pause ).toHaveBeenCalled();
			expect( onStatusChange ).not.toHaveBeenCalledWith(
				expect.objectContaining( {
					status: 'disconnected',
				} )
			);
		} );

		it( 'pauses all rooms consistently when limit is exceeded', async () => {
			let getCallCount = 0;

			// Two rooms × two polls: first poll (calls 1-2) returns
			// empty so it succeeds; second poll (calls 3-4) returns
			// oversized data to trigger the limit check.
			mockCreateUpdateQueue.mockReturnValue(
				createMockQueue( () => {
					getCallCount++;
					return getCallCount <= 2 ? [] : oversizedUpdates;
				} )
			);

			// The first poll must suspend at `await postSyncUpdate`
			// so room-b has time to register before it completes.
			// Return awareness keyed by our client ID (1) to avoid
			// triggering removals in processAwarenessUpdate.
			mockPostSyncUpdate.mockResolvedValue( {
				rooms: [
					{
						room: 'room-a',
						end_cursor: 1,
						awareness: { 1: {}, 2: {} },
						updates: [],
					},
					{
						room: 'room-b',
						end_cursor: 1,
						awareness: { 1: {}, 2: {} },
						updates: [],
					},
				],
			} );

			const onStatusChangeA = jest.fn();
			const onStatusChangeB = jest.fn();

			const awareness = createMockAwareness();
			awareness.getStates.mockReturnValue(
				new Map( [
					[ 1, createAwarenessState( 1000 ) ],
					[ 2, createAwarenessState( 2000 ) ],
				] )
			);

			// Room-a triggers poll(). start() suspends at await
			// postSyncUpdate, giving room-b time to register.
			pollingManager.registerRoom( {
				room: 'room-a',
				doc: createMockDoc( 1 ),
				awareness,
				log: jest.fn(),
				onStatusChange: onStatusChangeA,
				onSync: jest.fn(),
			} );

			pollingManager.registerRoom( {
				room: 'room-b',
				doc: createMockDoc( 1 ),
				awareness,
				log: jest.fn(),
				onStatusChange: onStatusChangeB,
				onSync: jest.fn(),
			} );

			// Flush first poll (succeeds, schedules next).
			await jest.advanceTimersByTimeAsync( 0 );

			// Advance to second poll — both rooms now exceed limit.
			await jest.advanceTimersByTimeAsync( 1000 );

			// Both rooms should receive provider-limit-exceeded.
			expect( onStatusChangeA ).toHaveBeenCalledWith(
				expect.objectContaining( {
					status: 'provider-limit-exceeded',
				} )
			);
			expect( onStatusChangeB ).toHaveBeenCalledWith(
				expect.objectContaining( {
					status: 'provider-limit-exceeded',
				} )
			);
		} );

		it( 'continues polling after queue is paused', async () => {
			let callCount = 0;

			// First call returns oversized, subsequent calls return empty
			// (simulating the paused queue returning []).
			mockCreateUpdateQueue.mockReturnValue(
				createMockQueue( () => {
					callCount++;
					return callCount === 1 ? oversizedUpdates : [];
				} )
			);

			mockPostSyncUpdate.mockResolvedValue( syncResponse );

			const awareness = createMockAwareness();
			// We are the earliest client (entered first).
			awareness.getStates.mockReturnValue(
				new Map( [
					[ 1, createAwarenessState( 1000 ) ],
					[ 5, createAwarenessState( 2000 ) ],
				] )
			);

			pollingManager.registerRoom( {
				room: 'test-room',
				doc: createMockDoc( 1 ),
				awareness,
				log: jest.fn(),
				onStatusChange: jest.fn(),
				onSync: jest.fn(),
			} );

			// First poll: exceeds limit, pauses queue, but still sends
			// the request with empty updates (for awareness).
			await jest.advanceTimersByTimeAsync( 0 );
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 1 );

			// Advance past the poll interval — should poll again.
			await jest.advanceTimersByTimeAsync( 1000 );
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 2 );
		} );
	} );

	describe( 'visibility change', () => {
		it( 'does not spawn a duplicate poll when a request is in-flight', () => {
			// Keep the first postSyncUpdate pending so we can simulate
			// a visibility change while the request is in-flight.
			const deferred = createDeferred< SyncResponse >();
			mockPostSyncUpdate.mockReturnValue( deferred.promise );

			pollingManager.registerRoom( {
				room: 'test-room',
				doc: createMockDoc(),
				awareness: createMockAwareness(),
				log: jest.fn(),
				onStatusChange: jest.fn(),
				onSync: jest.fn(),
			} );

			// registerRoom → poll() → start() → postSyncUpdate (pending).
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 1 );

			// Simulate tab hidden → visible while the request is in-flight.
			simulateVisibilityChange( 'hidden' );
			simulateVisibilityChange( 'visible' );

			// No second poll should have been spawned.
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'repolls immediately when tab becomes visible with a pending timeout', async () => {
			mockPostSyncUpdate.mockResolvedValue( syncResponse );

			pollingManager.registerRoom( {
				room: 'test-room',
				doc: createMockDoc(),
				awareness: createMockAwareness(),
				log: jest.fn(),
				onStatusChange: jest.fn(),
				onSync: jest.fn(),
			} );

			// Flush so the first poll completes and schedules a timeout.
			await jest.advanceTimersByTimeAsync( 0 );
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 1 );

			// Tab hidden → visible while a timeout is pending.
			simulateVisibilityChange( 'hidden' );
			simulateVisibilityChange( 'visible' );

			// Should trigger an immediate repoll (not wait for timeout).
			await jest.advanceTimersByTimeAsync( 0 );
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 2 );
		} );
	} );
} );
