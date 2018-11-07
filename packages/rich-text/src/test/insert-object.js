/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { insertObject } from '../insert-object';
import { getSparseArrayLength } from './helpers';

describe( 'insert', () => {
	const obj = { type: 'obj' };
	const em = { type: 'em' };

	const OBJECT_REPLACEMENT_CHARACTER = '\ufffc';

	it( 'should delete and insert', () => {
		const record = {
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			text: 'one two three',
			start: 6,
			end: 6,
		};
		const expected = {
			formats: [ , , [ { ...obj, object: true } ], [ em ], , , , , , , ],
			text: 'on' + OBJECT_REPLACEMENT_CHARACTER + 'o three',
			start: 3,
			end: 3,
		};
		const result = insertObject( deepFreeze( record ), obj, 2, 6 );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 2 );
	} );
} );
