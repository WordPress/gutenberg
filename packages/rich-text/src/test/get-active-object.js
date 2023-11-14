/**
 * Internal dependencies
 */

import { getActiveObject } from '../get-active-object';

describe( 'getActiveObject', () => {
	it( 'should return object if selected', () => {
		const record = {
			replacements: [ { type: 'img' } ],
			text: ' ',
			start: 0,
			end: 1,
		};

		expect( getActiveObject( record ) ).toEqual( { type: 'img' } );
	} );

	it( 'should return nothing if nothing is selected', () => {
		const record = {
			replacements: [ { type: 'img' } ],
			text: ' ',
			start: 0,
			end: 0,
		};

		expect( getActiveObject( record ) ).toBe( undefined );
	} );
} );
