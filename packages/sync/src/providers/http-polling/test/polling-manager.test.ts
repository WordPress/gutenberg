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
import type { SyncResponse } from '../types';

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
	estimateUpdateSizeBytes: jest.fn(
		( update: { data: string } ) => update.data.length
	),
	postSyncUpdate: jest.fn(),
	postSyncUpdateNonBlocking: jest.fn(),
} ) );

interface PollingManager {
	registerRoom: ( options: {
		room: string;
		doc: unknown;
		awareness: unknown;
		log: () => void;
		onStatusChange: ( status: unknown ) => void;
		onSync: () => void;
		sizeLimits?: {
			maxDocumentSizeBytes?: number;
			maxUpdateSizeBytes?: number;
		};
	} ) => void;
	retryNow: () => void;
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

	beforeEach( () => {
		jest.useFakeTimers();

		// Use isolateModules so each test gets fresh module-level state
		// (isPolling, pollingTimeoutId, roomStates, etc.).
		jest.isolateModules( () => {
			pollingManager = require( '../polling-manager' ).pollingManager;
			mockPostSyncUpdate = require( '../utils' ).postSyncUpdate;
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

	describe( 'size limits', () => {
		// Size limit tests need their own isolated modules with custom
		// createSyncUpdate mocks to control the data size.
		function setupWithSizeLimits(
			dataSize: number,
			sizeLimits?: {
				maxDocumentSizeBytes?: number;
				maxUpdateSizeBytes?: number;
			}
		) {
			let mgr!: PollingManager;
			let mockPost!: jest.Mock;

			jest.isolateModules( () => {
				// Override createSyncUpdate to return data of a specific size.
				const utils = require( '../utils' );
				utils.createSyncUpdate.mockImplementation(
					( _data: unknown, type: string ) => ( {
						data: 'x'.repeat( dataSize ),
						type,
					} )
				);
				utils.postSyncUpdate.mockResolvedValue( syncResponse );
				mgr = require( '../polling-manager' ).pollingManager;
				mockPost = utils.postSyncUpdate;
			} );

			const onStatusChange = jest.fn();
			const doc = createMockDoc();

			mgr.registerRoom( {
				room: 'test-room',
				doc,
				awareness: createMockAwareness(),
				log: jest.fn(),
				onStatusChange,
				onSync: jest.fn(),
				sizeLimits,
			} );

			// Get the registered updateV2 handler.
			const onDocUpdate = ( doc.on as jest.Mock ).mock.calls.find(
				( call: unknown[] ) => call[ 0 ] === 'updateV2'
			)?.[ 1 ] as
				| ( ( update: Uint8Array, origin: unknown ) => void )
				| undefined;

			return { onStatusChange, onDocUpdate, mockPost };
		}

		it( 'drops updates exceeding maxUpdateSizeBytes and emits disconnected status', () => {
			const { onStatusChange, onDocUpdate } = setupWithSizeLimits( 200, {
				maxUpdateSizeBytes: 100,
			} );

			expect( onDocUpdate ).toBeDefined();
			onDocUpdate( new Uint8Array( [ 1, 2, 3 ] ), 'some-origin' );

			expect( onStatusChange ).toHaveBeenCalledWith(
				expect.objectContaining( {
					status: 'disconnected',
					error: expect.objectContaining( {
						code: 'document-too-large',
					} ),
				} )
			);
		} );

		it( 'queues updates within maxUpdateSizeBytes normally', () => {
			const { onStatusChange, onDocUpdate } = setupWithSizeLimits( 50, {
				maxUpdateSizeBytes: 100,
			} );

			onDocUpdate( new Uint8Array( [ 1 ] ), 'some-origin' );

			const sizeLimitCalls = onStatusChange.mock.calls.filter(
				( call: unknown[] ) => {
					const status = call[ 0 ] as Record< string, unknown >;
					return (
						status.status === 'disconnected' &&
						( status.error as Record< string, unknown > )?.code ===
							'document-too-large'
					);
				}
			);
			expect( sizeLimitCalls ).toHaveLength( 0 );
		} );

		it( 'allows all updates when no size limits are set', () => {
			const { onStatusChange, onDocUpdate } = setupWithSizeLimits(
				10000
				// No sizeLimits — defaults to Infinity
			);

			onDocUpdate( new Uint8Array( [ 1 ] ), 'some-origin' );

			const sizeLimitCalls = onStatusChange.mock.calls.filter(
				( call: unknown[] ) => {
					const status = call[ 0 ] as Record< string, unknown >;
					return (
						status.status === 'disconnected' &&
						( status.error as Record< string, unknown > )?.code ===
							'document-too-large'
					);
				}
			);
			expect( sizeLimitCalls ).toHaveLength( 0 );
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
