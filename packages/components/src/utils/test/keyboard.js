/**
 * WordPress dependencies
 */
import { RIGHT, UP, DOWN, LEFT, SPACE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { normalizeArrowKey } from '../keyboard';

describe( 'normalizeArrowKey', () => {
	it.each`
		keyCode    | key               | normalized
		${ RIGHT } | ${ 'Right' }      | ${ 'ArrowRight' }
		${ UP }    | ${ 'Up' }         | ${ 'ArrowUp' }
		${ DOWN }  | ${ 'Down' }       | ${ 'ArrowDown' }
		${ LEFT }  | ${ 'Left' }       | ${ 'ArrowLeft' }
		${ RIGHT } | ${ 'ArrowRight' } | ${ 'ArrowRight' }
		${ UP }    | ${ 'ArrowUp' }    | ${ 'ArrowUp' }
		${ DOWN }  | ${ 'ArrowDown' }  | ${ 'ArrowDown' }
		${ LEFT }  | ${ 'ArrowLeft' }  | ${ 'ArrowLeft' }
		${ SPACE } | ${ 'Space' }      | ${ 'Space' }
	`(
		'should return $normalized for $key with keycode $keyCode',
		( { keyCode, key, normalized } ) => {
			const e = new window.KeyboardEvent( 'keydown', {
				key,
				keyCode,
			} );

			expect( normalizeArrowKey( e ) ).toEqual( normalized );
		}
	);
} );
