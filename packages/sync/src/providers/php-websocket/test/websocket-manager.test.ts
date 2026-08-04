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

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '../../http-polling/utils', () => ( {
	...( jest.requireActual( '../../http-polling/utils' ) as object ),
	postSyncUpdate: jest.fn(),
	postSyncUpdateNonBlocking: jest.fn(),
} ) );

interface WebSocketSyncManager {
	registerRoom: ( options: {
		room: string;
		doc: unknown;
		awareness: unknown;
		log: () => void;
		onStatusChange: ( status: unknown ) => void;
		onSync: () => void;
	} ) => void;
	retryNow: () => void;
	unregisterRoom: (
		room: string,
		options?: { sendDisconnectSignal?: boolean }
	) => void;
}

type Listener = ( event: unknown ) => void;

class MockWebSocket {
	public static CONNECTING = 0;
	public static OPEN = 1;
	public static CLOSING = 2;
	public static CLOSED = 3;
	public static instances: MockWebSocket[] = [];

	public readyState = MockWebSocket.CONNECTING;
	public sent: string[] = [];
	public url: string;
	private listeners: Record< string, Listener[] > = {};

	public constructor( url: string ) {
		this.url = url;
		MockWebSocket.instances.push( this );
	}

	public addEventListener( event: string, callback: Listener ): void {
		if ( ! this.listeners[ event ] ) {
			this.listeners[ event ] = [];
		}
		this.listeners[ event ].push( callback );
	}

	public send( data: string ): void {
		this.sent.push( data );
	}

	public close(): void {
		this.readyState = MockWebSocket.CLOSED;
		this.dispatch( 'close', {} );
	}

	public dispatch( event: string, arg: unknown ): void {
		( this.listeners[ event ] || [] ).forEach( ( callback ) =>
			callback( arg )
		);
	}

	public simulateOpen(): void {
		this.readyState = MockWebSocket.OPEN;
		this.dispatch( 'open', {} );
	}

	public simulateMessage( message: unknown ): void {
		this.dispatch( 'message', { data: JSON.stringify( message ) } );
	}

	public simulateUnexpectedClose(): void {
		this.readyState = MockWebSocket.CLOSED;
		this.dispatch( 'close', {} );
	}

	public getSentMessages(): Array< {
		type: string;
		rooms: Array< {
			room: string;
			client_id: number;
			after: number;
			awareness: unknown;
			updates: Array< { type: string; data: string } >;
		} >;
	} > {
		return this.sent.map( ( data ) => JSON.parse( data ) );
	}
}

function createMockDoc( clientID = 1 ) {
	return { clientID, on: jest.fn(), off: jest.fn() };
}

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

