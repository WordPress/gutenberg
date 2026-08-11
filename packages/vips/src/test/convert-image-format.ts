import { afterEach, describe, expect, it, vi } from 'vitest';
import type VipsFactory from 'wasm-vips';
import { convertImageFormat, compressImage } from '../';

const { MockVipsImage, mockNewFromBuffer } = vi.hoisted( () => {
	const writeToBufferMock = vi.fn( () => ( {
		buffer: '',
	} ) );

	class ImageMock {
		width = 100;
		height = 100;
		pageHeight = 100;
		writeToBuffer = writeToBufferMock;
		getInt = vi.fn( () => 0 );
	}

	const newFromBufferMock = vi.fn( () => new ImageMock() );

	class VipsImageMock {
		static newFromBuffer = newFromBufferMock;
	}

	return {
		MockVipsImage: VipsImageMock,
		mockNewFromBuffer: newFromBufferMock,
	};
} );

vi.mock( import( 'wasm-vips' ), () => ( {
	default: vi.fn( () => ( {
		Image: MockVipsImage,
		Cache: {
			max: vi.fn(),
		},
	} ) ) as unknown as typeof VipsFactory,
} ) );

describe( 'convertImageFormat', () => {
	afterEach( () => {
		vi.clearAllMocks();
	} );

	it( 'loads only the first frame when converting a GIF to JPEG', async () => {
		/*
		 * Regression test for https://github.com/WordPress/gutenberg/issues/80259.
		 * Loading an animated GIF with n=-1 produces a vertical strip image
		 * `frames × height` pixels tall. A JPEG cannot be animated, and
		 * libjpeg's 65,500 px dimension limit makes saving such a strip fail
		 * for long GIFs, so a still output must only decode the first frame.
		 */
		const gifFile = new File( [ '<BLOB>' ], 'example.gif', {
			lastModified: 1234567891,
			type: 'image/gif',
		} );
		const buffer = await gifFile.arrayBuffer();

		await convertImageFormat( 'itemId', buffer, 'image/gif', 'image/jpeg' );

		expect( mockNewFromBuffer ).toHaveBeenCalledWith( buffer, '', {} );
	} );

	it( 'loads all frames when converting a GIF to WebP', async () => {
		const gifFile = new File( [ '<BLOB>' ], 'example.gif', {
			lastModified: 1234567891,
			type: 'image/gif',
		} );
		const buffer = await gifFile.arrayBuffer();

		await convertImageFormat( 'itemId', buffer, 'image/gif', 'image/webp' );

		expect( mockNewFromBuffer ).toHaveBeenCalledWith( buffer, '[n=-1]', {
			n: -1,
		} );
	} );

	it( 'loads all frames when compressing a GIF in place', async () => {
		const gifFile = new File( [ '<BLOB>' ], 'example.gif', {
			lastModified: 1234567891,
			type: 'image/gif',
		} );
		const buffer = await gifFile.arrayBuffer();

		await compressImage( 'itemId', buffer, 'image/gif' );

		expect( mockNewFromBuffer ).toHaveBeenCalledWith( buffer, '[n=-1]', {
			n: -1,
		} );
	} );

	it( 'does not pass animation load options for still images', async () => {
		const jpegFile = new File( [ '<BLOB>' ], 'example.jpg', {
			lastModified: 1234567891,
			type: 'image/jpeg',
		} );
		const buffer = await jpegFile.arrayBuffer();

		await convertImageFormat(
			'itemId',
			buffer,
			'image/jpeg',
			'image/webp'
		);

		expect( mockNewFromBuffer ).toHaveBeenCalledWith( buffer, '', {} );
	} );
} );
