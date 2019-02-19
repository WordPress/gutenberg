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
			lineFormats: [ , , , ],
			objects: [ , , , ],
			text: 'one',
		};
		const two = {
			formats: [ [ em ], , , ],
			lineFormats: [ , , , ],
			objects: [ , , , ],
			text: 'two',
		};
		const three = {
			formats: [ , , [ em ], [ em ], , , ],
			lineFormats: [ , , , , , , ],
			objects: [ , , , , , , ],
			text: 'onetwo',
		};

		const merged = concat( deepFreeze( one ), deepFreeze( two ) );

		expect( merged ).not.toBe( one );
		expect( merged ).toEqual( three );
		expect( getSparseArrayLength( merged.formats ) ).toBe( 2 );
	} );
} );
