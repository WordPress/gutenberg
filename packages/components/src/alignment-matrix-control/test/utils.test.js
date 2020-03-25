/**
 * Internal dependencies
 */
import {
	ALIGNMENT_VALUES,
	getAlignmentIndex,
	isAlignmentValid,
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
} );
