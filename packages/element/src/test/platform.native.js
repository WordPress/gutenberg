/**
 * Internal dependencies
 */
import Platform from '../platform';

describe( 'Platform', () => {
	it( 'is chooses the right thing', () => {
		const element = Platform.select( {
			web: ( <div></div> ),
			native: ( <button></button> ),
		} );

		expect( element.type() ).toBe( 'button' );
	} );
} );
