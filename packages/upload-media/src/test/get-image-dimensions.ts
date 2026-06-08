/**
 * Internal dependencies
 */
import { getImageDimensions } from '../get-image-dimensions';

/**
 * Builds a File from a byte array for testing.
 *
 * @param bytes The file contents.
 * @param type  The MIME type.
 * @return A File wrapping the bytes.
 */
function fileFromBytes( bytes: number[], type: string ): File {
	return new File( [ new Uint8Array( bytes ) ], 'test', { type } );
}

/**
 * Builds a minimal JPEG header with a single Start Of Frame segment.
 *
 * @param sofMarker The SOFn marker byte (e.g. 0xc0 baseline, 0xc2 progressive).
 * @param width     Image width.
 * @param height    Image height.
 * @param prefix    Optional bytes inserted between SOI and the frame header.
 * @return The JPEG header bytes.
 */
function buildJpeg(
	sofMarker: number,
	width: number,
	height: number,
	prefix: number[] = []
): number[] {
	// Encode height and width as big-endian 16-bit values.
	const dimensions = new Uint8Array( 4 );
	const view = new DataView( dimensions.buffer );
	view.setUint16( 0, height );
	view.setUint16( 2, width );

	return [
		0xff,
		0xd8, // SOI
		...prefix,
		0xff,
		sofMarker, // SOFn
		0x00,
		0x11, // segment length (17)
		0x08, // precision
		...dimensions, // height (2) + width (2)
		0x03, // number of components
		0x00,
		0x00,
		0x00,
		0x00,
		0x00, // component data (padding)
	];
}

/**
 * Builds a minimal PNG header (signature + IHDR chunk).
 *
 * @param width     Image width.
 * @param height    Image height.
 * @param interlace Interlace method (0 = none, 1 = Adam7).
 * @return The PNG header bytes.
 */
function buildPng(
	width: number,
	height: number,
	interlace: number
): number[] {
	// Encode width and height as big-endian 32-bit values.
	const dimensions = new Uint8Array( 8 );
	const view = new DataView( dimensions.buffer );
	view.setUint32( 0, width );
	view.setUint32( 4, height );

	return [
		0x89,
		0x50,
		0x4e,
		0x47,
		0x0d,
		0x0a,
		0x1a,
		0x0a, // signature
		0x00,
		0x00,
		0x00,
		0x0d, // IHDR length (13)
		0x49,
		0x48,
		0x44,
		0x52, // "IHDR"
		...dimensions, // width (4) + height (4)
		0x08, // bit depth
		0x06, // color type
		0x00, // compression
		0x00, // filter
		interlace,
	];
}

describe( 'getImageDimensions', () => {
	it( 'parses a baseline JPEG', async () => {
		const file = fileFromBytes(
			buildJpeg( 0xc0, 1920, 1080 ),
			'image/jpeg'
		);
		await expect( getImageDimensions( file ) ).resolves.toEqual( {
			width: 1920,
			height: 1080,
			interlaced: false,
		} );
	} );

	it( 'parses a progressive JPEG as interlaced', async () => {
		const file = fileFromBytes(
			buildJpeg( 0xc2, 4000, 3000 ),
			'image/jpeg'
		);
		await expect( getImageDimensions( file ) ).resolves.toEqual( {
			width: 4000,
			height: 3000,
			interlaced: true,
		} );
	} );

	it( 'skips preceding marker segments (e.g. APP0/EXIF) to find the frame', async () => {
		// APP0 segment: FF E0, length 0x0006, then 4 bytes of payload.
		const app0 = [ 0xff, 0xe0, 0x00, 0x06, 0x4a, 0x46, 0x49, 0x46 ];
		const file = fileFromBytes(
			buildJpeg( 0xc0, 800, 600, app0 ),
			'image/jpeg'
		);
		await expect( getImageDimensions( file ) ).resolves.toEqual( {
			width: 800,
			height: 600,
			interlaced: false,
		} );
	} );

	it( 'parses a non-interlaced PNG', async () => {
		const file = fileFromBytes( buildPng( 1024, 768, 0 ), 'image/png' );
		await expect( getImageDimensions( file ) ).resolves.toEqual( {
			width: 1024,
			height: 768,
			interlaced: false,
		} );
	} );

	it( 'parses an Adam7-interlaced PNG', async () => {
		const file = fileFromBytes( buildPng( 1024, 768, 1 ), 'image/png' );
		await expect( getImageDimensions( file ) ).resolves.toEqual( {
			width: 1024,
			height: 768,
			interlaced: true,
		} );
	} );

	it( 'returns null for unsupported formats', async () => {
		// A WEBP-ish RIFF header, which the parser does not handle.
		const file = fileFromBytes(
			[ 0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00 ],
			'image/webp'
		);
		await expect( getImageDimensions( file ) ).resolves.toBeNull();
	} );

	it( 'returns null for truncated/garbage data', async () => {
		const file = fileFromBytes( [ 0xff, 0xd8, 0x00 ], 'image/jpeg' );
		await expect( getImageDimensions( file ) ).resolves.toBeNull();
	} );
} );
