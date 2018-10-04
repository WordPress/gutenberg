
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
			_formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			_text: 'one two three',
		};
		const expected = {
			_formats: [ , [ em ], [ em ] ],
			_text: ' tw',
		};
		const result = slice( deepFreeze( record ), 3, 6 );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result._formats ) ).toBe( 2 );
	} );

	it( 'should slice record', () => {
		const record = {
			_formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			_text: 'one two three',
			_start: 3,
			_end: 6,
		};
		const expected = {
			_formats: [ , [ em ], [ em ] ],
			_text: ' tw',
		};
		const result = slice( deepFreeze( record ) );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result._formats ) ).toBe( 2 );
	} );
} );
