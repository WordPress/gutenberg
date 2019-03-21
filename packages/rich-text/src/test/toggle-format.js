/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { toggleFormat } from '../toggle-format';
import { getSparseArrayLength } from './helpers';

describe( 'toggleFormat', () => {
	const strong = { type: 'strong' };
	const em = { type: 'em' };

	it( 'should remove format if it exists at start of selection', () => {
		const record = {
			formats: [ , , , [ strong ], [ em, strong ], [ em ], [ em ], , , , , , , ],
			text: 'one two three',
			start: 3,
			end: 6,
		};
		const expected = {
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			text: 'one two three',
			start: 3,
			end: 6,
		};
		const result = toggleFormat( deepFreeze( record ), strong );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 3 );
	} );

	it( 'should apply format if it doesn\'t exist at start of selection', () => {
		const record = {
			formats: [ , , , , [ em, strong ], [ em ], [ em ], , , , , , , ],
			text: 'one two three',
			start: 3,
			end: 6,
		};
		const expected = {
			formats: [ , , , [ strong ], [ strong, em ], [ strong, em ], [ em ], , , , , , , ],
			text: 'one two three',
			start: 3,
			end: 6,
		};
		const result = toggleFormat( deepFreeze( record ), strong );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 4 );
	} );
} );
