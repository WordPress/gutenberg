/**
 * @jest-environment node
 */

/**
 * External dependencies
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Loads the real `wasm-vips` build to exercise the actual AVIF decoder.
 *
 * Unlike the other tests in this package, this is an integration test: it does
 * not mock `wasm-vips`, because high-bit-depth decoding happens entirely inside
 * the WebAssembly module and cannot be verified with a mock. It runs in the
 * Node test environment so the package's Node build is used (no Web Worker).
 *
 * Regression guard for the `wasm-vips` 0.0.18 bump, which links a libaom built
 * with `CONFIG_AV1_HIGHBITDEPTH=1` and enables decoding of 10- and 12-bit
 * AVIF images (kleisauke/wasm-vips#118). Earlier builds threw "error in tile"
 * decode failures on the same files.
 */
const Vips = require( 'wasm-vips' );

const FIXTURES = join( __dirname, 'fixtures' );

describe( 'wasm-vips high-bit-depth AVIF decoding', () => {
	let vips: Awaited< ReturnType< typeof Vips > >;

	beforeAll( async () => {
		vips = await Vips( { dynamicLibraries: [ 'vips-heif.wasm' ] } );
	} );

	afterAll( () => {
		vips?.shutdown?.();
	} );

	it.each( [
		[ '10-bit', 'highbitdepth-10bit.avif' ],
		[ '12-bit', 'highbitdepth-12bit.avif' ],
	] )( 'decodes a %s AVIF image into a 16-bit image', ( _label, file ) => {
		const buffer = readFileSync( join( FIXTURES, file ) );

		const image = vips.Image.newFromBuffer( buffer );

		expect( image.width ).toBe( 64 );
		expect( image.height ).toBe( 64 );
		// 10/12-bit samples decode into a 16-bit (ushort) container.
		expect( image.format ).toBe( 'ushort' );
		// Reducing every pixel forces a full-frame decode, not just a header read.
		expect( () => image.avg() ).not.toThrow();

		image.delete();
	} );

	it( 'decodes a standard 8-bit AVIF image into an 8-bit image', () => {
		const buffer = readFileSync( join( FIXTURES, 'standard-8bit.avif' ) );

		const image = vips.Image.newFromBuffer( buffer );

		expect( image.width ).toBe( 64 );
		expect( image.height ).toBe( 64 );
		expect( image.format ).toBe( 'uchar' );

		image.delete();
	} );
} );
