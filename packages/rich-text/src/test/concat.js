/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { concat } from '../concat';
import { getSparseArrayLength } from './helpers';

describe( 'concat', () => {
	const em = { type: 'em' };

	it( 'should merge records', () => {
		const one = {
			formats: [ , , [ em ] ],
			replacements: [ , , , ],
			text: 'one',
		};
		const two = {
			formats: [ [ em ], , , ],
			replacements: [ , , , ],
			text: 'two',
		};
		const three = {
			formats: [ , , [ em ], [ em ], , , ],
			replacements: [ , , , , , , ],
			text: 'onetwo',
		};

		const merged = concat( deepFreeze( one ), deepFreeze( two ) );

		expect( merged ).not.toBe( one );
		expect( merged ).toEqual( three );
		expect( getSparseArrayLength( merged.formats ) ).toBe( 2 );
	} );
} );