describe( 'websocket-manager', () => {
	let webSocketSyncManager: WebSocketSyncManager;
	let mockApiFetch: jest.Mock< ( options: unknown ) => Promise< unknown > >;
	const originalWebSocket = global.WebSocket;

	beforeEach( () => {
		jest.useFakeTimers();
		MockWebSocket.instances = [];
		( global as any ).WebSocket = MockWebSocket;
		window._wpCollaborationWebSocketUrl = 'ws://localhost:8787';

		jest.isolateModules( () => {
			webSocketSyncManager =
				require( '../websocket-manager' ).webSocketSyncManager;
			mockApiFetch = require( '@wordpress/api-fetch' ).default;
		} );

		mockApiFetch.mockResolvedValue( { token: 'test-token' } );
	} );

	afterEach( () => {
		jest.clearAllTimers();
		jest.useRealTimers();
		( global as any ).WebSocket = originalWebSocket;
		delete window._wpCollaborationWebSocketUrl;
	} );

	function registerTestRoom(
		overrides: Partial< {
			onStatusChange: ( status: unknown ) => void;
			onSync: () => void;
			doc: ReturnType< typeof createMockDoc >;
		} > = {}
	) {
		const doc = overrides.doc ?? createMockDoc( 1 );
		webSocketSyncManager.registerRoom( {
			room: 'postType/post:1',
			doc,
			awareness: createMockAwareness(),
			log: jest.fn(),
			onStatusChange: overrides.onStatusChange ?? jest.fn(),
			onSync: overrides.onSync ?? jest.fn(),
		} );
		return doc;
	}

	async function openConnection() {
		// Let the token fetch resolve and the socket be constructed.
		await jest.advanceTimersByTimeAsync( 0 );
		const ws = MockWebSocket.instances.at( -1 )!;
		ws.simulateOpen();
		return ws;
	}

	describe( 'connection', () => {
		it( 'mints a token and includes it in the WebSocket URL', async () => {
			registerTestRoom();
			await jest.advanceTimersByTimeAsync( 0 );

			expect( mockApiFetch ).toHaveBeenCalledWith( {
				method: 'POST',
				path: '/wp-sync/v1/ws-token',
			} );

			expect( MockWebSocket.instances ).toHaveLength( 1 );
			expect( MockWebSocket.instances[ 0 ].url ).toBe(
				'ws://localhost:8787?token=test-token'
			);
		} );

		it( 'sends the initial room sync on open and emits connected', async () => {
			const onStatusChange = jest.fn();
			registerTestRoom( { onStatusChange } );

			const ws = await openConnection();

			expect( onStatusChange ).toHaveBeenCalledWith( {
				status: 'connected',
			} );

			const messages = ws.getSentMessages();
			expect( messages ).toHaveLength( 1 );
			expect( messages[ 0 ].type ).toBe( 'sync' );
			expect( messages[ 0 ].rooms[ 0 ].room ).toBe( 'postType/post:1' );
			expect( messages[ 0 ].rooms[ 0 ].client_id ).toBe( 1 );
		} );
	} );

	describe( 'message handling', () => {
		it( 'responds to a sync_step1 from a collaborator with a sync_step2', async () => {
			registerTestRoom();
			const ws = await openConnection();
			ws.sent = [];

			// A collaborator's presence resumes the queue; their sync_step1
			// requires a sync_step2 response.
			ws.simulateMessage( {
				type: 'sync',
				rooms: [
					{
						room: 'postType/post:1',
						end_cursor: 5,
						awareness: { 1: {}, 2: {} },
						updates: [ { type: 'sync_step1', data: 'AA==' } ],
					},
				],
			} );

			// Flush the send debounce.
			await jest.advanceTimersByTimeAsync( 100 );

			const messages = ws.getSentMessages();
			expect( messages.length ).toBeGreaterThan( 0 );

			const sentUpdates = messages.flatMap( ( message ) =>
				message.rooms.flatMap( ( room ) => room.updates )
			);
			const sentTypes = sentUpdates.map( ( update ) => update.type );
			expect( sentTypes ).toContain( 'sync_step2' );
			// The queued initial sync_step1 is also flushed once resumed.
			expect( sentTypes ).toContain( 'sync_step1' );
		} );

		it( 'advances the cursor from end_cursor and uses it in later sends', async () => {
			const doc = registerTestRoom();
			const ws = await openConnection();

			ws.simulateMessage( {
				type: 'sync',
				rooms: [
					{
						room: 'postType/post:1',
						end_cursor: 42,
						awareness: { 1: {}, 2: {} },
						updates: [],
					},
				],
			} );

			ws.sent = [];
			getOnDocUpdate( doc )( new Uint8Array( [ 1 ] ), 'user' );
			await jest.advanceTimersByTimeAsync( 100 );

			const messages = ws.getSentMessages();
			expect( messages ).toHaveLength( 1 );
			expect( messages[ 0 ].rooms[ 0 ].after ).toBe( 42 );
		} );

		it( 'queues local updates and flushes them over the socket', async () => {
			const doc = registerTestRoom();
			const ws = await openConnection();

			// Resume the queue with a collaborator.
			ws.simulateMessage( {
				type: 'sync',
				rooms: [
					{
						room: 'postType/post:1',
						end_cursor: 1,
						awareness: { 1: {}, 2: {} },
						updates: [],
					},
				],
			} );
			await jest.advanceTimersByTimeAsync( 100 );
			ws.sent = [];

			getOnDocUpdate( doc )( new Uint8Array( [ 1, 2, 3 ] ), 'user' );
			getOnDocUpdate( doc )( new Uint8Array( [ 4, 5, 6 ] ), 'user' );
			await jest.advanceTimersByTimeAsync( 100 );

			// Both updates are batched into a single frame.
			const messages = ws.getSentMessages();
			expect( messages ).toHaveLength( 1 );
			expect(
				messages[ 0 ].rooms[ 0 ].updates.filter(
					( update ) => update.type === 'update'
				)
			).toHaveLength( 2 );
		} );

		it( 'unregisters rooms listed in an error message', async () => {
			registerTestRoom();
			const ws = await openConnection();

			ws.simulateMessage( {
				type: 'error',
				code: 'rest_cannot_edit',
				message: 'Nope',
				rooms: [ 'postType/post:1' ],
			} );

			ws.sent = [];

			// Later messages for the room are ignored (room unregistered).
			ws.simulateMessage( {
				type: 'sync',
				rooms: [
					{
						room: 'postType/post:1',
						end_cursor: 9,
						awareness: { 1: {}, 2: {} },
						updates: [ { type: 'sync_step1', data: 'AA==' } ],
					},
				],
			} );
			await jest.advanceTimersByTimeAsync( 100 );

			expect( ws.getSentMessages() ).toHaveLength( 0 );
		} );
	} );

	describe( 'reconnection', () => {
		it( 'reconnects with a fresh token after an unexpected close', async () => {
			const onStatusChange = jest.fn();
			registerTestRoom( { onStatusChange } );
			const ws = await openConnection();

			mockApiFetch.mockClear();
			mockApiFetch.mockResolvedValue( { token: 'fresh-token' } );

			ws.simulateUnexpectedClose();

			expect( onStatusChange ).toHaveBeenCalledWith(
				expect.objectContaining( {
					status: 'disconnected',
					canManuallyRetry: true,
					consecutiveFailures: 1,
				} )
			);

			// First solo retry delay is 2000ms.
			await jest.advanceTimersByTimeAsync( 2000 );

			expect( mockApiFetch ).toHaveBeenCalledWith( {
				method: 'POST',
				path: '/wp-sync/v1/ws-token',
			} );
			expect( MockWebSocket.instances ).toHaveLength( 2 );
			expect( MockWebSocket.instances[ 1 ].url ).toBe(
				'ws://localhost:8787?token=fresh-token'
			);

			// The new connection re-announces the room on open.
			MockWebSocket.instances[ 1 ].simulateOpen();
			const messages = MockWebSocket.instances[ 1 ].getSentMessages();
			expect( messages ).toHaveLength( 1 );
			expect( messages[ 0 ].rooms[ 0 ].room ).toBe( 'postType/post:1' );
		} );

		it( 'retries again with backoff when the token fetch fails', async () => {
			const onStatusChange = jest.fn();
			registerTestRoom( { onStatusChange } );
			const ws = await openConnection();

			mockApiFetch.mockRejectedValue( new Error( 'network down' ) );
			ws.simulateUnexpectedClose();

			// First retry (2000ms) fails at the token fetch.
			await jest.advanceTimersByTimeAsync( 2000 );
			expect( MockWebSocket.instances ).toHaveLength( 1 );

			// Second retry succeeds.
			mockApiFetch.mockResolvedValue( { token: 'token-2' } );
			await jest.advanceTimersByTimeAsync( 4000 );
			expect( MockWebSocket.instances ).toHaveLength( 2 );
		} );
	} );

	describe( 'disconnect', () => {
		it( 'sends a null-awareness disconnect and closes the socket on unregister', async () => {
			registerTestRoom();
			const ws = await openConnection();
			ws.sent = [];

			webSocketSyncManager.unregisterRoom( 'postType/post:1' );

			const messages = ws.getSentMessages();
			expect( messages ).toHaveLength( 1 );
			expect( messages[ 0 ].rooms[ 0 ].awareness ).toBeNull();
			expect( ws.readyState ).toBe( MockWebSocket.CLOSED );

			// The deliberate close does not trigger a reconnect.
			await jest.advanceTimersByTimeAsync( 60000 );
			expect( MockWebSocket.instances ).toHaveLength( 1 );
		} );
	} );
} );
