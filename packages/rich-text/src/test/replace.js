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

	it( 'should move a selection at the start of the value', () => {
		const record = {
			formats: [ , , , ],
			replacements: [ , , , ],
			text: 'abc',
			start: 0,
			end: 0,
		};
		const expected = {
			formats: [ , , , , ],
			replacements: [ , , , , ],
			text: 'XYbc',
			start: 2,
			end: 2,
		};

		expect( replace( deepFreeze( record ), 'a', 'XY' ) ).toEqual(
			expected
		);
	} );

	it( 'should leave a value without a selection alone', () => {
		const record = {
			formats: [ , , , ],
			replacements: [ , , , ],
			text: 'abc',
		};
		const result = replace( deepFreeze( record ), 'a', 'XY' );

		expect( result.start ).toBeUndefined();
		expect( result.end ).toBeUndefined();
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
} );
