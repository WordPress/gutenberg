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
			_formats: new Map( [ [ em, [ 4, 7 ] ] ] ),
			replacements: [],
			text: 'one two three',
			start: 6,
			end: 6,
		};
		const toInsert = {
			formats: [ [ strong ] ],
			_formats: new Map( [ [ strong, [ 0, 1 ] ] ] ),
			replacements: [],
			text: 'a',
		};
		const expected = {
			formats: [ , , [ strong ], [ em ], , , , , , , ],
			_formats: new Map( [
				[ em, [ 3, 4 ] ],
				[ strong, [ 2, 3 ] ],
			] ),
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
			_formats: new Map(),
			replacements: [],
			text: 'tt',
			start: 1,
			end: 1,
		};
		const toInsert = {
			formats: [ , ],
			_formats: new Map(),
			replacements: [],
			text: '\n',
		};
		const expected = {
			formats: [ , , , ],
			_formats: new Map(),
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
