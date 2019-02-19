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
			lineFormats: [ , ],
			objects: [ , ],
			text: '1',
			start: 1,
			end: 1,
		};
		const result = indentListItems( deepFreeze( record ), ul );

		expect( result ).toEqual( record );
		expect( result ).toBe( record );
		expect( getSparseArrayLength( result.lineFormats ) ).toBe( 0 );
	} );

	it( 'should indent', () => {
		// As we're testing list formats, the text should remain the same.
		const text = `1${ LINE_SEPARATOR }`;
		const record = {
			formats: [ , , ],
			lineFormats: [ , , ],
			objects: [ , , ],
			text,
			start: 2,
			end: 2,
		};
		const expected = {
			...record,
			lineFormats: [ , [ ul ] ],
		};
		const result = indentListItems( deepFreeze( record ), ul );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.lineFormats ) ).toBe( 1 );
	} );

	it( 'should not indent without target list', () => {
		const record = {
			formats: [ , , ],
			lineFormats: [ , [ ul ] ],
			objects: [ , , ],
			text: `1${ LINE_SEPARATOR }`,
			start: 2,
			end: 2,
		};
		const result = indentListItems( deepFreeze( record ), ul );

		expect( result ).toEqual( record );
		expect( result ).toBe( record );
		expect( getSparseArrayLength( result.lineFormats ) ).toBe( 1 );
	} );

	it( 'should indent and merge with previous list', () => {
		// As we're testing list formats, the text should remain the same.
		const text = `1${ LINE_SEPARATOR }${ LINE_SEPARATOR }`;
		const record = {
			formats: [ , , , ],
			lineFormats: [ , [ ol ], , ],
			objects: [ , , , ],
			text,
			start: 3,
			end: 3,
		};
		const expected = {
			...record,
			lineFormats: [ , [ ol ], [ ol ] ],
		};
		const result = indentListItems( deepFreeze( record ), ul );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.lineFormats ) ).toBe( 2 );
	} );

	it( 'should indent already indented item', () => {
		// As we're testing list formats, the text should remain the same.
		const text = `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`;
		const record = {
			formats: [ , , , , , ],
			lineFormats: [ , [ ul ], , [ ul ], , ],
			objects: [ , , , , , ],
			text,
			start: 5,
			end: 5,
		};
		const expected = {
			...record,
			lineFormats: [ , [ ul ], , [ ul, ul ], , ],
		};
		const result = indentListItems( deepFreeze( record ), ul );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.lineFormats ) ).toBe( 2 );
	} );

	it( 'should indent with multiple lines selected', () => {
		// As we're testing list formats, the text should remain the same.
		const text = `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`;
		const record = {
			formats: [ , , , , , ],
			lineFormats: [ , , , [ ul ], , ],
			objects: [ , , , , , ],
			text,
			start: 2,
			end: 5,
		};
		const expected = {
			...record,
			lineFormats: [ , [ ul ], , [ ul, ul ], , ],
		};
		const result = indentListItems( deepFreeze( record ), ul );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.lineFormats ) ).toBe( 2 );
	} );

	it( 'should indent one level at a time', () => {
		// As we're testing list formats, the text should remain the same.
		const text = `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3${ LINE_SEPARATOR }4`;
		const record = {
			formats: Array( text.length ),
			lineFormats: [ , [ ul ], , [ ul, ul ], , , , ],
			objects: Array( text.length ),
			text,
			start: 6,
			end: 6,
		};

		const result1 = indentListItems( deepFreeze( record ), ul );

		expect( result1 ).not.toBe( record );
		expect( getSparseArrayLength( result1.lineFormats ) ).toBe( 3 );
		expect( result1 ).toEqual( {
			...record,
			lineFormats: [ , [ ul ], , [ ul, ul ], , [ ul ], , ],
		} );

		const result2 = indentListItems( deepFreeze( result1 ), ul );

		expect( result2 ).not.toBe( result1 );
		expect( getSparseArrayLength( result2.lineFormats ) ).toBe( 3 );
		expect( result2 ).toEqual( {
			...record,
			lineFormats: [ , [ ul ], , [ ul, ul ], , [ ul, ul ], , ],
		} );

		const result3 = indentListItems( deepFreeze( result2 ), ul );

		expect( result3 ).not.toBe( result2 );
		expect( getSparseArrayLength( result3.lineFormats ) ).toBe( 3 );
		expect( result3 ).toEqual( {
			...record,
			lineFormats: [ , [ ul ], , [ ul, ul ], , [ ul, ul, ul ], , ],
		} );
	} );
} );
