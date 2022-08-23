/**
 * External dependencies
 */
import isPlainObject from 'is-plain-obj';

/**
 * Internal dependencies
 */
import config from '../lib/';

describe( 'prettier config tests', () => {
	it( 'should be an object', () => {
		expect( isPlainObject( config ) ).toBeTruthy();
	} );
} );
