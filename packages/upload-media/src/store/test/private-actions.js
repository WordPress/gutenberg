/**
 * WordPress dependencies
 */
import { createBlobURL, revokeBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import {
	generateThumbnails,
	getTranscodeImageOperation,
	finalizeItem,
	prepareItem,
	transcodeGifItem,
	detectUltraHdr,
	removeItem,
} from '../private-actions';
import { OperationType, Type } from '../types';
import {
	vipsHasTransparency,
	vipsGetUltraHdrInfo,
	terminateVipsWorker,
} from '../utils';
import {
	convertGifToVideo,
	terminateVideoConversionWorker,
} from '../utils/video-conversion';

// Mock @wordpress/blob
jest.mock( '@wordpress/blob', () => ( {
	createBlobURL: jest.fn( () => 'blob:mock-url' ),
	revokeBlobURL: jest.fn(),
} ) );

// Mock vips utilities. The real isAnimatedGif() is needed by prepareItem
// so it is required from the actual module rather than stubbed out.
jest.mock( '../utils', () => {
	const actual = jest.requireActual( '../utils' );
	return {
		vipsHasTransparency: jest.fn(),
		vipsGetUltraHdrInfo: jest.fn(),
		terminateVipsWorker: jest.fn(),
		maybeRecycleVipsWorker: jest.fn(),
		isAnimatedGif: actual.isAnimatedGif,
		cloneFile: actual.cloneFile,
		convertBlobToFile: actual.convertBlobToFile,
		renameFile: actual.renameFile,
	};
} );

// Mock the video-conversion wrapper so the dynamic worker import is never
// executed. isUnsupportedConversionError is kept real so transcodeGifItem's
// graceful-skip vs. hard-failure branching is genuinely exercised.
jest.mock( '../utils/video-conversion', () => {
	const actual = jest.requireActual( '../utils/video-conversion' );
	return {
		convertGifToVideo: jest.fn(),
		cancelGifToVideoOperations: jest.fn(),
		terminateVideoConversionWorker: jest.fn(),
		isUnsupportedConversionError: actual.isUnsupportedConversionError,
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

	describe( 'prepareItem GIF to video', () => {
		// Animated GIF bytes: "GIF89a" magic followed by two Graphic
		// Control Extension headers (0x00 0x21 0xF9) so isAnimatedGif()
		// reports more than one frame.
		const animatedGifBytes = new Uint8Array( [
			0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x21, 0xf9, 0x00, 0x21,
			0xf9,
		] );

		function createGifFile() {
			return new File( [ animatedGifBytes ], 'animated.gif', {
				type: 'image/gif',
			} );
		}

		function flattenOperations( operations ) {
			return operations.map( ( op ) =>
				Array.isArray( op ) ? op[ 0 ] : op
			);
		}

		async function runPrepareItem() {
			const file = createGifFile();
			const item = {
				id: 'gif-id',
				file,
				additionalData: {},
			};

			let dispatchedOperations;
			const dispatch = ( action ) => {
				if ( action?.type === 'ADD_OPERATIONS' ) {
					dispatchedOperations = action.operations;
				}
			};
			dispatch.cancelItem = jest.fn();
			dispatch.finishOperation = jest.fn();

			const select = {
				getItem: () => item,
				getSettings: () => ( {} ),
			};

			const thunk = prepareItem( 'gif-id' );
			await thunk( { select, dispatch } );

			return { operations: dispatchedOperations, dispatch, item };
		}

		beforeEach( () => {
			global.ImageDecoder = function () {};
			global.VideoEncoder = function () {};
			// Default to opaque so the conversion branch is taken; individual
			// tests override this to exercise the transparency skip.
			vipsHasTransparency.mockResolvedValue( false );
		} );

		afterEach( () => {
			delete global.ImageDecoder;
			delete global.VideoEncoder;
		} );

		it( 'schedules a normal image upload and stashes animatedGifFile', async () => {
			// In the companion-file flow the GIF uploads as an ordinary
			// image attachment (so the editor block stays core/image),
			// and generateThumbnails sideloads the transcoded video.
			// prepareItem itself never enqueues TranscodeGif as the
			// first op — that happens inside the sideload's own
			// operations list.
			const { operations, dispatch, item } = await runPrepareItem();

			expect( flattenOperations( operations ) ).toEqual( [
				OperationType.Upload,
				OperationType.ThumbnailGeneration,
				OperationType.Finalize,
			] );
			expect( flattenOperations( operations ) ).not.toContain(
				OperationType.TranscodeGif
			);
			expect( dispatch.finishOperation ).toHaveBeenCalledWith( 'gif-id', {
				animatedGifFile: item.file,
			} );
		} );

		it( 'does not stash animatedGifFile when WebCodecs is unavailable', async () => {
			delete global.ImageDecoder;

			const { operations, dispatch } = await runPrepareItem();

			expect( flattenOperations( operations || [] ) ).not.toContain(
				OperationType.TranscodeGif
			);
			expect( dispatch.finishOperation ).not.toHaveBeenCalledWith(
				'gif-id',
				expect.objectContaining( {
					animatedGifFile: expect.anything(),
				} )
			);
		} );

		it( 'does not stash animatedGifFile for a transparent GIF', async () => {
			// A <video> cannot reproduce GIF transparency, so a transparent
			// GIF must stay a GIF.
			vipsHasTransparency.mockResolvedValue( true );

			const { dispatch } = await runPrepareItem();

			expect( vipsHasTransparency ).toHaveBeenCalled();
			expect( dispatch.finishOperation ).not.toHaveBeenCalledWith(
				'gif-id',
				expect.objectContaining( {
					animatedGifFile: expect.anything(),
				} )
			);
		} );

		it( 'keeps the GIF when the transparency check throws', async () => {
			vipsHasTransparency.mockRejectedValue(
				new Error( 'vips unavailable' )
			);

			const { dispatch } = await runPrepareItem();

			// Errs on the side of caution: no lossy conversion is attempted.
			expect( dispatch.finishOperation ).not.toHaveBeenCalledWith(
				'gif-id',
				expect.objectContaining( {
					animatedGifFile: expect.anything(),
				} )
			);
		} );

		it( 'does not enqueue TranscodeGif for a static (single-frame) GIF', async () => {
			// A static GIF has the "GIF89a" header but only one
			// Graphic Control Extension block (0x00,0x21,0xf9), so
			// isAnimatedGif() returns false.
			const staticGifBytes = new Uint8Array( [
				0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x21, 0xf9,
			] );
			const file = new File( [ staticGifBytes ], 'static.gif', {
				type: 'image/gif',
			} );
			const item = {
				id: 'gif-static-id',
				file,
				additionalData: {},
			};

			let dispatchedOperations;
			const dispatch = ( action ) => {
				if ( action?.type === 'ADD_OPERATIONS' ) {
					dispatchedOperations = action.operations;
				}
			};
			dispatch.cancelItem = jest.fn();
			dispatch.finishOperation = jest.fn();

			const select = {
				getItem: () => item,
				getSettings: () => ( {} ),
			};

			const thunk = prepareItem( 'gif-static-id' );
			await thunk( { select, dispatch } );

			// Static GIF falls through to the normal image pipeline (no TranscodeGif).
			expect(
				flattenOperations( dispatchedOperations || [] )
			).not.toContain( OperationType.TranscodeGif );
		} );

		it( 'does not enqueue TranscodeGif when gifConvert is false', async () => {
			// An animated GIF (two Graphic Control Extension blocks) with
			// gifConvert:false in settings should skip the transcode path.
			const animatedBytes = new Uint8Array( [
				0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x21, 0xf9, 0x00,
				0x21, 0xf9,
			] );
			const file = new File( [ animatedBytes ], 'animated.gif', {
				type: 'image/gif',
			} );
			const item = {
				id: 'gif-optout-id',
				file,
				additionalData: {},
			};

			let dispatchedOperations;
			const dispatch = ( action ) => {
				if ( action?.type === 'ADD_OPERATIONS' ) {
					dispatchedOperations = action.operations;
				}
			};
			dispatch.cancelItem = jest.fn();
			dispatch.finishOperation = jest.fn();

			const select = {
				getItem: () => item,
				// gifConvert:false opts out of the animated-GIF conversion path.
				getSettings: () => ( { gifConvert: false } ),
			};

			const thunk = prepareItem( 'gif-optout-id' );
			await thunk( { select, dispatch } );

			// gifConvert:false bypasses the detection branch entirely.
			expect(
				flattenOperations( dispatchedOperations || [] )
			).not.toContain( OperationType.TranscodeGif );
		} );
	} );

	describe( 'transcodeGifItem', () => {
		const gifFile = new File( [ 'gif' ], 'animation.gif', {
			type: 'image/gif',
		} );

		function buildArgs() {
			const dispatch = Object.assign( jest.fn(), {
				finishOperation: jest.fn(),
				cancelItem: jest.fn(),
				addSideloadItem: jest.fn(),
			} );
			const select = {
				getItem: jest.fn( () => ( {
					id: 'gif-1',
					file: gifFile,
					parentId: 'parent-1',
					additionalData: { post: 42 },
				} ) ),
			};
			return { select, dispatch };
		}

		let consoleError;

		beforeEach( () => {
			convertGifToVideo.mockReset();
			createBlobURL.mockClear();
			consoleError = jest
				.spyOn( console, 'error' )
				.mockImplementation( () => {} );
		} );

		afterEach( () => {
			consoleError.mockRestore();
		} );

		it( 'hands the transcoded video to the next Upload via finishOperation', async () => {
			const videoFile = new File( [ 'mp4' ], 'animation.mp4', {
				type: 'video/mp4',
			} );
			convertGifToVideo.mockResolvedValue( videoFile );
			const { select, dispatch } = buildArgs();

			await transcodeGifItem( 'gif-1', { outputFormat: 'mp4' } )( {
				select,
				dispatch,
			} );

			expect( convertGifToVideo ).toHaveBeenCalledWith(
				'gif-1',
				gifFile,
				'video/mp4'
			);
			// Sideload context: no CacheBlobUrl, no attachment URL update -
			// the parent GIF attachment already owns the block's URL.
			expect( createBlobURL ).not.toHaveBeenCalled();
			expect( dispatch ).not.toHaveBeenCalledWith(
				expect.objectContaining( { type: Type.CacheBlobUrl } )
			);
			expect( dispatch.finishOperation ).toHaveBeenCalledWith( 'gif-1', {
				file: videoFile,
			} );
			expect( dispatch.cancelItem ).not.toHaveBeenCalled();
		} );

		it( 'sideloads the first-frame poster as a sibling once the video succeeds', async () => {
			convertGifToVideo.mockResolvedValue(
				new File( [ 'mp4' ], 'animation.mp4', { type: 'video/mp4' } )
			);
			const { select, dispatch } = buildArgs();

			await transcodeGifItem( 'gif-1', { outputFormat: 'mp4' } )( {
				select,
				dispatch,
			} );

			expect( dispatch.addSideloadItem ).toHaveBeenCalledTimes( 1 );
			const poster = dispatch.addSideloadItem.mock.calls[ 0 ][ 0 ];
			/*
			 * Built from the original GIF (captured before finishOperation
			 * swaps in the video) and parented to the GIF attachment.
			 */
			expect( poster.file ).toBe( gifFile );
			expect( poster.parentId ).toBe( 'parent-1' );
			expect( poster.additionalData ).toEqual(
				expect.objectContaining( {
					post: 42,
					image_size: 'animated-video-poster',
					convert_format: false,
				} )
			);
			expect( poster.operations[ 0 ][ 0 ] ).toBe(
				OperationType.TranscodeImage
			);
			expect( poster.operations[ 0 ][ 1 ] ).toEqual(
				expect.objectContaining( { outputFormat: 'jpeg' } )
			);
			expect( poster.operations[ 1 ] ).toBe( OperationType.Upload );
		} );

		it( 'defaults to mp4 when no output format is given', async () => {
			convertGifToVideo.mockResolvedValue(
				new File( [ 'mp4' ], 'animation.mp4', { type: 'video/mp4' } )
			);
			const { select, dispatch } = buildArgs();

			await transcodeGifItem( 'gif-1' )( { select, dispatch } );

			expect( convertGifToVideo ).toHaveBeenCalledWith(
				'gif-1',
				gifFile,
				'video/mp4'
			);
		} );

		it( 'silently cancels the sideload on an Unsupported error', async () => {
			// The parent GIF attachment is already uploaded; falling back
			// to "upload the original GIF" here would write a meaningless
			// animated_video meta entry pointing at the GIF itself. Just
			// cancel the sideload — silently — and let the GIF stand alone.
			convertGifToVideo.mockRejectedValue(
				new Error( 'Unsupported: WebCodecs unavailable' )
			);
			const { select, dispatch } = buildArgs();

			await transcodeGifItem( 'gif-1' )( { select, dispatch } );

			expect( dispatch.finishOperation ).not.toHaveBeenCalled();
			expect( dispatch.cancelItem ).toHaveBeenCalledTimes( 1 );
			const [ cancelledId, , silent ] =
				dispatch.cancelItem.mock.calls[ 0 ];
			expect( cancelledId ).toBe( 'gif-1' );
			expect( silent ).toBe( true );
			expect( consoleError ).not.toHaveBeenCalled();
			// No video means no poster: the sideload is never queued.
			expect( dispatch.addSideloadItem ).not.toHaveBeenCalled();
		} );

		it( 'silently cancels the sideload on a hard transcoding failure', async () => {
			// A real engine failure is also not user-actionable on what the
			// user thinks of as an image upload: log the cause, cancel
			// the sideload silently, leave the GIF attachment untouched.
			const cause = new Error( 'Encoder produced empty output' );
			convertGifToVideo.mockRejectedValue( cause );
			const { select, dispatch } = buildArgs();

			await transcodeGifItem( 'gif-1' )( { select, dispatch } );

			expect( dispatch.finishOperation ).not.toHaveBeenCalled();
			expect( dispatch.cancelItem ).toHaveBeenCalledTimes( 1 );
			const [ cancelledId, error, silent ] =
				dispatch.cancelItem.mock.calls[ 0 ];
			expect( cancelledId ).toBe( 'gif-1' );
			expect( error.code ).toBe( 'GIF_TRANSCODING_ERROR' );
			expect( error.cause ).toBe( cause );
			expect( silent ).toBe( true );
			expect( consoleError ).toHaveBeenCalled();
			// No video means no poster: the sideload is never queued.
			expect( dispatch.addSideloadItem ).not.toHaveBeenCalled();
		} );

		it( 'does nothing when the item is not in the queue', async () => {
			const { dispatch } = buildArgs();
			const select = { getItem: jest.fn( () => undefined ) };

			await transcodeGifItem( 'missing' )( { select, dispatch } );

			expect( convertGifToVideo ).not.toHaveBeenCalled();
			expect( dispatch.finishOperation ).not.toHaveBeenCalled();
			expect( dispatch.cancelItem ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'generateThumbnails (animated GIF video sideload)', () => {
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

			/*
			 * Only the video is sideloaded here; the poster is queued later by
			 * the TranscodeGif operation once the conversion succeeds.
			 */
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

	describe( 'removeItem worker teardown', () => {
		beforeEach( () => {
			jest.clearAllMocks();
		} );

		const runRemove = async ( remaining ) =>
			removeItem( 'item-1' )( {
				select: {
					getItem: () => ( {} ),
					getAllItems: () => remaining,
				},
				dispatch: jest.fn(),
			} );

		it( 'terminates both background workers once the queue empties', async () => {
			await runRemove( [] );

			expect( terminateVipsWorker ).toHaveBeenCalledTimes( 1 );
			expect( terminateVideoConversionWorker ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'leaves the workers running while items remain in the queue', async () => {
			await runRemove( [ { id: 'item-2' } ] );

			expect( terminateVipsWorker ).not.toHaveBeenCalled();
			expect( terminateVideoConversionWorker ).not.toHaveBeenCalled();
		} );
	} );
} );
