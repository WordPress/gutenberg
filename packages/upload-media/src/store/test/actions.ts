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
	vipsResizeImage: jest.fn( () =>
		Promise.resolve(
			new File( [ 'resized' ], 'example-100x100.jpg', {
				type: 'image/jpeg',
			} )
		)
	),
	vipsRotateImage: jest.fn(),
	vipsHasTransparency: jest.fn( () => Promise.resolve( false ) ),
	vipsConvertImageFormat: jest.fn(),
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
			// Server should convert formats (e.g. HEIC to JPEG).
			expect( updatedItem.additionalData.convert_format ).toBe( true );
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
			expect( updatedItem.additionalData.convert_format ).toBe( true );
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
			expect( updatedItem.additionalData.convert_format ).toBe( true );
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
			expect( updatedItem.additionalData.convert_format ).toBe( true );
		} );

		it( 'routes very large interlaced images to the server', async () => {
			// A progressive JPEG (SOF2) header reporting 20000x11857, which
			// exceeds the client-side memory budget for interlaced images.
			const dimensions = new Uint8Array( 4 );
			const dimView = new DataView( dimensions.buffer );
			dimView.setUint16( 0, 11857 ); // height
			dimView.setUint16( 2, 20000 ); // width
			const bytes = new Uint8Array( [
				0xff,
				0xd8, // SOI
				0xff,
				0xc2, // SOF2 (progressive)
				0x00,
				0x11, // segment length
				0x08, // precision
				...dimensions, // height (2) + width (2)
				0x03, // components
				0x00,
				0x00,
				0x00,
			] );
			const largeJpeg = new File( [ bytes ], 'huge.jpg', {
				type: 'image/jpeg',
			} );

			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: largeJpeg,
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

			// Should fall back to server-side processing: only Upload, no
			// client-side thumbnail generation.
			expect( updatedItem.operations ).toEqual(
				expect.arrayContaining( [ OperationType.Upload ] )
			);
			expect( updatedItem.operations ).not.toEqual(
				expect.arrayContaining( [ OperationType.ThumbnailGeneration ] )
			);
			expect( updatedItem.additionalData.generate_sub_sizes ).toBe(
				true
			);
			expect( updatedItem.additionalData.convert_format ).toBe( true );
		} );
	} );

	describe( 'concurrent sideloads', () => {
		it( 'does not pause sideload items targeting the same post', async () => {
			// Configure mediaSideload so sideload uploads can proceed.
			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				mediaSideload: jest.fn(),
			} );

			// Use a fake parentId so we only test sideload scheduling.
			const fakeParentId = 'fake-parent-id';

			// Add two sideload items targeting the same post.
			unlock( registry.dispatch( uploadStore ) ).addSideloadItem( {
				file: jpegFile,
				parentId: fakeParentId,
				additionalData: { post: 100, image_size: 'thumbnail' },
				operations: [ OperationType.Upload ],
			} );
			unlock( registry.dispatch( uploadStore ) ).addSideloadItem( {
				file: jpegFile,
				parentId: fakeParentId,
				additionalData: { post: 100, image_size: 'medium' },
				operations: [ OperationType.Upload ],
			} );

			// Resume the queue to trigger processing.
			await unlock( registry.dispatch( uploadStore ) ).resumeQueue();

			const items = unlock(
				registry.select( uploadStore )
			).getAllItems();
			const sideloadItems = items.filter(
				( item ) => item.parentId === fakeParentId
			);

			// Neither sideload item should be paused.
			for ( const item of sideloadItems ) {
				expect( item.status ).not.toBe( ItemStatus.Paused );
			}
		} );

		it( 'allows multiple sideloads to the same attachment to upload concurrently', async () => {
			const mediaSideload = jest.fn();

			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				mediaSideload,
				maxConcurrentUploads: 5,
			} );

			// Add a parent item first.
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );
			const parentItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			// Add 3 sideload items to same post.
			for ( const size of [ 'thumbnail', 'medium', 'large' ] ) {
				unlock( registry.dispatch( uploadStore ) ).addSideloadItem( {
					file: jpegFile,
					parentId: parentItem.id,
					additionalData: { post: 200, image_size: size },
					operations: [ OperationType.Upload ],
				} );
			}

			// Resume the queue.
			await unlock( registry.dispatch( uploadStore ) ).resumeQueue();

			// All 3 sideloads should have started (not serialized).
			expect( mediaSideload ).toHaveBeenCalledTimes( 3 );
		} );

		it( 'respects maxConcurrentUploads for sideloads', async () => {
			const mediaSideload = jest.fn();

			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				mediaSideload,
				maxConcurrentUploads: 2,
			} );

			// Use a fake parentId so the parent item does not consume
			// an upload slot. Only sideload items compete for slots.
			const fakeParentId = 'fake-parent-id';

			// Add 4 sideload items.
			for ( const size of [
				'thumbnail',
				'medium',
				'large',
				'medium_large',
			] ) {
				unlock( registry.dispatch( uploadStore ) ).addSideloadItem( {
					file: jpegFile,
					parentId: fakeParentId,
					additionalData: { post: 300, image_size: size },
					operations: [ OperationType.Upload ],
				} );
			}

			// Resume the queue.
			await unlock( registry.dispatch( uploadStore ) ).resumeQueue();

			// Only 2 should have started due to concurrency limit.
			expect( mediaSideload ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'starts pending sideloads after one finishes', async () => {
			let onSuccessCallback:
				| ( ( subSize: Record< string, unknown > ) => void )
				| undefined;
			const mediaSideload = jest.fn( ( { onSuccess } ) => {
				// Capture the first callback to simulate completion later.
				if ( ! onSuccessCallback ) {
					onSuccessCallback = onSuccess;
				}
			} );

			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				mediaSideload,
				maxConcurrentUploads: 1,
			} );

			// Use a fake parentId so the parent item does not consume
			// an upload slot.
			const fakeParentId = 'fake-parent-id';

			// Add 2 sideload items.
			unlock( registry.dispatch( uploadStore ) ).addSideloadItem( {
				file: jpegFile,
				parentId: fakeParentId,
				additionalData: { post: 400, image_size: 'thumbnail' },
				operations: [ OperationType.Upload ],
			} );
			unlock( registry.dispatch( uploadStore ) ).addSideloadItem( {
				file: jpegFile,
				parentId: fakeParentId,
				additionalData: { post: 400, image_size: 'medium' },
				operations: [ OperationType.Upload ],
			} );

			// Resume the queue.
			await unlock( registry.dispatch( uploadStore ) ).resumeQueue();

			// Only 1 should have started due to maxConcurrentUploads=1.
			expect( mediaSideload ).toHaveBeenCalledTimes( 1 );

			// Complete the first upload to trigger the pending one.
			onSuccessCallback?.( {
				image_size: 'thumbnail',
				width: 150,
				height: 150,
				file: 'image-150x150.jpg',
				mime_type: 'image/jpeg',
				filesize: 5000,
			} );

			// Allow async dispatch to propagate.
			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

			// The second sideload should now have started.
			expect( mediaSideload ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'resumeItemByPostId is not on private dispatch', () => {
			const privateDispatch = unlock( registry.dispatch( uploadStore ) );
			expect(
				( privateDispatch as Record< string, unknown > )
					.resumeItemByPostId
			).toBeUndefined();
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

		describe( 'parent cancellation when child sideload fails', () => {
			// Helpers used by every scenario below. Set up a parent that
			// has finished its primary upload (so it has an attachment.id),
			// then add a sideload child that we'll cancel to trigger the
			// parent-cancel branch.
			const setUpParentAndChild = ( {
				parentSubSizes,
				parentOnError,
			}: {
				parentSubSizes?: { name: string; id: number }[];
				parentOnError?: jest.Mock;
			} = {} ) => {
				unlock( registry.dispatch( uploadStore ) ).addItem( {
					file: jpegFile,
					onError: parentOnError,
					operations: [ OperationType.Finalize ],
				} );
				const parent = unlock(
					registry.select( uploadStore )
				).getAllItems()[ 0 ];

				// Simulate the parent's primary upload having completed:
				// give it an attachment.id and (optionally) accumulated
				// sub-sizes from already-successful child sideloads.
				unlock( registry.dispatch( uploadStore ) ).finishOperation(
					parent.id,
					{
						attachment: { id: 42 },
						...( parentSubSizes
							? { subSizes: parentSubSizes }
							: {} ),
					}
				);

				unlock( registry.dispatch( uploadStore ) ).addSideloadItem( {
					file: jpegFile,
					parentId: parent.id,
					additionalData: { post: 42, image_size: 'medium' },
				} );

				const child = unlock( registry.select( uploadStore ) )
					.getAllItems()
					.find( ( i ) => i.parentId === parent.id );

				return { parent, child };
			};

			it( 'deletes parent attachment and cancels parent for vips processing failures with no successful siblings', async () => {
				const consoleErrorSpy = jest
					.spyOn( console, 'error' )
					.mockImplementation( () => {} );
				const mediaDelete = jest.fn().mockResolvedValue( undefined );
				const parentOnError = jest.fn();
				unlock( registry.dispatch( uploadStore ) ).updateSettings( {
					mediaDelete,
				} );

				const { parent, child } = setUpParentAndChild( {
					parentOnError,
				} );

				// resizeCropItem and rotateItem already wrap vips
				// failures in an UploadError that carries the
				// actionable user-facing message at the source.
				const vipsError = new ( jest.requireActual(
					'../../upload-error'
				).UploadError )( {
					code: 'IMAGE_TRANSCODING_ERROR',
					message:
						'The web server cannot generate responsive image sizes for this image. Convert it to JPEG or PNG before uploading.',
					file: jpegFile,
				} );

				await registry
					.dispatch( uploadStore )
					.cancelItem( child!.id, vipsError );

				expect( mediaDelete ).toHaveBeenCalledWith( 42 );
				expect( parentOnError ).toHaveBeenCalledWith(
					expect.objectContaining( {
						code: 'IMAGE_TRANSCODING_ERROR',
						message: expect.stringContaining(
							'cannot generate responsive image sizes'
						),
					} )
				);
				expect(
					unlock( registry.select( uploadStore ) ).getItem(
						parent.id
					)
				).toBeUndefined();

				consoleErrorSpy.mockRestore();
			} );

			it( 'propagates the underlying error message for non-vips sideload failures', async () => {
				const mediaDelete = jest.fn().mockResolvedValue( undefined );
				const parentOnError = jest.fn();
				unlock( registry.dispatch( uploadStore ) ).updateSettings( {
					mediaDelete,
				} );

				const { child } = setUpParentAndChild( { parentOnError } );

				const networkError = new ( jest.requireActual(
					'../../upload-error'
				).UploadError )( {
					code: 'GENERAL',
					message: 'Network request failed: 503',
					file: jpegFile,
				} );

				await registry
					.dispatch( uploadStore )
					.cancelItem( child!.id, networkError );

				expect( mediaDelete ).toHaveBeenCalledWith( 42 );
				expect( parentOnError ).toHaveBeenCalledWith(
					expect.objectContaining( {
						code: 'GENERAL',
						message: 'Network request failed: 503',
					} )
				);
			} );

			it( 'preserves the parent attachment when at least one sibling sub-size succeeded', async () => {
				const mediaDelete = jest.fn().mockResolvedValue( undefined );
				const parentOnError = jest.fn();
				unlock( registry.dispatch( uploadStore ) ).updateSettings( {
					mediaDelete,
				} );

				const { parent, child } = setUpParentAndChild( {
					parentOnError,
					parentSubSizes: [ { name: 'medium', id: 99 } ],
				} );

				const networkError = new ( jest.requireActual(
					'../../upload-error'
				).UploadError )( {
					code: 'GENERAL',
					message: 'sideload of large size failed',
					file: jpegFile,
				} );

				await registry
					.dispatch( uploadStore )
					.cancelItem( child!.id, networkError );

				// Partial success: do NOT delete the parent attachment,
				// do NOT cancel the parent. The accumulated sub-sizes
				// will still be sent to the finalize endpoint.
				expect( mediaDelete ).not.toHaveBeenCalled();
				expect( parentOnError ).not.toHaveBeenCalled();
				expect(
					unlock( registry.select( uploadStore ) ).getItem(
						parent.id
					)
				).toBeDefined();
			} );

			it( 'falls back to a generic message when the underlying error has no message', async () => {
				const mediaDelete = jest.fn().mockResolvedValue( undefined );
				const parentOnError = jest.fn();
				unlock( registry.dispatch( uploadStore ) ).updateSettings( {
					mediaDelete,
				} );

				const { child } = setUpParentAndChild( { parentOnError } );

				await registry
					.dispatch( uploadStore )
					.cancelItem( child!.id, new Error( '' ) );

				expect( parentOnError ).toHaveBeenCalledWith(
					expect.objectContaining( {
						message: 'The image could not be uploaded.',
					} )
				);
			} );
		} );
	} );

	describe( 'retryItem', () => {
		beforeEach( () => {
			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				retry: {
					maxRetryAttempts: 3,
					initialRetryDelayMs: 1000,
					maxRetryDelayMs: 30000,
					backoffMultiplier: 2,
					retryJitter: 0.1,
				},
			} );
		} );

		it( 'does nothing for non-existent item', async () => {
			await registry
				.dispatch( uploadStore )
				.retryItem( 'non-existent-id' );

			expect(
				unlock( registry.select( uploadStore ) ).getAllItems()
			).toHaveLength( 0 );
		} );

		it( 'does nothing for item without error', async () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			// Item has no error, so retryItem should do nothing.
			await registry.dispatch( uploadStore ).retryItem( item.id );

			const updatedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];
			expect( updatedItem.status ).toBe( ItemStatus.Processing );
			expect( updatedItem.retryCount ).toBeUndefined();
		} );

		it( 'sets status to Processing and clears error', async () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			// Schedule retry to put item in PendingRetry status with error.
			await registry
				.dispatch( uploadStore )
				.scheduleRetry( item.id, new Error( 'Network error' ) );

			// Retry the item.
			await registry.dispatch( uploadStore ).retryItem( item.id );

			const updatedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];
			expect( updatedItem.status ).toBe( ItemStatus.Processing );
			expect( updatedItem.error ).toBeUndefined();
		} );

		it( 'increments retryCount', async () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			// Schedule retry to put item in error state.
			await registry
				.dispatch( uploadStore )
				.scheduleRetry( item.id, new Error( 'Network error' ) );

			// Retry the item.
			await registry.dispatch( uploadStore ).retryItem( item.id );

			const updatedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];
			expect( updatedItem.retryCount ).toBe( 1 );
		} );
	} );

	describe( 'cancelItem retry integration', () => {
		beforeEach( () => {
			jest.useFakeTimers();
			( vipsCancelOperations as jest.Mock ).mockClear();
			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				retry: {
					maxRetryAttempts: 3,
					initialRetryDelayMs: 1000,
					maxRetryDelayMs: 30000,
					backoffMultiplier: 2,
					retryJitter: 0.1,
				},
			} );
		} );

		afterEach( () => {
			jest.useRealTimers();
		} );

		it( 'schedules retry for retryable errors', async () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			// Cancel with a retryable error (network error pattern).
			await registry
				.dispatch( uploadStore )
				.cancelItem( item.id, new Error( 'Network error' ) );

			// Item should still be in the queue with PendingRetry status.
			const updatedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];
			expect( updatedItem ).toBeDefined();
			expect( updatedItem.status ).toBe( ItemStatus.PendingRetry );
		} );

		it( 'does NOT schedule retry when silent=true', async () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			// Cancel silently with a retryable error.
			await registry
				.dispatch( uploadStore )
				.cancelItem( item.id, new Error( 'Network error' ), true );

			// Item should be removed (not retried).
			expect(
				unlock( registry.select( uploadStore ) ).getAllItems()
			).toHaveLength( 0 );
		} );

		it( 'does NOT schedule retry for non-retryable errors', async () => {
			const consoleErrorSpy = jest
				.spyOn( console, 'error' )
				.mockImplementation( () => {} );

			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			// Cancel with a non-retryable error.
			await registry
				.dispatch( uploadStore )
				.cancelItem( item.id, new Error( 'File validation failed' ) );

			// Item should be removed (not retried).
			expect(
				unlock( registry.select( uploadStore ) ).getAllItems()
			).toHaveLength( 0 );

			consoleErrorSpy.mockRestore();
		} );

		it( 'does NOT schedule retry when retry settings are undefined', async () => {
			const consoleErrorSpy = jest
				.spyOn( console, 'error' )
				.mockImplementation( () => {} );

			// Disable retry settings.
			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				retry: undefined,
			} );

			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			// Cancel with a retryable error.
			await registry
				.dispatch( uploadStore )
				.cancelItem( item.id, new Error( 'Network error' ) );

			// Item should be removed (retry not available without settings).
			expect(
				unlock( registry.select( uploadStore ) ).getAllItems()
			).toHaveLength( 0 );

			consoleErrorSpy.mockRestore();
		} );

		it( 'clears pending retry timer on manual cancel', async () => {
			const onError = jest.fn();
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
				onError,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			// Schedule a retry to put item in PendingRetry with a pending timer.
			await registry
				.dispatch( uploadStore )
				.cancelItem( item.id, new Error( 'Network error' ) );

			const pendingItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];
			expect( pendingItem.status ).toBe( ItemStatus.PendingRetry );

			// Now manually cancel the item while it's pending retry.
			await registry
				.dispatch( uploadStore )
				.cancelItem( item.id, new Error( 'Manual cancel' ), true );

			// Item should be removed from queue.
			expect(
				unlock( registry.select( uploadStore ) ).getAllItems()
			).toHaveLength( 0 );

			// Advance timers — the old retry timer should NOT fire.
			await jest.runAllTimersAsync();

			// Queue should still be empty (timer was cleared).
			expect(
				unlock( registry.select( uploadStore ) ).getAllItems()
			).toHaveLength( 0 );
		} );
	} );

	describe( 'scheduleRetry', () => {
		beforeEach( () => {
			jest.useFakeTimers();
			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				retry: {
					maxRetryAttempts: 3,
					initialRetryDelayMs: 1000,
					maxRetryDelayMs: 30000,
					backoffMultiplier: 2,
					retryJitter: 0.1,
				},
			} );
		} );

		afterEach( () => {
			jest.useRealTimers();
		} );

		it( 'sets item status to PendingRetry', async () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			await registry
				.dispatch( uploadStore )
				.scheduleRetry( item.id, new Error( 'Network error' ) );

			const updatedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];
			expect( updatedItem.status ).toBe( ItemStatus.PendingRetry );
		} );

		it( 'stores the error on the item', async () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			const error = new Error( 'Network error' );
			await registry
				.dispatch( uploadStore )
				.scheduleRetry( item.id, error );

			const updatedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];
			expect( updatedItem.error ).toBe( error );
		} );

		it( 'sets nextRetryTimestamp', async () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			const beforeTime = Date.now();
			await registry
				.dispatch( uploadStore )
				.scheduleRetry( item.id, new Error( 'Network error' ) );

			const updatedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];
			expect( updatedItem.nextRetryTimestamp ).toBeGreaterThan(
				beforeTime
			);
		} );

		it( 'does nothing if item does not exist', async () => {
			await registry
				.dispatch( uploadStore )
				.scheduleRetry(
					'non-existent-id',
					new Error( 'Network error' )
				);

			expect(
				unlock( registry.select( uploadStore ) ).getAllItems()
			).toHaveLength( 0 );
		} );

		it( 'executes retry after timer fires', async () => {
			// executeRetry is now a no-op when the queue is paused (the outer
			// beforeEach pauses); resume so the timer's executeRetry mutates
			// state.
			await unlock( registry.dispatch( uploadStore ) ).resumeQueue();

			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			await registry
				.dispatch( uploadStore )
				.scheduleRetry( item.id, new Error( 'Network error' ) );

			// Item should be in PendingRetry status.
			let updatedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];
			expect( updatedItem.status ).toBe( ItemStatus.PendingRetry );

			// Fire all timers to trigger executeRetry.
			await jest.runAllTimersAsync();

			// Item should now be back in Processing status with incremented retryCount.
			updatedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];
			expect( updatedItem.status ).toBe( ItemStatus.Processing );
			expect( updatedItem.retryCount ).toBe( 1 );
		} );
	} );

	describe( 'executeRetry', () => {
		beforeEach( async () => {
			jest.useFakeTimers();
			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				retry: {
					maxRetryAttempts: 3,
					initialRetryDelayMs: 1000,
					maxRetryDelayMs: 30000,
					backoffMultiplier: 2,
					retryJitter: 0.1,
				},
			} );
			// executeRetry is now a no-op when the queue is paused (the outer
			// beforeEach pauses); resume so executeRetry mutates state.
			await unlock( registry.dispatch( uploadStore ) ).resumeQueue();
		} );

		afterEach( () => {
			jest.useRealTimers();
		} );

		it( 'resets item to Processing status', async () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			// First schedule a retry to put item in PendingRetry status.
			await registry
				.dispatch( uploadStore )
				.scheduleRetry( item.id, new Error( 'Network error' ) );

			// Execute the retry.
			await registry.dispatch( uploadStore ).executeRetry( item.id );

			const updatedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];
			expect( updatedItem.status ).toBe( ItemStatus.Processing );
		} );

		it( 'clears the error on the item', async () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			// Schedule retry to set error.
			await registry
				.dispatch( uploadStore )
				.scheduleRetry( item.id, new Error( 'Network error' ) );

			// Verify error is set.
			let updatedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];
			expect( updatedItem.error ).toBeDefined();

			// Execute retry.
			await registry.dispatch( uploadStore ).executeRetry( item.id );

			updatedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];
			expect( updatedItem.error ).toBeUndefined();
		} );

		it( 'increments retryCount', async () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			// Schedule retry (sets retryCount to current value).
			await registry
				.dispatch( uploadStore )
				.scheduleRetry( item.id, new Error( 'Network error' ) );

			// Execute retry (increments retryCount).
			await registry.dispatch( uploadStore ).executeRetry( item.id );

			const updatedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];
			expect( updatedItem.retryCount ).toBe( 1 );
		} );

		it( 'creates a fresh AbortController after retry', async () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];
			const originalController = item.abortController;

			// Schedule retry to put item in PendingRetry status.
			await registry
				.dispatch( uploadStore )
				.scheduleRetry( item.id, new Error( 'Network error' ) );

			// Execute the retry.
			await registry.dispatch( uploadStore ).executeRetry( item.id );

			const updatedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			// Should have a new AbortController instance.
			expect( updatedItem.abortController ).toBeInstanceOf(
				AbortController
			);
			expect( updatedItem.abortController ).not.toBe(
				originalController
			);
			// The new controller should not be aborted.
			expect( updatedItem.abortController?.signal.aborted ).toBe( false );
		} );

		it( 'does nothing if item does not exist', async () => {
			await registry
				.dispatch( uploadStore )
				.executeRetry( 'non-existent-id' );

			// Should not throw, just return silently.
			expect(
				unlock( registry.select( uploadStore ) ).getAllItems()
			).toHaveLength( 0 );
		} );

		it( 'removeItem clears any pending retry timer', async () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			// Schedule a retry to put a timer in the retryTimers map.
			await registry
				.dispatch( uploadStore )
				.scheduleRetry( item.id, new Error( 'Network error' ) );

			expect(
				unlock( registry.select( uploadStore ) ).getAllItems()[ 0 ]
					.status
			).toBe( ItemStatus.PendingRetry );

			// Remove the item directly (not via cancelItem).
			await unlock( registry.dispatch( uploadStore ) ).removeItem(
				item.id
			);

			// Item should be gone.
			expect(
				unlock( registry.select( uploadStore ) ).getAllItems()
			).toHaveLength( 0 );

			// Advance timers — the old retry timer must NOT re-add or
			// touch the item.
			await jest.runAllTimersAsync();

			expect(
				unlock( registry.select( uploadStore ) ).getAllItems()
			).toHaveLength( 0 );
		} );

		it( 'falls through to cancellation after exhausting max retries', async () => {
			const onError = jest.fn();
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
				onError,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			// First failure with retryable error → schedules retry (count=0).
			await registry
				.dispatch( uploadStore )
				.cancelItem( item.id, new Error( 'Network error' ) );

			expect(
				unlock( registry.select( uploadStore ) ).getAllItems()[ 0 ]
					.status
			).toBe( ItemStatus.PendingRetry );

			// Run through the 3 scheduled retries — each fires the timer,
			// executes the retry (incrementing retryCount), then we simulate
			// another failure.
			for ( let attempt = 1; attempt <= 3; attempt++ ) {
				await jest.runAllTimersAsync();

				const inProgress = unlock(
					registry.select( uploadStore )
				).getAllItems()[ 0 ];
				expect( inProgress.status ).toBe( ItemStatus.Processing );
				expect( inProgress.retryCount ).toBe( attempt );

				await registry
					.dispatch( uploadStore )
					.cancelItem( item.id, new Error( 'Network error' ) );
			}

			// After max retries exhausted, the next cancel should remove
			// the item and surface the error to onError.
			expect(
				unlock( registry.select( uploadStore ) ).getAllItems()
			).toHaveLength( 0 );
			expect( onError ).toHaveBeenCalledWith(
				expect.objectContaining( { message: 'Network error' } )
			);
		} );

		it( 'does nothing if item is not in PendingRetry status', async () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			// Item is in Processing status, not PendingRetry.
			expect( item.status ).toBe( ItemStatus.Processing );

			// Execute retry should do nothing.
			await registry.dispatch( uploadStore ).executeRetry( item.id );

			// Status should remain unchanged.
			const updatedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];
			expect( updatedItem.status ).toBe( ItemStatus.Processing );
			expect( updatedItem.retryCount ).toBeUndefined();
		} );

		it( 'leaves item in PendingRetry when queue is paused, then resumes on resumeQueue', async () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );
			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			// Schedule a retry to put item in PendingRetry.
			await registry
				.dispatch( uploadStore )
				.scheduleRetry( item.id, new Error( 'Network error' ) );

			// Pause the queue before the timer fires.
			unlock( registry.dispatch( uploadStore ) ).pauseQueue();

			// Fire the retry timer while paused — executeRetry should bail
			// without mutating state.
			await jest.runAllTimersAsync();

			const pausedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];
			expect( pausedItem.status ).toBe( ItemStatus.PendingRetry );
			expect( pausedItem.retryCount ).toBe( 0 );

			// Resume — resumeQueue should re-trigger executeRetry for any
			// PendingRetry items so they actually process.
			await unlock( registry.dispatch( uploadStore ) ).resumeQueue();

			const resumedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];
			expect( resumedItem.status ).toBe( ItemStatus.Processing );
			expect( resumedItem.retryCount ).toBe( 1 );
		} );
	} );

	describe( 'resizeCropItem', () => {
		it( 'uses imageQuality from store settings when set', async () => {
			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				imageQuality: 0.5,
			} );

			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );

			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			const { vipsResizeImage } = require( '../utils' );
			( vipsResizeImage as jest.Mock ).mockClear();

			await unlock( registry.dispatch( uploadStore ) ).resizeCropItem(
				item.id,
				{ resize: { width: 100, height: 100 } }
			);

			// Verify the resize was called (quality will be wired through in a future update).
			expect( vipsResizeImage ).toHaveBeenCalled();
		} );

		it( 'falls back to default quality when imageQuality is not set', async () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );

			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			const { vipsResizeImage } = require( '../utils' );
			( vipsResizeImage as jest.Mock ).mockClear();

			await unlock( registry.dispatch( uploadStore ) ).resizeCropItem(
				item.id,
				{ resize: { width: 100, height: 100 } }
			);

			expect( vipsResizeImage ).toHaveBeenCalled();
		} );

		it( 'skips resize when no resize args are provided', async () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );

			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			await unlock( registry.dispatch( uploadStore ) ).resizeCropItem(
				item.id
			);

			// Item should finish without resize.
			const updatedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];
			expect( updatedItem.file ).toBe( jpegFile );
		} );
	} );

	describe( 'generateThumbnails', () => {
		const mockBitmapClose = jest.fn();

		function mockCreateImageBitmap( width: number, height: number ) {
			global.createImageBitmap = jest.fn( () =>
				Promise.resolve( {
					width,
					height,
					close: mockBitmapClose,
				} )
			) as unknown as typeof global.createImageBitmap;
		}

		/**
		 * Sets up an item in the queue with an attachment and
		 * ThumbnailGeneration as the current operation, simulating
		 * the state after upload completes.
		 *
		 * @param overrides            Optional overrides.
		 * @param overrides.attachment Attachment field overrides.
		 */
		async function setupItemForThumbnailGeneration( overrides?: {
			attachment?: Record< string, unknown >;
		} ) {
			// Add an item with ThumbnailGeneration as the only operation.
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
				operations: [ OperationType.ThumbnailGeneration ],
			} );

			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			// Simulate upload completion by finishing the operation with attachment data.
			// finishOperation shifts the operations array, so ThumbnailGeneration
			// becomes the next operation to process.
			await unlock( registry.dispatch( uploadStore ) ).finishOperation(
				item.id,
				{
					attachment: {
						id: 123,
						filename: 'example.jpg',
						missing_image_sizes: [ 'thumbnail', 'medium' ],
						...( overrides?.attachment || {} ),
					},
				}
			);

			return unlock( registry.select( uploadStore ) ).getAllItems()[ 0 ];
		}

		beforeEach( () => {
			mockBitmapClose.mockClear();
		} );

		afterEach( () => {
			// Clean up global mock.
			// @ts-ignore
			delete global.createImageBitmap;
		} );

		it( 'should not sideload a scaled version when image is below the threshold', async () => {
			// Image is 800x600, threshold is 2560.
			mockCreateImageBitmap( 800, 600 );

			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				bigImageSizeThreshold: 2560,
				allImageSizes: {
					thumbnail: { width: 150, height: 150 },
					medium: { width: 300, height: 300 },
				},
			} );

			const item = await setupItemForThumbnailGeneration();
			await unlock( registry.dispatch( uploadStore ) ).generateThumbnails(
				item.id
			);

			const allItems = unlock(
				registry.select( uploadStore )
			).getAllItems();

			// Should have sideload items for thumbnails, but NOT for 'scaled'.
			const scaledItems = allItems.filter(
				( i ) => i.additionalData?.image_size === 'scaled'
			);
			expect( scaledItems ).toHaveLength( 0 );
			expect( mockBitmapClose ).toHaveBeenCalled();
		} );

		it( 'should sideload a scaled version when image exceeds the threshold', async () => {
			// Image is 4000x3000, threshold is 2560.
			mockCreateImageBitmap( 4000, 3000 );

			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				bigImageSizeThreshold: 2560,
				allImageSizes: {
					thumbnail: { width: 150, height: 150 },
					medium: { width: 300, height: 300 },
				},
			} );

			const item = await setupItemForThumbnailGeneration();
			await unlock( registry.dispatch( uploadStore ) ).generateThumbnails(
				item.id
			);

			const allItems = unlock(
				registry.select( uploadStore )
			).getAllItems();

			const scaledItems = allItems.filter(
				( i ) => i.additionalData?.image_size === 'scaled'
			);
			expect( scaledItems ).toHaveLength( 1 );
			expect( scaledItems[ 0 ].additionalData.post ).toBe( 123 );
			expect( mockBitmapClose ).toHaveBeenCalled();
		} );

		it( 'should sideload a scaled version when only height exceeds the threshold', async () => {
			// Image is 2000x3000, threshold is 2560 — height exceeds.
			mockCreateImageBitmap( 2000, 3000 );

			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				bigImageSizeThreshold: 2560,
				allImageSizes: {
					thumbnail: { width: 150, height: 150 },
					medium: { width: 300, height: 300 },
				},
			} );

			const item = await setupItemForThumbnailGeneration();
			await unlock( registry.dispatch( uploadStore ) ).generateThumbnails(
				item.id
			);

			const allItems = unlock(
				registry.select( uploadStore )
			).getAllItems();

			const scaledItems = allItems.filter(
				( i ) => i.additionalData?.image_size === 'scaled'
			);
			expect( scaledItems ).toHaveLength( 1 );
		} );

		it( 'should not sideload a scaled version when bigImageSizeThreshold is not set', async () => {
			// No bigImageSizeThreshold in settings — scaling should be skipped entirely.
			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				allImageSizes: {
					thumbnail: { width: 150, height: 150 },
					medium: { width: 300, height: 300 },
				},
			} );

			const item = await setupItemForThumbnailGeneration();
			await unlock( registry.dispatch( uploadStore ) ).generateThumbnails(
				item.id
			);

			const allItems = unlock(
				registry.select( uploadStore )
			).getAllItems();

			const scaledItems = allItems.filter(
				( i ) => i.additionalData?.image_size === 'scaled'
			);
			expect( scaledItems ).toHaveLength( 0 );
			// createImageBitmap should not have been called since threshold is not set.
			expect( global.createImageBitmap ).toBeUndefined();
		} );

		it( 'should not sideload a scaled version when attachment has no id', async () => {
			mockCreateImageBitmap( 4000, 3000 );

			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				bigImageSizeThreshold: 2560,
				allImageSizes: {
					thumbnail: { width: 150, height: 150 },
					medium: { width: 300, height: 300 },
				},
			} );

			// Set up item with attachment that has no id.
			const item = await setupItemForThumbnailGeneration( {
				attachment: { id: undefined },
			} );
			await unlock( registry.dispatch( uploadStore ) ).generateThumbnails(
				item.id
			);

			const allItems = unlock(
				registry.select( uploadStore )
			).getAllItems();

			const scaledItems = allItems.filter(
				( i ) => i.additionalData?.image_size === 'scaled'
			);
			expect( scaledItems ).toHaveLength( 0 );
		} );

		it( 'should create sideload items for missing image sizes', async () => {
			mockCreateImageBitmap( 800, 600 );

			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				bigImageSizeThreshold: 2560,
				allImageSizes: {
					thumbnail: { width: 150, height: 150 },
					medium: { width: 300, height: 300 },
				},
			} );

			const item = await setupItemForThumbnailGeneration();
			await unlock( registry.dispatch( uploadStore ) ).generateThumbnails(
				item.id
			);

			const allItems = unlock(
				registry.select( uploadStore )
			).getAllItems();

			// Should have the original item plus 2 sideload items for thumbnail and medium.
			const thumbnailItems = allItems.filter(
				( i ) => i.additionalData?.image_size === 'thumbnail'
			);
			const mediumItems = allItems.filter(
				( i ) => i.additionalData?.image_size === 'medium'
			);
			expect( thumbnailItems ).toHaveLength( 1 );
			expect( mediumItems ).toHaveLength( 1 );
		} );

		it( 'should deduplicate sizes with the same dimensions', async () => {
			mockCreateImageBitmap( 800, 600 );

			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				bigImageSizeThreshold: 2560,
				allImageSizes: {
					thumbnail: { width: 150, height: 150, crop: true },
					medium: { width: 300, height: 300, crop: false },
					// 'custom' has the same dimensions as 'medium'.
					custom: { width: 300, height: 300, crop: false },
				},
			} );

			const item = await setupItemForThumbnailGeneration( {
				attachment: {
					missing_image_sizes: [ 'thumbnail', 'medium', 'custom' ],
				},
			} );
			await unlock( registry.dispatch( uploadStore ) ).generateThumbnails(
				item.id
			);

			const allItems = unlock(
				registry.select( uploadStore )
			).getAllItems();

			// Should have the original item plus 2 sideload items (not 3),
			// because medium and custom share the same dimensions.
			const sideloadItems = allItems.filter(
				( i ) => i.parentId === item.id
			);
			expect( sideloadItems ).toHaveLength( 2 );

			// The deduplicated group should pass both size names.
			const mediumCustomItem = sideloadItems.find( ( i ) =>
				Array.isArray( i.additionalData?.image_size )
			);
			expect( mediumCustomItem ).toBeDefined();
			expect( mediumCustomItem!.additionalData!.image_size ).toEqual( [
				'medium',
				'custom',
			] );
		} );

		it( 'should not deduplicate sizes that share dimensions but differ by crop', async () => {
			mockCreateImageBitmap( 800, 600 );

			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				bigImageSizeThreshold: 2560,
				allImageSizes: {
					// Same width/height, different crop — must be treated as distinct.
					soft: { width: 300, height: 300, crop: false },
					hard: { width: 300, height: 300, crop: true },
				},
			} );

			const item = await setupItemForThumbnailGeneration( {
				attachment: {
					missing_image_sizes: [ 'soft', 'hard' ],
				},
			} );
			await unlock( registry.dispatch( uploadStore ) ).generateThumbnails(
				item.id
			);

			const allItems = unlock(
				registry.select( uploadStore )
			).getAllItems();

			const sideloadItems = allItems.filter(
				( i ) => i.parentId === item.id
			);
			// Two separate sideloads because crop differs.
			expect( sideloadItems ).toHaveLength( 2 );

			// Each sideload passes a single string (not an array).
			for ( const sideload of sideloadItems ) {
				expect(
					typeof sideload.additionalData?.image_size === 'string'
				).toBe( true );
			}
			const imageSizes = sideloadItems.map(
				( i ) => i.additionalData?.image_size
			);
			expect( imageSizes ).toEqual(
				expect.arrayContaining( [ 'soft', 'hard' ] )
			);
		} );

		it( 'should group three sizes with identical dimensions into one sideload', async () => {
			mockCreateImageBitmap( 800, 600 );

			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				bigImageSizeThreshold: 2560,
				allImageSizes: {
					medium: { width: 300, height: 300, crop: false },
					alias_a: { width: 300, height: 300, crop: false },
					alias_b: { width: 300, height: 300, crop: false },
				},
			} );

			const item = await setupItemForThumbnailGeneration( {
				attachment: {
					missing_image_sizes: [ 'medium', 'alias_a', 'alias_b' ],
				},
			} );
			await unlock( registry.dispatch( uploadStore ) ).generateThumbnails(
				item.id
			);

			const allItems = unlock(
				registry.select( uploadStore )
			).getAllItems();

			const sideloadItems = allItems.filter(
				( i ) => i.parentId === item.id
			);
			// One sideload, all three names grouped together.
			expect( sideloadItems ).toHaveLength( 1 );
			expect( sideloadItems[ 0 ].additionalData!.image_size ).toEqual( [
				'medium',
				'alias_a',
				'alias_b',
			] );
		} );

		it( 'should skip thumbnail generation when item has no attachment', async () => {
			// Add an item without going through the attachment setup.
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
				operations: [ OperationType.ThumbnailGeneration ],
			} );

			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			// Clear the attachment to simulate no upload response.
			await unlock( registry.dispatch( uploadStore ) ).finishOperation(
				item.id,
				{
					attachment: undefined,
				}
			);

			const updatedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];

			await unlock( registry.dispatch( uploadStore ) ).generateThumbnails(
				updatedItem.id
			);

			// Should only have the original item — no sideloads created.
			const allItems = unlock(
				registry.select( uploadStore )
			).getAllItems();
			expect( allItems ).toHaveLength( 1 );
		} );

		it( 'should not create scaled version when image is exactly at the threshold', async () => {
			// Image is exactly 2560x2560, threshold is 2560 — should NOT scale.
			mockCreateImageBitmap( 2560, 2560 );

			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				bigImageSizeThreshold: 2560,
				allImageSizes: {
					thumbnail: { width: 150, height: 150 },
					medium: { width: 300, height: 300 },
				},
			} );

			const item = await setupItemForThumbnailGeneration();
			await unlock( registry.dispatch( uploadStore ) ).generateThumbnails(
				item.id
			);

			const allItems = unlock(
				registry.select( uploadStore )
			).getAllItems();

			const scaledItems = allItems.filter(
				( i ) => i.additionalData?.image_size === 'scaled'
			);
			// Exactly at threshold means no scaling (condition is > not >=).
			expect( scaledItems ).toHaveLength( 0 );
		} );

		// Sub-size and scaled-sideload naming uses attachment.filename
		// verbatim. The cases below cover both the everyday filename and
		// edge cases that previously broke with a client-side strip:
		//   - a legitimate `-scaled` suffix in the user's filename
		//   - the literal basename `scaled.jpg`
		//   - `-scaled` appearing mid-name
		//   - the server's numeric conflict-resolution suffix
		//   - mixed case and multi-dot filenames
		it.each( [
			'IMG_2300.jpg',
			'foo-scaled.jpg',
			'scaled.jpg',
			'my-scaled-image.jpg',
			'IMG_2300-1.jpg',
			'IMG-scaled-2.jpg',
			'image.with.dots.jpg',
			'FOO-SCALED.JPG',
			'photo.jpeg',
		] )( 'uses %s verbatim for thumbnail sideloads', async ( filename ) => {
			mockCreateImageBitmap( 800, 600 );

			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				bigImageSizeThreshold: 2560,
				allImageSizes: {
					thumbnail: { width: 150, height: 150 },
					medium: { width: 300, height: 300 },
				},
			} );

			const item = await setupItemForThumbnailGeneration( {
				attachment: { filename },
			} );
			await unlock( registry.dispatch( uploadStore ) ).generateThumbnails(
				item.id
			);

			const thumbnailItems = unlock( registry.select( uploadStore ) )
				.getAllItems()
				.filter(
					( i ) =>
						i.additionalData?.image_size === 'thumbnail' ||
						i.additionalData?.image_size === 'medium'
				);
			expect( thumbnailItems ).toHaveLength( 2 );
			for ( const sideload of thumbnailItems ) {
				expect( sideload.file.name ).toBe( filename );
			}
		} );

		it.each( [
			'IMG_2300.jpg',
			'foo-scaled.jpg',
			'scaled.jpg',
			'IMG_2300-1.jpg',
			'image.with.dots.jpg',
		] )(
			'uses %s verbatim for the scaled sideload when above threshold',
			async ( filename ) => {
				// Image above threshold triggers the scaled sideload path.
				mockCreateImageBitmap( 4000, 3000 );

				unlock( registry.dispatch( uploadStore ) ).updateSettings( {
					bigImageSizeThreshold: 2560,
					allImageSizes: {
						thumbnail: { width: 150, height: 150 },
					},
				} );

				const item = await setupItemForThumbnailGeneration( {
					attachment: {
						filename,
						missing_image_sizes: [ 'thumbnail' ],
					},
				} );
				await unlock(
					registry.dispatch( uploadStore )
				).generateThumbnails( item.id );

				const scaledItems = unlock( registry.select( uploadStore ) )
					.getAllItems()
					.filter(
						( i ) => i.additionalData?.image_size === 'scaled'
					);
				expect( scaledItems ).toHaveLength( 1 );
				// vipsResizeImage adds the `-scaled` suffix during the
				// ResizeCrop op; the sideload enters the queue under the
				// server's filename so the resulting file matches WP core's
				// naming (e.g. foo-scaled.jpg → foo-scaled-scaled.jpg, which
				// is correct because the user really did have `-scaled` in
				// their original name and the file was just scaled again).
				expect( scaledItems[ 0 ].file.name ).toBe( filename );
			}
		);
	} );

	describe( 'prepareItem big image threshold', () => {
		it( 'should not pre-scale the main upload when bigImageSizeThreshold is set', async () => {
			// Pre-scaling the main upload would cause the server-returned
			// attachment.filename to carry `-scaled`, which would then leak
			// into every sub-size name. Threshold scaling must happen as a
			// sideload so the original is uploaded with its un-suffixed
			// basename.
			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				bigImageSizeThreshold: 2560,
			} );
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
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

			expect( updatedItem.operations ).not.toEqual(
				expect.arrayContaining( [ OperationType.ResizeCrop ] )
			);
			expect( updatedItem.operations ).toEqual(
				expect.arrayContaining( [
					OperationType.Upload,
					OperationType.ThumbnailGeneration,
				] )
			);
		} );
	} );
} );
