/**
 * External dependencies
 */

// Mock the vips worker module.
// The mock functions must be declared inside the factory to avoid hoisting issues.
jest.mock( '@wordpress/vips/worker', () => ( {
	vipsConvertImageFormat: jest.fn(),
	vipsCompressImage: jest.fn(),
	vipsHasTransparency: jest.fn(),
	vipsResizeImage: jest.fn(),
	vipsCancelOperations: jest.fn(),
} ) );

// Import the mocked module to get access to the mock functions.
import * as vipsWorker from '@wordpress/vips/worker';

/**
 * Internal dependencies
 */
import { ImageFile } from '../../image-file';
import type { ImageSizeCrop } from '../types';

// Import after mock is set up.
import {
	vipsConvertImageFormat,
	vipsCompressImage,
	vipsHasTransparency,
	vipsResizeImage,
	vipsCancelOperations,
} from '../utils/vips';

// Cast to jest.Mock for type safety.
const mockConvertImageFormat = vipsWorker.vipsConvertImageFormat as jest.Mock;
const mockCompressImage = vipsWorker.vipsCompressImage as jest.Mock;
const mockHasTransparency = vipsWorker.vipsHasTransparency as jest.Mock;
const mockResizeImage = vipsWorker.vipsResizeImage as jest.Mock;
const mockCancelOperations = vipsWorker.vipsCancelOperations as jest.Mock;

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
			mockConvertImageFormat.mockResolvedValue( new ArrayBuffer( 10 ) );

			const result = await vipsConvertImageFormat(
				'item-1',
				jpegFile,
				'image/webp',
				0.8
			);

			expect( result.name ).toBe( 'test.webp' );
			expect( result.type ).toBe( 'image/webp' );
			expect( mockConvertImageFormat ).toHaveBeenCalledTimes( 1 );
			expect( mockConvertImageFormat.mock.calls[ 0 ][ 0 ] ).toBe(
				'item-1'
			);
			expect( mockConvertImageFormat.mock.calls[ 0 ][ 2 ] ).toBe(
				'image/jpeg'
			);
			expect( mockConvertImageFormat.mock.calls[ 0 ][ 3 ] ).toBe(
				'image/webp'
			);
			expect( mockConvertImageFormat.mock.calls[ 0 ][ 4 ] ).toBe( 0.8 );
		} );

		it( 'converts PNG to AVIF with interlacing', async () => {
			mockConvertImageFormat.mockResolvedValue( new ArrayBuffer( 5 ) );

			const result = await vipsConvertImageFormat(
				'item-2',
				pngFile,
				'image/avif',
				0.9,
				true
			);

			expect( result.name ).toBe( 'image.avif' );
			expect( result.type ).toBe( 'image/avif' );
			expect( mockConvertImageFormat.mock.calls[ 0 ][ 5 ] ).toBe( true );
		} );
	} );

	describe( 'vipsCompressImage', () => {
		it( 'compresses image preserving filename and type', async () => {
			mockCompressImage.mockResolvedValue( new ArrayBuffer( 5 ) );

			const result = await vipsCompressImage( 'item-1', jpegFile, 0.8 );

			expect( result.name ).toBe( 'test.jpg' );
			expect( result.type ).toBe( 'image/jpeg' );
			expect( mockCompressImage ).toHaveBeenCalledTimes( 1 );
			expect( mockCompressImage.mock.calls[ 0 ][ 0 ] ).toBe( 'item-1' );
			expect( mockCompressImage.mock.calls[ 0 ][ 2 ] ).toBe(
				'image/jpeg'
			);
			expect( mockCompressImage.mock.calls[ 0 ][ 3 ] ).toBe( 0.8 );
		} );

		it( 'compresses image with interlacing option', async () => {
			mockCompressImage.mockResolvedValue( new ArrayBuffer( 5 ) );

			const result = await vipsCompressImage(
				'item-2',
				pngFile,
				0.7,
				true
			);

			expect( result.name ).toBe( 'image.png' );
			expect( mockCompressImage.mock.calls[ 0 ][ 4 ] ).toBe( true );
		} );
	} );

	describe( 'vipsHasTransparency', () => {
		let mockFetch: jest.Mock;

		beforeEach( () => {
			mockFetch = jest.fn().mockResolvedValue( {
				arrayBuffer: () => Promise.resolve( new ArrayBuffer( 0 ) ),
			} as Response );
			window.fetch = mockFetch;
		} );

		it( 'returns true when image has transparency', async () => {
			mockHasTransparency.mockResolvedValue( true );

			const result = await vipsHasTransparency( 'blob:test-url' );

			expect( result ).toBe( true );
			expect( mockFetch ).toHaveBeenCalledWith( 'blob:test-url' );
			expect( mockHasTransparency ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'returns false when image has no transparency', async () => {
			mockHasTransparency.mockResolvedValue( false );

			const result = await vipsHasTransparency(
				'https://example.com/img'
			);

			expect( result ).toBe( false );
		} );
	} );

	describe( 'vipsResizeImage', () => {
		it( 'resizes image and returns ImageFile with dimensions and suffix', async () => {
			mockResizeImage.mockResolvedValue( {
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

			// Debug logging is expected.
			expect( console ).toHaveLogged();
		} );

		it( 'does not add suffix when dimensions unchanged', async () => {
			mockResizeImage.mockResolvedValue( {
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

			// Debug logging is expected.
			expect( console ).toHaveLogged();
		} );

		it( 'does not add suffix when addSuffix is false', async () => {
			mockResizeImage.mockResolvedValue( {
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

			// Debug logging is expected.
			expect( console ).toHaveLogged();
		} );

		it( 'passes smart crop parameter to worker', async () => {
			mockResizeImage.mockResolvedValue( {
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

			expect( mockResizeImage ).toHaveBeenCalledTimes( 1 );
			expect( mockResizeImage.mock.calls[ 0 ][ 0 ] ).toBe( 'item-1' );
			expect( mockResizeImage.mock.calls[ 0 ][ 2 ] ).toBe( 'image/jpeg' );
			expect( mockResizeImage.mock.calls[ 0 ][ 3 ] ).toEqual( resize );
			expect( mockResizeImage.mock.calls[ 0 ][ 4 ] ).toBe( true );

			// Debug logging is expected.
			expect( console ).toHaveLogged();
		} );
	} );

	describe( 'vipsCancelOperations', () => {
		it( 'calls worker cancelOperations with item ID', async () => {
			mockCancelOperations.mockResolvedValue( true );

			const result = await vipsCancelOperations( 'item-123' );

			expect( mockCancelOperations ).toHaveBeenCalledWith( 'item-123' );
			expect( result ).toBe( true );
		} );

		it( 'returns false when no operations were cancelled', async () => {
			mockCancelOperations.mockResolvedValue( false );

			const result = await vipsCancelOperations( 'item-456' );

			expect( result ).toBe( false );
		} );
	} );
} );
