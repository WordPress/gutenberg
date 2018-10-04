/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { applyFormat } from '../apply-format';
import { getSparseArrayLength } from './helpers';

describe( 'applyFormat', () => {
	const strong = { type: 'strong' };
	const em = { type: 'em' };

	it( 'should apply format', () => {
		const record = {
			_formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			_text: 'one two three',
		};
		const expected = {
			_formats: [ , , , [ strong ], [ em, strong ], [ em, strong ], [ em ], , , , , , , ],
			_text: 'one two three',
		};
		const result = applyFormat( deepFreeze( record ), strong, 3, 6 );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result._formats ) ).toBe( 4 );
	} );

	it( 'should apply format by selection', () => {
		const record = {
			_formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			_text: 'one two three',
			_start: 3,
			_end: 6,
		};
		const expected = {
			_formats: [ , , , [ strong ], [ em, strong ], [ em, strong ], [ em ], , , , , , , ],
			_text: 'one two three',
			_start: 3,
			_end: 6,
		};
		const result = applyFormat( deepFreeze( record ), strong );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result._formats ) ).toBe( 4 );
	} );
} );
