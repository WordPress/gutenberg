/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { slice } from '../slice';
import { getSparseArrayLength } from './helpers';

describe( 'slice', () => {
	const em = { type: 'em' };

	it( 'should slice', () => {
		const record = {
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			replacements: [ , , , , , , , , , , , , , ],
			text: 'one two three',
		};
		const expected = {
			formats: [ , [ em ], [ em ] ],
			replacements: [ , , , ],
			text: ' tw',
		};
		const result = slice( deepFreeze( record ), 3, 6 );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 2 );
	} );

	it( 'should slice record', () => {
		const record = {
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			replacements: [ , , , , , , , , , , , , , ],
			text: 'one two three',
			start: 3,
			end: 6,
		};
		const expected = {
			formats: [ , [ em ], [ em ] ],
			replacements: [ , , , ],
			text: ' tw',
		};
		const result = slice( deepFreeze( record ) );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 2 );
	} );
} );
