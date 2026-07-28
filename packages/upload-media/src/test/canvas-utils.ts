/**
 * Internal dependencies
 */
import { canvasConvertToJpeg } from '../canvas-utils';

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
			// @ts-ignore
			delete global.createImageBitmap;
		}
		if ( originalOffscreenCanvas ) {
			global.OffscreenCanvas = originalOffscreenCanvas;
		} else {
			// @ts-ignore
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
				'cannot decode HEIC'
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
				'cannot decode HEIC'
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
				'cannot decode HEIC'
			);

			expect(
				( global as any ).ImageDecoder.isTypeSupported
			).toHaveBeenCalledWith( 'image/heic' );
		} );
	} );
} );
