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
			lines: [ , ],
			objects: [ , ],
			text: '1',
			start: 1,
			end: 1,
		};
		const result = outdentListItems( deepFreeze( record ) );

		expect( result ).toEqual( record );
		expect( result ).toBe( record );
		expect( getSparseArrayLength( result.lines ) ).toBe( 0 );
	} );

	it( 'should indent', () => {
		// As we're testing list formats, the text should remain the same.
		const text = `1${ LINE_SEPARATOR }`;
		const record = {
			formats: Array( text.length ),
			lines: [ , [ ul ] ],
			objects: Array( text.length ),
			text,
			start: 2,
			end: 2,
		};
		const expected = {
			...record,
			lines: [ , , ],
		};
		const result = outdentListItems( deepFreeze( record ) );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.lines ) ).toBe( 0 );
	} );

	it( 'should outdent two levels deep', () => {
		// As we're testing list formats, the text should remain the same.
		const text = `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`;
		const record = {
			formats: Array( text.length ),
			lines: [ , [ ul ], , [ ul, ul ], , ],
			objects: Array( text.length ),
			text,
			start: 5,
			end: 5,
		};
		const expected = {
			...record,
			lines: [ , [ ul ], , [ ul ], , ],
		};
		const result = outdentListItems( deepFreeze( record ) );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.lines ) ).toBe( 2 );
	} );

	it( 'should outdent with multiple lines selected', () => {
		// As we're testing list formats, the text should remain the same.
		const text = `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`;
		const record = {
			formats: Array( text.length ),
			lines: [ , [ ul ], , [ ul, ul ], , ],
			objects: Array( text.length ),
			text,
			start: 2,
			end: 5,
		};
		const expected = {
			...record,
			lines: [ , , , [ ul ], , ],
		};
		const result = outdentListItems( deepFreeze( record ) );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.lines ) ).toBe( 1 );
	} );

	it( 'should outdent list item with children', () => {
		// As we're testing list formats, the text should remain the same.
		const text = `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3${ LINE_SEPARATOR }4`;
		const record = {
			formats: Array( text.length ),
			lines: [ , [ ul ], , [ ul, ul ], , [ ul, ul ], , ],
			objects: Array( text.length ),
			text,
			start: 2,
			end: 2,
		};
		const expected = {
			...record,
			lines: [ , , , [ ul ], , [ ul ], , ],
		};
		const result = outdentListItems( deepFreeze( record ) );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.lines ) ).toBe( 2 );
	} );

	it( 'should outdent list based on parent list', () => {
		// As we're testing list formats, the text should remain the same.
		const text = `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3${ LINE_SEPARATOR }4`;
		const record = {
			formats: Array( text.length ),
			lines: [ , [ ul ], , [ ul, ul ], , [ ul ], , ],
			objects: Array( text.length ),
			text,
			start: 6,
			end: 6,
		};
		const expected = {
			...record,
			lines: [ , [ ul ], , [ ul, ul ], , , , ],
		};
		const result = outdentListItems( deepFreeze( record ) );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.lines ) ).toBe( 2 );
	} );

	it( 'should outdent when a selected item is at level 0', () => {
		// As we're testing list formats, the text should remain the same.
		const text = `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`;
		const record = {
			formats: Array( text.length ),
			lines: [ , [ ul ], , , , ],
			objects: Array( text.length ),
			text,
			start: 2,
			end: 5,
		};
		const expected = {
			...record,
			lines: [ , , , , , ],
		};
		const result = outdentListItems( deepFreeze( record ) );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.lines ) ).toBe( 0 );
	} );
} );
