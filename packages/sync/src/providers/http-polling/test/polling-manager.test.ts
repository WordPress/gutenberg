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

jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn(
		( _hook: string, defaultValue: unknown ) => defaultValue
	),
} ) );

jest.mock( '../config', () => ( {
	...( jest.requireActual( '../config' ) as object ),
	MAX_UPDATE_SIZE_IN_BYTES: 10,
} ) );

jest.mock( '../utils', () => ( {
	...( jest.requireActual( '../utils' ) as object ),
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
	let mockApplyFilters: jest.Mock;

	beforeEach( () => {
		jest.useFakeTimers();

		// Use isolateModules so each test gets fresh module-level state
		// (isPolling, pollingTimeoutId, roomStates, etc.).
		jest.isolateModules( () => {
			pollingManager = require( '../polling-manager' ).pollingManager;
			mockPostSyncUpdate = require( '../utils' ).postSyncUpdate;
			mockPostSyncUpdateNonBlocking =
				require( '../utils' ).postSyncUpdateNonBlocking;
			mockApplyFilters = require( '@wordpress/hooks' ).applyFilters;
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

	describe( 'connection limits', () => {
		it( 'disconnects when clients exceed limit on first poll of first room', async () => {
			// DEFAULT_CLIENT_LIMIT_PER_ROOM is 3. 4 clients should exceed it.
			const awareness = {
				1: { collaboratorInfo: { id: 100 } },
				2: { collaboratorInfo: { id: 200 } },
				3: { collaboratorInfo: { id: 300 } },
				4: { collaboratorInfo: { id: 400 } },
			};

			mockPostSyncUpdate.mockResolvedValue( {
				rooms: [
					{
						room: 'test-room',
						end_cursor: 1,
						awareness,
						updates: [],
					},
				],
			} );

			const onStatusChange = jest.fn();

			pollingManager.registerRoom( {
				room: 'test-room',
				doc: createMockDoc( 1 ),
				awareness: createMockAwareness(),
				log: jest.fn(),
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

		it( 'allows connection when clients are at or under the limit', async () => {
			// DEFAULT_CLIENT_LIMIT_PER_ROOM is 3. 3 clients should be fine.
			const awareness = {
				1: { collaboratorInfo: { id: 100 } },
				2: { collaboratorInfo: { id: 200 } },
				3: { collaboratorInfo: { id: 300 } },
			};

			mockPostSyncUpdate.mockResolvedValue( {
				rooms: [
					{
						room: 'test-room',
						end_cursor: 1,
						awareness,
						updates: [],
					},
				],
			} );

			const onStatusChange = jest.fn();

			pollingManager.registerRoom( {
				room: 'test-room',
				doc: createMockDoc( 1 ),
				awareness: createMockAwareness(),
				log: jest.fn(),
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

		it( 'does not enforce limits on the second registered room', async () => {
			// Register a first room (which consumes the enforceConnectionLimit flag).
			mockPostSyncUpdate.mockResolvedValue( {
				rooms: [
					{
						room: 'first-room',
						end_cursor: 1,
						awareness: { 1: {} },
						updates: [],
					},
				],
			} );

			pollingManager.registerRoom( {
				room: 'first-room',
				doc: createMockDoc( 1 ),
				awareness: createMockAwareness(),
				log: jest.fn(),
				onStatusChange: jest.fn(),
				onSync: jest.fn(),
			} );

			await jest.advanceTimersByTimeAsync( 0 );

			// Now register a second room with many clients — should not disconnect.
			const awarenessMany = {
				1: {},
				2: {},
				3: {},
				4: {},
				5: {},
			};

			mockPostSyncUpdate.mockResolvedValue( {
				rooms: [
					{
						room: 'first-room',
						end_cursor: 2,
						awareness: { 1: {} },
						updates: [],
					},
					{
						room: 'second-room',
						end_cursor: 1,
						awareness: awarenessMany,
						updates: [],
					},
				],
			} );

			const onStatusChange = jest.fn();

			pollingManager.registerRoom( {
				room: 'second-room',
				doc: createMockDoc( 2 ),
				awareness: createMockAwareness(),
				log: jest.fn(),
				onStatusChange,
				onSync: jest.fn(),
			} );

			await jest.advanceTimersByTimeAsync( 1000 );

			expect( onStatusChange ).not.toHaveBeenCalledWith(
				expect.objectContaining( {
					error: expect.objectContaining( {
						code: 'connection-limit-exceeded',
					} ),
				} )
			);
		} );

		it( 'does not re-check limits after initial sync', async () => {
			// First poll: 3 clients (at limit, passes).
			const awareness3 = {
				1: {},
				2: {},
				3: {},
			};
			mockPostSyncUpdate.mockResolvedValue( {
				rooms: [
					{
						room: 'test-room',
						end_cursor: 1,
						awareness: awareness3,
						updates: [],
					},
				],
			} );

			const onStatusChange = jest.fn();

			pollingManager.registerRoom( {
				room: 'test-room',
				doc: createMockDoc( 1 ),
				awareness: createMockAwareness(),
				log: jest.fn(),
				onStatusChange,
				onSync: jest.fn(),
			} );

			// First poll passes.
			await jest.advanceTimersByTimeAsync( 0 );
			onStatusChange.mockClear();

			// Second poll: 5 clients (over limit).
			const awareness5 = {
				1: {},
				2: {},
				3: {},
				4: {},
				5: {},
			};
			mockPostSyncUpdate.mockResolvedValue( {
				rooms: [
					{
						room: 'test-room',
						end_cursor: 2,
						awareness: awareness5,
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

		it( 'passes room name to applyFilters for per-room customization', async () => {
			const awareness = {
				1: {},
				2: {},
				3: {},
				4: {},
			};

			mockPostSyncUpdate.mockResolvedValue( {
				rooms: [
					{
						room: 'my-custom-room',
						end_cursor: 1,
						awareness,
						updates: [],
					},
				],
			} );

			pollingManager.registerRoom( {
				room: 'my-custom-room',
				doc: createMockDoc( 1 ),
				awareness: createMockAwareness(),
				log: jest.fn(),
				onStatusChange: jest.fn(),
				onSync: jest.fn(),
			} );

			await jest.advanceTimersByTimeAsync( 0 );

			expect( mockApplyFilters ).toHaveBeenCalledWith(
				'sync.pollingProvider.maxClientsPerRoom',
				3,
				'my-custom-room'
			);
		} );

		it( 'respects a custom limit from applyFilters', async () => {
			// Override the filter to allow up to 10 clients.
			mockApplyFilters.mockReturnValue( 10 );

			const awareness = {
				1: {},
				2: {},
				3: {},
				4: {},
				5: {},
			};

			mockPostSyncUpdate.mockResolvedValue( {
				rooms: [
					{
						room: 'test-room',
						end_cursor: 1,
						awareness,
						updates: [],
					},
				],
			} );

			const onStatusChange = jest.fn();

			pollingManager.registerRoom( {
				room: 'test-room',
				doc: createMockDoc( 1 ),
				awareness: createMockAwareness(),
				log: jest.fn(),
				onStatusChange,
				onSync: jest.fn(),
			} );

			await jest.advanceTimersByTimeAsync( 0 );

			// 5 clients under a limit of 10 — should not disconnect.
			expect( onStatusChange ).not.toHaveBeenCalledWith(
				expect.objectContaining( {
					error: expect.objectContaining( {
						code: 'connection-limit-exceeded',
					} ),
				} )
			);
		} );
	} );

	describe( 'collaborator queue resumption', () => {
		it( 'resumes non-primary room queues when collaborators are detected on primary room', async () => {
			// First poll: primary room has collaborators, collection room has none.
			mockPostSyncUpdate.mockResolvedValue( {
				rooms: [
					{
						room: 'primary-room',
						end_cursor: 1,
						awareness: {
							1: { collaboratorInfo: { id: 100 } },
							2: { collaboratorInfo: { id: 200 } },
						},
						updates: [],
					},
					{
						room: 'collection-room',
						end_cursor: 1,
						awareness: {},
						updates: [],
					},
				],
			} );

			// Register primary room first (becomes isPrimaryRoom).
			pollingManager.registerRoom( {
				room: 'primary-room',
				doc: createMockDoc( 1 ),
				awareness: createMockAwareness(),
				log: jest.fn(),
				onStatusChange: jest.fn(),
				onSync: jest.fn(),
			} );

			pollingManager.registerRoom( {
				room: 'collection-room',
				doc: createMockDoc( 2 ),
				awareness: createMockAwareness(),
				log: jest.fn(),
				onStatusChange: jest.fn(),
				onSync: jest.fn(),
			} );

			// First poll: detects collaborators on primary room, resumes all queues.
			await jest.advanceTimersByTimeAsync( 0 );

			// Second poll: collection room queue should now be unpaused,
			// so its initial sync_step1 update should be included.
			mockPostSyncUpdate.mockResolvedValue( {
				rooms: [
					{
						room: 'primary-room',
						end_cursor: 2,
						awareness: {
							1: { collaboratorInfo: { id: 100 } },
							2: { collaboratorInfo: { id: 200 } },
						},
						updates: [],
					},
					{
						room: 'collection-room',
						end_cursor: 2,
						awareness: {},
						updates: [],
					},
				],
			} );

			await jest.advanceTimersByTimeAsync( 1000 );

			// The second call should include non-empty updates for the collection room.
			const secondCallPayload = mockPostSyncUpdate.mock.calls[ 1 ][ 0 ];
			const collectionRoom = secondCallPayload.rooms.find(
				( r: { room: string } ) => r.room === 'collection-room'
			);
			expect( collectionRoom!.updates.length ).toBeGreaterThan( 0 );
		} );

		it( 'does not resume non-primary room queues when no collaborators are detected', async () => {
			// Only 1 client (self) — no collaborators.
			mockPostSyncUpdate.mockResolvedValue( {
				rooms: [
					{
						room: 'primary-room',
						end_cursor: 1,
						awareness: { 1: { collaboratorInfo: { id: 100 } } },
						updates: [],
					},
					{
						room: 'collection-room',
						end_cursor: 1,
						awareness: {},
						updates: [],
					},
				],
			} );

			pollingManager.registerRoom( {
				room: 'primary-room',
				doc: createMockDoc( 1 ),
				awareness: createMockAwareness(),
				log: jest.fn(),
				onStatusChange: jest.fn(),
				onSync: jest.fn(),
			} );

			pollingManager.registerRoom( {
				room: 'collection-room',
				doc: createMockDoc( 2 ),
				awareness: createMockAwareness(),
				log: jest.fn(),
				onStatusChange: jest.fn(),
				onSync: jest.fn(),
			} );

			// First poll: no collaborators.
			await jest.advanceTimersByTimeAsync( 0 );

			// Second poll: collection room queue should still be paused.
			await jest.advanceTimersByTimeAsync( 4000 );

			const secondCallPayload = mockPostSyncUpdate.mock.calls[ 1 ][ 0 ];
			const collectionRoom = secondCallPayload.rooms.find(
				( r: { room: string } ) => r.room === 'collection-room'
			);
			expect( collectionRoom!.updates ).toEqual( [] );
		} );

		it( 'sends accumulated collection room updates after collaborator detection', async () => {
			// First poll: no collaborators.
			mockPostSyncUpdate.mockResolvedValue( {
				rooms: [
					{
						room: 'primary-room',
						end_cursor: 1,
						awareness: { 1: { collaboratorInfo: { id: 100 } } },
						updates: [],
					},
					{
						room: 'collection-room',
						end_cursor: 1,
						awareness: {},
						updates: [],
					},
				],
			} );

			const collectionDoc = createMockDoc( 2 );

			pollingManager.registerRoom( {
				room: 'primary-room',
				doc: createMockDoc( 1 ),
				awareness: createMockAwareness(),
				log: jest.fn(),
				onStatusChange: jest.fn(),
				onSync: jest.fn(),
			} );

			pollingManager.registerRoom( {
				room: 'collection-room',
				doc: collectionDoc,
				awareness: createMockAwareness(),
				log: jest.fn(),
				onStatusChange: jest.fn(),
				onSync: jest.fn(),
			} );

			// First poll: no collaborators, queues stay paused.
			await jest.advanceTimersByTimeAsync( 0 );

			// Simulate a local doc update on the collection room (e.g., a note was saved).
			const onDocUpdate = getOnDocUpdate( collectionDoc );
			onDocUpdate( new Uint8Array( [ 1, 2, 3 ] ), 'local-origin' );

			// Second poll: still no collaborators, collection room updates should be empty.
			mockPostSyncUpdate.mockResolvedValue( {
				rooms: [
					{
						room: 'primary-room',
						end_cursor: 2,
						awareness: { 1: { collaboratorInfo: { id: 100 } } },
						updates: [],
					},
					{
						room: 'collection-room',
						end_cursor: 2,
						awareness: {},
						updates: [],
					},
				],
			} );
			await jest.advanceTimersByTimeAsync( 4000 );

			const secondCallPayload = mockPostSyncUpdate.mock.calls[ 1 ][ 0 ];
			const collectionRoomPoll2 = secondCallPayload.rooms.find(
				( r: { room: string } ) => r.room === 'collection-room'
			);
			expect( collectionRoomPoll2!.updates ).toEqual( [] );

			// Third poll: collaborator joins — queues should be resumed.
			mockPostSyncUpdate.mockResolvedValue( {
				rooms: [
					{
						room: 'primary-room',
						end_cursor: 3,
						awareness: {
							1: { collaboratorInfo: { id: 100 } },
							2: { collaboratorInfo: { id: 200 } },
						},
						updates: [],
					},
					{
						room: 'collection-room',
						end_cursor: 3,
						awareness: {},
						updates: [],
					},
				],
			} );
			await jest.advanceTimersByTimeAsync( 4000 );

			// Fourth poll: collection room should now send accumulated updates.
			mockPostSyncUpdate.mockResolvedValue( {
				rooms: [
					{
						room: 'primary-room',
						end_cursor: 4,
						awareness: {
							1: { collaboratorInfo: { id: 100 } },
							2: { collaboratorInfo: { id: 200 } },
						},
						updates: [],
					},
					{
						room: 'collection-room',
						end_cursor: 4,
						awareness: {},
						updates: [],
					},
				],
			} );
			await jest.advanceTimersByTimeAsync( 1000 );

			const fourthCallPayload = mockPostSyncUpdate.mock.calls[ 3 ][ 0 ];
			const collectionRoomPoll4 = fourthCallPayload.rooms.find(
				( r: { room: string } ) => r.room === 'collection-room'
			);
			// Should include the initial sync_step1 update + the local update.
			expect( collectionRoomPoll4!.updates.length ).toBeGreaterThan( 0 );
		} );
	} );

	describe( 'error recovery', () => {
		it( 'replaces queued updates with a compaction after a poll error', async () => {
			// First poll: succeed with collaborators to resume the queue.
			const responseWithCollaborator = {
				rooms: [
					{
						room: 'test-room',
						end_cursor: 1,
						awareness: { 1: {}, 2: {} },
						updates: [],
					},
				],
			};
			mockPostSyncUpdate.mockResolvedValueOnce(
				responseWithCollaborator
			);

			const doc = createMockDoc( 1 );
			pollingManager.registerRoom( {
				room: 'test-room',
				doc,
				awareness: createMockAwareness(),
				log: jest.fn(),
				onStatusChange: jest.fn(),
				onSync: jest.fn(),
			} );

			// Flush the initial poll (queue is paused, so no updates sent).
			await jest.advanceTimersByTimeAsync( 0 );
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 1 );

			// Add a document update (queue is now resumed due to collaborators).
			const onDocUpdate = getOnDocUpdate( doc );
			onDocUpdate( new Uint8Array( [ 1, 2, 3 ] ), 'user' );

			// Second poll: fail with a network error.
			mockPostSyncUpdate.mockRejectedValueOnce( new Error( 'timeout' ) );
			await jest.advanceTimersByTimeAsync( 1000 );
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 2 );

			// Verify the second poll included the queued updates (sync_step1 + doc update).
			const secondCallPayload = mockPostSyncUpdate.mock
				.calls[ 1 ][ 0 ] as {
				rooms: Array< {
					updates: Array< { type: string } >;
				} >;
			};
			expect(
				secondCallPayload.rooms[ 0 ].updates.length
			).toBeGreaterThan( 0 );

			// Third poll: succeed — verify it sends a compaction instead of
			// restoring the same updates.
			mockPostSyncUpdate.mockResolvedValueOnce(
				responseWithCollaborator
			);

			// First failure with collaborators: retry in 1000ms (schedule[0]).
			await jest.advanceTimersByTimeAsync( 1000 );
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 3 );

			const thirdCallPayload = mockPostSyncUpdate.mock
				.calls[ 2 ][ 0 ] as {
				rooms: Array< {
					updates: Array< { type: string } >;
				} >;
			};
			const retryUpdates = thirdCallPayload.rooms[ 0 ].updates;
			expect( retryUpdates ).toHaveLength( 1 );
			expect( retryUpdates[ 0 ].type ).toBe( 'compaction' );
		} );

		it( 'does not queue a compaction for rooms with no outgoing updates', async () => {
			// First poll succeeds (no collaborators, queue stays paused).
			mockPostSyncUpdate.mockResolvedValueOnce( syncResponse );

			pollingManager.registerRoom( {
				room: 'test-room',
				doc: createMockDoc( 1 ),
				awareness: createMockAwareness(),
				log: jest.fn(),
				onStatusChange: jest.fn(),
				onSync: jest.fn(),
			} );

			await jest.advanceTimersByTimeAsync( 0 );
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 1 );

			// Second poll: fail (no updates were sent because queue is paused).
			mockPostSyncUpdate.mockRejectedValueOnce( new Error( 'timeout' ) );
			await jest.advanceTimersByTimeAsync( 4000 );
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 2 );

			// Verify no updates were sent on the failed poll.
			const secondCallPayload = mockPostSyncUpdate.mock
				.calls[ 1 ][ 0 ] as {
				rooms: Array< {
					updates: Array< { type: string } >;
				} >;
			};
			expect( secondCallPayload.rooms[ 0 ].updates ).toHaveLength( 0 );

			// Third poll: succeed — should still have no updates (no compaction queued).
			// First failure solo: retry in 2000ms (schedule[0]).
			mockPostSyncUpdate.mockResolvedValueOnce( syncResponse );
			await jest.advanceTimersByTimeAsync( 2000 );
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 3 );

			const thirdCallPayload = mockPostSyncUpdate.mock
				.calls[ 2 ][ 0 ] as {
				rooms: Array< {
					updates: Array< { type: string } >;
				} >;
			};
			expect( thirdCallPayload.rooms[ 0 ].updates ).toHaveLength( 0 );
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
