/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';

type WPDataRegistry = ReturnType< typeof createRegistry >;

/**
 * Internal dependencies
 */
import { store as uploadStore } from '..';
import { ItemStatus } from '../types';
import { unlock } from '../../lock-unlock';

jest.mock( '@wordpress/blob', () => ( {
	__esModule: true,
	createBlobURL: jest.fn( () => 'blob:foo' ),
	isBlobURL: jest.fn( ( str: string ) => str.startsWith( 'blob:' ) ),
	revokeBlobURL: jest.fn(),
} ) );

function createRegistryWithStores() {
	// Create a registry and register used stores.
	const registry = createRegistry();
	// @ts-ignore
	[ uploadStore ].forEach( registry.register );
	return registry;
}

const jpegFile = new File( [ 'foo' ], 'example.jpg', {
	lastModified: 1234567891,
	type: 'image/jpeg',
} );

const mp4File = new File( [ 'foo' ], 'amazing-video.mp4', {
	lastModified: 1234567891,
	type: 'video/mp4',
} );

describe( 'actions', () => {
	let registry: WPDataRegistry;
	beforeEach( () => {
		registry = createRegistryWithStores();
		unlock( registry.dispatch( uploadStore ) ).pauseQueue();
	} );

	describe( 'addItem', () => {
		it( 'adds an item to the queue', () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );

			expect( registry.select( uploadStore ).getItems() ).toHaveLength(
				1
			);
			expect(
				registry.select( uploadStore ).getItems()[ 0 ]
			).toStrictEqual(
				expect.objectContaining( {
					id: expect.any( String ),
					file: jpegFile,
					sourceFile: jpegFile,
					status: ItemStatus.Processing,
					attachment: {
						url: expect.stringMatching( /^blob:/ ),
					},
				} )
			);
		} );
	} );

	describe( 'addItems', () => {
		it( 'adds multiple items to the queue', () => {
			const onError = jest.fn();
			registry.dispatch( uploadStore ).addItems( {
				files: [ jpegFile, mp4File ],
				onError,
			} );

			expect( onError ).not.toHaveBeenCalled();
			expect( registry.select( uploadStore ).getItems() ).toHaveLength(
				2
			);
			expect(
				registry.select( uploadStore ).getItems()[ 0 ]
			).toStrictEqual(
				expect.objectContaining( {
					id: expect.any( String ),
					file: jpegFile,
					sourceFile: jpegFile,
					status: ItemStatus.Processing,
					attachment: {
						url: expect.stringMatching( /^blob:/ ),
					},
				} )
			);
			expect(
				registry.select( uploadStore ).getItems()[ 1 ]
			).toStrictEqual(
				expect.objectContaining( {
					id: expect.any( String ),
					file: mp4File,
					sourceFile: mp4File,
					status: ItemStatus.Processing,
					attachment: {
						url: expect.stringMatching( /^blob:/ ),
					},
				} )
			);
		} );
	} );
} );
