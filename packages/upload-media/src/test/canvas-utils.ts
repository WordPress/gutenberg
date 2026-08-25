import { readFileSync } from 'fs';
import { join } from 'path';
import { canvasConvertToJpeg } from '../canvas-utils';
import { getHeicUnsupportedMessage } from '../heic-support';

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
	} );

	describe( 'Strategy 1: createImageBitmap + OffscreenCanvas', () => {
		it( 'should convert via createImageBitmap when available', async () => {
			const jpegBlob = new Blob( [ 'jpeg-data' ], {
				type: 'image/jpeg',
			} );

			const mockBitmap = {
				width: 200,
				height: 150,
				close: jest.fn(),
			};

			const mockCtx = {
				drawImage: jest.fn(),
			};

			global.createImageBitmap = jest
				.fn()
				.mockResolvedValue( mockBitmap );
			global.OffscreenCanvas = jest.fn().mockImplementation( () => ( {
				getContext: jest.fn().mockReturnValue( mockCtx ),
				convertToBlob: jest.fn().mockResolvedValue( jpegBlob ),
			} ) );

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

			const mockConvertToBlob = jest.fn().mockResolvedValue( jpegBlob );
			const mockBitmap = { width: 100, height: 100, close: jest.fn() };

			global.createImageBitmap = jest
				.fn()
				.mockResolvedValue( mockBitmap );
			global.OffscreenCanvas = jest.fn().mockImplementation( () => ( {
				getContext: jest
					.fn()
					.mockReturnValue( { drawImage: jest.fn() } ),
				convertToBlob: mockConvertToBlob,
			} ) );

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
			const mockBitmap = { width: 10, height: 10, close: jest.fn() };

			global.createImageBitmap = jest
				.fn()
				.mockResolvedValue( mockBitmap );
			global.OffscreenCanvas = jest.fn().mockImplementation( () => ( {
				getContext: jest
					.fn()
					.mockReturnValue( { drawImage: jest.fn() } ),
				convertToBlob: jest.fn().mockResolvedValue( jpegBlob ),
			} ) );

			const file = new File( [ 'data' ], 'my-photo.HEIC', {
				type: 'image/heic',
			} );
			const result = await canvasConvertToJpeg( file );
			expect( result.name ).toBe( 'my-photo.jpg' );
		} );

		it( 'should close the bitmap even if canvas context fails', async () => {
			const mockBitmap = { width: 10, height: 10, close: jest.fn() };

			global.createImageBitmap = jest
				.fn()
				.mockResolvedValue( mockBitmap );
			global.OffscreenCanvas = jest.fn().mockImplementation( () => ( {
				getContext: jest.fn().mockReturnValue( null ),
				convertToBlob: jest.fn(),
			} ) );

			// Remove other decoders so it falls through to the final error.
			delete ( global as any ).ImageDecoder;
			delete ( global as any ).VideoDecoder;

			const file = new File( [ 'data' ], 'photo.heic', {
				type: 'image/heic',
			} );

			await expect( canvasConvertToJpeg( file ) ).rejects.toThrow(
				getHeicUnsupportedMessage()
			);
			expect( mockBitmap.close ).toHaveBeenCalled();
		} );
	} );

	describe( 'fallback behavior', () => {
		it( 'should throw when no strategy is available', async () => {
			// createImageBitmap throws (doesn't support HEIC).
			global.createImageBitmap = jest
				.fn()
				.mockRejectedValue( new Error( 'Unsupported format' ) );
			// No ImageDecoder or VideoDecoder.
			delete ( global as any ).ImageDecoder;
			delete ( global as any ).VideoDecoder;

			const file = new File( [ 'data' ], 'photo.heic', {
				type: 'image/heic',
			} );

			await expect( canvasConvertToJpeg( file ) ).rejects.toThrow(
				getHeicUnsupportedMessage()
			);
		} );

		it( 'should fall through Strategy 1 failure to subsequent strategies', async () => {
			// Strategy 1 fails.
			global.createImageBitmap = jest
				.fn()
				.mockRejectedValue( new Error( 'Unsupported' ) );

			// Strategy 2: ImageDecoder not supported for this type.
			( global as any ).ImageDecoder = {
				isTypeSupported: jest.fn().mockResolvedValue( false ),
			};

			// No VideoDecoder.
			delete ( global as any ).VideoDecoder;

			const file = new File( [ 'data' ], 'photo.heic', {
				type: 'image/heic',
			} );

			await expect( canvasConvertToJpeg( file ) ).rejects.toThrow(
				getHeicUnsupportedMessage()
			);

			expect(
				( global as any ).ImageDecoder.isTypeSupported
			).toHaveBeenCalledWith( 'image/heic' );
		} );
	} );

	describe( 'EXIF preservation', () => {
		it( 'carries the source EXIF block into the converted JPEG', async () => {
			// A real HEIC fixture carrying an EXIF block (Orientation=6).
			const heicBytes = readFileSync(
				join( __dirname, 'fixtures', 'exif-rotated-90cw.heic' )
			);

			const jpegBlob = new Blob(
				[ new Uint8Array( [ 0xff, 0xd8, 0xff, 0xd9 ] ) ],
				{ type: 'image/jpeg' }
			);
			const mockBitmap = { width: 32, height: 32, close: jest.fn() };
			global.createImageBitmap = jest
				.fn()
				.mockResolvedValue( mockBitmap );
			global.OffscreenCanvas = jest.fn().mockImplementation( () => ( {
				getContext: jest
					.fn()
					.mockReturnValue( { drawImage: jest.fn() } ),
				convertToBlob: jest.fn().mockResolvedValue( jpegBlob ),
			} ) );

			const file = new File( [ heicBytes ], 'photo.heic', {
				type: 'image/heic',
			} );
			const result = await canvasConvertToJpeg( file );

			const bytes = new Uint8Array( await result.arrayBuffer() );
			// An APP1 EXIF segment follows the SOI marker.
			expect( bytes[ 2 ] ).toBe( 0xff );
			expect( bytes[ 3 ] ).toBe( 0xe1 );
			expect( Array.from( bytes.subarray( 6, 12 ) ) ).toEqual( [
				0x45, 0x78, 0x69, 0x66, 0, 0,
			] );
		} );

		it( 'returns the plain JPEG when the source has no EXIF block', async () => {
			const jpegBlob = new Blob(
				[ new Uint8Array( [ 0xff, 0xd8, 0xff, 0xd9 ] ) ],
				{ type: 'image/jpeg' }
			);
			const mockBitmap = { width: 32, height: 32, close: jest.fn() };
			global.createImageBitmap = jest
				.fn()
				.mockResolvedValue( mockBitmap );
			global.OffscreenCanvas = jest.fn().mockImplementation( () => ( {
				getContext: jest
					.fn()
					.mockReturnValue( { drawImage: jest.fn() } ),
				convertToBlob: jest.fn().mockResolvedValue( jpegBlob ),
			} ) );

			const file = new File( [ 'not-a-heic' ], 'photo.heic', {
				type: 'image/heic',
			} );
			const result = await canvasConvertToJpeg( file );

			const bytes = new Uint8Array( await result.arrayBuffer() );
			expect( Array.from( bytes ) ).toEqual( [ 0xff, 0xd8, 0xff, 0xd9 ] );
		} );
	} );
} );
