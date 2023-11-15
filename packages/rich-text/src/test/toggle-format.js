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

	it( 'should remove format if it is active', () => {
		const record = {
			formats: [
				,
				,
				,
				// In reality, formats at a different index are never the same
				// value. Only formats that create the same tag are the same
				// value.
				[ { type: 'strong' } ],
				[ em, strong ],
				[ em, strong ],
				[ em ],
				,
				,
				,
				,
				,
				,
			],
			_formats: new Map( [
				[ em, [ 4, 7 ] ],
				[ strong, [ 3, 6 ] ],
			] ),
			text: 'one two three',
			start: 3,
			end: 6,
		};
		const expected = {
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			_formats: new Map( [ [ em, [ 4, 7 ] ] ] ),
			activeFormats: [],
			text: 'one two three',
			start: 3,
			end: 6,
		};
		const result = toggleFormat( deepFreeze( record ), strong );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 3 );
	} );

	it( "should apply format if it doesn't exist at start of selection", () => {
		const record = {
			formats: [ , , , , [ em, strong ], [ em ], [ em ], , , , , , , ],
			_formats: new Map( [
				[ em, [ 4, 7 ] ],
				[ strong, [ 4, 5 ] ],
			] ),
			text: 'one two three',
			start: 3,
			end: 6,
		};
		const expected = {
			formats: [
				,
				,
				,
				[ strong ],
				[ strong, em ],
				[ strong, em ],
				[ em ],
				,
				,
				,
				,
				,
				,
			],
			_formats: new Map( [
				[ em, [ 4, 7 ] ],
				[ strong, [ 3, 6 ] ],
			] ),
			activeFormats: [ strong ],
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
