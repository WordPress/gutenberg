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

describe( 'applyFormat', () => {
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
		const record = {
			formats: [ , , ],
			text: `1${ LINE_SEPARATOR }`,
			start: 2,
			end: 2,
		};
		const expected = {
			formats: [ , [ ul ] ],
			text: `1${ LINE_SEPARATOR }`,
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
		const record = {
			formats: [ , [ ol ], , ],
			text: `1${ LINE_SEPARATOR }${ LINE_SEPARATOR }`,
			start: 3,
			end: 3,
		};
		const expected = {
			formats: [ , [ ol ], [ ol ] ],
			text: `1${ LINE_SEPARATOR }${ LINE_SEPARATOR }`,
			start: 3,
			end: 3,
		};
		const result = indentListItems( deepFreeze( record ), ul );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 2 );
	} );

	it( 'should indent already indented item', () => {
		const record = {
			formats: [ , [ ul ], , [ ul ], , ],
			text: `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`,
			start: 5,
			end: 5,
		};
		const expected = {
			formats: [ , [ ul ], , [ ul, ul ], , ],
			text: `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`,
			start: 5,
			end: 5,
		};
		const result = indentListItems( deepFreeze( record ), ul );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 2 );
	} );

	it( 'should indent with multiple lines selected', () => {
		const record = {
			formats: [ , , , [ ul ], , ],
			text: `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`,
			start: 2,
			end: 5,
		};
		const expected = {
			formats: [ , [ ul ], , [ ul, ul ], , ],
			text: `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`,
			start: 2,
			end: 5,
		};
		const result = indentListItems( deepFreeze( record ), ul );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 2 );
	} );
} );
