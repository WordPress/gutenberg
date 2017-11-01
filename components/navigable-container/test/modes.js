/**
 * External Dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import { calculateMode } from '../modes';

const { UP, DOWN, TAB, LEFT, RIGHT } = keycodes;

function assertIndex( expected, index, total, shiftKey, keyCode, config ) {
	const actual = calculateMode( config );
	const event = {
		shiftKey,
		keyCode,
		nativeEvent: {
			stopImmediatePropagation: () => { },
		},
		stopPropagation: () => { },
		preventDefault: () => { },
	};

	const detector = actual.detect( event );
	if ( ! detector ) {
		expect( index ).toEqual( expected );
	} else {
		expect( detector( index, total ) ).toEqual( expected );
	}
}

describe( 'calculateMode tabbing', () => {
	it( 'should create tabbing with defaults', () => {
		const actual = calculateMode( { mode: 'tabbing' } );
		expect( omit( actual, [ 'detect' ] ) ).toEqual( {
			useTabstops: true,
			deep: false,
			widget: true,
		} );
	} );

	it( 'should create tabbing mode with all options specified', () => {
		const actual = calculateMode( {
			mode: 'tabbing',
			cycle: false,
			deep: false,
			widget: false,
		} );

		expect( omit( actual, [ 'detect' ] ) ).toEqual( {
			useTabstops: true,
			deep: false,
			widget: false,
		} );
	} );

	it( 'should create tabbing mode without extra options specified', () => {
		const actual = calculateMode( {
			mode: 'tabbing',
			cycle: false,
			deep: false,
			widget: false,
			extra: 10,
		});

		expect( omit( actual, [ 'detect' ] ) ).toEqual( {
			useTabstops: true,
			deep: false,
			widget: false,
		} );
	} );

	it( 'checking move function for tabbing', () => {
		// Normal
		assertIndex( 1, 0, 5, false, TAB, { mode: 'tabbing', cycle: true } );
		assertIndex( 4, 3, 5, false, TAB, { mode: 'tabbing', cycle: true } );
		assertIndex( 3, 4, 5, true, TAB, { mode: 'tabbing', cycle: true } );

		// Cycling
		assertIndex( 4, 0, 5, true, TAB, { mode: 'tabbing', cycle: true } );
		assertIndex( 0, 4, 5, false, TAB, { mode: 'tabbing', cycle: true } );

		// Wrong keys
		assertIndex( 0, 0, 5, true, UP, { mode: 'tabbing', cycle: true } );
		assertIndex( 4, 4, 5, true, DOWN, { mode: 'tabbing', cycle: true } );
		assertIndex( 0, 0, 5, true, LEFT, { mode: 'tabbing', cycle: true } );
		assertIndex( 4, 4, 5, true, RIGHT, { mode: 'tabbing', cycle: true } );

		// No cycling
		assertIndex( 5, 4, 5, false, TAB, { mode: 'tabbing', cycle: false } );
		assertIndex( -1, 0, 5, true, TAB, { mode: 'tabbing', cycle: false } );
	} );
} );

describe( 'calculateMode menu', () => {
	it( 'should create menu with defaults', () => {
		const actual = calculateMode( { mode: 'menu' } );
		expect( omit( actual, [ 'detect' ] ) ).toEqual( {
			useTabstops: false,
			deep: false,
			widget: false,
		} );
	} );

	it( 'should create menu mode with all options specified', () => {
		const actual = calculateMode( {
			mode: 'menu',
			cycle: false,
			deep: true,
			widget: true,
			orientation: 'horizontal',
		} );

		expect( omit( actual, [ 'detect' ] ) ).toEqual( {
			useTabstops: false,
			deep: true,
			widget: true,
		} );
	} );

	it( 'should create tabbing mode without extra options specified', () => {
		const actual = calculateMode( {
			mode: 'menu',
			cycle: false,
			deep: true,
			widget: true,
			orientation: 'horizontal',
			extra: 10,
		} );

		expect( omit( actual, [ 'detect' ] ) ).toEqual( {
			useTabstops: false,
			deep: true,
			widget: true,
		} );
	} );

	it( 'checking move function for menu', () => {
		const shiftValues = [ false, true ];
		shiftValues.forEach( ( shiftKey ) => {
			// Checking up and down
			assertIndex( 1, 0, 5, shiftKey, DOWN, { mode: 'menu', cycle: true } );
			assertIndex( 4, 3, 5, shiftKey, DOWN, { mode: 'menu', cycle: true } );
			assertIndex( 3, 4, 5, shiftKey, UP, { mode: 'menu', cycle: true } );
			assertIndex( 2, 3, 5, shiftKey, UP, { mode: 'menu', cycle: true } );

			// Checking left and right
			assertIndex( 1, 0, 5, shiftKey, RIGHT, { mode: 'menu', cycle: true, orientation: 'horizontal' } );
			assertIndex( 4, 3, 5, shiftKey, RIGHT, { mode: 'menu', cycle: true, orientation: 'horizontal' } );
			assertIndex( 3, 4, 5, shiftKey, LEFT, { mode: 'menu', cycle: true, orientation: 'horizontal' } );
			assertIndex( 2, 3, 5, shiftKey, LEFT, { mode: 'menu', cycle: true, orientation: 'horizontal' } );

			// Cycling
			assertIndex( 0, 4, 5, shiftKey, DOWN, { mode: 'menu', cycle: true } );
			assertIndex( 4, 0, 5, shiftKey, UP, { mode: 'menu', cycle: true } );
			assertIndex( 0, 4, 5, shiftKey, RIGHT, { mode: 'menu', cycle: true, orientation: 'horizontal' } );
			assertIndex( 4, 0, 5, shiftKey, LEFT, { mode: 'menu', cycle: true, orientation: 'horizontal' } );

			// No Cycling
			assertIndex( 5, 4, 5, shiftKey, DOWN, { mode: 'menu', cycle: false } );
			assertIndex( -1, 0, 5, shiftKey, UP, { mode: 'menu', cycle: false } );
			assertIndex( 0, 4, 5, shiftKey, RIGHT, { mode: 'menu', cycle: true, orientation: 'horizontal' } );
			assertIndex( 4, 0, 5, shiftKey, LEFT, { mode: 'menu', cycle: true, orientation: 'horizontal' } );

			// Wrong keys
			assertIndex( 0, 0, 5, shiftKey, LEFT, { mode: 'menu', cycle: true } );
			assertIndex( 4, 4, 5, shiftKey, RIGHT, { mode: 'menu', cycle: true } );

			// Wrong keys for orientation horizontal
			assertIndex( 4, 4, 5, shiftKey, DOWN, { mode: 'menu', cycle: true, orientation: 'horizontal' } );
			assertIndex( 0, 0, 5, shiftKey, UP, { mode: 'menu', cycle: true, orientation: 'horizontal' } );
		} );
	} );
} );
