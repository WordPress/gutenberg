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
			replacements: [],
			text: 'one two three',
			start: 6,
			end: 6,
		};
		const toInsert = {
			formats: [ [ strong ] ],
			replacements: [],
			text: 'a',
		};
		const expected = {
			formats: [ , , [ strong ], [ em ], , , , , , , ],
			replacements: [],
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
			replacements: [],
			text: 'tt',
			start: 1,
			end: 1,
		};
		const toInsert = {
			formats: [ , ],
			replacements: [],
			text: '\n',
		};
		const expected = {
			formats: [ , , , ],
			replacements: [],
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
