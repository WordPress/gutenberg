/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { getLastChildIndex } from '../get-last-child-index';
import { LINE_SEPARATOR } from '../special-characters';

describe( 'outdentListItems', () => {
	const ul = { type: 'ul' };

	it( 'should return undefined if there is only one line', () => {
		expect( getLastChildIndex( deepFreeze( {
			formats: [ , ],
			text: '1',
		} ), undefined ) ).toBe( undefined );
	} );

	it( 'should return the last line if no line is indented', () => {
		expect( getLastChildIndex( deepFreeze( {
			formats: [ , ],
			text: `1${ LINE_SEPARATOR }`,
		} ), undefined ) ).toBe( 1 );
	} );

	it( 'should return the last child index', () => {
		expect( getLastChildIndex( deepFreeze( {
			formats: [ , [ ul ], , [ ul ], , ],
			text: `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`,
		} ), undefined ) ).toBe( 3 );
	} );

	it( 'should return the last child index by sibling', () => {
		expect( getLastChildIndex( deepFreeze( {
			formats: [ , [ ul ], , [ ul ], , ],
			text: `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`,
		} ), 1 ) ).toBe( 3 );
	} );

	it( 'should return the last child index (with further lower indented items)', () => {
		expect( getLastChildIndex( deepFreeze( {
			formats: [ , [ ul ], , , , ],
			text: `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`,
		} ), 1 ) ).toBe( 1 );
	} );
} );
