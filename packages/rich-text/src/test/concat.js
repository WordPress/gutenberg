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
			_formats: new Map().set( em, [ 2, 3 ] ),
			replacements: [ , , , ],
			text: 'one',
		};
		const two = {
			formats: [ [ em ], , , ],
			_formats: new Map().set( em, [ 0, 1 ] ),
			replacements: [ , , , ],
			text: 'two',
		};
		const three = {
			formats: [ , , [ em ], [ em ], , , ],
			_formats: new Map().set( em, [ 2, 4 ] ),
			replacements: [ , , , , , , ],
			text: 'onetwo',
		};

		const merged = concat( deepFreeze( one ), deepFreeze( two ) );

		expect( merged ).not.toBe( one );
		expect( merged ).toEqual( three );
		expect( getSparseArrayLength( merged.formats ) ).toBe( 2 );
	} );
} );
