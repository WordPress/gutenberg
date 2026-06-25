/**
 * Internal dependencies
 */
import { resizeImage } from '../';
import type { ImageSizeCrop } from '../types';

const mockThumbnailBuffer = jest.fn( () => new MockImage() );
const mockCrop = jest.fn( () => new MockImage() );
const mockResize = jest.fn( () => new MockImage() );
const mockNewFromBuffer = jest.fn( () => new MockImage() );
const mockWriteToBuffer = jest.fn( () => ( {
	buffer: '',
} ) );

// Controls the `heif-bitdepth` value reported by the mocked source image so
// tests can exercise both the standard (8-bit) and high-bit-depth code paths.
let mockBitdepth = 8;

class MockImage {
	width = 100;
	height = 100;
	pageHeight = 100;
	crop = mockCrop;
	resize = mockResize;
	writeToBuffer = mockWriteToBuffer;
	getInt = jest.fn( ( name: string ) =>
		'heif-bitdepth' === name ? mockBitdepth : 0
	);
}

class MockVipsImage {
	static thumbnailBuffer = mockThumbnailBuffer;
	static newFromBuffer = mockNewFromBuffer;
}

jest.mock( 'wasm-vips', () =>
	jest.fn( () => ( {
		Image: MockVipsImage,
		Cache: {
			max: jest.fn(),
		},
	} ) )
);

