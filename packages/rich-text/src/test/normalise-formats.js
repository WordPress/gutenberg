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
			formats: [
				,
				[ em ],
				[ { ...em }, { ...strong } ],
				[ em, strong ],
				,
				[ { ...em } ],
			],
			text: 'one two three',
		};
		const result = normaliseFormats( deepFreeze( record ) );

		expect( result ).toEqual( record );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 4 );
		expect( result.formats[ 1 ][ 0 ] ).toBe( result.formats[ 2 ][ 0 ] );
		expect( result.formats[ 1 ][ 0 ] ).toBe( result.formats[ 3 ][ 0 ] );
		expect( result.formats[ 1 ][ 0 ] ).not.toBe( result.formats[ 5 ][ 0 ] );
		expect( result.formats[ 2 ][ 1 ] ).toBe( result.formats[ 3 ][ 1 ] );
	} );
} );
