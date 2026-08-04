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
import { type SyncPayload, type SyncResponse } from '../../common/types';

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

jest.mock( '../utils', () => ( {
	...( jest.requireActual( '../utils' ) as object ),
	postLongPollSyncUpdate: jest.fn(),
} ) );

jest.mock( '../../http-polling/utils', () => ( {
	...( jest.requireActual( '../../http-polling/utils' ) as object ),
	postSyncUpdate: jest.fn(),
	postSyncUpdateNonBlocking: jest.fn(),
} ) );

interface LongPollingManager {
	registerRoom: ( options: {
		room: string;
		doc: unknown;
		awareness: unknown;
		log: () => void;
		onStatusChange: ( status: unknown ) => void;
		onSync: () => void;
	} ) => void;
	unregisterRoom: (
		room: string,
		options?: { sendDisconnectSignal?: boolean }
	) => void;
}

interface PendingRequest {
	payload: SyncPayload;
	resolve: ( value: SyncResponse ) => void;
	reject: ( reason: unknown ) => void;
	signal?: AbortSignal;
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

const soloResponse: SyncResponse = {
	rooms: [
		{
			room: 'test-room',
			end_cursor: 1,
			awareness: { 1: {} },
			updates: [],
		},
	],
};

const collaboratorResponse: SyncResponse = {
	rooms: [
		{
			room: 'test-room',
			end_cursor: 1,
			awareness: { 1: {}, 2: {} },
			updates: [],
		},
	],
};

describe( 'long-polling-manager', () => {
	let longPollingManager: LongPollingManager;
	let mockPostLongPollSyncUpdate: jest.Mock<
		typeof import('../utils').postLongPollSyncUpdate
	>;
	let mockPostSyncUpdate: jest.Mock<
		typeof import('../../http-polling/utils').postSyncUpdate
	>;
	let pendingRequests: PendingRequest[];

	function trackLongPollRequests() {
		mockPostLongPollSyncUpdate.mockImplementation(
			( payload: SyncPayload, signal?: AbortSignal ) =>
				new Promise< SyncResponse >( ( resolve, reject ) => {
					pendingRequests.push( {
						payload,
						reject,
						resolve,
						signal,
					} );
					signal?.addEventListener( 'abort', () => {
						const error = new Error( 'Aborted' );
						error.name = 'AbortError';
						reject( error );
					} );
				} )
		);
	}

	function registerTestRoom(
		overrides: Partial< {
			onStatusChange: ( status: unknown ) => void;
			doc: ReturnType< typeof createMockDoc >;
		} > = {}
	) {
		const doc = overrides.doc ?? createMockDoc( 1 );
		longPollingManager.registerRoom( {
			room: 'test-room',
			doc,
			awareness: createMockAwareness(),
			log: jest.fn(),
			onStatusChange: overrides.onStatusChange ?? jest.fn(),
			onSync: jest.fn(),
		} );
		return doc;
	}

	beforeEach( () => {
		jest.useFakeTimers();
		pendingRequests = [];

		// Use isolateModules so each test gets fresh module-level state.
		jest.isolateModules( () => {
			longPollingManager =
				require( '../long-polling-manager' ).longPollingManager;
			mockPostLongPollSyncUpdate =
				require( '../utils' ).postLongPollSyncUpdate;
			mockPostSyncUpdate =
				require( '../../http-polling/utils' ).postSyncUpdate;
		} );

		trackLongPollRequests();
	} );

	afterEach( () => {
		// Unregister the test room so this module instance removes its
		// document/window listeners; otherwise stale instances react to
		// visibility events dispatched by later tests.
		longPollingManager.unregisterRoom( 'test-room', {
			sendDisconnectSignal: false,
		} );
		jest.clearAllTimers();
		jest.useRealTimers();
		Object.defineProperty( document, 'visibilityState', {
			configurable: true,
			get: () => 'visible',
		} );
	} );

	describe( 'immediate re-issue', () => {
		it( 're-issues a new long-poll request immediately after a held response', async () => {
			registerTestRoom();

			expect( pendingRequests ).toHaveLength( 1 );

			// Simulate the server holding the request for 5 seconds before
			// responding (past the minimum request interval).
			await jest.advanceTimersByTimeAsync( 5000 );
			pendingRequests[ 0 ].resolve( soloResponse );

			// The next request should be issued immediately (delay 0).
			await jest.advanceTimersByTimeAsync( 0 );
			expect( pendingRequests ).toHaveLength( 2 );
		} );

		it( 'applies a minimum interval when the server responds instantly with nothing', async () => {
			registerTestRoom();
			expect( pendingRequests ).toHaveLength( 1 );

			// Respond instantly with no updates.
			pendingRequests[ 0 ].resolve( soloResponse );
			await jest.advanceTimersByTimeAsync( 0 );

			// No immediate re-issue: the manager waits out the minimum interval.
			expect( pendingRequests ).toHaveLength( 1 );

			await jest.advanceTimersByTimeAsync( 250 );
			expect( pendingRequests ).toHaveLength( 2 );
		} );
	} );

	describe( 'abort-and-resend on local updates', () => {
		it( 'aborts a held request and immediately re-posts with the queued update', async () => {
			const doc = registerTestRoom();

			// First request: respond with a collaborator so queues resume.
			await jest.advanceTimersByTimeAsync( 1000 );
			pendingRequests[ 0 ].resolve( collaboratorResponse );
			await jest.advanceTimersByTimeAsync( 0 );

			// Second request carries the initial sync_step1 (queue resumed).
			expect( pendingRequests ).toHaveLength( 2 );
			expect(
				pendingRequests[ 1 ].payload.rooms[ 0 ].updates.length
			).toBeGreaterThan( 0 );

			// Respond, third request is held with no outgoing updates.
			await jest.advanceTimersByTimeAsync( 1000 );
			pendingRequests[ 1 ].resolve( collaboratorResponse );
			await jest.advanceTimersByTimeAsync( 300 );
			expect( pendingRequests ).toHaveLength( 3 );
			expect( pendingRequests[ 2 ].payload.rooms[ 0 ].updates ).toEqual(
				[]
			);

			// A local doc update arrives while the request is held.
			getOnDocUpdate( doc )( new Uint8Array( [ 1, 2, 3 ] ), 'user' );

			// After the send debounce, the held request is aborted and a new
			// request is immediately issued carrying the update.
			await jest.advanceTimersByTimeAsync( 100 );
			expect( pendingRequests[ 2 ].signal!.aborted ).toBe( true );

			await jest.advanceTimersByTimeAsync( 10 );
			expect( pendingRequests ).toHaveLength( 4 );

			const resendUpdates =
				pendingRequests[ 3 ].payload.rooms[ 0 ].updates;
			expect( resendUpdates ).toHaveLength( 1 );
			expect( resendUpdates[ 0 ].type ).toBe( 'update' );
		} );

		it( 'does not run backoff or compaction recovery for a self-inflicted abort', async () => {
			const onStatusChange = jest.fn();
			const doc = registerTestRoom( { onStatusChange } );

			// Resume queues with a collaborator, then reach a held request.
			await jest.advanceTimersByTimeAsync( 1000 );
			pendingRequests[ 0 ].resolve( collaboratorResponse );
			await jest.advanceTimersByTimeAsync( 1000 );
			pendingRequests[ 1 ].resolve( collaboratorResponse );
			await jest.advanceTimersByTimeAsync( 300 );
			expect( pendingRequests ).toHaveLength( 3 );

			onStatusChange.mockClear();

			// Local update triggers a self-abort of the held request.
			getOnDocUpdate( doc )( new Uint8Array( [ 1, 2, 3 ] ), 'user' );
			await jest.advanceTimersByTimeAsync( 100 );
			await jest.advanceTimersByTimeAsync( 10 );

			// No disconnected status was emitted for the deliberate abort.
			expect( onStatusChange ).not.toHaveBeenCalledWith(
				expect.objectContaining( { status: 'disconnected' } )
			);

			// The resent payload contains the exact queued update, not a
			// compaction produced by the failure-recovery path.
			const resendUpdates =
				pendingRequests[ 3 ].payload.rooms[ 0 ].updates;
			expect(
				resendUpdates.some( ( update ) => update.type === 'compaction' )
			).toBe( false );
			expect( resendUpdates ).toHaveLength( 1 );
		} );

		it( 'does not abort a request that is already carrying updates', async () => {
			const doc = registerTestRoom();

			// Resume queues with a collaborator.
			await jest.advanceTimersByTimeAsync( 1000 );
			pendingRequests[ 0 ].resolve( collaboratorResponse );
			await jest.advanceTimersByTimeAsync( 0 );

			// Second request carries the sync_step1 update and stays in flight.
			expect( pendingRequests ).toHaveLength( 2 );
			expect(
				pendingRequests[ 1 ].payload.rooms[ 0 ].updates.length
			).toBeGreaterThan( 0 );

			// A new local update while the sending request is in flight must
			// not abort it.
			getOnDocUpdate( doc )( new Uint8Array( [ 4, 5, 6 ] ), 'user' );
			await jest.advanceTimersByTimeAsync( 100 );

			expect( pendingRequests[ 1 ].signal!.aborted ).toBe( false );
		} );
	} );

	describe( 'background tab fallback', () => {
		it( 'releases the held request and falls back to plain interval polling when hidden', async () => {
			mockPostSyncUpdate.mockResolvedValue( soloResponse );

			registerTestRoom();
			expect( pendingRequests ).toHaveLength( 1 );

			// The tab moves to the background: the held long-poll is released.
			simulateVisibilityChange( 'hidden' );
			expect( pendingRequests[ 0 ].signal!.aborted ).toBe( true );

			// The next cycle is a plain (non-held) poll at the background cadence.
			await jest.advanceTimersByTimeAsync( 25000 );
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 1 );
			expect( pendingRequests ).toHaveLength( 1 );
		} );

		it( 'resumes long polling when the tab becomes visible again', async () => {
			mockPostSyncUpdate.mockResolvedValue( soloResponse );

			registerTestRoom();
			simulateVisibilityChange( 'hidden' );
			await jest.advanceTimersByTimeAsync( 25000 );
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 1 );

			// While waiting out the background interval, the tab is shown
			// again: the manager resumes long polling immediately.
			simulateVisibilityChange( 'visible' );
			await jest.advanceTimersByTimeAsync( 0 );
			expect( pendingRequests ).toHaveLength( 2 );
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'error handling', () => {
		it( 'retries with backoff after a network error', async () => {
			const onStatusChange = jest.fn();
			registerTestRoom( { onStatusChange } );

			pendingRequests[ 0 ].reject( new Error( 'network down' ) );
			await jest.advanceTimersByTimeAsync( 0 );

			expect( onStatusChange ).toHaveBeenCalledWith(
				expect.objectContaining( {
					status: 'disconnected',
					canManuallyRetry: true,
					consecutiveFailures: 1,
				} )
			);

			// First solo retry delay is 2000ms.
			await jest.advanceTimersByTimeAsync( 2000 );
			expect( pendingRequests ).toHaveLength( 2 );
		} );

		it( 'stops the loop after a protocol mismatch', async () => {
			const onStatusChange = jest.fn();
			registerTestRoom( { onStatusChange } );

			pendingRequests[ 0 ].reject( {
				code: 'rest_sync_protocol_mismatch',
			} );
			await jest.advanceTimersByTimeAsync( 0 );

			expect( onStatusChange ).toHaveBeenCalledWith( {
				status: 'disconnected',
				error: expect.objectContaining( {
					code: 'protocol-mismatch',
				} ),
			} );

			await jest.advanceTimersByTimeAsync( 60000 );
			expect( pendingRequests ).toHaveLength( 1 );
		} );

		it( 'silently unregisters forbidden rooms on a 403', async () => {
			const onStatusChange = jest.fn();
			registerTestRoom( { onStatusChange } );

			pendingRequests[ 0 ].reject( {
				code: 'rest_cannot_edit',
				data: { status: 403, rooms: [ 'test-room' ] },
			} );
			await jest.advanceTimersByTimeAsync( 0 );

			expect( onStatusChange ).not.toHaveBeenCalledWith(
				expect.objectContaining( {
					error: expect.anything(),
				} )
			);

			// The loop stops because no rooms remain.
			await jest.advanceTimersByTimeAsync( 60000 );
			expect( pendingRequests ).toHaveLength( 1 );
		} );
	} );
} );
