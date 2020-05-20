/**
 * Internal dependencies
 */
import { getNormalizedTitle } from '../changelog';

describe( 'getNormalizedTitle', () => {
	describe( 'ends in period', () => {
		it( 'adds a period if missing', () => {
			const result = getNormalizedTitle( 'Fixes a bug' );

			expect( result ).toBe( 'Fixes a bug.' );
		} );

		it( 'does not add a period if already present', () => {
			const result = getNormalizedTitle( 'Fixes a bug.' );

			expect( result ).toBe( 'Fixes a bug.' );
		} );
	} );
} );
