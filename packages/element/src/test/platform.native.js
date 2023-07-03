/**
 * Internal dependencies
 */
import Platform from '../platform';

describe( 'Platform', () => {
	it( 'is chooses the right thing', () => {
		const selection = Platform.select( {
			web: 'web',
			native: 'native',
		} );

		expect( selection ).toBe( 'native' );
	} );
} );
