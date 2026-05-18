/**
 * Internal dependencies
 */
import { isAnimatedGif } from '../utils';

/**
 * Builds a minimal GIF buffer.
 *
 * @param frameExtensions Number of Graphic Control Extension blocks to embed.
 * @return ArrayBuffer of a synthetic GIF.
 */
function buildGif( frameExtensions: number ): ArrayBuffer {
	// Header "GIF8" + "9a".
	const bytes: number[] = [ 0x47, 0x49, 0x46, 0x38, 0x39, 0x61 ];
	for ( let i = 0; i < frameExtensions; i++ ) {
		// Block Terminator, Extension Introducer, Graphic Control Label.
		bytes.push( 0x00, 0x21, 0xf9 );
	}
	return new Uint8Array( bytes ).buffer;
}

describe( 'isAnimatedGif', () => {
	it( 'returns false for a non-GIF buffer', () => {
		expect(
			isAnimatedGif( new Uint8Array( [ 0x89, 0x50, 0x4e, 0x47 ] ).buffer )
		).toBe( false );
	} );

	it( 'returns false for a buffer shorter than the magic bytes', () => {
		expect( isAnimatedGif( new Uint8Array( [ 0x47 ] ).buffer ) ).toBe(
			false
		);
	} );

	it( 'returns false for a single-frame (static) GIF', () => {
		expect( isAnimatedGif( buildGif( 1 ) ) ).toBe( false );
	} );

	it( 'returns true for a multi-frame (animated) GIF', () => {
		expect( isAnimatedGif( buildGif( 2 ) ) ).toBe( true );
	} );

	// Characterization test for a documented heuristic limitation: the marker
	// byte sequence can occur coincidentally inside image data, so a
	// single-frame GIF can be misreported as animated. This is non-destructive
	// (the worker's ImageDecoder frame count is authoritative) — see the
	// isAnimatedGif docblock.
	it( 'misreports a single-frame GIF when image data contains the marker bytes (known limitation)', () => {
		// Header + one real Graphic Control Extension, then a coincidental
		// 0x00 0x21 0xF9 sequence embedded in "image data".
		const bytes = [
			0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x21, 0xf9, 0x42, 0x07,
			0x00, 0x21, 0xf9,
		];
		expect( isAnimatedGif( new Uint8Array( bytes ).buffer ) ).toBe( true );
	} );
} );
