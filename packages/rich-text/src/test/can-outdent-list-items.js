/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { canOutdentListItems } from '../can-outdent-list-items';
import { LINE_SEPARATOR } from '../special-characters';

describe( 'outdentListItems', () => {
	const ul = { type: 'ul' };

	it( 'should not be able to outdent if not indented', () => {
		const record = {
			replacements: [ , ],
			text: '1',
			start: 1,
			end: 1,
		};
		const result = canOutdentListItems( deepFreeze( record ) );

		expect( result ).toBe( false );
	} );

	it( 'should be able to outdent if indented', () => {
		const record = {
			replacements: [ , [ ul ] ],
			text: `1${ LINE_SEPARATOR }`,
			start: 2,
			end: 2,
		};
		const result = canOutdentListItems( deepFreeze( record ) );

		expect( result ).toBe( true );
	} );
} );
