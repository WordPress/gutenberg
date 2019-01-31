/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { indentListItems } from '../indent-list-items';
import { getSparseArrayLength } from './helpers';
import { LINE_SEPARATOR } from '../special-characters';

describe( 'indentListItems', () => {
	const ul = { type: 'ul' };
	const ol = { type: 'ol' };

	it( 'should not indent only item', () => {
		const record = {
			formats: [ , ],
			text: '1',
			start: 1,
			end: 1,
		};
		const result = indentListItems( deepFreeze( record ), ul );

		expect( result ).toEqual( record );
		expect( result ).toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 0 );
	} );

	it( 'should indent', () => {
		// As we're testing list formats, the text should remain the same.
		const text = `1${ LINE_SEPARATOR }`;
		const record = {
			formats: [ , , ],
			text,
			start: 2,
			end: 2,
		};
		const expected = {
			formats: [ , [ ul ] ],
			text,
			start: 2,
			end: 2,
		};
		const result = indentListItems( deepFreeze( record ), ul );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 1 );
	} );

	it( 'should not indent without target list', () => {
		const record = {
			formats: [ , [ ul ] ],
			text: `1${ LINE_SEPARATOR }`,
			start: 2,
			end: 2,
		};
		const result = indentListItems( deepFreeze( record ), ul );

		expect( result ).toEqual( record );
		expect( result ).toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 1 );
	} );

	it( 'should indent and merge with previous list', () => {
		// As we're testing list formats, the text should remain the same.
		const text = `1${ LINE_SEPARATOR }${ LINE_SEPARATOR }`;
		const record = {
			formats: [ , [ ol ], , ],
			text,
			start: 3,
			end: 3,
		};
		const expected = {
			formats: [ , [ ol ], [ ol ] ],
			text,
			start: 3,
			end: 3,
		};
		const result = indentListItems( deepFreeze( record ), ul );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 2 );
	} );

	it( 'should indent already indented item', () => {
		// As we're testing list formats, the text should remain the same.
		const text = `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`;
		const record = {
			formats: [ , [ ul ], , [ ul ], , ],
			text,
			start: 5,
			end: 5,
		};
		const expected = {
			formats: [ , [ ul ], , [ ul, ul ], , ],
			text,
			start: 5,
			end: 5,
		};
		const result = indentListItems( deepFreeze( record ), ul );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 2 );
	} );

	it( 'should indent with multiple lines selected', () => {
		// As we're testing list formats, the text should remain the same.
		const text = `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`;
		const record = {
			formats: [ , , , [ ul ], , ],
			text,
			start: 2,
			end: 5,
		};
		const expected = {
			formats: [ , [ ul ], , [ ul, ul ], , ],
			text,
			start: 2,
			end: 5,
		};
		const result = indentListItems( deepFreeze( record ), ul );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 2 );
	} );

	it( 'should indent one level at a time', () => {
		// As we're testing list formats, the text should remain the same.
		const text = `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3${ LINE_SEPARATOR }4`;
		const record = {
			formats: [ , [ ul ], , [ ul, ul ], , , , ],
			text,
			start: 6,
			end: 6,
		};

		const result1 = indentListItems( deepFreeze( record ), ul );

		expect( result1 ).not.toBe( record );
		expect( getSparseArrayLength( result1.formats ) ).toBe( 3 );
		expect( result1 ).toEqual( {
			formats: [ , [ ul ], , [ ul, ul ], , [ ul ], , ],
			text,
			start: 6,
			end: 6,
		} );

		const result2 = indentListItems( deepFreeze( result1 ), ul );

		expect( result2 ).not.toBe( result1 );
		expect( getSparseArrayLength( result2.formats ) ).toBe( 3 );
		expect( result2 ).toEqual( {
			formats: [ , [ ul ], , [ ul, ul ], , [ ul, ul ], , ],
			text,
			start: 6,
			end: 6,
		} );

		const result3 = indentListItems( deepFreeze( result2 ), ul );

		expect( result3 ).not.toBe( result2 );
		expect( getSparseArrayLength( result3.formats ) ).toBe( 3 );
		expect( result3 ).toEqual( {
			formats: [ , [ ul ], , [ ul, ul ], , [ ul, ul, ul ], , ],
			text,
			start: 6,
			end: 6,
		} );
	} );
} );
