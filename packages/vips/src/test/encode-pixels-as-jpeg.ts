/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { encodePixelsAsJpeg } from '../';

/**
 * Integration tests for encoding decoded pixels with the source file's EXIF
 * carried over. Whether libvips can read the EXIF block of a HEIC it cannot
 * decode (no HEVC decoder ships with wasm-vips) is only answerable with the
 * real build, so like `rotate-image-integration.ts` this loads it instead of
 * a mock.
 *
 * `exif-camera.heic` is the 64x32 `exif-rotated-90cw.heic` fixture with
 * camera tags added:
 *
 *     exiftool -Make=WordPress -Model="Unit Camera" -n -Orientation=6 \
 *         -o exif-camera.heic exif-rotated-90cw.heic
 */

jest.mock( 'wasm-vips', () => {
	const RealVips = jest.requireActual( 'wasm-vips' );
	return jest.fn( ( options: Record< string, unknown > = {} ) =>
		RealVips( { dynamicLibraries: options.dynamicLibraries } )
	);
} );

const FIXTURES = join( __dirname, 'fixtures' );

const loadFixture = ( file: string ): ArrayBuffer => {
	const contents = readFileSync( join( FIXTURES, file ) );
	return contents.buffer.slice(
		contents.byteOffset,
		contents.byteOffset + contents.byteLength
	) as ArrayBuffer;
};

const WIDTH = 64;
const HEIGHT = 32;

/**
 * Opaque RGBA pixels: left half red, right half blue.
 */
function buildPixels(): ArrayBuffer {
	const pixels = new Uint8Array( WIDTH * HEIGHT * 4 );
	for ( let y = 0; y < HEIGHT; y++ ) {
		for ( let x = 0; x < WIDTH; x++ ) {
			const offset = ( y * WIDTH + x ) * 4;
			pixels[ offset ] = x < WIDTH / 2 ? 0xcc : 0x00;
			pixels[ offset + 2 ] = x < WIDTH / 2 ? 0x00 : 0xcc;
			pixels[ offset + 3 ] = 0xff;
		}
	}
	return pixels.buffer;
}

// Dominant-channel comparisons so lossy compression noise is tolerated.
const isRed = ( [ r, , b ]: number[] ) => r > 128 && r > b;
const isBlue = ( [ r, , b ]: number[] ) => b > 128 && b > r;

describe( 'encodePixelsAsJpeg', () => {
	let vips: any;

	beforeAll( async () => {
		const Vips = jest.requireActual( 'wasm-vips' );
		vips = await Vips( { dynamicLibraries: [ 'vips-heif.wasm' ] } );
	} );

	afterAll( () => {
		vips?.shutdown?.();
	} );

	it( 'copies the EXIF block from the source and resets the orientation', async () => {
		const buffer = await encodePixelsAsJpeg(
			'test-item',
			buildPixels(),
			WIDTH,
			HEIGHT,
			{ metadataSource: loadFixture( 'exif-camera.heic' ) }
		);

		const image = vips.Image.newFromBuffer( buffer );
		expect( image.width ).toBe( WIDTH );
		expect( image.height ).toBe( HEIGHT );

		expect( image.getString( 'exif-ifd0-Make' ) ).toContain( 'WordPress' );
		expect( image.getString( 'exif-ifd0-Model' ) ).toContain(
			'Unit Camera'
		);
		// The source says "rotate 90° CW", but the pixels are already
		// upright, so the copy must not ask viewers to rotate again.
		expect( image.getInt( 'orientation' ) ).toBe( 1 );
		expect( image.getString( 'exif-ifd0-Orientation' ) ).toMatch( /^1 / );

		expect( isRed( image.getpoint( 16, 16 ) ) ).toBe( true );
		expect( isBlue( image.getpoint( 48, 16 ) ) ).toBe( true );
	} );

	it( 'encodes a plain JPEG when the source has no readable EXIF', async () => {
		const buffer = await encodePixelsAsJpeg(
			'test-item',
			buildPixels(),
			WIDTH,
			HEIGHT,
			{
				metadataSource: new TextEncoder().encode( 'not an image' )
					.buffer as ArrayBuffer,
			}
		);

		const image = vips.Image.newFromBuffer( buffer );
		expect( image.width ).toBe( WIDTH );
		expect( image.height ).toBe( HEIGHT );
		expect( image.getTypeof( 'exif-ifd0-Make' ) ).toBe( 0 );
	} );

	it( 'encodes a plain JPEG when no source is given', async () => {
		const buffer = await encodePixelsAsJpeg(
			'test-item',
			buildPixels(),
			WIDTH,
			HEIGHT
		);

		const image = vips.Image.newFromBuffer( buffer );
		expect( image.width ).toBe( WIDTH );
		expect( image.getTypeof( 'exif-ifd0-Make' ) ).toBe( 0 );
	} );
} );
