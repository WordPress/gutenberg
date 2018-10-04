/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { replace } from '../replace';
import { getSparseArrayLength } from './helpers';

describe( 'replace', () => {
	const em = { type: 'em' };

	it( 'should replace string to string', () => {
		const record = {
			_formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			_text: 'one two three',
			_start: 6,
			_end: 6,
		};
		const expected = {
			_formats: [ , , , , [ em ], , , , , , , ],
			_text: 'one 2 three',
			_start: 5,
			_end: 5,
		};
		const result = replace( deepFreeze( record ), 'two', '2' );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result._formats ) ).toBe( 1 );
	} );

	it( 'should replace string to record', () => {
		const record = {
			_formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			_text: 'one two three',
			_start: 6,
			_end: 6,
		};
		const replacement = {
			_formats: [ , ],
			_text: '2',
		};
		const expected = {
			_formats: [ , , , , , , , , , , , ],
			_text: 'one 2 three',
			_start: 5,
			_end: 5,
		};
		const result = replace( deepFreeze( record ), 'two', replacement );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result._formats ) ).toBe( 0 );
	} );

	it( 'should replace string to function', () => {
		const record = {
			_formats: [ , , , , , , , , , , , , ],
			_text: 'abc12345#$*%',
			_start: 6,
			_end: 6,
		};
		const expected = {
			_formats: [ , , , , , , , , , , , , , , , , , , ],
			_text: 'abc - 12345 - #$*%',
			_start: 18,
			_end: 18,
		};
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
		const result = replace( deepFreeze( record ), /([^\d]*)(\d*)([^\w]*)/, ( match, p1, p2, p3 ) => {
			return [ p1, p2, p3 ].join( ' - ' );
		} );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result._formats ) ).toBe( 0 );
	} );
} );
