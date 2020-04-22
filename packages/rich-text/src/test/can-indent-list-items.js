/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { canIndentListItems } from '../can-indent-list-items';
import { LINE_SEPARATOR } from '../special-characters';

describe( 'indentListItems', () => {
	const ul = { type: 'ul' };

	it( 'should not be able to indent if no previous item', () => {
		const record = {
			replacements: [ , ],
			text: '1',
			start: 1,
			end: 1,
		};
		const result = canIndentListItems( deepFreeze( record ) );

		expect( result ).toBe( false );
	} );

	it( 'should be able to indent if previous item', () => {
		const record = {
			replacements: [ , , ],
			text: `1${ LINE_SEPARATOR }`,
			start: 2,
			end: 2,
		};
		const result = canIndentListItems( deepFreeze( record ) );

		expect( result ).toBe( true );
	} );

	it( 'should not be able to indent already far indented item', () => {
		const record = {
			replacements: [ , [ ul ] ],
			text: `1${ LINE_SEPARATOR }`,
			start: 2,
			end: 2,
		};
		const result = canIndentListItems( deepFreeze( record ) );

		expect( result ).toBe( false );
	} );
} );
