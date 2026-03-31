/**
 * Internal dependencies
 */
import { isAnimatedGif } from '../utils';

describe( 'isAnimatedGif', () => {
	it( 'returns false for empty buffer', () => {
		expect( isAnimatedGif( new ArrayBuffer( 0 ) ) ).toBe( false );
	} );

	it( 'returns false for non-GIF data', () => {
		// PNG magic bytes.
		const png = new Uint8Array( [ 0x89, 0x50, 0x4e, 0x47 ] );
		expect( isAnimatedGif( png.buffer ) ).toBe( false );
	} );

	it( 'returns false for a buffer that is too small', () => {
		const small = new Uint8Array( [ 0x47, 0x49, 0x46 ] ); // "GIF" only
		expect( isAnimatedGif( small.buffer ) ).toBe( false );
	} );

	it( 'returns false for a static GIF (single frame)', () => {
		// GIF magic bytes "GIF89a" followed by minimal content with only
		// one Graphic Control Extension block.
		const bytes = [
			0x47,
			0x49,
			0x46,
			0x38,
			0x39,
			0x61, // GIF89a
			// ... minimal header data ...
			0x01,
			0x00,
			0x01,
			0x00,
			0x00,
			0x00,
			0x00,
			// One graphic control extension.
			0x21,
			0xf9,
			0x04,
			0x00,
			0x00,
			0x00,
			0x00,
			0x00,
			// Image data.
			0x2c,
			0x00,
			0x00,
			0x00,
			0x00,
			0x01,
			0x00,
			0x01,
			0x00,
			0x00,
			0x02,
			0x02,
			0x44,
			0x01,
			0x00,
			// Trailer.
			0x3b,
		];
		expect( isAnimatedGif( new Uint8Array( bytes ).buffer ) ).toBe( false );
	} );

	it( 'returns true for an animated GIF (multiple frames)', () => {
		// GIF with GIF89a header and two Graphic Control Extension blocks
		// separated by Block Terminator + Extension Introducer + GCL pattern.
		const bytes = [
			0x47,
			0x49,
			0x46,
			0x38,
			0x39,
			0x61, // GIF89a
			// Minimal header.
			0x01,
			0x00,
			0x01,
			0x00,
			0x00,
			0x00,
			0x00,
			// First graphic control extension.
			0x21,
			0xf9,
			0x04,
			0x00,
			0x00,
			0x00,
			0x00,
			0x00,
			// First image data.
			0x2c,
			0x00,
			0x00,
			0x00,
			0x00,
			0x01,
			0x00,
			0x01,
			0x00,
			0x00,
			0x02,
			0x02,
			0x44,
			0x01,
			// Block Terminator (0x00) + Extension Introducer (0x21) + GCL (0xF9)
			// = pattern that indicates a second frame.
			0x00,
			0x21,
			0xf9,
			0x04,
			0x00,
			0x00,
			0x00,
			0x00,
			0x00,
			// Second image data.
			0x2c,
			0x00,
			0x00,
			0x00,
			0x00,
			0x01,
			0x00,
			0x01,
			0x00,
			0x00,
			0x02,
			0x02,
			0x44,
			0x01,
			0x00,
			// Trailer.
			0x3b,
		];
		expect( isAnimatedGif( new Uint8Array( bytes ).buffer ) ).toBe( true );
	} );

	it( 'returns false for GIF87a header (older format, no animation)', () => {
		// GIF87a doesn't support Graphic Control Extensions.
		const bytes = [
			0x47,
			0x49,
			0x46,
			0x38,
			0x37,
			0x61, // GIF87a
			0x01,
			0x00,
			0x01,
			0x00,
			0x00,
			0x00,
			0x00,
			0x2c,
			0x00,
			0x00,
			0x00,
			0x00,
			0x01,
			0x00,
			0x01,
			0x00,
			0x00,
			0x02,
			0x02,
			0x44,
			0x01,
			0x00,
			0x3b,
		];
		// GIF87a starts with "GIF8" so the magic check passes,
		// but there are no GCE blocks so it should return false.
		expect( isAnimatedGif( new Uint8Array( bytes ).buffer ) ).toBe( false );
	} );
} );
