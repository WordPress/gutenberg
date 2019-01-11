/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { outdentListItems } from '../outdent-list-items';
import { getSparseArrayLength } from './helpers';
import { LINE_SEPARATOR } from '../special-characters';

describe( 'outdentListItems', () => {
	const ul = { type: 'ul' };

	it( 'should not outdent only item', () => {
		const record = {
			formats: [ , ],
			text: '1',
			start: 1,
			end: 1,
		};
		const result = outdentListItems( deepFreeze( record ), ul );

		expect( result ).toEqual( record );
		expect( result ).toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 0 );
	} );

	it( 'should indent', () => {
		const record = {
			formats: [ , [ ul ] ],
			text: `1${ LINE_SEPARATOR }`,
			start: 2,
			end: 2,
		};
		const expected = {
			formats: [ , , ],
			text: `1${ LINE_SEPARATOR }`,
			start: 2,
			end: 2,
		};
		const result = outdentListItems( deepFreeze( record ), ul );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 0 );
	} );

	it( 'should outdent two levels deep', () => {
		const record = {
			formats: [ , [ ul ], , [ ul, ul ], , ],
			text: `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`,
			start: 5,
			end: 5,
		};
		const expected = {
			formats: [ , [ ul ], , [ ul ], , ],
			text: `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`,
			start: 5,
			end: 5,
		};
		const result = outdentListItems( deepFreeze( record ), ul );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 2 );
	} );

	it( 'should outdent with multiple lines selected', () => {
		const record = {
			formats: [ , [ ul ], , [ ul, ul ], , ],
			text: `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`,
			start: 2,
			end: 5,
		};
		const expected = {
			formats: [ , , , [ ul ], , ],
			text: `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`,
			start: 2,
			end: 5,
		};
		const result = outdentListItems( deepFreeze( record ), ul );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 1 );
	} );
} );