describe( 'resizeImage', () => {
	afterEach( () => {
		jest.clearAllMocks();
		mockBitdepth = 8;
	} );

	it( 'resizes without crop', async () => {
		const jpegFile = new File( [ '<BLOB>' ], 'example.jpg', {
			lastModified: 1234567891,
			type: 'image/jpeg',
		} );
		const buffer = await jpegFile.arrayBuffer();

		await resizeImage( 'itemId', buffer, 'image/jpeg', {
			width: 100,
			height: 100,
		} );

		expect( mockThumbnailBuffer ).toHaveBeenCalledWith( buffer, 100, {
			height: 100,
			size: 'down',
		} );
		expect( mockCrop ).not.toHaveBeenCalled();
	} );

	it( 'resizes without crop and zero height', async () => {
		const jpegFile = new File( [], 'example.jpg', {
			lastModified: 1234567891,
			type: 'image/jpeg',
		} );
		const buffer = await jpegFile.arrayBuffer();

		await resizeImage( 'itemId', buffer, 'image/jpeg', {
			width: 100,
			height: 0,
		} );

		expect( mockThumbnailBuffer ).toHaveBeenCalledWith( buffer, 100, {
			size: 'down',
			height: 100,
		} );
		expect( mockCrop ).not.toHaveBeenCalled();
	} );

	it( 'resizes with center crop', async () => {
		const jpegFile = new File( [ '<BLOB>' ], 'example.jpg', {
			lastModified: 1234567891,
			type: 'image/jpeg',
		} );
		const buffer = await jpegFile.arrayBuffer();

		await resizeImage( 'itemId', buffer, 'image/jpeg', {
			width: 100,
			height: 100,
			crop: true,
		} );

		expect( mockThumbnailBuffer ).toHaveBeenCalledWith( buffer, 100, {
			height: 100,
			crop: 'centre',
			size: 'down',
		} );
		expect( mockCrop ).not.toHaveBeenCalled();
	} );

	it( 'resizes with center crop and zero height', async () => {
		const jpegFile = new File( [ '<BLOB>' ], 'example.jpg', {
			lastModified: 1234567891,
			type: 'image/jpeg',
		} );
		const buffer = await jpegFile.arrayBuffer();

		await resizeImage( 'itemId', buffer, 'image/jpeg', {
			width: 100,
			height: 0,
			crop: true,
		} );

		expect( mockThumbnailBuffer ).toHaveBeenCalledWith( buffer, 100, {
			crop: 'centre',
			height: 100,
			size: 'down',
		} );
		expect( mockCrop ).not.toHaveBeenCalled();
	} );

	it( 'resizes without crop and attention strategy', async () => {
		const jpegFile = new File( [ '<BLOB>' ], 'example.jpg', {
			lastModified: 1234567891,
			type: 'image/jpeg',
		} );
		const buffer = await jpegFile.arrayBuffer();

		await resizeImage(
			'itemId',
			buffer,
			'image/jpeg',
			{
				width: 100,
				height: 100,
			},
			true
		);

		expect( mockThumbnailBuffer ).toHaveBeenCalledWith( buffer, 100, {
			height: 100,
			size: 'down',
		} );
		expect( mockCrop ).not.toHaveBeenCalled();
	} );

	it( 'resizes with center crop and attention strategy', async () => {
		const jpegFile = new File( [ '<BLOB>' ], 'example.jpg', {
			lastModified: 1234567891,
			type: 'image/jpeg',
		} );
		const buffer = await jpegFile.arrayBuffer();

		await resizeImage(
			'itemId',
			buffer,
			'image/jpeg',
			{
				width: 100,
				height: 100,
				crop: true,
			},
			true
		);

		expect( mockThumbnailBuffer ).toHaveBeenCalledWith( buffer, 100, {
			height: 100,
			crop: 'attention',
			size: 'down',
		} );
		expect( mockCrop ).not.toHaveBeenCalled();
	} );

	it.each< [ ImageSizeCrop[ 'crop' ], [ number, number, number, number ] ] >(
		[
			[
				[ 'left', 'top' ],
				[ 0, 0, 25, 25 ],
			],
			[
				[ 'center', 'top' ],
				[ 37.5, 0, 25, 25 ],
			],
			[
				[ 'right', 'top' ],
				[ 75, 0, 25, 25 ],
			],
			[
				[ 'left', 'center' ],
				[ 0, 37.5, 25, 25 ],
			],
			[
				[ 'center', 'center' ],
				[ 37.5, 37.5, 25, 25 ],
			],
			[
				[ 'right', 'center' ],
				[ 75, 37.5, 25, 25 ],
			],
			[
				[ 'left', 'bottom' ],
				[ 0, 75, 25, 25 ],
			],
			[
				[ 'center', 'bottom' ],
				[ 37.5, 75, 25, 25 ],
			],
			[
				[ 'right', 'bottom' ],
				[ 75, 75, 25, 25 ],
			],
		]
	)( 'resizes with %s param and crops %s', async ( crop, expected ) => {
		const jpegFile = new File( [ '<BLOB>' ], 'example.jpg', {
			lastModified: 1234567891,
			type: 'image/jpeg',
		} );
		const buffer = await jpegFile.arrayBuffer();

		await resizeImage( 'itemId', buffer, 'image/jpeg', {
			width: 25,
			height: 25,
			crop,
		} );

		expect( mockCrop ).toHaveBeenCalledWith( ...expected );
	} );

	describe( 'high-bit-depth AVIF', () => {
		it( 'preserves bit depth when resizing a 10-bit AVIF without crop', async () => {
			mockBitdepth = 10;
			const avifFile = new File( [ '<BLOB>' ], 'example.avif', {
				type: 'image/avif',
			} );
			const buffer = await avifFile.arrayBuffer();

			await resizeImage( 'itemId', buffer, 'image/avif', {
				width: 50,
				height: 50,
			} );

			// Uses the precision-preserving resize path, not `thumbnail`
			// (which would flatten the samples to 8-bit sRGB).
			expect( mockResize ).toHaveBeenCalled();
			expect( mockThumbnailBuffer ).not.toHaveBeenCalled();
			// Writes the source bit depth so the sub-size stays 10-bit.
			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.avif',
				expect.objectContaining( { bitdepth: 10 } )
			);
		} );

		it( 'centre-crops a 12-bit AVIF while preserving bit depth', async () => {
			mockBitdepth = 12;
			const avifFile = new File( [ '<BLOB>' ], 'example.avif', {
				type: 'image/avif',
			} );
			const buffer = await avifFile.arrayBuffer();

			await resizeImage( 'itemId', buffer, 'image/avif', {
				width: 50,
				height: 50,
				crop: true,
			} );

			expect( mockResize ).toHaveBeenCalled();
			expect( mockCrop ).toHaveBeenCalled();
			expect( mockThumbnailBuffer ).not.toHaveBeenCalled();
			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.avif',
				expect.objectContaining( { bitdepth: 12 } )
			);
		} );

		it( 'uses the standard thumbnail path for an 8-bit AVIF', async () => {
			mockBitdepth = 8;
			const avifFile = new File( [ '<BLOB>' ], 'example.avif', {
				type: 'image/avif',
			} );
			const buffer = await avifFile.arrayBuffer();

			await resizeImage( 'itemId', buffer, 'image/avif', {
				width: 50,
				height: 50,
			} );

			expect( mockThumbnailBuffer ).toHaveBeenCalled();
			expect( mockResize ).not.toHaveBeenCalled();
			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.avif',
				expect.not.objectContaining( { bitdepth: expect.anything() } )
			);
		} );
	} );
} );
