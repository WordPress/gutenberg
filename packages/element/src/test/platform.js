/**
 * Internal dependencies
 */
import Platform from '../platform';

describe( 'Platform', () => {
	it( 'is chooses the right thing', () => {
		const element = Platform.select( {
			web: <div />,
			native: <button />,
		} );

		expect( element ).toEqual( <div /> );
	} );
} );
