/**
 * External dependencies
 */
import { shallow } from 'enzyme';
/**
 * Internal dependencies
 */
import Platform from '../platform';

describe( 'Platform', () => {
	it( 'is chooses the right thing', () => {
		const element = Platform.select( {
			web: shallow( <div></div> ),
			native: shallow( <button></button> ),
		} );

		expect( element.type() ).toBe( 'div' );
	} );
} );
