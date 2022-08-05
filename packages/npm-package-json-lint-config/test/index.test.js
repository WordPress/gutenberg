/**
 * External dependencies
 */
import isPlainObject from 'is-plain-obj';

/**
 * Internal dependencies
 */
import config from '../';

describe( 'npm-package-json-lint config tests', () => {
	it( 'should be an object', () => {
		expect( isPlainObject( config ) ).toBeTruthy();
	} );

	it( 'should have rules property as an object', () => {
		expect( isPlainObject( config.rules ) ).toBeTruthy();
	} );
} );
