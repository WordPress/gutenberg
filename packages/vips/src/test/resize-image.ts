/**
 * Internal dependencies
 */
import { resizeImage } from '../';
import type { ImageSizeCrop } from '../types';

const mockThumbnailBuffer = jest.fn( () => new MockImage() );
const mockCrop = jest.fn( () => new MockImage() );
const mockNewFromBuffer = jest.fn( () => new MockImage() );

class MockImage {
	width = 100;
	height = 100;
	pageHeight = 100;
	crop = mockCrop;
	writeToBuffer = jest.fn( () => ( {
		buffer: '',
	} ) );
}

class MockVipsImage {
	static thumbnailBuffer = mockThumbnailBuffer;
	static newFromBuffer = mockNewFromBuffer;
}

jest.mock( 'wasm-vips', () =>
	jest.fn( () => ( {
		Image: MockVipsImage,
	} ) )
);

describe( 'resizeImage', () => {
	afterEach( () => {
		jest.clearAllMocks();
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
} );
