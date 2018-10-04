/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { removeFormat } from '../remove-format';
import { getSparseArrayLength } from './helpers';

describe( 'removeFormat', () => {
	const strong = { type: 'strong' };
	const em = { type: 'em' };

	it( 'should remove format', () => {
		const record = {
			_formats: [ , , , [ strong ], [ em, strong ], [ em, strong ], [ em ], , , , , , , ],
			_text: 'one two three',
		};
		const expected = {
			_formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			_text: 'one two three',
		};
		const result = removeFormat( deepFreeze( record ), 'strong', 3, 6 );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result._formats ) ).toBe( 3 );
	} );

	it( 'should remove format for collased selection', () => {
		const record = {
			_formats: [ , , , [ strong ], [ em, strong ], [ em, strong ], [ em ], , , , , , , ],
			_text: 'one two three',
		};
		const expected = {
			_formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			_text: 'one two three',
		};
		const result = removeFormat( deepFreeze( record ), 'strong', 4, 4 );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result._formats ) ).toBe( 3 );
	} );
} );
