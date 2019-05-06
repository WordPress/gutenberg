/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { getParentLineIndex } from '../get-parent-line-index';
import { LINE_SEPARATOR } from '../special-characters';

describe( 'getParentLineIndex', () => {
	const ul = { type: 'ul' };

	it( 'should return undefined if there is only one line', () => {
		expect( getParentLineIndex( deepFreeze( {
			replacements: [ , ],
			text: '1',
		} ), undefined ) ).toBe( undefined );
	} );

	it( 'should return undefined if the list is part of the first root list child', () => {
		expect( getParentLineIndex( deepFreeze( {
			replacements: [ , ],
			text: `1${ LINE_SEPARATOR }2`,
		} ), 2 ) ).toBe( undefined );
	} );

	it( 'should return the line index of the parent list (1)', () => {
		expect( getParentLineIndex( deepFreeze( {
			replacements: [ , , , [ ul ], , ],
			text: `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`,
		} ), 3 ) ).toBe( 1 );
	} );

	it( 'should return the line index of the parent list (2)', () => {
		expect( getParentLineIndex( deepFreeze( {
			replacements: [ , [ ul ], , [ ul, ul ], , [ ul ], , ],
			text: `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3${ LINE_SEPARATOR }4`,
		} ), 5 ) ).toBe( undefined );
	} );
} );
