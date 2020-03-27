/**
 * Internal dependencies
 */
import {
	ALIGNMENT_VALUES,
	DIRECTION,
	getAlignmentIndex,
	isAlignmentValid,
	getAlignmentValueFromIndex,
	getNextIndexFromDirection,
} from '../utils';

describe( 'AlignmentMatrixControl', () => {
	describe( 'isAlignmentValid', () => {
		it( 'should return true for correctly matching alignment values', () => {
			// x and y values
			expect( isAlignmentValid( 'center top' ) ).toBe( true );
			expect( isAlignmentValid( 'top center' ) ).toBe( true );
			expect( isAlignmentValid( 'center bottom' ) ).toBe( true );
			// single center value
			expect( isAlignmentValid( 'center' ) ).toBe( true );
			// x + y center value
			expect( isAlignmentValid( 'center center' ) ).toBe( true );
		} );

		it( 'should return false for invalid alignment values', () => {
			expect( isAlignmentValid( 'top bottom' ) ).toBe( false );
			expect( isAlignmentValid( 'left right' ) ).toBe( false );
			expect( isAlignmentValid( 'near mid' ) ).toBe( false );
			expect( isAlignmentValid( 'mid mid' ) ).toBe( false );
			expect( isAlignmentValid( 'mid' ) ).toBe( false );
		} );

		it( 'should only consider first 2 (max) values', () => {
			expect( isAlignmentValid( 'center top right bottom' ) ).toBe(
				false
			);
			expect( isAlignmentValid( 'top center left right bottom' ) ).toBe(
				false
			);
		} );

		it( 'should remap middle to center', () => {
			expect( isAlignmentValid( 'middle' ) ).toBe( true );
			expect( isAlignmentValid( 'middle middle' ) ).toBe( true );
			expect( isAlignmentValid( 'top middle' ) ).toBe( true );
			expect( isAlignmentValid( 'middle bottom' ) ).toBe( true );
		} );
	} );

	describe( 'getAlignmentIndex', () => {
		it( 'should return correct index given an alignment value', () => {
			ALIGNMENT_VALUES.forEach( ( alignment, index ) => {
				expect( getAlignmentIndex( alignment ) ).toBe( index );
			} );
		} );
	} );

	describe( 'getAlignmentValueFromIndex', () => {
		it( 'should return correct value based on index', () => {
			ALIGNMENT_VALUES.forEach( ( alignment, index ) => {
				expect( getAlignmentValueFromIndex( index ) ).toBe( alignment );
			} );
		} );
	} );

	describe( 'getNextIndexFromDirection', () => {
		describe( 'Basic movements', () => {
			it( 'should move index "up"', () => {
				const currentIndex = 4;

				const nextDirection = getNextIndexFromDirection(
					currentIndex,
					DIRECTION.UP
				);

				expect( nextDirection ).toBe( 1 );
			} );

			it( 'should move index "DOWN"', () => {
				const currentIndex = 4;

				const nextDirection = getNextIndexFromDirection(
					currentIndex,
					DIRECTION.DOWN
				);

				expect( nextDirection ).toBe( 7 );
			} );

			it( 'should move index "LEFT"', () => {
				const currentIndex = 4;

				const nextDirection = getNextIndexFromDirection(
					currentIndex,
					DIRECTION.LEFT
				);

				expect( nextDirection ).toBe( 3 );
			} );

			it( 'should move index "RIGHT"', () => {
				const currentIndex = 4;

				const nextDirection = getNextIndexFromDirection(
					currentIndex,
					DIRECTION.RIGHT
				);

				expect( nextDirection ).toBe( 5 );
			} );
		} );

		describe( 'Edge movements', () => {
			it( 'should not move index "up" at at an edge', () => {
				const currentIndex = 2;

				const nextDirection = getNextIndexFromDirection(
					currentIndex,
					DIRECTION.UP
				);

				expect( nextDirection ).toBe( 2 );
			} );

			it( 'should not move index "down" at at an edge', () => {
				const currentIndex = 7;

				const nextDirection = getNextIndexFromDirection(
					currentIndex,
					DIRECTION.DOWN
				);

				expect( nextDirection ).toBe( 7 );
			} );

			it( 'should not move index "LEFT" at at an edge', () => {
				const currentIndex = 3;

				const nextDirection = getNextIndexFromDirection(
					currentIndex,
					DIRECTION.LEFT
				);

				expect( nextDirection ).toBe( 3 );
			} );

			it( 'should not move index "RIGHT" at at an edge', () => {
				const currentIndex = 5;

				const nextDirection = getNextIndexFromDirection(
					currentIndex,
					DIRECTION.RIGHT
				);

				expect( nextDirection ).toBe( 5 );
			} );
		} );
	} );
} );
