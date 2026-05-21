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
	transcodeGifItem,
	prepareItem,
	generateThumbnails,
} from '../private-actions';
import { OperationType, Type } from '../types';
import { vipsHasTransparency } from '../utils';
import { ffmpegConvertGifToVideo } from '../utils/ffmpeg';
import { UploadError } from '../../upload-error';
import { isAnimatedGif } from '../../utils';

// Mock @wordpress/blob
jest.mock( '@wordpress/blob', () => ( {
	createBlobURL: jest.fn( () => 'blob:mock-url' ),
	revokeBlobURL: jest.fn(),
} ) );

// Mock vips utilities
jest.mock( '../utils', () => ( {
	vipsHasTransparency: jest.fn(),
} ) );

// Mock ffmpeg utilities
jest.mock( '../utils/ffmpeg', () => ( {
	ffmpegConvertGifToVideo: jest.fn(),
} ) );

// Mock isAnimatedGif so prepareItem tests don't depend on real GIF byte
// patterns. The isAnimatedGif function is exhaustively tested elsewhere.
jest.mock( '../../utils', () => {
	const actual = jest.requireActual( '../../utils' );
	return {
		...actual,
		isAnimatedGif: jest.fn(),
	};
} );

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

	describe( 'transcodeGifItem', () => {
		const gifFile = new File( [ new Uint8Array( [ 0x47 ] ) ], 'cat.gif', {
			type: 'image/gif',
		} );

		beforeEach( () => {
			jest.clearAllMocks();
		} );

		it( 'converts to mp4 by default and dispatches CacheBlobUrl + finishOperation', async () => {
			const videoFile = new File(
				[ new Uint8Array( [ 0, 1, 2 ] ) ],
				'cat.mp4',
				{ type: 'video/mp4' }
			);
			ffmpegConvertGifToVideo.mockResolvedValue( videoFile );

			const dispatchFn = jest.fn();
			dispatchFn.finishOperation = jest.fn();
			dispatchFn.cancelItem = jest.fn();

			const select = {
				getItem: () => ( { id: 'queue-1', file: gifFile } ),
			};

			const thunk = transcodeGifItem( 'queue-1' );
			await thunk( { select, dispatch: dispatchFn } );

			expect( ffmpegConvertGifToVideo ).toHaveBeenCalledWith(
				'queue-1',
				gifFile,
				'video/mp4'
			);
			expect( createBlobURL ).toHaveBeenCalledWith( videoFile );
			expect( dispatchFn ).toHaveBeenCalledWith( {
				type: Type.CacheBlobUrl,
				id: 'queue-1',
				blobUrl: 'blob:mock-url',
			} );
			expect( dispatchFn.finishOperation ).toHaveBeenCalledWith(
				'queue-1',
				{
					file: videoFile,
					attachment: { url: 'blob:mock-url' },
				}
			);
			expect( dispatchFn.cancelItem ).not.toHaveBeenCalled();
		} );

		it( 'uses webm when outputFormat is webm', async () => {
			ffmpegConvertGifToVideo.mockResolvedValue(
				new File( [], 'cat.webm', { type: 'video/webm' } )
			);

			const dispatchFn = jest.fn();
			dispatchFn.finishOperation = jest.fn();
			dispatchFn.cancelItem = jest.fn();

			const select = {
				getItem: () => ( { id: 'queue-2', file: gifFile } ),
			};

			const thunk = transcodeGifItem( 'queue-2', {
				outputFormat: 'webm',
			} );
			await thunk( { select, dispatch: dispatchFn } );

			expect( ffmpegConvertGifToVideo ).toHaveBeenCalledWith(
				'queue-2',
				gifFile,
				'video/webm'
			);
		} );

		it( 'cancels the item with an UploadError when conversion fails', async () => {
			ffmpegConvertGifToVideo.mockRejectedValue(
				new Error( 'worker crashed' )
			);

			const dispatchFn = jest.fn();
			dispatchFn.finishOperation = jest.fn();
			dispatchFn.cancelItem = jest.fn();

			const select = {
				getItem: () => ( { id: 'queue-3', file: gifFile } ),
			};

			const thunk = transcodeGifItem( 'queue-3' );
			await thunk( { select, dispatch: dispatchFn } );

			expect( dispatchFn.finishOperation ).not.toHaveBeenCalled();
			expect( dispatchFn.cancelItem ).toHaveBeenCalledTimes( 1 );
			const [ id, error ] = dispatchFn.cancelItem.mock.calls[ 0 ];
			expect( id ).toBe( 'queue-3' );
			expect( error ).toBeInstanceOf( UploadError );
			expect( error.code ).toBe( 'GIF_TRANSCODING_ERROR' );
			expect( error.file ).toBe( gifFile );
			expect( error.cause ).toBeInstanceOf( Error );
			expect( error.cause.message ).toBe( 'worker crashed' );
			expect( console ).toHaveErrored();
		} );

		it( 'returns early when the queued item is missing', async () => {
			const dispatchFn = jest.fn();
			dispatchFn.finishOperation = jest.fn();
			dispatchFn.cancelItem = jest.fn();

			const select = { getItem: () => undefined };

			const thunk = transcodeGifItem( 'queue-missing' );
			await thunk( { select, dispatch: dispatchFn } );

			expect( ffmpegConvertGifToVideo ).not.toHaveBeenCalled();
			expect( dispatchFn.finishOperation ).not.toHaveBeenCalled();
			expect( dispatchFn.cancelItem ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'prepareItem (animated GIF → image; video sideloaded later)', () => {
		const originalCrossOriginIsolated = Reflect.getOwnPropertyDescriptor(
			globalThis,
			'crossOriginIsolated'
		);

		function setCrossOriginIsolated( value ) {
			Object.defineProperty( globalThis, 'crossOriginIsolated', {
				configurable: true,
				get: () => value,
			} );
		}

		function makeGifItem( id = 'q', additionalData = {} ) {
			const file = new File(
				[ new Uint8Array( [ 0x47, 0x49, 0x46, 0x38 ] ) ],
				'animated.gif',
				{ type: 'image/gif' }
			);
			return { id, file, additionalData };
		}

		beforeEach( () => {
			jest.clearAllMocks();
			setCrossOriginIsolated( true );
			// Default to opaque so the conversion branch is taken; individual
			// tests override this to exercise the transparency skip.
			vipsHasTransparency.mockResolvedValue( false );
		} );

		afterAll( () => {
			if ( originalCrossOriginIsolated ) {
				Object.defineProperty(
					globalThis,
					'crossOriginIsolated',
					originalCrossOriginIsolated
				);
			}
		} );

		function runPrepare( { item, settings, id = 'q' } ) {
			const dispatchFn = jest.fn();
			dispatchFn.finishOperation = jest.fn();
			dispatchFn.addSideloadItem = jest.fn();
			const select = {
				getItem: () => item,
				getSettings: () => settings,
			};
			return transcodePrepareAndCapture(
				{ select, dispatch: dispatchFn },
				id
			);
		}

		async function transcodePrepareAndCapture( args, id ) {
			const thunk = prepareItem( id );
			await thunk( args );
			return args.dispatch;
		}

		function gifFinishCall( dispatchFn ) {
			return dispatchFn.finishOperation.mock.calls.find(
				( [ , payload ] ) => payload?.animatedGifFile !== undefined
			);
		}

		it( 'uploads an animated GIF as an image and stashes it for sideload', async () => {
			isAnimatedGif.mockReturnValue( true );
			const item = makeGifItem( 'q-anim' );

			const dispatchFn = await runPrepare( {
				item,
				settings: {},
				id: 'q-anim',
			} );

			// The GIF flows through the normal image pipeline so the
			// block stays a valid core/image.
			const addOpsCall = dispatchFn.mock.calls.find(
				( [ action ] ) => action?.type === Type.AddOperations
			);
			expect( addOpsCall ).toBeDefined();
			const [ action ] = addOpsCall;
			expect( action.id ).toBe( 'q-anim' );
			expect( action.operations ).toEqual( [
				OperationType.Upload,
				OperationType.ThumbnailGeneration,
				OperationType.Finalize,
			] );

			// The original GIF is stashed so generateThumbnails can
			// transcode + sideload it as a companion file. No separate
			// attachment/queue item is created.
			expect( dispatchFn.finishOperation ).toHaveBeenCalledWith(
				'q-anim',
				{ animatedGifFile: item.file }
			);
		} );

		it( 'does not alter the queue item additionalData', async () => {
			isAnimatedGif.mockReturnValue( true );
			const item = makeGifItem( 'q-additional', {
				post_id: 7,
				custom: 'keep-me',
			} );

			const dispatchFn = await runPrepare( {
				item,
				settings: {},
				id: 'q-additional',
			} );

			const call = gifFinishCall( dispatchFn );
			expect( call ).toBeDefined();
			expect( call[ 1 ] ).toEqual( { animatedGifFile: item.file } );
		} );

		it( 'skips the GIF branch when settings.gifConvert is false', async () => {
			isAnimatedGif.mockReturnValue( true );
			const item = makeGifItem( 'q-off' );

			const dispatchFn = await runPrepare( {
				item,
				settings: { gifConvert: false },
				id: 'q-off',
			} );

			expect( gifFinishCall( dispatchFn ) ).toBeUndefined();
		} );

		it( 'skips the GIF branch when crossOriginIsolated is false', async () => {
			isAnimatedGif.mockReturnValue( true );
			setCrossOriginIsolated( false );
			const item = makeGifItem( 'q-not-isolated' );

			const dispatchFn = await runPrepare( {
				item,
				settings: {},
				id: 'q-not-isolated',
			} );

			// isAnimatedGif should never be consulted because the isolation
			// check short-circuits first.
			expect( isAnimatedGif ).not.toHaveBeenCalled();
			expect( gifFinishCall( dispatchFn ) ).toBeUndefined();
		} );

		it( 'falls through when the GIF is not animated', async () => {
			isAnimatedGif.mockReturnValue( false );
			const item = makeGifItem( 'q-static' );

			const dispatchFn = await runPrepare( {
				item,
				settings: {},
				id: 'q-static',
			} );

			// A static GIF takes the normal image path: it is not stashed
			// for video sideload.
			expect( gifFinishCall( dispatchFn ) ).toBeUndefined();
		} );

		it( 'keeps a transparent animated GIF as an image (no video sideload)', async () => {
			isAnimatedGif.mockReturnValue( true );
			// A <video> cannot reproduce GIF transparency, so a transparent
			// GIF must stay a GIF.
			vipsHasTransparency.mockResolvedValue( true );
			const item = makeGifItem( 'q-transparent' );

			const dispatchFn = await runPrepare( {
				item,
				settings: {},
				id: 'q-transparent',
			} );

			expect( vipsHasTransparency ).toHaveBeenCalled();
			expect( gifFinishCall( dispatchFn ) ).toBeUndefined();
		} );

		it( 'keeps the GIF when the transparency check throws', async () => {
			isAnimatedGif.mockReturnValue( true );
			vipsHasTransparency.mockRejectedValue(
				new Error( 'vips unavailable' )
			);
			const item = makeGifItem( 'q-throws' );

			const dispatchFn = await runPrepare( {
				item,
				settings: {},
				id: 'q-throws',
			} );

			// Errs on the side of caution: no lossy conversion is attempted.
			expect( gifFinishCall( dispatchFn ) ).toBeUndefined();
		} );
	} );

	describe( 'generateThumbnails (animated GIF video sideload)', () => {
		beforeEach( () => {
			jest.clearAllMocks();
		} );

		function runGenerate( { item, settings } ) {
			const dispatchFn = jest.fn();
			dispatchFn.finishOperation = jest.fn();
			dispatchFn.addSideloadItem = jest.fn();
			const select = {
				getItem: () => item,
				getSettings: () => settings,
			};
			const thunk = generateThumbnails( item.id );
			return thunk( { select, dispatch: dispatchFn } ).then(
				() => dispatchFn
			);
		}

		function makeGif( name = 'animated.gif' ) {
			return new File(
				[ new Uint8Array( [ 0x47, 0x49, 0x46, 0x38 ] ) ],
				name,
				{ type: 'image/gif' }
			);
		}

		it( 'sideloads the converted video as an animated-video companion', async () => {
			const gif = makeGif();
			const item = {
				id: 'g',
				sourceFile: gif,
				file: gif,
				animatedGifFile: gif,
				attachment: { id: 42 },
			};

			const dispatchFn = await runGenerate( {
				item,
				settings: { videoOutputFormat: 'video/mp4' },
			} );

			expect( dispatchFn.addSideloadItem ).toHaveBeenCalledTimes( 1 );
			const sideload = dispatchFn.addSideloadItem.mock.calls[ 0 ][ 0 ];
			expect( sideload.file ).toBe( gif );
			expect( sideload.parentId ).toBe( 'g' );
			expect( sideload.additionalData ).toEqual(
				expect.objectContaining( {
					post: 42,
					image_size: 'animated-video',
					convert_format: false,
				} )
			);
			expect( sideload.operations ).toEqual( [
				[ OperationType.TranscodeGif, { outputFormat: 'mp4' } ],
				OperationType.Upload,
			] );
		} );

		it( 'uses webm when videoOutputFormat is video/webm', async () => {
			const gif = makeGif();
			const item = {
				id: 'g2',
				sourceFile: gif,
				file: gif,
				animatedGifFile: gif,
				attachment: { id: 7 },
			};

			const dispatchFn = await runGenerate( {
				item,
				settings: { videoOutputFormat: 'video/webm' },
			} );

			const sideload = dispatchFn.addSideloadItem.mock.calls[ 0 ][ 0 ];
			expect( sideload.operations[ 0 ] ).toEqual( [
				OperationType.TranscodeGif,
				{ outputFormat: 'webm' },
			] );
		} );

		it( 'does not sideload a video for non-GIF uploads', async () => {
			const jpeg = new File( [ 'x' ], 'photo.jpg', {
				type: 'image/jpeg',
			} );
			const item = {
				id: 'g3',
				sourceFile: jpeg,
				file: jpeg,
				attachment: { id: 9 },
			};

			const dispatchFn = await runGenerate( { item, settings: {} } );

			expect( dispatchFn.addSideloadItem ).not.toHaveBeenCalled();
		} );
	} );
} );
