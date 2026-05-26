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

	it( 'uses short decimal labels for unusual ratios', () => {
		expect( formatAspectRatio( 2000, 1242 ) ).toBe( '1.61:1' );
		expect( formatAspectRatio( 1242, 2000 ) ).toBe( '1:1.61' );
	} );

	it( 'returns undefined for invalid dimensions', () => {
		expect( formatAspectRatio( 0, 100 ) ).toBeUndefined();
		expect( formatAspectRatio( 100, NaN ) ).toBeUndefined();
	} );
} );
