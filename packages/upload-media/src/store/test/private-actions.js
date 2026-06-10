/**
 * WordPress dependencies
 */
import { createBlobURL, revokeBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import {
	getTranscodeImageOperation,
	finalizeItem,
	detectUltraHdr,
	generateThumbnails,
	removeItem,
} from '../private-actions';
import { OperationType } from '../types';
import { vipsHasTransparency, vipsGetUltraHdrInfo } from '../utils';

// Mock @wordpress/blob
jest.mock( '@wordpress/blob', () => ( {
	createBlobURL: jest.fn( () => 'blob:mock-url' ),
	revokeBlobURL: jest.fn(),
} ) );

// Mock vips utilities
jest.mock( '../utils', () => ( {
	vipsHasTransparency: jest.fn(),
	vipsGetUltraHdrInfo: jest.fn(),
	terminateVipsWorker: jest.fn(),
	maybeRecycleVipsWorker: jest.fn(),
} ) );

describe( 'private actions', () => {
	describe( 'getTranscodeImageOperation', () => {
		beforeEach( () => {
			jest.clearAllMocks();
		} );

		it( 'should return transcode operation for valid format conversion', async () => {
			const file = new File( [ 'test' ], 'test.jpg', {
				type: 'image/jpeg',
			} );

			const result = await getTranscodeImageOperation(
				file,
				'image/webp',
				false
			);

			expect( result ).toEqual( [
				OperationType.TranscodeImage,
				{
					outputFormat: 'webp',
					outputQuality: 0.82,
					interlaced: false,
				},
			] );
		} );

		it( 'should return null for invalid output format', async () => {
			const file = new File( [ 'test' ], 'test.jpg', {
				type: 'image/jpeg',
			} );

			const result = await getTranscodeImageOperation(
				file,
				'image/unknown',
				false
			);

			expect( result ).toBeNull();
		} );

		it( 'should return null when PNG has transparency for PNG to JPEG conversion', async () => {
			vipsHasTransparency.mockResolvedValue( true );

			const file = new File( [ 'test' ], 'test.png', {
				type: 'image/png',
			} );

			const result = await getTranscodeImageOperation(
				file,
				'image/jpeg',
				false
			);

			expect( result ).toBeNull();
			expect( createBlobURL ).toHaveBeenCalledWith( file );
			expect( revokeBlobURL ).toHaveBeenCalledWith( 'blob:mock-url' );
		} );

		it( 'should return transcode operation when PNG has no transparency for PNG to JPEG conversion', async () => {
			vipsHasTransparency.mockResolvedValue( false );

			const file = new File( [ 'test' ], 'test.png', {
				type: 'image/png',
			} );

			const result = await getTranscodeImageOperation(
				file,
				'image/jpeg',
				false
			);

			expect( result ).toEqual( [
				OperationType.TranscodeImage,
				{
					outputFormat: 'jpeg',
					outputQuality: 0.82,
					interlaced: false,
				},
			] );
			expect( createBlobURL ).toHaveBeenCalledWith( file );
			expect( revokeBlobURL ).toHaveBeenCalledWith( 'blob:mock-url' );
		} );

		it( 'should return null when transparency check fails', async () => {
			vipsHasTransparency.mockRejectedValue(
				new Error( 'WASM load failed' )
			);

			const file = new File( [ 'test' ], 'test.png', {
				type: 'image/png',
			} );

			const result = await getTranscodeImageOperation(
				file,
				'image/jpeg',
				false
			);

			expect( result ).toBeNull();
			expect( revokeBlobURL ).toHaveBeenCalledWith( 'blob:mock-url' );
		} );

		it( 'should skip transparency check for non-PNG to JPEG conversions', async () => {
			const file = new File( [ 'test' ], 'test.png', {
				type: 'image/png',
			} );

			const result = await getTranscodeImageOperation(
				file,
				'image/webp',
				false
			);

			expect( result ).toEqual( [
				OperationType.TranscodeImage,
				{
					outputFormat: 'webp',
					outputQuality: 0.82,
					interlaced: false,
				},
			] );
			expect( vipsHasTransparency ).not.toHaveBeenCalled();
		} );

		it( 'should respect interlaced setting for JPEG output', async () => {
			const file = new File( [ 'test' ], 'test.png', {
				type: 'image/png',
			} );
			vipsHasTransparency.mockResolvedValue( false );

			const result = await getTranscodeImageOperation(
				file,
				'image/jpeg',
				true
			);

			expect( result ).toEqual( [
				OperationType.TranscodeImage,
				{
					outputFormat: 'jpeg',
					outputQuality: 0.82,
					interlaced: true,
				},
			] );
		} );

		it( 'should respect interlaced setting for PNG output', async () => {
			const file = new File( [ 'test' ], 'test.jpg', {
				type: 'image/jpeg',
			} );

			const result = await getTranscodeImageOperation(
				file,
				'image/png',
				true
			);

			expect( result ).toEqual( [
				OperationType.TranscodeImage,
				{
					outputFormat: 'png',
					outputQuality: 0.82,
					interlaced: true,
				},
			] );
		} );

		it( 'should respect interlaced setting for GIF output', async () => {
			const file = new File( [ 'test' ], 'test.jpg', {
				type: 'image/jpeg',
			} );

			const result = await getTranscodeImageOperation(
				file,
				'image/gif',
				true
			);

			expect( result ).toEqual( [
				OperationType.TranscodeImage,
				{
					outputFormat: 'gif',
					outputQuality: 0.82,
					interlaced: true,
				},
			] );
		} );

		it( 'should return transcode operation for AVIF output', async () => {
			const file = new File( [ 'test' ], 'test.jpg', {
				type: 'image/jpeg',
			} );

			const result = await getTranscodeImageOperation(
				file,
				'image/avif',
				false
			);

			expect( result ).toEqual( [
				OperationType.TranscodeImage,
				{
					outputFormat: 'avif',
					outputQuality: 0.82,
					interlaced: false,
				},
			] );
		} );

		it( 'should return null for malformed MIME type', async () => {
			const file = new File( [ 'test' ], 'test.jpg', {
				type: 'image/jpeg',
			} );

			const result = await getTranscodeImageOperation(
				file,
				'image/',
				false
			);

			expect( result ).toBeNull();
		} );
	} );

	describe( 'finalizeItem', () => {
		const mockSubSizes = [
			{
				image_size: 'thumbnail',
				width: 150,
				height: 150,
				file: 'image-150x150.jpg',
				mime_type: 'image/jpeg',
				filesize: 5000,
			},
			{
				image_size: 'medium',
				width: 300,
				height: 200,
				file: 'image-300x200.jpg',
				mime_type: 'image/jpeg',
				filesize: 15000,
			},
		];

		it( 'should call mediaFinalize with the attachment ID and sub-sizes', async () => {
			const mediaFinalize = jest.fn().mockResolvedValue( undefined );
			const finishOperation = jest.fn();
			const select = {
				getItem: () => ( {
					attachment: { id: 42 },
					subSizes: mockSubSizes,
				} ),
				getSettings: () => ( { mediaFinalize } ),
			};
			const dispatch = { finishOperation };

			const thunk = finalizeItem( 'test-id' );
			await thunk( { select, dispatch } );

			expect( mediaFinalize ).toHaveBeenCalledWith( 42, mockSubSizes );
			expect( finishOperation ).toHaveBeenCalledWith( 'test-id', {} );
		} );

		it( 'should pass empty array when no sub-sizes accumulated', async () => {
			const mediaFinalize = jest.fn().mockResolvedValue( undefined );
			const finishOperation = jest.fn();
			const select = {
				getItem: () => ( {
					attachment: { id: 42 },
				} ),
				getSettings: () => ( { mediaFinalize } ),
			};
			const dispatch = { finishOperation };

			const thunk = finalizeItem( 'test-id' );
			await thunk( { select, dispatch } );

			expect( mediaFinalize ).toHaveBeenCalledWith( 42, [] );
			expect( finishOperation ).toHaveBeenCalledWith( 'test-id', {} );
		} );

		it( 'should not call mediaFinalize when no callback is provided', async () => {
			const finishOperation = jest.fn();
			const select = {
				getItem: () => ( {
					attachment: { id: 42 },
				} ),
				getSettings: () => ( {} ),
			};
			const dispatch = { finishOperation };

			const thunk = finalizeItem( 'test-id' );
			await thunk( { select, dispatch } );

			expect( finishOperation ).toHaveBeenCalledWith( 'test-id', {} );
		} );

		it( 'should not call mediaFinalize when there is no attachment ID', async () => {
			const mediaFinalize = jest.fn();
			const finishOperation = jest.fn();
			const select = {
				getItem: () => ( {
					attachment: {},
				} ),
				getSettings: () => ( { mediaFinalize } ),
			};
			const dispatch = { finishOperation };

			const thunk = finalizeItem( 'test-id' );
			await thunk( { select, dispatch } );

			expect( mediaFinalize ).not.toHaveBeenCalled();
			expect( finishOperation ).toHaveBeenCalledWith( 'test-id', {} );
		} );

		it( 'should forward the finalized attachment to finishOperation', async () => {
			// Regression: after PR #78038, CSM uploads the original file rather
			// than a pre-scaled copy, so the upload response carries the URL of
			// the un-scaled original. The scaled-sideload step later updates
			// _wp_attached_file server-side, and finalize returns the
			// up-to-date attachment. The queue's stored attachment must be
			// merged with that response so onChange propagates the scaled URL
			// to the block — otherwise wp_calculate_image_srcset() cannot
			// match the src to a known size and no srcset is rendered.
			const updatedAttachment = {
				id: 42,
				url: 'https://example.com/wp-content/uploads/image-scaled.jpg',
			};
			const mediaFinalize = jest
				.fn()
				.mockResolvedValue( updatedAttachment );
			const finishOperation = jest.fn();
			const select = {
				getItem: () => ( {
					attachment: {
						id: 42,
						url: 'https://example.com/wp-content/uploads/image.jpg',
					},
					subSizes: mockSubSizes,
				} ),
				getSettings: () => ( { mediaFinalize } ),
			};
			const dispatch = { finishOperation };

			const thunk = finalizeItem( 'test-id' );
			await thunk( { select, dispatch } );

			expect( mediaFinalize ).toHaveBeenCalledWith( 42, mockSubSizes );
			expect( finishOperation ).toHaveBeenCalledWith( 'test-id', {
				attachment: updatedAttachment,
			} );
		} );

		it( 'should handle mediaFinalize errors gracefully', async () => {
			const mediaFinalize = jest
				.fn()
				.mockRejectedValue( new Error( 'Network error' ) );
			const finishOperation = jest.fn();
			const warnSpy = jest
				.spyOn( console, 'warn' )
				.mockImplementation( () => {} );
			const select = {
				getItem: () => ( {
					attachment: { id: 42 },
					subSizes: mockSubSizes,
				} ),
				getSettings: () => ( { mediaFinalize } ),
			};
			const dispatch = { finishOperation };

			const thunk = finalizeItem( 'test-id' );
			await thunk( { select, dispatch } );

			expect( mediaFinalize ).toHaveBeenCalledWith( 42, mockSubSizes );
			expect( warnSpy ).toHaveBeenCalledWith(
				'Media finalization failed:',
				expect.any( Error )
			);
			expect( finishOperation ).toHaveBeenCalledWith( 'test-id', {} );
			warnSpy.mockRestore();
		} );

		it( 'should return early when item is not found', async () => {
			const finishOperation = jest.fn();
			const select = {
				getItem: () => undefined,
			};
			const dispatch = { finishOperation };

			const thunk = finalizeItem( 'test-id' );
			await thunk( { select, dispatch } );

			expect( finishOperation ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'detectUltraHdr', () => {
		const makeItem = () => ( {
			file: new File( [ 'fake' ], 'photo.jpg', {
				type: 'image/jpeg',
			} ),
			attachment: { meta: {} },
		} );

		beforeEach( () => {
			jest.clearAllMocks();
		} );

		it( 'probes the file and finishes the operation when UltraHDR', async () => {
			vipsGetUltraHdrInfo.mockResolvedValue( {
				width: 1024,
				height: 768,
				hdrCapacity: 3,
			} );
			const finishOperation = jest.fn();
			const item = makeItem();
			const select = { getItem: () => item };
			const dispatch = { finishOperation };

			const thunk = detectUltraHdr( 'test-id' );
			await thunk( { select, dispatch } );

			// The thunk only probes and tracks the item (tracking is verified
			// via the generateThumbnails routing tests); the upload itself is
			// untouched, so it finishes with no attachment updates.
			expect( vipsGetUltraHdrInfo ).toHaveBeenCalledTimes( 1 );
			expect( finishOperation ).toHaveBeenCalledWith( 'test-id', {} );
		} );

		it( 'finishes cleanly when buffer is not UltraHDR', async () => {
			vipsGetUltraHdrInfo.mockResolvedValue( null );
			const finishOperation = jest.fn();
			const select = { getItem: () => makeItem() };
			const dispatch = { finishOperation };

			const thunk = detectUltraHdr( 'test-id' );
			await thunk( { select, dispatch } );

			expect( finishOperation ).toHaveBeenCalledWith( 'test-id', {} );
		} );

		it( 'falls through gracefully when probe throws', async () => {
			vipsGetUltraHdrInfo.mockRejectedValue(
				new Error( 'wasm module unavailable' )
			);
			const finishOperation = jest.fn();
			const select = { getItem: () => makeItem() };
			const dispatch = { finishOperation };

			const thunk = detectUltraHdr( 'test-id' );
			await thunk( { select, dispatch } );

			// Probe failure must not cancel the upload — pass-through finish.
			expect( finishOperation ).toHaveBeenCalledWith( 'test-id', {} );
		} );

		it( 'returns early when item is not found', async () => {
			const finishOperation = jest.fn();
			const select = { getItem: () => undefined };
			const dispatch = { finishOperation };

			const thunk = detectUltraHdr( 'missing' );
			await thunk( { select, dispatch } );

			expect( vipsGetUltraHdrInfo ).not.toHaveBeenCalled();
			expect( finishOperation ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'generateThumbnails UltraHDR gain-map routing', () => {
		const ULTRAHDR_INFO = { width: 1024, height: 768, hdrCapacity: 3 };

		// Two sizes with distinct dimensions/crop so they form two separate
		// groups: a hard-cropped square thumbnail and a proportional medium
		// downscale. Together they exercise both resize paths.
		const ALL_IMAGE_SIZES = {
			thumbnail: { width: 150, height: 150, crop: true },
			medium: { width: 300, height: 0, crop: false },
		};

		const makeThumbnailItem = ( attachmentOverrides = {} ) => ( {
			id: 'uhdr-parent',
			file: new File( [ 'fake' ], 'photo.jpg', { type: 'image/jpeg' } ),
			sourceFile: new File( [ 'fake' ], 'photo.jpg', {
				type: 'image/jpeg',
			} ),
			attachment: {
				id: 42,
				filename: 'photo.jpg',
				missing_image_sizes: [ 'thumbnail', 'medium' ],
				exif_orientation: 1,
				...attachmentOverrides,
			},
		} );

		const makeHarness = ( item, settings = {} ) => {
			const addSideloadItem = jest.fn();
			const finishOperation = jest.fn();
			const dispatch = {
				addSideloadItem,
				finishOperation,
				addItem: jest.fn(),
			};
			const select = {
				getItem: () => item,
				getSettings: () => ( {
					allImageSizes: ALL_IMAGE_SIZES,
					...settings,
				} ),
			};
			return { select, dispatch, addSideloadItem };
		};

		// Normalizes an operations list to the bare operation types, whether
		// an entry is a plain type or a [ type, args ] tuple.
		const operationTypes = ( sideloadArgs ) =>
			sideloadArgs.operations.map( ( op ) =>
				Array.isArray( op ) ? op[ 0 ] : op
			);

		// Marks an item as UltraHDR by running the real detectUltraHdr thunk,
		// which is what populates the module-level tracking set that
		// generateThumbnails reads.
		const markUltraHdr = async ( item ) => {
			vipsGetUltraHdrInfo.mockResolvedValue( ULTRAHDR_INFO );
			await detectUltraHdr( item.id )( {
				select: { getItem: () => item },
				dispatch: { finishOperation: jest.fn() },
			} );
		};

		// removeItem owns teardown of the tracking set, so use it to reset
		// state between tests (and to exercise the cleanup path itself).
		const clearTracking = async ( id ) => {
			await removeItem( id )( {
				select: { getItem: () => ( {} ), getAllItems: () => [] },
				dispatch: jest.fn(),
			} );
		};

		beforeEach( () => {
			jest.clearAllMocks();
		} );

		afterEach( async () => {
			await clearTracking( 'uhdr-parent' );
		} );

		it( 'routes every sub-size through resize without transcoding, preserving the gain map', async () => {
			const item = makeThumbnailItem( {
				image_output_format: 'image/webp',
			} );
			await markUltraHdr( item );

			const { select, dispatch, addSideloadItem } = makeHarness( item );
			await generateThumbnails( item.id )( { select, dispatch } );

			// Both the cropped thumbnail and the proportional medium size
			// were dispatched as sideloads.
			const sizes = addSideloadItem.mock.calls.map(
				( [ args ] ) => args.additionalData.image_size
			);
			expect( sizes ).toEqual(
				expect.arrayContaining( [ 'thumbnail', 'medium' ] )
			);

			// Crucially, none of the sub-size operations transcode the image,
			// which would strip the ISO 21496-1 gain map. Each one resizes
			// (gain-map-aware) and uploads.
			for ( const [ args ] of addSideloadItem.mock.calls ) {
				const types = operationTypes( args );
				expect( types ).toContain( OperationType.ResizeCrop );
				expect( types ).toContain( OperationType.Upload );
				expect( types ).not.toContain( OperationType.TranscodeImage );
			}
		} );

		it( 'keeps the over-threshold -scaled full-size copy as UltraHDR (no transcode)', async () => {
			const originalCreateImageBitmap = global.createImageBitmap;
			global.createImageBitmap = jest.fn( async () => ( {
				width: 5000,
				height: 4000,
				close: jest.fn(),
			} ) );

			try {
				const item = makeThumbnailItem( {
					image_output_format: 'image/webp',
				} );
				await markUltraHdr( item );

				const { select, dispatch, addSideloadItem } = makeHarness(
					item,
					{ bigImageSizeThreshold: 2560 }
				);
				await generateThumbnails( item.id )( { select, dispatch } );

				const scaledCall = addSideloadItem.mock.calls.find(
					( [ args ] ) => args.additionalData.image_size === 'scaled'
				);
				expect( scaledCall ).toBeDefined();

				const types = operationTypes( scaledCall[ 0 ] );
				expect( types ).toContain( OperationType.ResizeCrop );
				expect( types ).not.toContain( OperationType.TranscodeImage );
			} finally {
				global.createImageBitmap = originalCreateImageBitmap;
			}
		} );

		it( 'transcodes sub-sizes for non-UltraHDR sources', async () => {
			// This item is never marked UltraHDR, so the gain-map guard does
			// not apply and the configured format conversion runs as usual.
			const item = makeThumbnailItem( {
				image_output_format: 'image/webp',
			} );

			const { select, dispatch, addSideloadItem } = makeHarness( item );
			await generateThumbnails( item.id )( { select, dispatch } );

			const anyTranscode = addSideloadItem.mock.calls.some(
				( [ args ] ) =>
					operationTypes( args ).includes(
						OperationType.TranscodeImage
					)
			);
			expect( anyTranscode ).toBe( true );
		} );

		it( 'clears UltraHDR tracking on removeItem so later processing transcodes normally', async () => {
			const item = makeThumbnailItem( {
				image_output_format: 'image/webp',
			} );
			await markUltraHdr( item );
			// Both success and cancellation route through removeItem.
			await clearTracking( item.id );

			const { select, dispatch, addSideloadItem } = makeHarness( item );
			await generateThumbnails( item.id )( { select, dispatch } );

			// With tracking cleared the source is treated as a normal JPEG,
			// re-enabling transcoding — proving the set was emptied.
			const anyTranscode = addSideloadItem.mock.calls.some(
				( [ args ] ) =>
					operationTypes( args ).includes(
						OperationType.TranscodeImage
					)
			);
			expect( anyTranscode ).toBe( true );
		} );
	} );
} );
