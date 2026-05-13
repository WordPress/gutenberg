/**
 * Internal dependencies
 */
import { formatBadgeText } from '../crop-dimensions-badge';

describe( 'formatBadgeText', () => {
	it( 'renders integer-rounded dimensions with a multiplication sign', () => {
		expect( formatBadgeText( 1240.4, 819.6 ) ).toBe( '1240 × 820' );
	} );

	it( 'handles whole-pixel dimensions', () => {
		expect( formatBadgeText( 500, 333 ) ).toBe( '500 × 333' );
	} );
} );
