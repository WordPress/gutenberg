/**
 * External Dependencies
 */
import { omit, each } from 'lodash';

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

	it( 'should create menu mode without extra options specified', () => {
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

describe( 'calculateMode grid', () => {
	it( 'should create grid with defaults', () => {
		const actual = calculateMode( { mode: 'grid' } );
		expect( omit( actual, [ 'detect' ] ) ).toEqual( {
			useTabstops: false,
			deep: false,
			widget: false,
		} );
	} );

	it( 'should create grid mode with all options specified', () => {
		const actual = calculateMode( {
			mode: 'grid',
			cycle: false,
			deep: true,
			widget: true,
			width: 2,
		} );

		expect( omit( actual, [ 'detect' ] ) ).toEqual( {
			useTabstops: false,
			deep: true,
			widget: true,
		} );
	} );

	it( 'should create grid mode without extra options specified', () => {
		const actual = calculateMode( {
			mode: 'grid',
			cycle: false,
			deep: true,
			widget: true,
			extra: 10,
		} );

		expect( omit( actual, [ 'detect' ] ) ).toEqual( {
			useTabstops: false,
			deep: true,
			widget: true,
		} );
	} );

	it( 'checking move function for grid', () => {
		/*
		 0 1 2 3
		 4 5 6 7
		 8 9
		 */

		const shiftValues = [ false, true ];
		shiftValues.forEach( ( shiftKey ) => {
			const tests = {
				0: [
					{ key: DOWN, result: 4 },
					{ key: UP, result: 8 },
					{ key: RIGHT, result: 1 },
					{ key: LEFT, result: 3 },
				],

				1: [
					{ key: DOWN, result: 5 },
					{ key: UP, result: 9 },
					{ key: RIGHT, result: 2 },
					{ key: LEFT, result: 0 },
				],

				2: [
					{ key: DOWN, result: 6 },
					{ key: UP, result: 6 },
					{ key: RIGHT, result: 3 },
					{ key: LEFT, result: 1 },
				],

				3: [
					{ key: DOWN, result: 7 },
					{ key: UP, result: 7 },
					{ key: RIGHT, result: 0 },
					{ key: LEFT, result: 2 },
				],

				4: [
					{ key: DOWN, result: 8 },
					{ key: UP, result: 0 },
					{ key: RIGHT, result: 5 },
					{ key: LEFT, result: 7 },
				],

				5: [
					{ key: DOWN, result: 9 },
					{ key: UP, result: 1 },
					{ key: RIGHT, result: 6 },
					{ key: LEFT, result: 4 },
				],

				6: [
					{ key: DOWN, result: 2 },
					{ key: UP, result: 2 },
					{ key: RIGHT, result: 7 },
					{ key: LEFT, result: 5 },
				],

				7: [
					{ key: DOWN, result: 3 },
					{ key: UP, result: 3 },
					{ key: RIGHT, result: 4  },
					{ key: LEFT, result: 6 },
				],

				8: [
					{ key: DOWN, result: 0 },
					{ key: UP, result: 4 },
					{ key: RIGHT, result: 9 },
					{ key: LEFT, result: 9 },
				],

				9: [
					{ key: DOWN, result: 1 },
					{ key: UP, result: 5 },
					{ key: RIGHT, result: 8 },
					{ key: LEFT, result: 8 },
				],
			};

			each( tests, ( v, k ) => {
				each( v, ( testcase ) => {
					assertIndex( testcase.result, k, 10, shiftKey, testcase.key, { mode: 'grid', width: 4 } );
					assertIndex( k, k, 10, shiftKey, TAB, { mode: 'grid', width: 4 } );
				} );
			} );
		} );
	} );
} );
