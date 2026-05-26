/**
 * Internal dependencies
 */
import { formatAspectRatio } from '../aspect-ratio';

describe( 'formatAspectRatio', () => {
	it( 'uses familiar labels for common ratios', () => {
		expect( formatAspectRatio( 4032, 3024 ) ).toBe( '4:3' );
		expect( formatAspectRatio( 1200, 1200 ) ).toBe( '1:1' );
		expect( formatAspectRatio( 900, 1600 ) ).toBe( '9:16' );
	} );

	it( 'snaps off-spec resolutions to familiar ratios within tolerance', () => {
		// 1350/899 = 1.5017 — snaps to 3:2 (1.5).
		expect( formatAspectRatio( 1350, 899 ) ).toBe( '3:2' );
		// 1366/768 = 1.7786 — snaps to 16:9 (1.7778).
		expect( formatAspectRatio( 1366, 768 ) ).toBe( '16:9' );
		// Portrait twin of 1350×899 — snaps symmetrically to 2:3.
		expect( formatAspectRatio( 899, 1350 ) ).toBe( '2:3' );
	} );

	it( 'uses short decimal labels for unusual ratios', () => {
		expect( formatAspectRatio( 2000, 1242 ) ).toBe( '1.61:1' );
		expect( formatAspectRatio( 1242, 2000 ) ).toBe( '1:1.61' );
	} );

	it( 'returns undefined for invalid dimensions', () => {
		expect( formatAspectRatio( 0, 100 ) ).toBeUndefined();
		expect( formatAspectRatio( 100, NaN ) ).toBeUndefined();
	} );
} );
