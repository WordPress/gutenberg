/**
 * Internal dependencies
 */
import { formatBadgeText } from '../crop-dimensions-badge';

describe( 'formatBadgeText', () => {
	it( 'renders integer-rounded dimensions with px-suffixed labels', () => {
		expect( formatBadgeText( 1240.4, 819.6 ) ).toBe( 'W: 1240px H: 820px' );
	} );

	it( 'handles whole-pixel dimensions', () => {
		expect( formatBadgeText( 500, 333 ) ).toBe( 'W: 500px H: 333px' );
	} );
} );
