/**
 * External dependencies
 */
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import config from '../lib/';

describe( 'prettier config tests', () => {
	it( 'should be an object', () => {
		expect( isPlainObject( config ) ).toBeTruthy();
	} );
} );
