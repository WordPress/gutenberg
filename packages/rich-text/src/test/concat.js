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
			_formats: [ , , [ em ] ],
			_text: 'one',
		};
		const two = {
			_formats: [ [ em ], , , ],
			_text: 'two',
		};
		const three = {
			_formats: [ , , [ em ], [ em ], , , ],
			_text: 'onetwo',
		};

		const merged = concat( deepFreeze( one ), deepFreeze( two ) );

		expect( merged ).not.toBe( one );
		expect( merged ).toEqual( three );
		expect( getSparseArrayLength( merged._formats ) ).toBe( 2 );
	} );
} );
