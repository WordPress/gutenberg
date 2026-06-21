/**
 * External dependencies
 */
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

/**
 * Internal dependencies
 */
import {
	isPersistenceAvailable,
	persistItem,
	deleteItem,
	getAllItems,
	clearAll,
	pruneStale,
} from '../persistence';
import { ItemStatus } from '../../types';
import type { PersistedQueueItem } from '../../types';

function makeRecord(
	overrides: Partial< PersistedQueueItem > = {}
): PersistedQueueItem {
	const file = new File( [ 'x'.repeat( 10 ) ], 'image.jpg', {
		type: 'image/jpeg',
	} );
	return {
		id: 'item-1',
		uploadId: 'upload-1',
		file,
		sourceFile: file,
		additionalData: {},
		status: ItemStatus.Processing,
		operations: [ 'UPLOAD' as any ],
		persistedAt: 1000,
		...overrides,
	};
}

describe( 'persistence helper', () => {
	beforeEach( () => {
		// Reset the in-memory IndexedDB between tests.
		( globalThis as any ).indexedDB = new IDBFactory();
	} );

	it( 'reports availability when indexedDB exists', () => {
		expect( isPersistenceAvailable() ).toBe( true );
	} );

	it( 'round-trips a record', async () => {
		await persistItem( makeRecord() );
		const all = await getAllItems();
		expect( all ).toHaveLength( 1 );
		expect( all[ 0 ].uploadId ).toBe( 'upload-1' );
		expect( all[ 0 ].file ).toBeInstanceOf( File );
	} );

	it( 'deletes a record by id', async () => {
		await persistItem( makeRecord() );
		await deleteItem( 'item-1' );
		expect( await getAllItems() ).toHaveLength( 0 );
	} );

	it( 'clears all records', async () => {
		await persistItem( makeRecord( { id: 'a' } ) );
		await persistItem( makeRecord( { id: 'b' } ) );
		await clearAll();
		expect( await getAllItems() ).toHaveLength( 0 );
	} );

	it( 'prunes records older than maxAgeMs', async () => {
		await persistItem( makeRecord( { id: 'old', persistedAt: 0 } ) );
		await persistItem( makeRecord( { id: 'new', persistedAt: 9_000 } ) );
		const survivors = await pruneStale(
			{ maxAgeMs: 5_000 },
			10_000 // now
		);
		expect( survivors.map( ( s ) => s.id ) ).toEqual( [ 'new' ] );
		expect( await getAllItems() ).toHaveLength( 1 );
	} );

	it( 'prunes oldest-first when over the byte budget', async () => {
		const big = () =>
			new File( [ new Uint8Array( 100 ) ], 'b.jpg', {
				type: 'image/jpeg',
			} );
		await persistItem(
			makeRecord( { id: 'oldest', persistedAt: 1, file: big() } )
		);
		await persistItem(
			makeRecord( { id: 'newest', persistedAt: 2, file: big() } )
		);
		const survivors = await pruneStale( { maxBytes: 150 }, 10_000 );
		expect( survivors.map( ( s ) => s.id ) ).toEqual( [ 'newest' ] );
	} );
} );
