/**
 * Internal dependencies
 */
import { getGapCSSValue } from '../gap';

describe( 'gap', () => {
	describe( 'getGapCSSValue()', () => {
		it( 'should return `null` if argument is falsey', () => {
			expect( getGapCSSValue( undefined ) ).toBeNull();
			expect( getGapCSSValue( '' ) ).toBeNull();
		} );

		it( 'should return single value for gap if argument is valid string', () => {
			expect( getGapCSSValue( '88rem' ) ).toEqual( '88rem' );
		} );

		it( 'should return single value for gap if row and column are the same', () => {
			const blockGapValue = {
				top: '88rem',
				left: '88rem',
			};
			expect( getGapCSSValue( blockGapValue ) ).toEqual( '88rem' );
		} );

		it( 'should return shorthand value for gap if row and column are different', () => {
			const blockGapValue = {
				top: '88px',
				left: '88rem',
			};
			expect( getGapCSSValue( blockGapValue ) ).toEqual( '88px 88rem' );
		} );

		it( 'should return default value if a top or left is missing', () => {
			const blockGapValue = {
				top: '88px',
			};
			expect( getGapCSSValue( blockGapValue, '1px' ) ).toEqual(
				'88px 1px'
			);
		} );
	} );
} );
