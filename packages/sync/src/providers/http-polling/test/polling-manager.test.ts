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
import { type SyncResponse } from '../types';

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
	MAX_UPDATE_SIZE_IN_BYTES: 10,
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
		maxClientsPerUser?: number;
		maxPeersPerRoom?: number;
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
	let mockPostSyncUpdateNonBlocking: jest.Mock<
		typeof import('../utils').postSyncUpdateNonBlocking
	>;

	beforeEach( () => {
		jest.useFakeTimers();

		// Use isolateModules so each test gets fresh module-level state
		// (isPolling, pollingTimeoutId, roomStates, etc.).
		jest.isolateModules( () => {
			pollingManager = require( '../polling-manager' ).pollingManager;
			mockPostSyncUpdate = require( '../utils' ).postSyncUpdate;
			mockPostSyncUpdateNonBlocking =
				require( '../utils' ).postSyncUpdateNonBlocking;
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

	describe( 'document size limit', () => {
		// Helper to extract the onDocUpdate callback registered via doc.on('updateV2', ...).
		function getOnDocUpdate( doc: ReturnType< typeof createMockDoc > ) {
			const call = doc.on.mock.calls.find(
				( args: unknown[] ) => args[ 0 ] === 'updateV2'
			);
			if ( ! call ) {
				throw new Error( 'onDocUpdate not registered' );
			}
			return call[ 1 ] as ( update: Uint8Array, origin: unknown ) => void;
		}

		it( 'emits document-size-limit-exceeded error when an update exceeds the size limit', async () => {
			mockPostSyncUpdate.mockResolvedValue( syncResponse );

			const onStatusChange = jest.fn();
			const doc = createMockDoc( 1 );

			pollingManager.registerRoom( {
				room: 'test-room',
				doc,
				awareness: createMockAwareness(),
				log: jest.fn(),
				onStatusChange,
				onSync: jest.fn(),
			} );

			// Simulate a doc update that exceeds the mocked MAX_UPDATE_SIZE_IN_BYTES (10).
			const onDocUpdate = getOnDocUpdate( doc );
			onDocUpdate( new Uint8Array( 11 ), 'some-origin' );

			expect( onStatusChange ).toHaveBeenCalledWith( {
				status: 'disconnected',
				error: expect.objectContaining( {
					code: 'document-size-limit-exceeded',
				} ),
			} );
		} );

		it( 'unregisters the room when the limit is exceeded', async () => {
			mockPostSyncUpdate.mockResolvedValue( syncResponse );

			const doc = createMockDoc( 1 );

			pollingManager.registerRoom( {
				room: 'test-room',
				doc,
				awareness: createMockAwareness(),
				log: jest.fn(),
				onStatusChange: jest.fn(),
				onSync: jest.fn(),
			} );

			const onDocUpdate = getOnDocUpdate( doc );
			onDocUpdate( new Uint8Array( 11 ), 'some-origin' );

			// unregisterRoom sends a disconnect signal via postSyncUpdateNonBlocking.
			expect( mockPostSyncUpdateNonBlocking ).toHaveBeenCalledWith(
				expect.objectContaining( {
					rooms: expect.arrayContaining( [
						expect.objectContaining( {
							room: 'test-room',
							awareness: null,
						} ),
					] ),
				} )
			);

			// The doc listener should be removed.
			expect( doc.off ).toHaveBeenCalledWith(
				'updateV2',
				expect.any( Function )
			);
		} );

		it( 'does not trigger for updates within the size limit', async () => {
			mockPostSyncUpdate.mockResolvedValue( syncResponse );

			const onStatusChange = jest.fn();
			const doc = createMockDoc( 1 );

			pollingManager.registerRoom( {
				room: 'test-room',
				doc,
				awareness: createMockAwareness(),
				log: jest.fn(),
				onStatusChange,
				onSync: jest.fn(),
			} );

			// Flush the initial poll so 'connected' status is emitted first.
			await jest.advanceTimersByTimeAsync( 0 );
			onStatusChange.mockClear();

			// Send an update within the limit (10 bytes).
			const onDocUpdate = getOnDocUpdate( doc );
			onDocUpdate( new Uint8Array( 10 ), 'some-origin' );

			expect( onStatusChange ).not.toHaveBeenCalledWith(
				expect.objectContaining( {
					status: 'disconnected',
					error: expect.objectContaining( {
						code: 'document-size-limit-exceeded',
					} ),
				} )
			);
		} );
	} );

	describe( 'peer limits', () => {
		function makeAwareness(
			entries: Array< { clientId: number; userId: number } >
		) {
			const awareness: Record<
				string,
				{ collaboratorInfo: { id: number } }
			> = {};
			for ( const { clientId, userId } of entries ) {
				awareness[ clientId ] = {
					collaboratorInfo: { id: userId },
				};
			}
			return awareness;
		}

		it( 'disconnects when unique users exceed maxPeersPerRoom on first poll', async () => {
			const awareness3Users = makeAwareness( [
				{ clientId: 1, userId: 100 },
				{ clientId: 2, userId: 200 },
				{ clientId: 3, userId: 300 },
			] );

			mockPostSyncUpdate.mockResolvedValue( {
				rooms: [
					{
						room: 'test-room',
						end_cursor: 1,
						awareness: awareness3Users,
						updates: [],
					},
				],
			} );

			const onStatusChange = jest.fn();
			const mockAwareness = createMockAwareness();
			mockAwareness.getLocalState.mockReturnValue( {
				collaboratorInfo: { id: 300 },
			} );

			pollingManager.registerRoom( {
				room: 'test-room',
				doc: createMockDoc( 3 ),
				awareness: mockAwareness,
				log: jest.fn(),
				maxPeersPerRoom: 2,
				onStatusChange,
				onSync: jest.fn(),
			} );

			await jest.advanceTimersByTimeAsync( 0 );

			expect( onStatusChange ).toHaveBeenCalledWith( {
				status: 'disconnected',
				error: expect.objectContaining( {
					code: 'connection-limit-exceeded',
				} ),
			} );
		} );

		it( 'allows connection when under the peer limit', async () => {
			const awareness2Users = makeAwareness( [
				{ clientId: 1, userId: 100 },
				{ clientId: 2, userId: 200 },
			] );

			mockPostSyncUpdate.mockResolvedValue( {
				rooms: [
					{
						room: 'test-room',
						end_cursor: 1,
						awareness: awareness2Users,
						updates: [],
					},
				],
			} );

			const onStatusChange = jest.fn();
			const mockAwareness = createMockAwareness();
			mockAwareness.getLocalState.mockReturnValue( {
				collaboratorInfo: { id: 200 },
			} );

			pollingManager.registerRoom( {
				room: 'test-room',
				doc: createMockDoc( 2 ),
				awareness: mockAwareness,
				log: jest.fn(),
				maxPeersPerRoom: 2,
				onStatusChange,
				onSync: jest.fn(),
			} );

			await jest.advanceTimersByTimeAsync( 0 );

			expect( onStatusChange ).not.toHaveBeenCalledWith(
				expect.objectContaining( {
					error: expect.objectContaining( {
						code: 'connection-limit-exceeded',
					} ),
				} )
			);
		} );

		it( 'disconnects when same-user tabs exceed maxClientsPerUser', async () => {
			const awareness3Tabs = makeAwareness( [
				{ clientId: 1, userId: 100 },
				{ clientId: 2, userId: 100 },
				{ clientId: 3, userId: 100 },
			] );

			mockPostSyncUpdate.mockResolvedValue( {
				rooms: [
					{
						room: 'test-room',
						end_cursor: 1,
						awareness: awareness3Tabs,
						updates: [],
					},
				],
			} );

			const onStatusChange = jest.fn();
			const mockAwareness = createMockAwareness();
			mockAwareness.getLocalState.mockReturnValue( {
				collaboratorInfo: { id: 100 },
			} );

			pollingManager.registerRoom( {
				room: 'test-room',
				doc: createMockDoc( 3 ),
				awareness: mockAwareness,
				log: jest.fn(),
				maxClientsPerUser: 2,
				onStatusChange,
				onSync: jest.fn(),
			} );

			await jest.advanceTimersByTimeAsync( 0 );

			expect( onStatusChange ).toHaveBeenCalledWith( {
				status: 'disconnected',
				error: expect.objectContaining( {
					code: 'connection-limit-exceeded',
				} ),
			} );
		} );

		it( 'does not re-check limits after initial sync', async () => {
			// First poll: 2 users (at limit, passes).
			const awareness2Users = makeAwareness( [
				{ clientId: 1, userId: 100 },
				{ clientId: 2, userId: 200 },
			] );
			mockPostSyncUpdate.mockResolvedValue( {
				rooms: [
					{
						room: 'test-room',
						end_cursor: 1,
						awareness: awareness2Users,
						updates: [],
					},
				],
			} );

			const onStatusChange = jest.fn();
			const mockAwareness = createMockAwareness();
			mockAwareness.getLocalState.mockReturnValue( {
				collaboratorInfo: { id: 200 },
			} );

			pollingManager.registerRoom( {
				room: 'test-room',
				doc: createMockDoc( 2 ),
				awareness: mockAwareness,
				log: jest.fn(),
				maxPeersPerRoom: 2,
				onStatusChange,
				onSync: jest.fn(),
			} );

			// First poll passes.
			await jest.advanceTimersByTimeAsync( 0 );
			onStatusChange.mockClear();

			// Second poll: 3 users (over limit).
			const awareness3Users = makeAwareness( [
				{ clientId: 1, userId: 100 },
				{ clientId: 2, userId: 200 },
				{ clientId: 3, userId: 300 },
			] );
			mockPostSyncUpdate.mockResolvedValue( {
				rooms: [
					{
						room: 'test-room',
						end_cursor: 2,
						awareness: awareness3Users,
						updates: [],
					},
				],
			} );

			await jest.advanceTimersByTimeAsync( 1000 );

			// Should NOT disconnect — limit check only runs on initial sync.
			expect( onStatusChange ).not.toHaveBeenCalledWith(
				expect.objectContaining( {
					error: expect.objectContaining( {
						code: 'connection-limit-exceeded',
					} ),
				} )
			);
		} );

		it( 'skips awareness entries with null or missing collaboratorInfo', async () => {
			const awarenessWithNulls: Record< string, object | null > = {
				1: { collaboratorInfo: { id: 100 } },
				2: null,
				3: {},
				4: { collaboratorInfo: { id: 200 } },
			};

			mockPostSyncUpdate.mockResolvedValue( {
				rooms: [
					{
						room: 'test-room',
						end_cursor: 1,
						awareness: awarenessWithNulls,
						updates: [],
					},
				],
			} );

			const onStatusChange = jest.fn();
			const mockAwareness = createMockAwareness();
			mockAwareness.getLocalState.mockReturnValue( {
				collaboratorInfo: { id: 200 },
			} );

			pollingManager.registerRoom( {
				room: 'test-room',
				doc: createMockDoc( 4 ),
				awareness: mockAwareness,
				log: jest.fn(),
				maxPeersPerRoom: 2,
				onStatusChange,
				onSync: jest.fn(),
			} );

			await jest.advanceTimersByTimeAsync( 0 );

			// Only 2 valid users (100, 200) — should not disconnect.
			expect( onStatusChange ).not.toHaveBeenCalledWith(
				expect.objectContaining( {
					error: expect.objectContaining( {
						code: 'connection-limit-exceeded',
					} ),
				} )
			);
		} );

		it( 'does not enforce limits when set to 0', async () => {
			const awareness5Users = makeAwareness( [
				{ clientId: 1, userId: 100 },
				{ clientId: 2, userId: 200 },
				{ clientId: 3, userId: 300 },
				{ clientId: 4, userId: 400 },
				{ clientId: 5, userId: 500 },
			] );

			mockPostSyncUpdate.mockResolvedValue( {
				rooms: [
					{
						room: 'test-room',
						end_cursor: 1,
						awareness: awareness5Users,
						updates: [],
					},
				],
			} );

			const onStatusChange = jest.fn();
			pollingManager.registerRoom( {
				room: 'test-room',
				doc: createMockDoc( 5 ),
				awareness: createMockAwareness(),
				log: jest.fn(),
				maxPeersPerRoom: 0,
				maxClientsPerUser: 0,
				onStatusChange,
				onSync: jest.fn(),
			} );

			await jest.advanceTimersByTimeAsync( 0 );

			expect( onStatusChange ).not.toHaveBeenCalledWith(
				expect.objectContaining( {
					error: expect.objectContaining( {
						code: 'connection-limit-exceeded',
					} ),
				} )
			);
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
