/**
 * Internal dependencies
 */
import { ImageFile } from '../../image-file';
import type { ImageSizeCrop } from '../types';

// Mock the web worker factory before importing the module.
const mockWorker = {
	convertImageFormat: jest.fn(),
	compressImage: jest.fn(),
	hasTransparency: jest.fn(),
	resizeImage: jest.fn(),
	cancelOperations: jest.fn(),
};

jest.mock( '@shopify/web-worker', () => ( {
	createWorkerFactory: jest.fn( () => () => mockWorker ),
} ) );

// Import after mock is set up.
import {
	vipsConvertImageFormat,
	vipsCompressImage,
	vipsHasTransparency,
	vipsResizeImage,
	vipsCancelOperations,
} from '../utils/vips';

const jpegFile = new File( [ 'test-content' ], 'test.jpg', {
	type: 'image/jpeg',
	lastModified: 1234567890,
} );

const pngFile = new File( [ 'test-content' ], 'image.png', {
	type: 'image/png',
	lastModified: 1234567890,
} );

describe( 'vips utilities', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'vipsConvertImageFormat', () => {
		it( 'converts image and returns new File with correct extension', async () => {
			mockWorker.convertImageFormat.mockResolvedValue(
				new ArrayBuffer( 10 )
			);

			const result = await vipsConvertImageFormat(
				'item-1',
				jpegFile,
				'image/webp',
				0.8
			);

			expect( result.name ).toBe( 'test.webp' );
			expect( result.type ).toBe( 'image/webp' );
			expect( mockWorker.convertImageFormat ).toHaveBeenCalledTimes( 1 );
			expect( mockWorker.convertImageFormat.mock.calls[ 0 ][ 0 ] ).toBe(
				'item-1'
			);
			expect( mockWorker.convertImageFormat.mock.calls[ 0 ][ 2 ] ).toBe(
				'image/jpeg'
			);
			expect( mockWorker.convertImageFormat.mock.calls[ 0 ][ 3 ] ).toBe(
				'image/webp'
			);
			expect( mockWorker.convertImageFormat.mock.calls[ 0 ][ 4 ] ).toBe(
				0.8
			);
		} );

		it( 'converts PNG to AVIF with interlacing', async () => {
			mockWorker.convertImageFormat.mockResolvedValue(
				new ArrayBuffer( 5 )
			);

			const result = await vipsConvertImageFormat(
				'item-2',
				pngFile,
				'image/avif',
				0.9,
				true
			);

			expect( result.name ).toBe( 'image.avif' );
			expect( result.type ).toBe( 'image/avif' );
			expect( mockWorker.convertImageFormat.mock.calls[ 0 ][ 5 ] ).toBe(
				true
			);
		} );
	} );

	describe( 'vipsCompressImage', () => {
		it( 'compresses image preserving filename and type', async () => {
			mockWorker.compressImage.mockResolvedValue( new ArrayBuffer( 5 ) );

			const result = await vipsCompressImage( 'item-1', jpegFile, 0.8 );

			expect( result.name ).toBe( 'test.jpg' );
			expect( result.type ).toBe( 'image/jpeg' );
			expect( mockWorker.compressImage ).toHaveBeenCalledTimes( 1 );
			expect( mockWorker.compressImage.mock.calls[ 0 ][ 0 ] ).toBe(
				'item-1'
			);
			expect( mockWorker.compressImage.mock.calls[ 0 ][ 2 ] ).toBe(
				'image/jpeg'
			);
			expect( mockWorker.compressImage.mock.calls[ 0 ][ 3 ] ).toBe( 0.8 );
		} );

		it( 'compresses image with interlacing option', async () => {
			mockWorker.compressImage.mockResolvedValue( new ArrayBuffer( 5 ) );

			const result = await vipsCompressImage(
				'item-2',
				pngFile,
				0.7,
				true
			);

			expect( result.name ).toBe( 'image.png' );
			expect( mockWorker.compressImage.mock.calls[ 0 ][ 4 ] ).toBe(
				true
			);
		} );
	} );

	describe( 'vipsHasTransparency', () => {
		beforeEach( () => {
			jest.spyOn( global, 'fetch' ).mockResolvedValue( {
				arrayBuffer: () => Promise.resolve( new ArrayBuffer( 0 ) ),
			} as Response );
		} );

		it( 'returns true when image has transparency', async () => {
			mockWorker.hasTransparency.mockResolvedValue( true );

			const result = await vipsHasTransparency( 'blob:test-url' );

			expect( result ).toBe( true );
			expect( global.fetch ).toHaveBeenCalledWith( 'blob:test-url' );
			expect( mockWorker.hasTransparency ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'returns false when image has no transparency', async () => {
			mockWorker.hasTransparency.mockResolvedValue( false );

			const result = await vipsHasTransparency(
				'https://example.com/img'
			);

			expect( result ).toBe( false );
		} );
	} );

	describe( 'vipsResizeImage', () => {
		it( 'resizes image and returns ImageFile with dimensions and suffix', async () => {
			mockWorker.resizeImage.mockResolvedValue( {
				buffer: new ArrayBuffer( 10 ),
				width: 150,
				height: 150,
				originalWidth: 300,
				originalHeight: 300,
			} );

			const resize: ImageSizeCrop = { width: 150, height: 150 };
			const result = await vipsResizeImage(
				'item-1',
				jpegFile,
				resize,
				false,
				true
			);

			expect( result ).toBeInstanceOf( ImageFile );
			// ImageFile extends File, so name/type are direct properties.
			expect( result.name ).toBe( 'test-150x150.jpg' );
			expect( result.type ).toBe( 'image/jpeg' );
			expect( result.width ).toBe( 150 );
			expect( result.height ).toBe( 150 );
			expect( result.originalWidth ).toBe( 300 );
			expect( result.originalHeight ).toBe( 300 );
		} );

		it( 'does not add suffix when dimensions unchanged', async () => {
			mockWorker.resizeImage.mockResolvedValue( {
				buffer: new ArrayBuffer( 10 ),
				width: 300,
				height: 300,
				originalWidth: 300,
				originalHeight: 300,
			} );

			const resize: ImageSizeCrop = { width: 300, height: 300 };
			const result = await vipsResizeImage(
				'item-1',
				jpegFile,
				resize,
				false,
				true
			);

			expect( result.name ).toBe( 'test.jpg' );
		} );

		it( 'does not add suffix when addSuffix is false', async () => {
			mockWorker.resizeImage.mockResolvedValue( {
				buffer: new ArrayBuffer( 10 ),
				width: 150,
				height: 150,
				originalWidth: 300,
				originalHeight: 300,
			} );

			const resize: ImageSizeCrop = { width: 150, height: 150 };
			const result = await vipsResizeImage(
				'item-1',
				jpegFile,
				resize,
				false,
				false
			);

			expect( result.name ).toBe( 'test.jpg' );
		} );

		it( 'passes smart crop parameter to worker', async () => {
			mockWorker.resizeImage.mockResolvedValue( {
				buffer: new ArrayBuffer( 10 ),
				width: 100,
				height: 100,
				originalWidth: 200,
				originalHeight: 200,
			} );

			const resize: ImageSizeCrop = {
				width: 100,
				height: 100,
				crop: true,
			};
			await vipsResizeImage( 'item-1', jpegFile, resize, true, true );

			expect( mockWorker.resizeImage ).toHaveBeenCalledTimes( 1 );
			expect( mockWorker.resizeImage.mock.calls[ 0 ][ 0 ] ).toBe(
				'item-1'
			);
			expect( mockWorker.resizeImage.mock.calls[ 0 ][ 2 ] ).toBe(
				'image/jpeg'
			);
			expect( mockWorker.resizeImage.mock.calls[ 0 ][ 3 ] ).toEqual(
				resize
			);
			expect( mockWorker.resizeImage.mock.calls[ 0 ][ 4 ] ).toBe( true );
		} );
	} );

	describe( 'vipsCancelOperations', () => {
		it( 'calls worker cancelOperations with item ID', async () => {
			mockWorker.cancelOperations.mockResolvedValue( true );

			const result = await vipsCancelOperations( 'item-123' );

			expect( mockWorker.cancelOperations ).toHaveBeenCalledWith(
				'item-123'
			);
			expect( result ).toBe( true );
		} );

		it( 'returns false when no operations were cancelled', async () => {
			mockWorker.cancelOperations.mockResolvedValue( false );

			const result = await vipsCancelOperations( 'item-456' );

			expect( result ).toBe( false );
		} );
	} );
} );
