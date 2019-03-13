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
			replacements: [ , ],
			text: '1',
			start: 1,
			end: 1,
		};
		const result = outdentListItems( deepFreeze( record ) );

		expect( result ).toEqual( record );
		expect( result ).toBe( record );
		expect( getSparseArrayLength( result.replacements ) ).toBe( 0 );
	} );

	it( 'should indent', () => {
		// As we're testing list formats, the text should remain the same.
		const text = `1${ LINE_SEPARATOR }`;
		const record = {
			replacements: [ , [ ul ] ],
			text,
			start: 2,
			end: 2,
		};
		const expected = {
			...record,
			replacements: [ , , ],
		};
		const result = outdentListItems( deepFreeze( record ) );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.replacements ) ).toBe( 0 );
	} );

	it( 'should outdent two levels deep', () => {
		// As we're testing list formats, the text should remain the same.
		const text = `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`;
		const record = {
			replacements: [ , [ ul ], , [ ul, ul ], , ],
			text,
			start: 5,
			end: 5,
		};
		const expected = {
			...record,
			replacements: [ , [ ul ], , [ ul ], , ],
		};
		const result = outdentListItems( deepFreeze( record ) );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.replacements ) ).toBe( 2 );
	} );

	it( 'should outdent with multiple lines selected', () => {
		// As we're testing list formats, the text should remain the same.
		const text = `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`;
		const record = {
			replacements: [ , [ ul ], , [ ul, ul ], , ],
			text,
			start: 2,
			end: 5,
		};
		const expected = {
			...record,
			replacements: [ , , , [ ul ], , ],
		};
		const result = outdentListItems( deepFreeze( record ) );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.replacements ) ).toBe( 1 );
	} );

	it( 'should outdent list item with children', () => {
		// As we're testing list formats, the text should remain the same.
		const text = `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3${ LINE_SEPARATOR }4`;
		const record = {
			replacements: [ , [ ul ], , [ ul, ul ], , [ ul, ul ], , ],
			text,
			start: 2,
			end: 2,
		};
		const expected = {
			...record,
			replacements: [ , , , [ ul ], , [ ul ], , ],
		};
		const result = outdentListItems( deepFreeze( record ) );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.replacements ) ).toBe( 2 );
	} );

	it( 'should outdent list based on parent list', () => {
		// As we're testing list formats, the text should remain the same.
		const text = `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3${ LINE_SEPARATOR }4`;
		const record = {
			replacements: [ , [ ul ], , [ ul, ul ], , [ ul ], , ],
			text,
			start: 6,
			end: 6,
		};
		const expected = {
			...record,
			replacements: [ , [ ul ], , [ ul, ul ], , , , ],
		};
		const result = outdentListItems( deepFreeze( record ) );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.replacements ) ).toBe( 2 );
	} );

	it( 'should outdent when a selected item is at level 0', () => {
		// As we're testing list formats, the text should remain the same.
		const text = `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`;
		const record = {
			replacements: [ , [ ul ], , , , ],
			text,
			start: 2,
			end: 5,
		};
		const expected = {
			...record,
			replacements: [ , , , , , ],
		};
		const result = outdentListItems( deepFreeze( record ) );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.replacements ) ).toBe( 0 );
	} );
} );
