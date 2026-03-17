/**
 * Internal dependencies
 */
import config from '../lib/';

describe( 'prettier config tests', () => {
	it( 'should be an object', () => {
		expect( config ).not.toBeNull();
		expect( typeof config ).toBe( 'object' );
	} );
} );
