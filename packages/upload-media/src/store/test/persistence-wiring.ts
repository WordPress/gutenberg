/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as uploadStore } from '../';
import { unlock } from '../../lock-unlock';
import { getAllItems } from '../utils/persistence';
import { buildIndexedDBMock } from '../utils/test/fixtures/build-idb-mock';

jest.mock( '@wordpress/blob', () => ( {
	__esModule: true,
	createBlobURL: jest.fn( () => 'blob:foo' ),
	isBlobURL: jest.fn( ( str: string ) => str.startsWith( 'blob:' ) ),
	revokeBlobURL: jest.fn(),
} ) );

function flush() {
	return new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
}

describe( 'persistence wiring', () => {
	let registry: any;

	beforeEach( () => {
		( globalThis as any ).indexedDB = buildIndexedDBMock();
		registry = createRegistry();
		// @ts-ignore
		registry.register( uploadStore );
		unlock( registry.dispatch( uploadStore ) ).pauseQueue();
	} );

	it( 'persists an item with its uploadId when added', async () => {
		const file = new File( [ 'x' ], 'a.jpg', { type: 'image/jpeg' } );
		await unlock( registry.dispatch( uploadStore ) ).addItem( {
			file,
			uploadId: 'upload-xyz',
			postId: 42,
		} );
		await flush();

		const persisted = await getAllItems();
		expect( persisted ).toHaveLength( 1 );
		expect( persisted[ 0 ].uploadId ).toBe( 'upload-xyz' );
		expect( persisted[ 0 ].postId ).toBe( 42 );
	} );

	it( 'addItems forwards uploadId and postId onto the queue item', async () => {
		const file = new File( [ 'x' ], 'a.jpg', { type: 'image/jpeg' } );
		registry.dispatch( uploadStore ).addItems( {
			files: [ file ],
			uploadId: 'u-batch',
			postId: 7,
		} );
		await flush();

		const [ item ] = unlock( registry.select( uploadStore ) ).getAllItems();
		expect( item.uploadId ).toBe( 'u-batch' );
		expect( item.postId ).toBe( 7 );
	} );

	it( 'deletes the persisted item when removed', async () => {
		const file = new File( [ 'x' ], 'a.jpg', { type: 'image/jpeg' } );
		await unlock( registry.dispatch( uploadStore ) ).addItem( {
			file,
			uploadId: 'upload-xyz',
		} );
		await flush();
		const [ item ] = unlock( registry.select( uploadStore ) ).getAllItems();

		await unlock( registry.dispatch( uploadStore ) ).removeItem( item.id );
		await flush();
		expect( await getAllItems() ).toHaveLength( 0 );
	} );
} );
