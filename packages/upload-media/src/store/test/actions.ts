/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';

type WPDataRegistry = ReturnType< typeof createRegistry >;

/**
 * Internal dependencies
 */
import { store as uploadStore } from '..';
import { ItemStatus, OperationType } from '../types';
import { unlock } from '../../lock-unlock';

jest.mock( '@wordpress/blob', () => ( {
	__esModule: true,
	createBlobURL: jest.fn( () => 'blob:foo' ),
	isBlobURL: jest.fn( ( str: string ) => str.startsWith( 'blob:' ) ),
	revokeBlobURL: jest.fn(),
} ) );

jest.mock( '../utils', () => ( {
	vipsCancelOperations: jest.fn( () => Promise.resolve( true ) ),
	vipsResizeImage: jest.fn(),
	terminateVipsWorker: jest.fn(),
} ) );

// Import the mocked module to access the mock function.
import { vipsCancelOperations } from '../utils';

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

	describe( 'addSideloadItem', () => {
		it( 'adds a sideload item with parent ID', () => {
			// Add parent item first.
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );
			const parentItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			unlock( registry.dispatch( uploadStore ) ).addSideloadItem( {
				file: jpegFile,
				parentId: parentItem.id,
				additionalData: { post: 123, image_size: 'thumbnail' },
			} );

			const items = unlock(
				registry.select( uploadStore )
			).getAllItems();
			expect( items ).toHaveLength( 2 );
			expect( items[ 1 ].parentId ).toBe( parentItem.id );
			expect( items[ 1 ].additionalData ).toEqual(
				expect.objectContaining( {
					post: 123,
					image_size: 'thumbnail',
				} )
			);
		} );

		it( 'adds a sideload item with custom operations', () => {
			unlock( registry.dispatch( uploadStore ) ).addSideloadItem( {
				file: jpegFile,
				additionalData: { post: 456, image_size: 'medium' },
			} );

			const items = unlock(
				registry.select( uploadStore )
			).getAllItems();
			expect( items ).toHaveLength( 1 );
			expect( items[ 0 ].status ).toBe( ItemStatus.Processing );
		} );
	} );

	describe( 'prepareItem', () => {
		it( 'should add Upload and ThumbnailGeneration for vips-supported image types', async () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );

			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			// Manually call prepareItem to determine operations.
			await unlock( registry.dispatch( uploadStore ) ).prepareItem(
				item.id
			);

			const updatedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			// Should include Upload and ThumbnailGeneration (no ResizeCrop without bigImageSizeThreshold).
			expect( updatedItem.operations ).toEqual(
				expect.arrayContaining( [
					OperationType.Upload,
					OperationType.ThumbnailGeneration,
				] )
			);
			// Server should not generate sub-sizes for vips-supported images.
			expect( updatedItem.additionalData.generate_sub_sizes ).toBe(
				false
			);
		} );

		it( 'should add only Upload for non-image types', async () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: mp4File,
			} );

			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			await unlock( registry.dispatch( uploadStore ) ).prepareItem(
				item.id
			);

			const updatedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			expect( updatedItem.operations ).toEqual(
				expect.arrayContaining( [ OperationType.Upload ] )
			);
			expect( updatedItem.operations ).not.toEqual(
				expect.arrayContaining( [ OperationType.ThumbnailGeneration ] )
			);
			// Server should generate sub-sizes for non-vips files.
			expect( updatedItem.additionalData.generate_sub_sizes ).toBe(
				true
			);
		} );

		it( 'should add only Upload for unsupported image types like SVG', async () => {
			const svgFile = new File( [ '<svg></svg>' ], 'test.svg', {
				lastModified: 1234567891,
				type: 'image/svg+xml',
			} );

			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: svgFile,
			} );

			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			await unlock( registry.dispatch( uploadStore ) ).prepareItem(
				item.id
			);

			const updatedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			expect( updatedItem.operations ).toEqual(
				expect.arrayContaining( [ OperationType.Upload ] )
			);
			expect( updatedItem.operations ).not.toEqual(
				expect.arrayContaining( [ OperationType.ThumbnailGeneration ] )
			);
			expect( updatedItem.additionalData.generate_sub_sizes ).toBe(
				true
			);
		} );

		it( 'should add only Upload for unsupported image types like BMP', async () => {
			const bmpFile = new File( [ 'bmp' ], 'test.bmp', {
				lastModified: 1234567891,
				type: 'image/bmp',
			} );

			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: bmpFile,
			} );

			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			await unlock( registry.dispatch( uploadStore ) ).prepareItem(
				item.id
			);

			const updatedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			expect( updatedItem.operations ).toEqual(
				expect.arrayContaining( [ OperationType.Upload ] )
			);
			expect( updatedItem.operations ).not.toEqual(
				expect.arrayContaining( [ OperationType.ThumbnailGeneration ] )
			);
			expect( updatedItem.additionalData.generate_sub_sizes ).toBe(
				true
			);
		} );

		it( 'should add only Upload for PDF files', async () => {
			const pdfFile = new File( [ 'pdf' ], 'document.pdf', {
				lastModified: 1234567891,
				type: 'application/pdf',
			} );

			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: pdfFile,
			} );

			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			await unlock( registry.dispatch( uploadStore ) ).prepareItem(
				item.id
			);

			const updatedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			expect( updatedItem.operations ).toEqual(
				expect.arrayContaining( [ OperationType.Upload ] )
			);
			expect( updatedItem.operations ).not.toEqual(
				expect.arrayContaining( [ OperationType.ThumbnailGeneration ] )
			);
			expect( updatedItem.additionalData.generate_sub_sizes ).toBe(
				true
			);
		} );
	} );

	describe( 'cancelItem', () => {
		beforeEach( () => {
			( vipsCancelOperations as jest.Mock ).mockClear();
		} );

		it( 'calls vipsCancelOperations when cancelling', async () => {
			// Suppress console.error that fires when there's no onError callback.
			const consoleErrorSpy = jest
				.spyOn( console, 'error' )
				.mockImplementation( () => {} );

			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			await registry
				.dispatch( uploadStore )
				.cancelItem( item.id, new Error( 'User cancelled' ) );

			expect( vipsCancelOperations ).toHaveBeenCalledWith( item.id );
			expect( consoleErrorSpy ).toHaveBeenCalled();

			consoleErrorSpy.mockRestore();
		} );

		it( 'removes item from queue after cancelling', async () => {
			// Suppress console.error that fires when there's no onError callback.
			const consoleErrorSpy = jest
				.spyOn( console, 'error' )
				.mockImplementation( () => {} );

			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			await registry
				.dispatch( uploadStore )
				.cancelItem( item.id, new Error( 'User cancelled' ) );

			expect(
				unlock( registry.select( uploadStore ) ).getAllItems()
			).toHaveLength( 0 );

			consoleErrorSpy.mockRestore();
		} );

		it( 'calls onError callback when not silent', async () => {
			const onError = jest.fn();
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
				onError,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			await registry
				.dispatch( uploadStore )
				.cancelItem( item.id, new Error( 'Test error' ) );

			expect( onError ).toHaveBeenCalledWith(
				expect.objectContaining( { message: 'Test error' } )
			);
		} );

		it( 'does not call onError when silent', async () => {
			const onError = jest.fn();
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
				onError,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			await registry
				.dispatch( uploadStore )
				.cancelItem( item.id, new Error( 'Test error' ), true );

			expect( onError ).not.toHaveBeenCalled();
		} );
	} );
} );
