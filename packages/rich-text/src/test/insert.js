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
			_formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			_text: 'one two three',
			_start: 6,
			_end: 6,
		};
		const toInsert = {
			_formats: [ [ strong ] ],
			_text: 'a',
		};
		const expected = {
			_formats: [ , , [ strong ], [ em ], , , , , , , ],
			_text: 'onao three',
			_start: 3,
			_end: 3,
		};
		const result = insert( deepFreeze( record ), toInsert, 2, 6 );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result._formats ) ).toBe( 2 );
	} );

	it( 'should insert line break with selection', () => {
		const record = {
			_formats: [ , , ],
			_text: 'tt',
			_start: 1,
			_end: 1,
		};
		const toInsert = {
			_formats: [ , ],
			_text: '\n',
		};
		const expected = {
			_formats: [ , , , ],
			_text: 't\nt',
			_start: 2,
			_end: 2,
		};
		const result = insert( deepFreeze( record ), toInsert );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result._formats ) ).toBe( 0 );
	} );
} );
