/**
 * WordPress dependencies
 */
import { RIGHT, SPACE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { normalizeArrowKey } from '../keyboard';

describe( 'normalizeArrowKey', () => {
	it( 'should return the Arrow(Key) version for the presed key', () => {
		const e = new window.KeyboardEvent( 'keydown', {
			key: 'Right',
			keyCode: RIGHT,
		} );

		expect( normalizeArrowKey( e ) ).toEqual( 'ArrowRight' );
	} );

	it( 'should return the non-normalized version if given a non arrow key event', () => {
		const e = new window.KeyboardEvent( 'keydown', {
			key: 'Space',
			keyCode: SPACE,
		} );

		expect( normalizeArrowKey( e ) ).toEqual( 'Space' );
	} );
} );
