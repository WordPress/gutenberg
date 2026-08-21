/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Loads the real `wasm-vips` build to exercise the actual PNG encoder.
 *
 * Like the high-bit-depth AVIF test, this is an integration test rather than a
 * mocked one: palette quantisation happens inside the WebAssembly module and
 * cannot be observed through a mock. It runs in the Node test environment so
 * the package's Node build is used.
 *
 * Guards against indexed PNGs being re-encoded as truecolour, which makes
 * sub-sizes several times larger than the source they were derived from.
 * See https://github.com/WordPress/gutenberg/issues/81895.
 */
const Vips = require( 'wasm-vips' );

const FIXTURES = join( __dirname, 'fixtures' );

// Byte 25 of a PNG is the IHDR colour type: 3 is indexed, 2 and 6 truecolour.
const COLOUR_TYPE_OFFSET = 25;
const COLOUR_TYPE_INDEXED = 3;

describe( 'indexed PNG handling', () => {
	let vips: Awaited< ReturnType< typeof Vips > >;

	beforeAll( async () => {
		vips = await Vips();
	} );

	afterAll( () => {
		vips?.shutdown?.();
	} );

	it( 'reports an indexed source through the palette field', () => {
		const buffer = readFileSync( join( FIXTURES, 'indexed-palette.png' ) );
		expect( buffer[ COLOUR_TYPE_OFFSET ] ).toBe( COLOUR_TYPE_INDEXED );

		const image = vips.Image.newFromBuffer( buffer );

		// libvips decodes the palette away, keeping only this marker.
		expect( image.getInt( 'palette' ) ).toBe( 1 );
	} );

	it( 'does not report a palette for a truecolour source', () => {
		const buffer = readFileSync( join( FIXTURES, 'indexed-palette.png' ) );
		const truecolour = vips.Image.newFromBuffer( buffer ).writeToBuffer(
			'.png',
			{}
		);

		const image = vips.Image.newFromBuffer( truecolour );

		expect( () => image.getInt( 'palette' ) ).toThrow();
	} );

	it( 'keeps a resized indexed PNG indexed and smaller than truecolour', () => {
		const buffer = readFileSync( join( FIXTURES, 'indexed-palette.png' ) );
		const image = vips.Image.newFromBuffer( buffer );
		const resized = image.resize( 0.5 );

		const asTruecolour = resized.writeToBuffer( '.png', {} );
		const asIndexed = resized.writeToBuffer( '.png', { palette: true } );

		expect( asTruecolour[ COLOUR_TYPE_OFFSET ] ).not.toBe(
			COLOUR_TYPE_INDEXED
		);
		expect( asIndexed[ COLOUR_TYPE_OFFSET ] ).toBe( COLOUR_TYPE_INDEXED );
		expect( asIndexed.length ).toBeLessThan( asTruecolour.length );
	} );
} );
