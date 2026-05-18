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
} from '../private-actions';
import { OperationType } from '../types';
import { vipsHasTransparency } from '../utils';

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
		isAnimatedGif: actual.isAnimatedGif,
		cloneFile: actual.cloneFile,
		convertBlobToFile: actual.convertBlobToFile,
		renameFile: actual.renameFile,
	};
} );

// Mock the mediabunny wrapper so the dynamic worker import is never executed.
jest.mock( '../utils/mediabunny', () => ( {
	mediabunnyConvertGifToVideo: jest.fn(),
	mediabunnyCancelOperations: jest.fn(),
	terminateMediabunnyWorker: jest.fn(),
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

			return dispatchedOperations;
		}

		beforeEach( () => {
			global.ImageDecoder = function () {};
			global.VideoEncoder = function () {};
		} );

		afterEach( () => {
			delete global.ImageDecoder;
			delete global.VideoEncoder;
		} );

		it( 'enqueues a TranscodeGif operation when WebCodecs is available', async () => {
			const operations = await runPrepareItem();

			expect( flattenOperations( operations ) ).toContain(
				OperationType.TranscodeGif
			);
		} );

		it( 'does not enqueue TranscodeGif when WebCodecs is unavailable', async () => {
			delete global.ImageDecoder;

			const operations = await runPrepareItem();

			expect( flattenOperations( operations ) ).not.toContain(
				OperationType.TranscodeGif
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
} );
