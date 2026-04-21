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
	generateThumbnails,
} from '../private-actions';
import { OperationType } from '../types';
import { vipsHasTransparency, vipsBatchResizeImage } from '../utils';

// Mock @wordpress/blob
jest.mock( '@wordpress/blob', () => ( {
	createBlobURL: jest.fn( () => 'blob:mock-url' ),
	revokeBlobURL: jest.fn(),
	isBlobURL: jest.fn( () => false ),
} ) );

// Mock vips utilities
jest.mock( '../utils', () => ( {
	vipsHasTransparency: jest.fn(),
	vipsBatchResizeImage: jest.fn( ( _id, _file, outputType, configs ) =>
		Promise.resolve(
			configs.map( ( c ) => ( {
				name: c.name,
				file: new File(
					[ 'batch-resized' ],
					`converted-${ c.resize.width }x${ c.resize.height }.${
						outputType.split( '/' )[ 1 ]
					}`,
					{ type: outputType }
				),
			} ) )
		)
	),
} ) );

describe( 'private actions', () => {
	describe( 'getTranscodeImageOperation', () => {
		const mockSettings = {
			jpegInterlaced: false,
			pngInterlaced: false,
			gifInterlaced: false,
		};

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
				mockSettings
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
				mockSettings
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
				mockSettings
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
				mockSettings
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
				mockSettings
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
				mockSettings
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
				{ ...mockSettings, jpegInterlaced: true }
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
				{ ...mockSettings, pngInterlaced: true }
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
				{ ...mockSettings, gifInterlaced: true }
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
				mockSettings
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
				mockSettings
			);

			expect( result ).toBeNull();
		} );
	} );

	describe( 'generateThumbnails - batch resize with copyMemory()', () => {
		let addSideloadItem;
		let finishOperation;
		let dispatch;

		function makeSelect( {
			sourceType = 'image/avif',
			outputMimeType = 'image/jpeg',
			filename = 'photo.avif',
		} = {} ) {
			const sourceFile = new File( [ 'test' ], filename, {
				type: sourceType,
			} );
			return {
				getItem: () => ( {
					id: 'item-1',
					file: sourceFile,
					sourceFile,
					attachment: {
						id: 42,
						filename,
						missing_image_sizes: [ 'thumbnail', 'medium' ],
					},
				} ),
				getSettings: () => ( {
					allImageSizes: {
						thumbnail: { width: 150, height: 150, crop: true },
						medium: { width: 300, height: 300, crop: false },
					},
					imageOutputFormats: outputMimeType
						? { [ sourceType ]: outputMimeType }
						: {},
					jpegInterlaced: false,
					pngInterlaced: false,
					gifInterlaced: false,
				} ),
			};
		}

		beforeEach( () => {
			jest.clearAllMocks();
			addSideloadItem = jest.fn();
			finishOperation = jest.fn();
			dispatch = { addSideloadItem, finishOperation };
		} );

		it( 'should use batch resize with output format when transcoding', async () => {
			const select = makeSelect( {
				sourceType: 'image/avif',
				outputMimeType: 'image/jpeg',
			} );

			const thunk = generateThumbnails( 'item-1' );
			await thunk( { select, dispatch } );

			expect( vipsBatchResizeImage ).toHaveBeenCalledWith(
				'item-1',
				expect.any( File ),
				'image/jpeg',
				expect.arrayContaining( [
					expect.objectContaining( { name: 'thumbnail' } ),
					expect.objectContaining( { name: 'medium' } ),
				] ),
				false
			);
			// Sideload items should only have Upload operation.
			const thumbnailCall = addSideloadItem.mock.calls.find(
				( call ) => call[ 0 ].additionalData?.image_size === 'thumbnail'
			);
			expect( thumbnailCall ).toBeDefined();
			expect( thumbnailCall[ 0 ].operations ).toEqual( [
				OperationType.Upload,
			] );
		} );

		it( 'should use source format for batch resize when no transcoding', async () => {
			const select = makeSelect( {
				sourceType: 'image/jpeg',
				outputMimeType: undefined,
				filename: 'photo.jpg',
			} );

			const thunk = generateThumbnails( 'item-1' );
			await thunk( { select, dispatch } );

			expect( vipsBatchResizeImage ).toHaveBeenCalledWith(
				'item-1',
				expect.any( File ),
				'image/jpeg',
				expect.any( Array ),
				false
			);
		} );

		it( 'should fall back to per-thumbnail processing when batch resize fails', async () => {
			vipsBatchResizeImage.mockRejectedValueOnce( new Error( 'OOM' ) );
			const select = makeSelect( {
				sourceType: 'image/avif',
				outputMimeType: 'image/jpeg',
			} );

			const thunk = generateThumbnails( 'item-1' );
			await thunk( { select, dispatch } );

			expect( console ).toHaveWarned();

			// Should still create sideload items with ResizeCrop + TranscodeImage operations.
			const thumbnailCall = addSideloadItem.mock.calls.find(
				( call ) => call[ 0 ].additionalData?.image_size === 'thumbnail'
			);
			expect( thumbnailCall ).toBeDefined();
			expect( thumbnailCall[ 0 ].operations ).toEqual(
				expect.arrayContaining( [
					expect.arrayContaining( [ OperationType.ResizeCrop ] ),
				] )
			);
		} );
	} );

	describe( 'finalizeItem', () => {
		it( 'should call mediaFinalize with the attachment ID', async () => {
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

			expect( mediaFinalize ).toHaveBeenCalledWith( 42 );
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
				} ),
				getSettings: () => ( { mediaFinalize } ),
			};
			const dispatch = { finishOperation };

			const thunk = finalizeItem( 'test-id' );
			await thunk( { select, dispatch } );

			expect( mediaFinalize ).toHaveBeenCalledWith( 42 );
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
} );
