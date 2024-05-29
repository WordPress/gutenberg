/**
 * Internal dependencies
 */
import config from '../';

describe( 'npm-package-json-lint config tests', () => {
	it( 'should be an object', () => {
		expect( config ).not.toBeNull();
		expect( typeof config ).toBe( 'object' );
	} );

	it( 'should have rules property as an object', () => {
		expect( config.rules ).not.toBeNull();
		expect( typeof config.rules ).toBe( 'object' );
	} );
} );
