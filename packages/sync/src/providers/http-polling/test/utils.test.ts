/**
 * External dependencies
 */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

// Mock @wordpress/api-fetch
jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { SyncUpdateType } from '../types';
import {
	base64ToUint8Array,
	createSyncUpdate,
	createUpdateQueue,
	postSyncUpdate,
	uint8ArrayToBase64,
} from '../utils';

const mockApiFetch = jest.mocked( apiFetch );

describe( 'http-polling utils', () => {
	describe( 'SyncUpdateType', () => {
		it( 'has the expected enum values', () => {
			expect( SyncUpdateType.COMPACTION ).toBe( 'compaction' );
			expect( SyncUpdateType.SYNC_STEP_1 ).toBe( 'sync_step1' );
			expect( SyncUpdateType.SYNC_STEP_2 ).toBe( 'sync_step2' );
			expect( SyncUpdateType.UPDATE ).toBe( 'update' );
		} );
	} );

	describe( 'uint8ArrayToBase64', () => {
		it( 'converts an empty array', () => {
			const input = new Uint8Array( [] );
			const result = uint8ArrayToBase64( input );

			expect( result ).toBe( '' );
		} );

		it( 'converts a simple byte array', () => {
			// "Hello" in ASCII
			const input = new Uint8Array( [ 72, 101, 108, 108, 111 ] );
			const result = uint8ArrayToBase64( input );

			expect( result ).toBe( 'SGVsbG8=' );
		} );

		it( 'converts binary data with all byte values', () => {
			const input = new Uint8Array( [ 0, 127, 128, 255 ] );
			const result = uint8ArrayToBase64( input );

			// Verify round-trip
			const decoded = base64ToUint8Array( result );
			expect( decoded ).toEqual( input );
		} );

		it( 'handles large arrays', () => {
			const input = new Uint8Array( 1000 );
			for ( let i = 0; i < 1000; i++ ) {
				input[ i ] = i % 256;
			}

			const result = uint8ArrayToBase64( input );
			const decoded = base64ToUint8Array( result );

			expect( decoded ).toEqual( input );
		} );
	} );

	describe( 'base64ToUint8Array', () => {
		it( 'converts an empty string', () => {
			const result = base64ToUint8Array( '' );

			expect( result ).toEqual( new Uint8Array( [] ) );
		} );

		it( 'converts a simple base64 string', () => {
			// "SGVsbG8=" is "Hello" in base64
			const result = base64ToUint8Array( 'SGVsbG8=' );

			expect( result ).toEqual(
				new Uint8Array( [ 72, 101, 108, 108, 111 ] )
			);
		} );

		it( 'handles base64 without padding', () => {
			// Some base64 implementations omit padding
			const withPadding = base64ToUint8Array( 'YQ==' );
			const withoutPadding = base64ToUint8Array( 'YQ' );

			expect( withPadding ).toEqual( new Uint8Array( [ 97 ] ) ); // 'a'
			expect( withoutPadding ).toEqual( new Uint8Array( [ 97 ] ) );
		} );
	} );

	describe( 'base64 round-trip', () => {
		it( 'maintains data integrity through encode/decode cycle', () => {
			const testCases = [
				new Uint8Array( [] ),
				new Uint8Array( [ 0 ] ),
				new Uint8Array( [ 255 ] ),
				new Uint8Array( [ 1, 2, 3, 4, 5 ] ),
				new Uint8Array( [ 0, 0, 0, 0 ] ),
				new Uint8Array( [ 255, 255, 255, 255 ] ),
			];

			for ( const original of testCases ) {
				const encoded = uint8ArrayToBase64( original );
				const decoded = base64ToUint8Array( encoded );
				expect( decoded ).toEqual( original );
			}
		} );

		it( 'handles random binary data', () => {
			const original = new Uint8Array( 256 );
			for ( let i = 0; i < 256; i++ ) {
				original[ i ] = i;
			}

			const encoded = uint8ArrayToBase64( original );
			const decoded = base64ToUint8Array( encoded );

			expect( decoded ).toEqual( original );
		} );
	} );

	describe( 'createSyncUpdate', () => {
		it( 'creates a typed update with UPDATE type', () => {
			const data = new Uint8Array( [ 1, 2, 3 ] );
			const result = createSyncUpdate( data, SyncUpdateType.UPDATE );

			expect( result.type ).toBe( SyncUpdateType.UPDATE );
			expect( result.data ).toBe( uint8ArrayToBase64( data ) );
		} );

		it( 'creates a typed update with COMPACTION type', () => {
			const data = new Uint8Array( [ 4, 5, 6 ] );
			const result = createSyncUpdate( data, SyncUpdateType.COMPACTION );

			expect( result.type ).toBe( SyncUpdateType.COMPACTION );
			expect( result.data ).toBe( uint8ArrayToBase64( data ) );
		} );

		it( 'creates a typed update with SYNC_STEP_1 type', () => {
			const data = new Uint8Array( [ 7, 8, 9 ] );
			const result = createSyncUpdate( data, SyncUpdateType.SYNC_STEP_1 );

			expect( result.type ).toBe( SyncUpdateType.SYNC_STEP_1 );
			expect( result.data ).toBe( uint8ArrayToBase64( data ) );
		} );

		it( 'creates a typed update with SYNC_STEP_2 type', () => {
			const data = new Uint8Array( [ 10, 11, 12 ] );
			const result = createSyncUpdate( data, SyncUpdateType.SYNC_STEP_2 );

			expect( result.type ).toBe( SyncUpdateType.SYNC_STEP_2 );
			expect( result.data ).toBe( uint8ArrayToBase64( data ) );
		} );

		it( 'handles empty data', () => {
			const data = new Uint8Array( [] );
			const result = createSyncUpdate( data, SyncUpdateType.UPDATE );

			expect( result.type ).toBe( SyncUpdateType.UPDATE );
			expect( result.data ).toBe( '' );
		} );
	} );

	describe( 'createUpdateQueue', () => {
		describe( 'initialization', () => {
			it( 'creates an empty queue by default', () => {
				const queue = createUpdateQueue();

				expect( queue.size() ).toBe( 0 );
			} );

			it( 'creates a queue with initial updates', () => {
				const initial = [
					createSyncUpdate(
						new Uint8Array( [ 1 ] ),
						SyncUpdateType.UPDATE
					),
					createSyncUpdate(
						new Uint8Array( [ 2 ] ),
						SyncUpdateType.UPDATE
					),
				];

				const queue = createUpdateQueue( initial );

				expect( queue.size() ).toBe( 2 );
			} );

			it( 'creates a paused queue by default', () => {
				const queue = createUpdateQueue();
				queue.add(
					createSyncUpdate(
						new Uint8Array( [ 1 ] ),
						SyncUpdateType.UPDATE
					)
				);

				// get() returns empty when paused
				expect( queue.get() ).toEqual( [] );
				expect( queue.size() ).toBe( 1 ); // still has the update
			} );

			it( 'can create an unpaused queue', () => {
				const queue = createUpdateQueue( [], false );
				queue.add(
					createSyncUpdate(
						new Uint8Array( [ 1 ] ),
						SyncUpdateType.UPDATE
					)
				);

				expect( queue.get() ).toHaveLength( 1 );
			} );

			it( 'does not modify the initial array', () => {
				const initial = [
					createSyncUpdate(
						new Uint8Array( [ 1 ] ),
						SyncUpdateType.UPDATE
					),
				];
				const initialCopy = [ ...initial ];

				const queue = createUpdateQueue( initial );
				queue.add(
					createSyncUpdate(
						new Uint8Array( [ 2 ] ),
						SyncUpdateType.UPDATE
					)
				);

				expect( initial ).toEqual( initialCopy );
			} );
		} );

		describe( 'add', () => {
			it( 'adds a single update to the queue', () => {
				const queue = createUpdateQueue();
				const update = createSyncUpdate(
					new Uint8Array( [ 1 ] ),
					SyncUpdateType.UPDATE
				);

				queue.add( update );

				expect( queue.size() ).toBe( 1 );
			} );

			it( 'adds multiple updates in order', () => {
				const queue = createUpdateQueue( [], false );
				const update1 = createSyncUpdate(
					new Uint8Array( [ 1 ] ),
					SyncUpdateType.UPDATE
				);
				const update2 = createSyncUpdate(
					new Uint8Array( [ 2 ] ),
					SyncUpdateType.UPDATE
				);

				queue.add( update1 );
				queue.add( update2 );

				const result = queue.get();
				expect( result ).toHaveLength( 2 );
				expect( result[ 0 ] ).toEqual( update1 );
				expect( result[ 1 ] ).toEqual( update2 );
			} );
		} );

		describe( 'addBulk', () => {
			it( 'adds multiple updates at once', () => {
				const queue = createUpdateQueue();
				const updates = [
					createSyncUpdate(
						new Uint8Array( [ 1 ] ),
						SyncUpdateType.UPDATE
					),
					createSyncUpdate(
						new Uint8Array( [ 2 ] ),
						SyncUpdateType.UPDATE
					),
					createSyncUpdate(
						new Uint8Array( [ 3 ] ),
						SyncUpdateType.UPDATE
					),
				];

				queue.addBulk( updates );

				expect( queue.size() ).toBe( 3 );
			} );

			it( 'handles empty array', () => {
				const queue = createUpdateQueue();

				queue.addBulk( [] );

				expect( queue.size() ).toBe( 0 );
			} );

			it( 'appends to existing updates', () => {
				const queue = createUpdateQueue();
				const existing = createSyncUpdate(
					new Uint8Array( [ 0 ] ),
					SyncUpdateType.UPDATE
				);
				const newUpdates = [
					createSyncUpdate(
						new Uint8Array( [ 1 ] ),
						SyncUpdateType.UPDATE
					),
					createSyncUpdate(
						new Uint8Array( [ 2 ] ),
						SyncUpdateType.UPDATE
					),
				];

				queue.add( existing );
				queue.addBulk( newUpdates );

				expect( queue.size() ).toBe( 3 );
			} );
		} );

		describe( 'get', () => {
			it( 'returns empty array when paused', () => {
				const queue = createUpdateQueue();
				const update = createSyncUpdate(
					new Uint8Array( [ 1 ] ),
					SyncUpdateType.UPDATE
				);

				queue.add( update );
				const result = queue.get();

				expect( result ).toEqual( [] );
				expect( queue.size() ).toBe( 1 ); // update still in queue
			} );

			it( 'returns and clears the queue when not paused', () => {
				const queue = createUpdateQueue( [], false );
				const update = createSyncUpdate(
					new Uint8Array( [ 1 ] ),
					SyncUpdateType.UPDATE
				);

				queue.add( update );
				const result = queue.get();

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toEqual( update );
				expect( queue.size() ).toBe( 0 );
				expect( queue.get() ).toEqual( [] );
			} );

			it( 'returns updates in FIFO order', () => {
				const queue = createUpdateQueue( [], false );
				const updates = [
					createSyncUpdate(
						new Uint8Array( [ 1 ] ),
						SyncUpdateType.SYNC_STEP_1
					),
					createSyncUpdate(
						new Uint8Array( [ 2 ] ),
						SyncUpdateType.UPDATE
					),
					createSyncUpdate(
						new Uint8Array( [ 3 ] ),
						SyncUpdateType.COMPACTION
					),
				];

				updates.forEach( ( u ) => queue.add( u ) );
				const result = queue.get();

				expect( result ).toEqual( updates );
			} );
		} );

		describe( 'clear', () => {
			it( 'removes all updates from the queue', () => {
				const queue = createUpdateQueue();
				queue.add(
					createSyncUpdate(
						new Uint8Array( [ 1 ] ),
						SyncUpdateType.UPDATE
					)
				);
				queue.add(
					createSyncUpdate(
						new Uint8Array( [ 2 ] ),
						SyncUpdateType.UPDATE
					)
				);

				expect( queue.size() ).toBe( 2 );
				queue.clear();
				expect( queue.size() ).toBe( 0 );
			} );
		} );

		describe( 'pause and resume', () => {
			it( 'pause prevents get from returning updates', () => {
				const queue = createUpdateQueue( [], false );
				queue.add(
					createSyncUpdate(
						new Uint8Array( [ 1 ] ),
						SyncUpdateType.UPDATE
					)
				);

				expect( queue.get() ).toHaveLength( 1 );

				queue.add(
					createSyncUpdate(
						new Uint8Array( [ 2 ] ),
						SyncUpdateType.UPDATE
					)
				);
				queue.pause();

				expect( queue.get() ).toEqual( [] );
				expect( queue.size() ).toBe( 1 );
			} );

			it( 'resume allows get to return updates', () => {
				const queue = createUpdateQueue(); // paused by default
				queue.add(
					createSyncUpdate(
						new Uint8Array( [ 1 ] ),
						SyncUpdateType.UPDATE
					)
				);

				expect( queue.get() ).toEqual( [] );

				queue.resume();
				const result = queue.get();

				expect( result ).toHaveLength( 1 );
			} );
		} );

		describe( 'restore', () => {
			it( 'restores updates to the front of the queue', () => {
				const queue = createUpdateQueue( [], false );
				const existing = createSyncUpdate(
					new Uint8Array( [ 2 ] ),
					SyncUpdateType.UPDATE
				);
				const toRestore = [
					createSyncUpdate(
						new Uint8Array( [ 1 ] ),
						SyncUpdateType.UPDATE
					),
				];

				queue.add( existing );
				queue.restore( toRestore );

				const result = queue.get();
				expect( result[ 0 ] ).toEqual( toRestore[ 0 ] );
				expect( result[ 1 ] ).toEqual( existing );
			} );

			it( 'filters out compaction updates', () => {
				const queue = createUpdateQueue( [], false );
				const toRestore = [
					createSyncUpdate(
						new Uint8Array( [ 1 ] ),
						SyncUpdateType.UPDATE
					),
					createSyncUpdate(
						new Uint8Array( [ 2 ] ),
						SyncUpdateType.COMPACTION
					),
					createSyncUpdate(
						new Uint8Array( [ 3 ] ),
						SyncUpdateType.UPDATE
					),
				];

				queue.restore( toRestore );

				const result = queue.get();
				expect( result ).toHaveLength( 2 );
				expect( result[ 0 ].type ).toBe( SyncUpdateType.UPDATE );
				expect( result[ 1 ].type ).toBe( SyncUpdateType.UPDATE );
			} );

			it( 'handles empty restore array', () => {
				const queue = createUpdateQueue();
				const existing = createSyncUpdate(
					new Uint8Array( [ 1 ] ),
					SyncUpdateType.UPDATE
				);

				queue.add( existing );
				queue.restore( [] );

				expect( queue.size() ).toBe( 1 );
			} );

			it( 'handles restore array with only compaction updates', () => {
				const queue = createUpdateQueue();
				const existing = createSyncUpdate(
					new Uint8Array( [ 1 ] ),
					SyncUpdateType.UPDATE
				);
				const toRestore = [
					createSyncUpdate(
						new Uint8Array( [ 2 ] ),
						SyncUpdateType.COMPACTION
					),
				];

				queue.add( existing );
				queue.restore( toRestore );

				// Only the existing update should remain
				expect( queue.size() ).toBe( 1 );
			} );
		} );

		describe( 'size', () => {
			it( 'returns 0 for empty queue', () => {
				const queue = createUpdateQueue();

				expect( queue.size() ).toBe( 0 );
			} );

			it( 'returns correct size after operations', () => {
				const queue = createUpdateQueue( [], false );
				const update = createSyncUpdate(
					new Uint8Array( [ 1 ] ),
					SyncUpdateType.UPDATE
				);

				expect( queue.size() ).toBe( 0 );

				queue.add( update );
				expect( queue.size() ).toBe( 1 );

				queue.add( update );
				expect( queue.size() ).toBe( 2 );

				queue.get();
				expect( queue.size() ).toBe( 0 );
			} );
		} );
	} );

	describe( 'postSyncUpdate', () => {
		beforeEach( () => {
			jest.clearAllMocks();
		} );

		it( 'sends a POST request to the sync endpoint', async () => {
			const mockResponse = {
				ok: true,
				json: jest.fn().mockResolvedValue( {
					rooms: [],
				} as never ),
			};
			mockApiFetch.mockResolvedValue( mockResponse );

			const payload = {
				rooms: [
					{
						after: 0,
						awareness: {},
						client_id: 123,
						room: 'test-room',
						updates: [],
					},
				],
			};

			await postSyncUpdate( payload );

			expect( mockApiFetch ).toHaveBeenCalledWith( {
				body: JSON.stringify( payload ),
				headers: {
					'Content-Type': 'application/json',
				},
				method: 'POST',
				parse: false,
				path: '/wp/v2/sync/updates',
			} );
		} );

		it( 'returns the parsed response', async () => {
			const expectedResponse = {
				rooms: [
					{
						awareness: {},
						end_cursor: 1000,
						room: 'test-room',
						updates: [],
					},
				],
			};
			const mockResponse = {
				ok: true,
				json: jest.fn().mockResolvedValue( expectedResponse as never ),
			};
			mockApiFetch.mockResolvedValue( mockResponse );

			const result = await postSyncUpdate( { rooms: [] } );

			expect( result ).toEqual( expectedResponse );
		} );

		it( 'throws an error when response is not ok', async () => {
			const mockResponse = {
				ok: false,
				status: 500,
			};
			mockApiFetch.mockResolvedValue( mockResponse as never );

			await expect( postSyncUpdate( { rooms: [] } ) ).rejects.toThrow(
				'Sync update failed with status 500'
			);
		} );

		it( 'throws an error for 401 status', async () => {
			const mockResponse = {
				ok: false,
				status: 401,
			};
			mockApiFetch.mockResolvedValue( mockResponse as never );

			await expect( postSyncUpdate( { rooms: [] } ) ).rejects.toThrow(
				'Sync update failed with status 401'
			);
		} );

		it( 'propagates network errors', async () => {
			mockApiFetch.mockRejectedValue( new Error( 'Network error' ) );

			await expect( postSyncUpdate( { rooms: [] } ) ).rejects.toThrow(
				'Network error'
			);
		} );
	} );
} );
