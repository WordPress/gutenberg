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
			text: 'one',
		};
		const two = {
			formats: [ [ em ], , , ],
			text: 'two',
		};
		const three = {
			formats: [ , , [ em ], [ em ], , , ],
			text: 'onetwo',
		};

		const merged = concat( deepFreeze( one ), deepFreeze( two ) );

		expect( merged ).not.toBe( one );
		expect( merged ).toEqual( three );
		expect( getSparseArrayLength( merged.formats ) ).toBe( 2 );
	} );
} );
