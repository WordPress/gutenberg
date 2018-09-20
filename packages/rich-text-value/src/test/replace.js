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
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			text: 'one two three',
			start: 6,
			end: 6,
		};
		const expected = {
			formats: [ , , , , [ em ], , , , , , , ],
			text: 'one 2 three',
		};
		const result = replace( deepFreeze( record ), 'two', '2' );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 1 );
	} );

	it( 'should replace string to record', () => {
		const record = {
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			text: 'one two three',
			start: 6,
			end: 6,
		};
		const replacement = {
			formats: [ , ],
			text: '2',
		};
		const expected = {
			formats: [ , , , , , , , , , , , ],
			text: 'one 2 three',
		};
		const result = replace( deepFreeze( record ), 'two', replacement );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 0 );
	} );

	it( 'should replace string to function', () => {
		const record = {
			formats: [ , , , , , , , , , , , , ],
			text: 'abc12345#$*%',
			start: 6,
			end: 6,
		};
		const expected = {
			formats: [ , , , , , , , , , , , , , , , , , , ],
			text: 'abc - 12345 - #$*%',
		};
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
		const result = replace( deepFreeze( record ), /([^\d]*)(\d*)([^\w]*)/, ( match, p1, p2, p3 ) => {
			return [ p1, p2, p3 ].join( ' - ' );
		} );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 0 );
	} );
} );
