/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { insert } from '../insert';
import { getSparseArrayLength } from './helpers';

describe( 'insert', () => {
	const em = { type: 'em' };
	const strong = { type: 'strong' };

	it( 'should delete and insert', () => {
		const record = {
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			lines: [],
			objects: [],
			text: 'one two three',
			start: 6,
			end: 6,
		};
		const toInsert = {
			formats: [ [ strong ] ],
			lines: [],
			objects: [],
			text: 'a',
		};
		const expected = {
			formats: [ , , [ strong ], [ em ], , , , , , , ],
			lines: [],
			objects: [],
			text: 'onao three',
			start: 3,
			end: 3,
		};
		const result = insert( deepFreeze( record ), toInsert, 2, 6 );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 2 );
	} );

	it( 'should insert line break with selection', () => {
		const record = {
			formats: [ , , ],
			lines: [],
			objects: [],
			text: 'tt',
			start: 1,
			end: 1,
		};
		const toInsert = {
			formats: [ , ],
			lines: [],
			objects: [],
			text: '\n',
		};
		const expected = {
			formats: [ , , , ],
			lines: [],
			objects: [],
			text: 't\nt',
			start: 2,
			end: 2,
		};
		const result = insert( deepFreeze( record ), toInsert );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 0 );
	} );
} );
