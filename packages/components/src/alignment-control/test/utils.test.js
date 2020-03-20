/**
 * Internal dependencies
 */
import { isAlignmentValid } from '../utils';

describe( 'AlignmentControl', () => {
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
			expect( isAlignmentValid( 'near middle' ) ).toBe( false );
			expect( isAlignmentValid( 'middle middle' ) ).toBe( false );
			expect( isAlignmentValid( 'middle' ) ).toBe( false );
		} );

		it( 'should only consider first 2 (max) values', () => {
			expect( isAlignmentValid( 'center top right bottom' ) ).toBe(
				false
			);
			expect( isAlignmentValid( 'top center left right bottom' ) ).toBe(
				false
			);
		} );
	} );
} );
