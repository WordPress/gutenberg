/**
 * Internal dependencies
 */

import { getActiveObject } from '../get-active-object';
import { OBJECT_REPLACEMENT_CHARACTER } from '../special-characters';

describe( 'getActiveObject', () => {
	it( 'should return object if selected', () => {
		const record = {
			replacements: [ { type: 'img' } ],
			text: OBJECT_REPLACEMENT_CHARACTER,
			start: 0,
			end: 1,
		};

		expect( getActiveObject( record ) ).toEqual( { type: 'img' } );
	} );

	it( 'should return nothing if nothing is selected', () => {
		const record = {
			replacements: [ { type: 'img' } ],
			text: OBJECT_REPLACEMENT_CHARACTER,
			start: 0,
			end: 0,
		};

		expect( getActiveObject( record ) ).toBe( undefined );
	} );

	it( 'should return nothing if te selection is not an object', () => {
		const record = {
			replacements: [ { type: 'em' } ],
			text: 'a',
			start: 0,
			end: 1,
		};

		expect( getActiveObject( record ) ).toBe( undefined );
	} );
} );
