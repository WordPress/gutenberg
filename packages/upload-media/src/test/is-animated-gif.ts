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
} );
