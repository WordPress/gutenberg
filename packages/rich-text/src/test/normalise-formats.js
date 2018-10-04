/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { normaliseFormats } from '../normalise-formats';
import { getSparseArrayLength } from './helpers';

describe( 'normaliseFormats', () => {
	const strong = { type: 'strong' };
	const em = { type: 'em' };

	it( 'should normalise formats', () => {
		const record = {
			_formats: [ , [ em ], [ { ...em }, { ...strong } ], [ em, strong ] ],
			_text: 'one two three',
		};
		const result = normaliseFormats( deepFreeze( record ) );

		expect( result ).toEqual( record );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result._formats ) ).toBe( 3 );
		expect( result._formats[ 1 ][ 0 ] ).toBe( result._formats[ 2 ][ 0 ] );
		expect( result._formats[ 1 ][ 0 ] ).toBe( result._formats[ 3 ][ 0 ] );
		expect( result._formats[ 2 ][ 1 ] ).toBe( result._formats[ 3 ][ 1 ] );
	} );
} );
