import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { canvasConvertToJpeg, HeicUnsupportedError } from '../canvas-utils';
import { getHeicUnsupportedMessage } from '../heic-support';

/*
 * A small, valid HEIC. Every decoder is stubbed out below, so what the bytes
 * decide is whether the container parses, which is how a damaged file is
 * told apart from a browser without a codec.
 */
const validHeic = readFileSync(
	join( __dirname, 'fixtures', 'exif-rotated-90cw.heic' )
);

function heicFile( bytes: Uint8Array ) {
	return new File( [ new Uint8Array( bytes ) ], 'photo.heic', {
		type: 'image/heic',
	} );
}

describe( 'canvasConvertToJpeg', () => {
	const originalCreateImageBitmap = global.createImageBitmap;
	const originalOffscreenCanvas = global.OffscreenCanvas;
	const originalImageDecoder = ( global as any ).ImageDecoder;
	const originalVideoDecoder = ( global as any ).VideoDecoder;

	afterEach( () => {
		// Restore all globals.
		if ( originalCreateImageBitmap ) {
			global.createImageBitmap = originalCreateImageBitmap;
		} else {
			// @ts-expect-error The operand of `delete` must be optional.
			delete global.createImageBitmap;
		}
		if ( originalOffscreenCanvas ) {
			global.OffscreenCanvas = originalOffscreenCanvas;
		} else {
			// @ts-expect-error The operand of `delete` must be optional.
			delete global.OffscreenCanvas;
		}
		if ( originalImageDecoder ) {
			( global as any ).ImageDecoder = originalImageDecoder;
		} else {
			delete ( global as any ).ImageDecoder;
		}
		if ( originalVideoDecoder ) {
			( global as any ).VideoDecoder = originalVideoDecoder;
		} else {
			delete ( global as any ).VideoDecoder;
		}
		delete ( global as any ).EncodedVideoChunk;
	} );

	describe( 'Strategy 1: createImageBitmap + OffscreenCanvas', () => {
		it( 'should convert via createImageBitmap when available', async () => {
			const jpegBlob = new Blob( [ 'jpeg-data' ], {
				type: 'image/jpeg',
			} );

			const mockBitmap = {
				width: 200,
				height: 150,
				close: vi.fn(),
			};

			const mockCtx = {
				drawImage: vi.fn(),
			};

			global.createImageBitmap = vi.fn().mockResolvedValue( mockBitmap );
			global.OffscreenCanvas = vi
				.fn()
				.mockImplementation( function OffscreenCanvas() {
					return {
						getContext: vi.fn().mockReturnValue( mockCtx ),
						convertToBlob: vi.fn().mockResolvedValue( jpegBlob ),
					};
				} );

			const file = new File( [ 'heic-data' ], 'photo.heic', {
				type: 'image/heic',
			} );
			const result = await canvasConvertToJpeg( file );

			expect( result ).toBeInstanceOf( File );
			expect( result.name ).toBe( 'photo.jpg' );
			expect( result.type ).toBe( 'image/jpeg' );
			expect( mockBitmap.close ).toHaveBeenCalled();
			expect( global.createImageBitmap ).toHaveBeenCalledWith( file );
		} );

		it( 'should use the specified quality', async () => {
			const jpegBlob = new Blob( [ 'jpeg-data' ], {
				type: 'image/jpeg',
			} );

			const mockConvertToBlob = vi.fn().mockResolvedValue( jpegBlob );
			const mockBitmap = { width: 100, height: 100, close: vi.fn() };

			global.createImageBitmap = vi.fn().mockResolvedValue( mockBitmap );
			global.OffscreenCanvas = vi
				.fn()
				.mockImplementation( function OffscreenCanvas() {
					return {
						getContext: vi
							.fn()
							.mockReturnValue( { drawImage: vi.fn() } ),
						convertToBlob: mockConvertToBlob,
					};
				} );

			const file = new File( [ 'data' ], 'photo.heic', {
				type: 'image/heic',
			} );
			await canvasConvertToJpeg( file, 0.5 );

			expect( mockConvertToBlob ).toHaveBeenCalledWith( {
				type: 'image/jpeg',
				quality: 0.5,
			} );
		} );

		it( 'should strip the extension and use .jpg', async () => {
			const jpegBlob = new Blob( [ 'jpeg-data' ], {
				type: 'image/jpeg',
			} );
			const mockBitmap = { width: 10, height: 10, close: vi.fn() };

			global.createImageBitmap = vi.fn().mockResolvedValue( mockBitmap );
			global.OffscreenCanvas = vi
				.fn()
				.mockImplementation( function OffscreenCanvas() {
					return {
						getContext: vi
							.fn()
							.mockReturnValue( { drawImage: vi.fn() } ),
						convertToBlob: vi.fn().mockResolvedValue( jpegBlob ),
					};
				} );

			const file = new File( [ 'data' ], 'my-photo.HEIC', {
				type: 'image/heic',
			} );
			const result = await canvasConvertToJpeg( file );
			expect( result.name ).toBe( 'my-photo.jpg' );
		} );

		it( 'should close the bitmap even if canvas context fails', async () => {
			const mockBitmap = { width: 10, height: 10, close: vi.fn() };

			global.createImageBitmap = vi.fn().mockResolvedValue( mockBitmap );
			global.OffscreenCanvas = vi
				.fn()
				.mockImplementation( function OffscreenCanvas() {
					return {
						getContext: vi.fn().mockReturnValue( null ),
						convertToBlob: vi.fn(),
					};
				} );

			// Remove other decoders so it falls through to the final error.
			delete ( global as any ).ImageDecoder;
			delete ( global as any ).VideoDecoder;

			await expect(
				canvasConvertToJpeg( heicFile( validHeic ) )
			).rejects.toThrow( getHeicUnsupportedMessage() );
			expect( mockBitmap.close ).toHaveBeenCalled();
		} );
	} );

	describe( 'fallback behavior', () => {
		it( 'should throw when no strategy is available', async () => {
			// createImageBitmap throws (doesn't support HEIC).
			global.createImageBitmap = vi
				.fn()
				.mockRejectedValue( new Error( 'Unsupported format' ) );
			// No ImageDecoder or VideoDecoder.
			delete ( global as any ).ImageDecoder;
			delete ( global as any ).VideoDecoder;

			await expect(
				canvasConvertToJpeg( heicFile( validHeic ) )
			).rejects.toThrow( HeicUnsupportedError );
		} );

		it( 'should not blame the codec for bytes that are not a HEIC', async () => {
			global.createImageBitmap = vi
				.fn()
				.mockRejectedValue( new Error( 'Unsupported format' ) );
			delete ( global as any ).ImageDecoder;
			delete ( global as any ).VideoDecoder;

			const error = await canvasConvertToJpeg(
				heicFile( new TextEncoder().encode( 'not a heic file' ) )
			).catch( ( e ) => e );

			expect( error ).toBeInstanceOf( Error );
			expect( error ).not.toBeInstanceOf( HeicUnsupportedError );
			expect( error.cause ).toBeInstanceOf( Error );
		} );

		it( 'should not blame the codec for a HEIC cut short of its pixel data', async () => {
			global.createImageBitmap = vi
				.fn()
				.mockRejectedValue( new Error( 'Unsupported format' ) );
			delete ( global as any ).ImageDecoder;
			delete ( global as any ).VideoDecoder;

			// Metadata intact, `mdat` missing: what a partial copy looks like.
			const error = await canvasConvertToJpeg(
				heicFile( validHeic.subarray( 0, 500 ) )
			).catch( ( e ) => e );

			expect( error ).not.toBeInstanceOf( HeicUnsupportedError );
			expect( error.cause.message ).toContain(
				'past the end of the file'
			);
		} );

		it( 'should not report a failed HEVC decode as unsupported', async () => {
			global.createImageBitmap = vi
				.fn()
				.mockRejectedValue( new Error( 'Unsupported format' ) );
			delete ( global as any ).ImageDecoder;

			global.OffscreenCanvas = vi
				.fn()
				.mockImplementation( function OffscreenCanvas() {
					return {
						getContext: vi
							.fn()
							.mockReturnValue( { drawImage: vi.fn() } ),
					};
				} );
			( global as any ).EncodedVideoChunk = vi.fn();

			// Strategy 3: the browser reports HEVC support, then the decode
			// fails, which a damaged bitstream does.
			( global as any ).VideoDecoder = vi.fn( function () {
				return {
					state: 'configured',
					configure: vi.fn(),
					decode: vi.fn(),
					flush: vi
						.fn()
						.mockRejectedValue( new Error( 'Decoding error' ) ),
					close: vi.fn(),
				};
			} );
			( global as any ).VideoDecoder.isConfigSupported = vi
				.fn()
				.mockResolvedValue( { supported: true } );

			const rejection = canvasConvertToJpeg( heicFile( validHeic ) );
			await expect( rejection ).rejects.toThrow( 'Decoding error' );
			await expect( rejection ).rejects.not.toBeInstanceOf(
				HeicUnsupportedError
			);
		} );

		it( 'should treat a codec string the browser rejects as unsupported', async () => {
			global.createImageBitmap = vi
				.fn()
				.mockRejectedValue( new Error( 'Unsupported format' ) );
			delete ( global as any ).ImageDecoder;
			( global as any ).VideoDecoder = {
				isConfigSupported: vi
					.fn()
					.mockRejectedValue( new TypeError( 'Invalid codec' ) ),
			};

			await expect(
				canvasConvertToJpeg( heicFile( validHeic ) )
			).rejects.toThrow( HeicUnsupportedError );
		} );

		it( 'should not report a failed decode as unsupported', async () => {
			// Strategy 1 rejects, as it does for any HEIC in Chromium.
			global.createImageBitmap = vi
				.fn()
				.mockRejectedValue( new Error( 'Unsupported format' ) );

			// Strategy 2 supports the type, so the browser can decode HEIC.
			// The decode itself fails, which a damaged file does.
			( global as any ).ImageDecoder = vi.fn( function () {
				return {
					decode: vi
						.fn()
						.mockRejectedValue( new Error( 'Corrupt image data' ) ),
					close: vi.fn(),
				};
			} );
			( global as any ).ImageDecoder.isTypeSupported = vi
				.fn()
				.mockResolvedValue( true );

			const file = new File( [ 'data' ], 'photo.heic', {
				type: 'image/heic',
			} );

			const rejection = canvasConvertToJpeg( file );
			await expect( rejection ).rejects.toThrow( 'Corrupt image data' );
			await expect( rejection ).rejects.not.toBeInstanceOf(
				HeicUnsupportedError
			);
		} );

		it( 'should fall through Strategy 1 failure to subsequent strategies', async () => {
			// Strategy 1 fails.
			global.createImageBitmap = vi
				.fn()
				.mockRejectedValue( new Error( 'Unsupported' ) );

			// Strategy 2: ImageDecoder not supported for this type.
			( global as any ).ImageDecoder = {
				isTypeSupported: vi.fn().mockResolvedValue( false ),
			};

			// No VideoDecoder.
			delete ( global as any ).VideoDecoder;

			await expect(
				canvasConvertToJpeg( heicFile( validHeic ) )
			).rejects.toThrow( HeicUnsupportedError );

			expect(
				( global as any ).ImageDecoder.isTypeSupported
			).toHaveBeenCalledWith( 'image/heic' );
		} );
	} );
} );
