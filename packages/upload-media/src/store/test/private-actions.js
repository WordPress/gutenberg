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
	prepareItem,
	generateThumbnails,
} from '../private-actions';
import { OperationType } from '../types';
import { vipsHasTransparency } from '../utils';
import { canvasConvertToJpeg } from '../../canvas-utils';
import { isClientSideMediaSupported } from '../../feature-detection';

// Mock @wordpress/blob
jest.mock( '@wordpress/blob', () => ( {
	createBlobURL: jest.fn( () => 'blob:mock-url' ),
	revokeBlobURL: jest.fn(),
	isBlobURL: jest.fn( () => false ),
} ) );

// Mock vips utilities
jest.mock( '../utils', () => ( {
	vipsHasTransparency: jest.fn(),
	vipsResizeImage: jest.fn(),
	vipsRotateImage: jest.fn(),
	vipsConvertImageFormat: jest.fn(),
	terminateVipsWorker: jest.fn(),
} ) );

// Mock canvas-utils
jest.mock( '../../canvas-utils', () => ( {
	canvasConvertToJpeg: jest.fn(),
} ) );

// Mock feature-detection
jest.mock( '../../feature-detection', () => ( {
	isClientSideMediaSupported: jest.fn( () => true ),
} ) );

// Mock uuid
jest.mock( 'uuid', () => ( {
	v4: jest.fn( () => 'mock-uuid' ),
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

	describe( 'prepareItem - HEIC handling', () => {
		const heicFile = new File( [ 'heic-data' ], 'photo.heic', {
			type: 'image/heic',
		} );

		const jpegFile = new File( [ 'jpeg-data' ], 'photo.jpeg', {
			type: 'image/jpeg',
		} );

		beforeEach( () => {
			jest.clearAllMocks();
			canvasConvertToJpeg.mockResolvedValue( jpegFile );
			isClientSideMediaSupported.mockReturnValue( true );
		} );

		it( 'should preserve original HEIC in sourceFile and set file to JPEG', async () => {
			const finishOperation = jest.fn();
			const dispatch = Object.assign( jest.fn(), {
				finishOperation,
				cancelItem: jest.fn(),
			} );

			const select = {
				getItem: () => ( {
					id: 'test-id',
					file: heicFile,
					sourceFile: heicFile,
					additionalData: {
						generate_sub_sizes: false,
						convert_format: false,
					},
				} ),
				getSettings: () => ( {
					imageQuality: 0.82,
				} ),
			};

			const thunk = prepareItem( 'test-id' );
			await thunk( { select, dispatch } );

			// finishOperation should be called with file=JPEG but NOT sourceFile
			expect( finishOperation ).toHaveBeenCalledWith(
				'test-id',
				expect.objectContaining( {
					file: jpegFile,
					additionalData: expect.objectContaining( {
						convert_format: true,
					} ),
				} )
			);

			// sourceFile should NOT be in the updates (preserving original HEIC)
			const updates = finishOperation.mock.calls[ 0 ][ 1 ];
			expect( updates ).not.toHaveProperty( 'sourceFile' );
		} );

		it( 'should cancel item when HEIC conversion fails', async () => {
			canvasConvertToJpeg.mockRejectedValue(
				new Error( 'Decode failed' )
			);

			const cancelItem = jest.fn();
			const dispatch = Object.assign( jest.fn(), {
				finishOperation: jest.fn(),
				cancelItem,
			} );

			const select = {
				getItem: () => ( {
					id: 'test-id',
					file: heicFile,
					sourceFile: heicFile,
					additionalData: {
						generate_sub_sizes: false,
						convert_format: false,
					},
				} ),
				getSettings: () => ( {} ),
			};

			const thunk = prepareItem( 'test-id' );
			await thunk( { select, dispatch } );

			expect( cancelItem ).toHaveBeenCalledWith(
				'test-id',
				expect.objectContaining( {
					code: 'HEIC_DECODE_ERROR',
				} )
			);
		} );
	} );

	describe( 'generateThumbnails - HEIC handling', () => {
		const heicFile = new File( [ 'heic-data' ], 'photo.heic', {
			type: 'image/heic',
		} );

		const jpegFile = new File( [ 'jpeg-data' ], 'photo.jpeg', {
			type: 'image/jpeg',
		} );

		beforeEach( () => {
			jest.clearAllMocks();
		} );

		it( 'should sideload original HEIC as "original" when source is HEIC', async () => {
			const addSideloadItem = jest.fn();
			const finishOperation = jest.fn();
			const dispatch = Object.assign( jest.fn(), {
				addSideloadItem,
				finishOperation,
			} );

			const select = {
				getItem: () => ( {
					id: 'test-id',
					file: jpegFile,
					sourceFile: heicFile,
					attachment: {
						id: 42,
						missing_image_sizes: [],
					},
					abortController: new AbortController(),
				} ),
				getSettings: () => ( {} ),
			};

			const thunk = generateThumbnails( 'test-id' );
			await thunk( { select, dispatch } );

			// Should sideload the HEIC as "original"
			expect( addSideloadItem ).toHaveBeenCalledWith(
				expect.objectContaining( {
					file: heicFile,
					additionalData: expect.objectContaining( {
						post: 42,
						image_size: 'original',
					} ),
				} )
			);
		} );

		it( 'should not sideload HEIC as "original" for non-HEIC files', async () => {
			const addSideloadItem = jest.fn();
			const finishOperation = jest.fn();
			const dispatch = Object.assign( jest.fn(), {
				addSideloadItem,
				finishOperation,
			} );

			const select = {
				getItem: () => ( {
					id: 'test-id',
					file: jpegFile,
					sourceFile: jpegFile,
					attachment: {
						id: 42,
						missing_image_sizes: [],
					},
					abortController: new AbortController(),
				} ),
				getSettings: () => ( {} ),
			};

			const thunk = generateThumbnails( 'test-id' );
			await thunk( { select, dispatch } );

			// Should NOT sideload as "original" for non-HEIC
			const originalSideloads = addSideloadItem.mock.calls.filter(
				( call ) => call[ 0 ].additionalData.image_size === 'original'
			);
			expect( originalSideloads ).toHaveLength( 0 );
		} );

		it( 'should use JPEG file for thumbnail generation when source is HEIC', async () => {
			// Mock createImageBitmap for the scaled check
			const closeMock = jest.fn();
			global.createImageBitmap = jest.fn().mockResolvedValue( {
				width: 100,
				height: 100,
				close: closeMock,
			} );

			const addSideloadItem = jest.fn();
			const finishOperation = jest.fn();
			const dispatch = Object.assign( jest.fn(), {
				addSideloadItem,
				finishOperation,
			} );

			const select = {
				getItem: () => ( {
					id: 'test-id',
					file: jpegFile,
					sourceFile: heicFile,
					attachment: {
						id: 42,
						filename: 'photo.jpeg',
						missing_image_sizes: [ 'thumbnail' ],
					},
					abortController: new AbortController(),
				} ),
				getSettings: () => ( {
					allImageSizes: {
						thumbnail: { width: 150, height: 150 },
					},
					bigImageSizeThreshold: 2560,
				} ),
			};

			const thunk = generateThumbnails( 'test-id' );
			await thunk( { select, dispatch } );

			// Find the thumbnail sideload (not the "original" sideload)
			const thumbnailSideloads = addSideloadItem.mock.calls.filter(
				( call ) => call[ 0 ].additionalData.image_size === 'thumbnail'
			);
			expect( thumbnailSideloads ).toHaveLength( 1 );

			// The file used for thumbnails should be JPEG-based (not HEIC)
			const thumbnailFile = thumbnailSideloads[ 0 ][ 0 ].file;
			expect( thumbnailFile.type ).toBe( 'image/jpeg' );
		} );
	} );
} );
