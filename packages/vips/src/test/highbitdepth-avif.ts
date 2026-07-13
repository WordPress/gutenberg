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

	/*
	 * Output (sub-size) bit depth.
	 *
	 * Decoding alone (above) does not prove that generated sub-sizes stay
	 * high-bit-depth. The resize pipeline must avoid `thumbnail` (which flattens
	 * to 8-bit sRGB) and write the matching bit depth on save. These tests
	 * exercise the same vips operations `resizeImage` uses for high-bit-depth
	 * sources. They cannot import `resizeImage` directly: that module inlines
	 * the WASM binaries at build time, so it only runs through the package build,
	 * not the Node test environment. The mocked `resize-image.ts` unit test
	 * verifies that `resizeImage` actually wires these operations together.
	 */
	describe( 'resize preserves bit depth', () => {
		it.each( [
			[ '10-bit', 'highbitdepth-10bit.avif', 10 ],
			[ '12-bit', 'highbitdepth-12bit.avif', 12 ],
		] )(
			'keeps a %s AVIF high-bit-depth through resize and re-encode',
			( _label, file, depth ) => {
				const buffer = readFileSync( join( FIXTURES, file ) );

				// `thumbnail` flattens samples to 8-bit sRGB...
				const flattened = vips.Image.thumbnailBuffer( buffer, 32, {
					size: 'down',
					height: 32,
				} );
				expect( flattened.format ).toBe( 'uchar' );
				flattened.delete();

				// ...while resizing the decoded 16-bit image keeps full precision.
				const resized =
					vips.Image.newFromBuffer( buffer ).resize( 0.5 );
				expect( resized.width ).toBe( 32 );
				expect( resized.format ).toBe( 'ushort' );
				// More than 256 tonal levels means genuine high-bit-depth data,
				// not 8-bit values stretched into a 16-bit container.
				expect( resized.max() ).toBeGreaterThan( 255 );

				// Re-encoding with the matching bit depth yields a high-bit-depth AVIF.
				const out = resized.writeToBuffer( '.avif', {
					keep: 'icc|gainmap',
					Q: 82,
					effort: 2,
					bitdepth: depth,
				} );
				const reloaded = vips.Image.newFromBuffer( out );
				expect( reloaded.format ).toBe( 'ushort' );
				expect( reloaded.getInt( 'heif-bitdepth' ) ).toBe( depth );

				reloaded.delete();
				resized.delete();
			}
		);

		it( 'requires the explicit bit depth to keep a 10-bit source at 10-bit', () => {
			// Regression guard for passing the source bit depth on save.
			// heifsave defaults any 16-bit image to 12-bit, so a 10-bit source
			// would be inflated to 12-bit (larger, not "similar") unless the
			// original depth is written explicitly.
			const buffer = readFileSync(
				join( FIXTURES, 'highbitdepth-10bit.avif' )
			);
			const resized = vips.Image.newFromBuffer( buffer ).resize( 0.5 );

			const saveOptions = { keep: 'icc|gainmap', Q: 82, effort: 2 };

			const defaultOut = resized.writeToBuffer( '.avif', saveOptions );
			const defaultReloaded = vips.Image.newFromBuffer( defaultOut );
			// Default inflates the 10-bit source to 12-bit.
			expect( defaultReloaded.getInt( 'heif-bitdepth' ) ).toBe( 12 );

			const preservedOut = resized.writeToBuffer( '.avif', {
				...saveOptions,
				bitdepth: 10,
			} );
			const preservedReloaded = vips.Image.newFromBuffer( preservedOut );
			// Explicit bit depth keeps it at the source's 10-bit.
			expect( preservedReloaded.getInt( 'heif-bitdepth' ) ).toBe( 10 );

			preservedReloaded.delete();
			defaultReloaded.delete();
			resized.delete();
		} );
	} );
} );
