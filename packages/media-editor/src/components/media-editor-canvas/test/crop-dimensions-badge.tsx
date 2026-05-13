/**
 * Internal dependencies
 */
import { formatBadgeText } from '../crop-dimensions-badge';

describe( 'formatBadgeText', () => {
	it( 'renders integer-rounded dimensions with a multiplication sign', () => {
		expect( formatBadgeText( 1240.4, 819.6 ) ).toBe( '1240 × 820' );
	} );

	it( 'appends a labeled ratio when the aspect ratio matches a known preset', () => {
		expect( formatBadgeText( 1600, 900, 16 / 9 ) ).toBe(
			'1600 × 900 · 16:9'
		);
		expect( formatBadgeText( 800, 800, 1 ) ).toBe( '800 × 800 · 1:1' );
		expect( formatBadgeText( 900, 1200, 3 / 4 ) ).toBe(
			'900 × 1200 · 3:4'
		);
	} );

	it( 'omits the ratio segment for free / unknown aspect ratios', () => {
		expect( formatBadgeText( 500, 333 ) ).toBe( '500 × 333' );
		expect( formatBadgeText( 500, 333, 0 ) ).toBe( '500 × 333' );
		expect( formatBadgeText( 500, 321, 1.557 ) ).toBe( '500 × 321' );
	} );

	it( 'tolerates floating point drift around known preset ratios', () => {
		expect( formatBadgeText( 1600, 900, 1.7777777 ) ).toBe(
			'1600 × 900 · 16:9'
		);
	} );
} );
