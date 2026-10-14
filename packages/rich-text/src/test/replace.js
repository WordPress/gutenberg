import { describe, expect, it } from 'vitest';
import deepFreeze from 'deep-freeze';
import { replace } from '../replace';
import { getSparseArrayLength } from './helpers';

describe( 'replace', () => {
	const em = { type: 'em' };

	it( 'should replace string to string', () => {
		const record = {
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			replacements: [ , , , , , , , , , , , , , ],
			text: 'one two three',
			start: 6,
			end: 6,
		};
		const expected = {
			formats: [ , , , , [ em ], , , , , , , ],
			replacements: [ , , , , , , , , , , , ],
			text: 'one 2 three',
			start: 5,
			end: 5,
		};
		const result = replace( deepFreeze( record ), 'two', '2' );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 1 );
	} );

	it( 'should replace string to record', () => {
		const record = {
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			replacements: [ , , , , , , , , , , , , , ],
			text: 'one two three',
			start: 6,
			end: 6,
		};
		const replacement = {
			formats: [ , ],
			replacements: [ , ],
			text: '2',
		};
		const expected = {
			formats: [ , , , , , , , , , , , ],
			replacements: [ , , , , , , , , , , , ],
			text: 'one 2 three',
			start: 5,
			end: 5,
		};
		const result = replace( deepFreeze( record ), 'two', replacement );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 0 );
	} );

	it( 'should replace string to function', () => {
		const record = {
			formats: [ , , , , , , , , , , , , ],
			replacements: [ , , , , , , , , , , , , ],
			text: 'abc12345#$*%',
			start: 6,
			end: 6,
		};
		const expected = {
			formats: [ , , , , , , , , , , , , , , , , , , ],
			replacements: [ , , , , , , , , , , , , , , , , , , ],
			text: 'abc - 12345 - #$*%',
			start: 18,
			end: 18,
		};
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
		const result = replace(
			deepFreeze( record ),
			/([^\d]*)(\d*)([^\w]*)/,
			( match, p1, p2, p3 ) => {
				return [ p1, p2, p3 ].join( ' - ' );
			}
		);

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 0 );
	} );

	it( 'should replace with a pattern with named groups', () => {
		const record = {
			formats: [ , , , , [ em ], [ em ] ],
			replacements: [ , , , , , , ],
			text: 'ab12cd',
			start: 6,
			end: 6,
		};
		const expected = {
			formats: [ , , , [ em ], [ em ] ],
			replacements: [ , , , , , ],
			text: 'abXcd',
			start: 3,
			end: 3,
		};
		const result = replace( deepFreeze( record ), /(?<digits>\d+)/, 'X' );

		expect( result ).toEqual( expected );
	} );

	it( 'should move a caret at the start', () => {
		const record = {
			formats: [ , , ],
			replacements: [ , , ],
			text: 'ab',
			start: 0,
			end: 0,
		};
		const result = replace( deepFreeze( record ), 'a', 'xyz' );

		expect( result.text ).toBe( 'xyzb' );
		expect( result.start ).toBe( 3 );
		expect( result.end ).toBe( 3 );
	} );
} );
