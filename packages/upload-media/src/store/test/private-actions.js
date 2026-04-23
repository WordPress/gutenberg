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
	hasGainMap,
} from '../private-actions';
import { OperationType } from '../types';
import { vipsHasTransparency, vipsConvertImageFormat } from '../utils';

// Mock @wordpress/blob
jest.mock( '@wordpress/blob', () => ( {
	createBlobURL: jest.fn( () => 'blob:mock-url' ),
	revokeBlobURL: jest.fn(),
} ) );

// Mock vips utilities
jest.mock( '../utils', () => ( {
	vipsHasTransparency: jest.fn(),
	vipsConvertImageFormat: jest.fn(),
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

	describe( 'generateThumbnails - PNG intermediate conversion', () => {
		let addSideloadItem;
		let finishOperation;
		let dispatch;

		const pngFile = new File( [ 'png-data' ], 'converted.png', {
			type: 'image/png',
		} );

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
			vipsConvertImageFormat.mockResolvedValue( pngFile );
		} );

		it( 'should convert AVIF to PNG intermediate when output format differs', async () => {
			const select = makeSelect( {
				sourceType: 'image/avif',
				outputMimeType: 'image/jpeg',
			} );

			const thunk = generateThumbnails( 'item-1' );
			await thunk( { select, dispatch } );

			expect( vipsConvertImageFormat ).toHaveBeenCalledWith(
				'item-1',
				expect.any( File ),
				'image/png',
				1,
				false
			);
			// Each thumbnail sideload item should use the PNG file.
			const thumbnailCall = addSideloadItem.mock.calls.find(
				( call ) => call[ 0 ].additionalData?.image_size === 'thumbnail'
			);
			expect( thumbnailCall ).toBeDefined();
			expect( thumbnailCall[ 0 ].file ).toBe( pngFile );
		} );

		it( 'should skip PNG conversion when source is already PNG', async () => {
			vipsHasTransparency.mockResolvedValue( false );
			const select = makeSelect( {
				sourceType: 'image/png',
				outputMimeType: 'image/jpeg',
				filename: 'photo.png',
			} );

			const thunk = generateThumbnails( 'item-1' );
			await thunk( { select, dispatch } );

			expect( vipsConvertImageFormat ).not.toHaveBeenCalled();
		} );

		it( 'should skip PNG conversion when source and output formats match', async () => {
			const select = makeSelect( {
				sourceType: 'image/jpeg',
				outputMimeType: undefined,
				filename: 'photo.jpg',
			} );

			const thunk = generateThumbnails( 'item-1' );
			await thunk( { select, dispatch } );

			expect( vipsConvertImageFormat ).not.toHaveBeenCalled();
		} );

		it( 'should skip PNG conversion for GIF source (animated format)', async () => {
			const select = makeSelect( {
				sourceType: 'image/gif',
				outputMimeType: 'image/jpeg',
				filename: 'animation.gif',
			} );

			const thunk = generateThumbnails( 'item-1' );
			await thunk( { select, dispatch } );

			expect( vipsConvertImageFormat ).not.toHaveBeenCalled();
		} );

		it( 'should convert WebP to PNG intermediate when output format differs', async () => {
			const select = makeSelect( {
				sourceType: 'image/webp',
				outputMimeType: 'image/jpeg',
				filename: 'image.webp',
			} );

			const thunk = generateThumbnails( 'item-1' );
			await thunk( { select, dispatch } );

			expect( vipsConvertImageFormat ).toHaveBeenCalledWith(
				'item-1',
				expect.any( File ),
				'image/png',
				1,
				false
			);
		} );

		it( 'should fall back to original file when PNG conversion fails', async () => {
			vipsConvertImageFormat.mockRejectedValue(
				new Error( 'Conversion failed' )
			);
			const select = makeSelect( {
				sourceType: 'image/avif',
				outputMimeType: 'image/jpeg',
			} );

			const thunk = generateThumbnails( 'item-1' );
			await thunk( { select, dispatch } );

			// Should still create sideload items with original file.
			const thumbnailCall = addSideloadItem.mock.calls.find(
				( call ) => call[ 0 ].additionalData?.image_size === 'thumbnail'
			);
			expect( thumbnailCall ).toBeDefined();
			expect( thumbnailCall[ 0 ].file.type ).toBe( 'image/avif' );
		} );

		it( 'should skip PNG conversion for images with HDR gain maps', async () => {
			// Build a JPEG file that contains the gain map XMP namespace.
			const gainMapXmp =
				'<x:xmpmeta>' +
				'<rdf:Description xmlns:hdrgm="http://ns.adobe.com/hdr-gain-map/1.0/">' +
				'<hdrgm:Version>1.0</hdrgm:Version>' +
				'</rdf:Description>' +
				'</x:xmpmeta>';
			const sourceFile = new File( [ gainMapXmp ], 'photo.jpg', {
				type: 'image/jpeg',
			} );

			const select = {
				getItem: () => ( {
					id: 'item-1',
					file: sourceFile,
					sourceFile,
					attachment: {
						id: 42,
						filename: 'photo.jpg',
						missing_image_sizes: [ 'thumbnail' ],
					},
				} ),
				getSettings: () => ( {
					allImageSizes: {
						thumbnail: { width: 150, height: 150, crop: true },
					},
					imageOutputFormats: { 'image/jpeg': 'image/avif' },
					jpegInterlaced: false,
					pngInterlaced: false,
					gifInterlaced: false,
				} ),
			};

			const thunk = generateThumbnails( 'item-1' );
			await thunk( { select, dispatch } );

			// PNG conversion should NOT be called because the file has a gain map.
			expect( vipsConvertImageFormat ).not.toHaveBeenCalled();

			// Thumbnail should use the original source file.
			const thumbnailCall = addSideloadItem.mock.calls.find(
				( call ) => call[ 0 ].additionalData?.image_size === 'thumbnail'
			);
			expect( thumbnailCall ).toBeDefined();
			expect( thumbnailCall[ 0 ].file.type ).toBe( 'image/jpeg' );
		} );
	} );

	describe( 'hasGainMap', () => {
		it( 'should return true for files containing gain map XMP namespace', async () => {
			const xmpData =
				'<rdf:Description xmlns:hdrgm="http://ns.adobe.com/hdr-gain-map/1.0/">';
			const file = new File( [ xmpData ], 'hdr.jpg', {
				type: 'image/jpeg',
			} );
			expect( await hasGainMap( file ) ).toBe( true );
		} );

		it( 'should return false for files without gain map data', async () => {
			const file = new File( [ 'regular jpeg data' ], 'photo.jpg', {
				type: 'image/jpeg',
			} );
			expect( await hasGainMap( file ) ).toBe( false );
		} );

		it( 'should return false for empty files', async () => {
			const file = new File( [], 'empty.jpg', {
				type: 'image/jpeg',
			} );
			expect( await hasGainMap( file ) ).toBe( false );
		} );
	} );
} );
